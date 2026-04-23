const { validationResult } = require('express-validator');
const { query } = require('../config/db');
const { apiResponse, apiError } = require('../utils/apiFeatures');

const getAllTopics = async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;
    let sql = `SELECT ct.*, u.name as assigned_to_name FROM consulting_topics ct LEFT JOIN users u ON ct.assigned_to = u.id WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (status) {
      sql += ` AND ct.status = $${idx++}`;
      params.push(status);
    }
    if (priority) {
      sql += ` AND ct.priority = $${idx++}`;
      params.push(priority);
    }
    if (search) {
      sql += ` AND (ct.title ILIKE $${idx} OR ct.description ILIKE $${idx+1} OR ct.client_name ILIKE $${idx+2})`;
      params.push(`%${search}%`,`%${search}%`,`%${search}%`);
      idx += 3;
    }

    sql += ' ORDER BY ct.created_at DESC';
    const result = await query(sql, params);
    return apiResponse(res, result.rows);
  } catch (error) {
    next(error);
  }
};

const getTopicById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const topicResult = await query(
      `SELECT ct.*, u.name as assigned_to_name FROM consulting_topics ct LEFT JOIN users u ON ct.assigned_to = u.id WHERE ct.id = $1`,
      [id]
    );
    if (topicResult.rows.length === 0) return apiError(res, 'Topic not found', 404);

    const repliesResult = await query(
      'SELECT cr.*, u.name as author_user_name FROM consulting_replies cr LEFT JOIN users u ON cr.author_id = u.id WHERE cr.topic_id = $1 ORDER BY cr.created_at ASC',
      [id]
    );

    return apiResponse(res, { ...topicResult.rows[0], replies: repliesResult.rows });
  } catch (error) {
    next(error);
  }
};

const createTopic = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const {
      title, description, client_name, client_email, client_phone,
      status, priority, assigned_to, estimated_hours, budget, start_date, end_date
    } = req.body;

    const result = await query(
      `INSERT INTO consulting_topics (title,description,client_name,client_email,client_phone,status,priority,assigned_to,estimated_hours,budget,start_date,end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [title, description||null, client_name, client_email||null, client_phone||null,
       status||'new', priority||'medium', assigned_to||null, estimated_hours||0, budget||0,
       start_date||null, end_date||null]
    );
    return apiResponse(res, result.rows[0], {}, 201);
  } catch (error) {
    next(error);
  }
};

const updateTopic = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const { id } = req.params;
    const existing = await query('SELECT id FROM consulting_topics WHERE id = $1', [id]);
    if (existing.rows.length === 0) return apiError(res, 'Topic not found', 404);

    const {
      title, description, client_name, client_email, client_phone,
      status, priority, assigned_to, estimated_hours, actual_hours, budget, start_date, end_date
    } = req.body;

    const result = await query(
      `UPDATE consulting_topics SET
        title=COALESCE($1,title), description=COALESCE($2,description),
        client_name=COALESCE($3,client_name), client_email=COALESCE($4,client_email),
        client_phone=COALESCE($5,client_phone), status=COALESCE($6,status),
        priority=COALESCE($7,priority), assigned_to=COALESCE($8,assigned_to),
        estimated_hours=COALESCE($9,estimated_hours), actual_hours=COALESCE($10,actual_hours),
        budget=COALESCE($11,budget), start_date=COALESCE($12,start_date),
        end_date=COALESCE($13,end_date), updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [title,description,client_name,client_email,client_phone,status,priority,
       assigned_to,estimated_hours,actual_hours,budget,start_date,end_date,id]
    );
    return apiResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteTopic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id FROM consulting_topics WHERE id = $1', [id]);
    if (existing.rows.length === 0) return apiError(res, 'Topic not found', 404);
    await query('DELETE FROM consulting_topics WHERE id = $1', [id]);
    return apiResponse(res, { message: 'Topic deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const addReply = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const { topicId } = req.params;
    const existing = await query('SELECT id FROM consulting_topics WHERE id = $1', [topicId]);
    if (existing.rows.length === 0) return apiError(res, 'Topic not found', 404);

    const { content } = req.body;
    const result = await query(
      `INSERT INTO consulting_replies (topic_id, content, author_id, author_name)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [topicId, content, req.user.id, req.user.name]
    );
    return apiResponse(res, result.rows[0], {}, 201);
  } catch (error) {
    next(error);
  }
};

const deleteReply = async (req, res, next) => {
  try {
    const { replyId } = req.params;
    const existing = await query('SELECT id FROM consulting_replies WHERE id = $1', [replyId]);
    if (existing.rows.length === 0) return apiError(res, 'Reply not found', 404);
    await query('DELETE FROM consulting_replies WHERE id = $1', [replyId]);
    return apiResponse(res, { message: 'Reply deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllTopics, getTopicById, createTopic, updateTopic, deleteTopic, addReply, deleteReply };
