const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const pool = require('../config/db');

const getAllJobs = async (req, res, next) => {
  try {
    const { status, type, search } = req.query;
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [jobs] = await pool.query(query, params);
    res.json({ jobs, count: jobs.length });
  } catch (error) {
    next(error);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ?', [id]);

    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job: jobs[0] });
  } catch (error) {
    next(error);
  }
};

const createJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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
    res.status(201).json({ job: newJob[0], message: 'Job created successfully' });
  } catch (error) {
    next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const [existingJobs] = await pool.query('SELECT id FROM jobs WHERE id = ?', [id]);

    if (existingJobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
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
    res.json({ job: updatedJob[0], message: 'Job updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existingJobs] = await pool.query('SELECT id FROM jobs WHERE id = ?', [id]);

    if (existingJobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await pool.query('DELETE FROM jobs WHERE id = ?', [id]);
    res.json({ message: 'Job deleted successfully' });
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

    res.json({
      status: statusStats,
      type: typeStats,
      totals: totalStats[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getJobStats
};
