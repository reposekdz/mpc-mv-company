const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { APIFeatures, apiResponse, apiError } = require('../utils/apiFeatures');

const getAllJobs = async (req, res, next) => {
  try {
    const { search } = req.query;
    let baseQuery = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];

    if (search) {
      baseQuery += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const allowedFilters = ['status', 'type', 'priority', 'progress', 'budget'];
    const allowedSorts = ['title', 'status', 'priority', 'budget', 'progress', 'created_at', 'start_date', 'end_date'];

    const features = new APIFeatures(baseQuery, req.query, allowedFilters, allowedSorts)
      .filter()
      .sort()
      .paginate();

    const { query, params: queryParams, pagination } = features.getQuery();
    const finalParams = [...params, ...queryParams];

    const [jobs] = await pool.query(query, finalParams);

    // Get total count for pagination metadata
    const countQuery = baseQuery.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    const paginationMeta = await APIFeatures.buildPaginationMeta(
      total,
      pagination.page,
      pagination.limit,
      `${req.protocol}://${req.get('host')}${req.baseUrl}`,
      req.query
    );

    return apiResponse(res, jobs, { pagination: paginationMeta });
  } catch (error) {
    next(error);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ?', [id]);

    if (jobs.length === 0) {
      return apiError(res, 'Job not found', 404);
    }

    return apiResponse(res, jobs[0]);
  } catch (error) {
    next(error);
  }
};

const createJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiError(res, 'Validation failed', 400, errors.array());
    }

    const id = uuidv4();
    const {
      title,
      description,
      status,
      priority,
      assigned_to,
      location,
      start_date,
      end_date,
      budget,
      progress,
      type
    } = req.body;

    await pool.query(
      `INSERT INTO jobs (
        id, title, description, status, priority, assigned_to, location,
        start_date, end_date, budget, progress, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, title, description, status || 'pending', priority || 'medium',
        assigned_to, location, start_date, end_date, budget || 0, progress || 0, type
      ]
    );

    const [newJob] = await pool.query('SELECT * FROM jobs WHERE id = ?', [id]);
    return apiResponse(res, newJob[0]).status(201);
  } catch (error) {
    next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const [existingJobs] = await pool.query('SELECT id FROM jobs WHERE id = ?', [id]);

    if (existingJobs.length === 0) {
      return apiError(res, 'Job not found', 404);
    }

    const {
      title,
      description,
      status,
      priority,
      assigned_to,
      location,
      start_date,
      end_date,
      budget,
      progress,
      type
    } = req.body;

    await pool.query(
      `UPDATE jobs SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        assigned_to = COALESCE(?, assigned_to),
        location = COALESCE(?, location),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        budget = COALESCE(?, budget),
        progress = COALESCE(?, progress),
        type = COALESCE(?, type)
      WHERE id = ?`,
      [
        title, description, status, priority, assigned_to, location,
        start_date, end_date, budget, progress, type, id
      ]
    );

    const [updatedJob] = await pool.query('SELECT * FROM jobs WHERE id = ?', [id]);
    return apiResponse(res, updatedJob[0]);
  } catch (error) {
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existingJobs] = await pool.query('SELECT id FROM jobs WHERE id = ?', [id]);

    if (existingJobs.length === 0) {
      return apiError(res, 'Job not found', 404);
    }

    await pool.query('DELETE FROM jobs WHERE id = ?', [id]);
    return apiResponse(res, { message: 'Job deleted successfully', id });
  } catch (error) {
    next(error);
  }
};

const getJobStats = async (req, res, next) => {
  try {
    const [statusStats] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM jobs 
      GROUP BY status
    `);

    const [typeStats] = await pool.query(`
      SELECT type, COUNT(*) as count, SUM(budget) as total_budget
      FROM jobs 
      GROUP BY type
    `);

    const [totalStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(budget) as total_budget,
        AVG(progress) as average_progress
      FROM jobs
    `);

    return apiResponse(res, {
      status: statusStats,
      type: typeStats,
      totals: totalStats[0]
    });
  } catch (error) {
    next(error);
  }
};

// Bulk Operations
const bulkCreateJobs = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { jobs } = req.body;
    
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return apiError(res, 'Jobs array is required', 400);
    }

    if (jobs.length > 100) {
      return apiError(res, 'Maximum 100 jobs can be created in bulk', 400);
    }

    const createdJobs = [];
    const errors = [];

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const id = uuidv4();
      
      try {
        await connection.query(
          `INSERT INTO jobs (
            id, title, description, status, priority, assigned_to, location,
            start_date, end_date, budget, progress, type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, 
            job.title, 
            job.description, 
            job.status || 'pending', 
            job.priority || 'medium',
            job.assigned_to, 
            job.location, 
            job.start_date, 
            job.end_date, 
            job.budget || 0, 
            job.progress || 0, 
            job.type
          ]
        );

        const [newJob] = await connection.query('SELECT * FROM jobs WHERE id = ?', [id]);
        createdJobs.push(newJob[0]);
      } catch (err) {
        errors.push({ index: i, error: err.message, job });
      }
    }

    await connection.commit();

    return apiResponse(res, {
      created: createdJobs,
      failed: errors,
      successCount: createdJobs.length,
      failedCount: errors.length
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const bulkUpdateJobs = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return apiError(res, 'Updates array is required', 400);
    }

    if (updates.length > 100) {
      return apiError(res, 'Maximum 100 jobs can be updated in bulk', 400);
    }

    const updatedJobs = [];
    const errors = [];

    for (let i = 0; i < updates.length; i++) {
      const { id, ...fields } = updates[i];
      
      try {
        const [existing] = await connection.query('SELECT id FROM jobs WHERE id = ?', [id]);
        if (existing.length === 0) {
          errors.push({ index: i, error: 'Job not found', id });
          continue;
        }

        const setClauses = [];
        const params = [];

        Object.keys(fields).forEach(key => {
          setClauses.push(`${key} = ?`);
          params.push(fields[key]);
        });

        if (setClauses.length === 0) {
          errors.push({ index: i, error: 'No fields to update', id });
          continue;
        }

        params.push(id);

        await connection.query(
          `UPDATE jobs SET ${setClauses.join(', ')} WHERE id = ?`,
          params
        );

        const [updatedJob] = await connection.query('SELECT * FROM jobs WHERE id = ?', [id]);
        updatedJobs.push(updatedJob[0]);
      } catch (err) {
        errors.push({ index: i, error: err.message, id });
      }
    }

    await connection.commit();

    return apiResponse(res, {
      updated: updatedJobs,
      failed: errors,
      successCount: updatedJobs.length,
      failedCount: errors.length
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const bulkDeleteJobs = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return apiError(res, 'IDs array is required', 400);
    }

    if (ids.length > 100) {
      return apiError(res, 'Maximum 100 jobs can be deleted in bulk', 400);
    }

    const deletedIds = [];
    const errors = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      
      try {
        const [existing] = await connection.query('SELECT id FROM jobs WHERE id = ?', [id]);
        if (existing.length === 0) {
          errors.push({ index: i, error: 'Job not found', id });
          continue;
        }

        await connection.query('DELETE FROM jobs WHERE id = ?', [id]);
        deletedIds.push(id);
      } catch (err) {
        errors.push({ index: i, error: err.message, id });
      }
    }

    await connection.commit();

    return apiResponse(res, {
      deleted: deletedIds,
      failed: errors,
      successCount: deletedIds.length,
      failedCount: errors.length
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getJobStats,
  bulkCreateJobs,
  bulkUpdateJobs,
  bulkDeleteJobs
};
