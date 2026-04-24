const { validationResult } = require('express-validator');
const { query } = require('../config/db');
const { apiResponse, apiError } = require('../utils/apiFeatures');

const normalizeReport = (row) => ({
  ...row,
  author: row.author || row.submitted_by_name || 'Manager',
  status: row.status || 'draft',
  summary: row.summary || row.description || null,
  attachments: Array.isArray(row.attachments) ? row.attachments : (row.attachments || []),
});

const getAllReports = async (req, res, next) => {
  try {
    const { type, status, search } = req.query;
    let sql = `SELECT r.*, u.name as submitted_by_name, rv.name as reviewed_by_name
               FROM reports r
               LEFT JOIN users u ON r.submitted_by = u.id
               LEFT JOIN users rv ON r.reviewed_by = rv.id
               WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (type) {
      sql += ` AND r.type = $${idx++}`;
      params.push(type);
    }
    if (status) {
      sql += ` AND r.status = $${idx++}`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (r.title ILIKE $${idx} OR r.description ILIKE $${idx+1} OR r.summary ILIKE $${idx+2})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      idx += 3;
    }

    sql += ' ORDER BY r.created_at DESC';
    const result = await query(sql, params);
    return apiResponse(res, result.rows.map(normalizeReport));
  } catch (error) {
    next(error);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT r.*, u.name as submitted_by_name, rv.name as reviewed_by_name
       FROM reports r
       LEFT JOIN users u ON r.submitted_by = u.id
       LEFT JOIN users rv ON r.reviewed_by = rv.id
       WHERE r.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return apiError(res, 'Report not found', 404);
    return apiResponse(res, normalizeReport(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

const createReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const { title, description, summary, content, type, status, author, period_start, period_end, attachments } = req.body;

    const result = await query(
      `INSERT INTO reports
        (title, description, summary, content, type, status, submitted_by, submitted_at, author, period_start, period_end, attachments)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8,$9,$10,$11) RETURNING *`,
      [
        title,
        description || summary || null,
        summary || description || null,
        content || null,
        type || 'operational',
        status || 'draft',
        req.user?.id || null,
        author || req.user?.name || 'Manager',
        period_start || null,
        period_end || null,
        Array.isArray(attachments) ? JSON.stringify(attachments) : null,
      ]
    );

    const io = req.app.get('io');
    if (io) {
      io.to('managers').emit('report-created', result.rows[0]);
      io.to('admins').emit('report-created', result.rows[0]);
    }

    return apiResponse(res, normalizeReport(result.rows[0]), {}, 201);
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const { id } = req.params;
    const existing = await query('SELECT id FROM reports WHERE id = $1', [id]);
    if (existing.rows.length === 0) return apiError(res, 'Report not found', 404);

    const {
      title, description, summary, content, type, status,
      author, period_start, period_end, attachments,
    } = req.body;

    const result = await query(
      `UPDATE reports SET
        title=COALESCE($1,title),
        description=COALESCE($2,description),
        summary=COALESCE($3,summary),
        content=COALESCE($4,content),
        type=COALESCE($5,type),
        status=COALESCE($6,status),
        author=COALESCE($7,author),
        period_start=COALESCE($8,period_start),
        period_end=COALESCE($9,period_end),
        attachments=COALESCE($10,attachments),
        updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [
        title || null,
        description || summary || null,
        summary || null,
        content || null,
        type || null,
        status || null,
        author || null,
        period_start || null,
        period_end || null,
        Array.isArray(attachments) ? JSON.stringify(attachments) : null,
        id,
      ]
    );
    return apiResponse(res, normalizeReport(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id FROM reports WHERE id = $1', [id]);
    if (existing.rows.length === 0) return apiError(res, 'Report not found', 404);
    await query('DELETE FROM reports WHERE id = $1', [id]);
    return apiResponse(res, { message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getReportStats = async (req, res, next) => {
  try {
    const [typeStats, statusStats] = await Promise.all([
      query('SELECT type, COUNT(*) as count FROM reports GROUP BY type'),
      query('SELECT status, COUNT(*) as count FROM reports GROUP BY status'),
    ]);
    return apiResponse(res, { byType: typeStats.rows, byStatus: statusStats.rows });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllReports, getReportById, createReport, updateReport, deleteReport, getReportStats };
