const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { query, getClient } = require('../config/db');
const { APIFeatures, apiResponse, apiError } = require('../utils/apiFeatures');

const getAllJobs = async (req, res, next) => {
  try {
    const { search } = req.query;
    let baseQuery = 'SELECT j.*, u.name as assigned_to_name FROM jobs j LEFT JOIN users u ON j.assigned_to = u.id WHERE 1=1';
    const params = [];

    if (search) {
      baseQuery += ` AND (j.title ILIKE $1 OR j.description ILIKE $2 OR j.location ILIKE $3)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const allowedFilters = ['status', 'type', 'priority'];
    const allowedSorts = ['title', 'status', 'priority', 'budget', 'progress', 'created_at', 'start_date', 'end_date'];

    const features = new APIFeatures(baseQuery, req.query, allowedFilters, allowedSorts, params.length)
      .filter()
      .sort()
      .paginate();

    const { sql, params: featureParams, pagination } = features.getQuery();
    const finalParams = [...params, ...featureParams];
    const result = await query(sql, finalParams);

    const countBase = search
      ? `SELECT COUNT(*) as total FROM jobs WHERE (title ILIKE $1 OR description ILIKE $2 OR location ILIKE $3)`
      : `SELECT COUNT(*) as total FROM jobs WHERE 1=1`;
    const countResult = await query(countBase, params);
    const total = parseInt(countResult.rows[0].total);

    const paginationMeta = await APIFeatures.buildPaginationMeta(
      total, pagination.page, pagination.limit,
      `${req.protocol}://${req.get('host')}${req.baseUrl}`, req.query
    );

    return apiResponse(res, result.rows, { pagination: paginationMeta });
  } catch (error) {
    next(error);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT j.*, u.name as assigned_to_name FROM jobs j LEFT JOIN users u ON j.assigned_to = u.id WHERE j.id = $1',
      [id]
    );
    if (result.rows.length === 0) return apiError(res, 'Job not found', 404);
    return apiResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const createJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const id = uuidv4();
    const { title, description, status, priority, assigned_to, location, start_date, end_date, budget, progress, type } = req.body;

    const result = await query(
      `INSERT INTO jobs (id,title,description,status,priority,assigned_to,location,start_date,end_date,budget,progress,type,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [id, title, description, status || 'pending', priority || 'medium',
       assigned_to || null, location, start_date || null, end_date || null,
       budget || 0, progress || 0, type, req.user.id]
    );
    const job = result.rows[0];
    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to('managers').emit('job-created', job);
      io.to('admins').emit('job-created', job);
    }
    return apiResponse(res, job, {}, 201);
  } catch (error) {
    next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const { id } = req.params;
    const existing = await query('SELECT id FROM jobs WHERE id = $1', [id]);
    if (existing.rows.length === 0) return apiError(res, 'Job not found', 404);

    const { title, description, status, priority, assigned_to, location, start_date, end_date, budget, progress, type } = req.body;

    const result = await query(
      `UPDATE jobs SET
        title=COALESCE($1,title), description=COALESCE($2,description),
        status=COALESCE($3,status), priority=COALESCE($4,priority),
        assigned_to=COALESCE($5,assigned_to), location=COALESCE($6,location),
        start_date=COALESCE($7,start_date), end_date=COALESCE($8,end_date),
        budget=COALESCE($9,budget), progress=COALESCE($10,progress),
        type=COALESCE($11,type), updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [title, description, status, priority, assigned_to, location, start_date, end_date, budget, progress, type, id]
    );
    const job = result.rows[0];
    const io = req.app.get('io');
    if (io) {
      io.to('managers').emit('job-updated', job);
      io.to('admins').emit('job-updated', job);
    }
    return apiResponse(res, job);
  } catch (error) {
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id FROM jobs WHERE id = $1', [id]);
    if (existing.rows.length === 0) return apiError(res, 'Job not found', 404);
    await query('DELETE FROM jobs WHERE id = $1', [id]);
    return apiResponse(res, { message: 'Job deleted successfully', id });
  } catch (error) {
    next(error);
  }
};

