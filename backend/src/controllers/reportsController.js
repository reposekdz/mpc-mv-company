const { validationResult } = require('express-validator');
const { query } = require('../config/db');
const { upload, getFileUrl } = require('../middleware/upload');
const { apiResponse, apiError } = require('../utils/apiFeatures');

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
      sql += ` AND (r.title ILIKE $${idx} OR r.description ILIKE $${idx+1})`;
      params.push(`%${search}%`,`%${search}%`);
      idx += 2;
    }

    sql += ' ORDER BY r.created_at DESC';
    const result = await query(sql, params);
    return apiResponse(res, result.rows);
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
    return apiResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const createReport = async (req, res, next) => {
  upload.array('attachments', 5)(req, res, async (err) => {
    if (err) return apiError(res, err.message, 400);

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

      const { title, description, type, status, job_id } = req.body;

      const attachments = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          attachments.push({
            filename: file.originalname,
            url: getFileUrl(file),
            size: file.size,
            mimetype: file.mimetype
          });
        }
      }

      const result = await query(
        `INSERT INTO reports (title,description,type,status,job_id,submitted_by,submitted_at,attachments)
         VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7) RETURNING *`,
        [title, description||null, type, status||'draft', job_id||null, req.user.id, JSON.stringify(attachments)]
      );
      return apiResponse(res, result.rows[0], {}, 201);
    } catch (error) {
      next(error);
    }
  });
};

const updateReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const { id } = req.params;
    const existing = await query('SELECT id FROM reports WHERE id = $1', [id]);
    if (existing.rows.length === 0) return apiError(res, 'Report not found', 404);

    const { title, description, type, status, job_id, reviewed_by } = req.body;

    const result = await query(
      `UPDATE reports SET
        title=COALESCE($1,title), description=COALESCE($2,description),
        type=COALESCE($3,type), status=COALESCE($4,status),
        job_id=COALESCE($5,job_id),
        reviewed_by=COALESCE($6,reviewed_by),
        reviewed_at=CASE WHEN $4 IN ('reviewed','approved','rejected') THEN NOW() ELSE reviewed_at END,
        updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [title, description, type, status, job_id, reviewed_by||null, id]
    );
    return apiResponse(res, result.rows[0]);
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
    const [typeStats, statusStats, monthlyStats] = await Promise.all([
      query('SELECT type, COUNT(*) as count FROM reports GROUP BY type'),
      query('SELECT status, COUNT(*) as count FROM reports GROUP BY status'),
      query(`SELECT TO_CHAR(created_at,'YYYY-MM') as month, COUNT(*) as count
             FROM reports
             WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
             GROUP BY TO_CHAR(created_at,'YYYY-MM')
             ORDER BY month DESC`)
    ]);
    return apiResponse(res, { types: typeStats.rows, status: statusStats.rows, monthly: monthlyStats.rows });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllReports, getReportById, createReport, updateReport, deleteReport, getReportStats };
