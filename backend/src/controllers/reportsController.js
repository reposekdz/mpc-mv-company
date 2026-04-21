const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const pool = require('../config/db');

const getAllReports = async (req, res, next) => {
  try {
    const { type, status, search } = req.query;
    let query = 'SELECT * FROM reports WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (title LIKE ? OR summary LIKE ? OR author LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const [reports] = await pool.query(query, params);
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [reports] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(reports[0]);
  } catch (error) {
    next(error);
  }
};

const createReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = uuidv4();
    const {
      title,
      type,
      date,
      status,
      summary,
      author
    } = req.body;

    await pool.query(
      `INSERT INTO reports (
        id, title, type, date, status, summary, author
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id, title, type, date || new Date(), status || 'draft', summary, author || req.user.name
      ]
    );

    const [newReport] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
    res.status(201).json({ report: newReport[0], message: 'Report created successfully' });
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const [existingReports] = await pool.query('SELECT id FROM reports WHERE id = ?', [id]);

    if (existingReports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const {
      title,
      type,
      date,
      status,
      summary,
      author
    } = req.body;

    await pool.query(
      `UPDATE reports SET
        title = COALESCE(?, title),
        type = COALESCE(?, type),
        date = COALESCE(?, date),
        status = COALESCE(?, status),
        summary = COALESCE(?, summary),
        author = COALESCE(?, author)
      WHERE id = ?`,
      [
        title, type, date, status, summary, author, id
      ]
    );

    const [updatedReport] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
    res.json({ report: updatedReport[0], message: 'Report updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existingReports] = await pool.query('SELECT id FROM reports WHERE id = ?', [id]);

    if (existingReports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await pool.query('DELETE FROM reports WHERE id = ?', [id]);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getReportStats = async (req, res, next) => {
  try {
    const [typeStats] = await pool.query(`
      SELECT type, COUNT(*) as count 
      FROM reports 
      GROUP BY type
    `);

    const [statusStats] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM reports 
      GROUP BY status
    `);

    const [monthlyStats] = await pool.query(`
      SELECT DATE_FORMAT(date, '%Y-%m') as month, COUNT(*) as count
      FROM reports
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month DESC
    `);

    res.json({
      types: typeStats,
      status: statusStats,
      monthly: monthlyStats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  getReportStats
};