const getJobStats = async (req, res, next) => {
  try {
    const [statusStats, typeStats, totalStats] = await Promise.all([
      query('SELECT status, COUNT(*) as count FROM jobs GROUP BY status'),
      query('SELECT type, COUNT(*) as count, COALESCE(SUM(budget),0) as total_budget FROM jobs GROUP BY type'),
      query('SELECT COUNT(*) as total_jobs, COALESCE(SUM(budget),0) as total_budget, COALESCE(AVG(progress),0) as average_progress FROM jobs')
    ]);
    return apiResponse(res, { status: statusStats.rows, type: typeStats.rows, totals: totalStats.rows[0] });
  } catch (error) {
    next(error);
  }
};

const bulkCreateJobs = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { jobs } = req.body;
    if (!Array.isArray(jobs) || jobs.length === 0) return apiError(res, 'Jobs array is required', 400);
    if (jobs.length > 50) return apiError(res, 'Maximum 50 jobs per bulk operation', 400);

    const created = [], failed = [];
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const id = uuidv4();
      try {
        const r = await client.query(
          `INSERT INTO jobs (id,title,description,status,priority,assigned_to,location,start_date,end_date,budget,progress,type,created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
          [id, job.title, job.description, job.status||'pending', job.priority||'medium',
           job.assigned_to||null, job.location, job.start_date||null, job.end_date||null,
           job.budget||0, job.progress||0, job.type, req.user.id]
        );
        created.push(r.rows[0]);
      } catch (err) {
        failed.push({ index: i, error: err.message, job });
      }
    }
    await client.query('COMMIT');
    return apiResponse(res, { created, failed, successCount: created.length, failedCount: failed.length });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const bulkUpdateJobs = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) return apiError(res, 'Updates array is required', 400);

    const updated = [], failed = [];
    const allowed = ['title','description','status','priority','assigned_to','location','start_date','end_date','budget','progress','type'];

    for (let i = 0; i < updates.length; i++) {
      const { id, ...fields } = updates[i];
      try {
        const ex = await client.query('SELECT id FROM jobs WHERE id = $1', [id]);
        if (ex.rows.length === 0) { failed.push({ index: i, error: 'Not found', id }); continue; }
        const setClauses = [], params = [];
        Object.keys(fields).filter(k => allowed.includes(k)).forEach(k => {
          params.push(fields[k]); setClauses.push(`${k}=$${params.length}`);
        });
        if (!setClauses.length) { failed.push({ index: i, error: 'No valid fields', id }); continue; }
        params.push(id);
        const r = await client.query(`UPDATE jobs SET ${setClauses.join(',')},updated_at=NOW() WHERE id=$${params.length} RETURNING *`, params);
        updated.push(r.rows[0]);
      } catch (err) {
        failed.push({ index: i, error: err.message, id });
      }
    }
    await client.query('COMMIT');
    return apiResponse(res, { updated, failed, successCount: updated.length, failedCount: failed.length });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const bulkDeleteJobs = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return apiError(res, 'IDs array is required', 400);

    const deleted = [], failed = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        const ex = await client.query('SELECT id FROM jobs WHERE id = $1', [id]);
        if (ex.rows.length === 0) { failed.push({ index: i, error: 'Not found', id }); continue; }
        await client.query('DELETE FROM jobs WHERE id = $1', [id]);
        deleted.push(id);
      } catch (err) {
        failed.push({ index: i, error: err.message, id });
      }
    }
    await client.query('COMMIT');
    return apiResponse(res, { deleted, failed, successCount: deleted.length, failedCount: failed.length });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = { getAllJobs, getJobById, createJob, updateJob, deleteJob, getJobStats, bulkCreateJobs, bulkUpdateJobs, bulkDeleteJobs };
