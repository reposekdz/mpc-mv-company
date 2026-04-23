const { validationResult } = require('express-validator');
const { query } = require('../config/db');
const { apiResponse, apiError } = require('../utils/apiFeatures');

const getAllMeetings = async (req, res, next) => {
  try {
    const { status, dateFrom, dateTo, search } = req.query;
    let sql = `SELECT m.*, u.name as organizer_name FROM meetings m LEFT JOIN users u ON m.organizer_id = u.id WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (status) {
      sql += ` AND m.status = $${idx++}`;
      params.push(status);
    }
    if (dateFrom) {
      sql += ` AND m.start_time >= $${idx++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      sql += ` AND m.start_time <= $${idx++}`;
      params.push(dateTo);
    }
    if (search) {
      sql += ` AND (m.title ILIKE $${idx} OR m.description ILIKE $${idx+1} OR m.location ILIKE $${idx+2})`;
      params.push(`%${search}%`,`%${search}%`,`%${search}%`);
      idx += 3;
    }

    sql += ' ORDER BY m.start_time ASC';
    const result = await query(sql, params);
    return apiResponse(res, result.rows);
  } catch (error) {
    next(error);
  }
};

const getMeetingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT m.*, u.name as organizer_name FROM meetings m LEFT JOIN users u ON m.organizer_id = u.id WHERE m.id = $1',
      [id]
    );
    if (result.rows.length === 0) return apiError(res, 'Meeting not found', 404);
    return apiResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const createMeeting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const {
      title, description, start_time, end_time, location,
      is_virtual, virtual_link, attendees, status, agenda
    } = req.body;

    const result = await query(
      `INSERT INTO meetings (title,description,organizer_id,start_time,end_time,location,is_virtual,virtual_link,attendees,status,agenda)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title, description||null, req.user.id, start_time, end_time, location||null,
       is_virtual||false, virtual_link||null,
       JSON.stringify(attendees||[]),
       status||'scheduled', agenda||null]
    );
    return apiResponse(res, result.rows[0], {}, 201);
  } catch (error) {
    next(error);
  }
};

const updateMeeting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const { id } = req.params;
    const existing = await query('SELECT id FROM meetings WHERE id = $1', [id]);
    if (existing.rows.length === 0) return apiError(res, 'Meeting not found', 404);

    const {
      title, description, start_time, end_time, location,
      is_virtual, virtual_link, attendees, status, agenda, minutes
    } = req.body;

    const result = await query(
      `UPDATE meetings SET
        title=COALESCE($1,title), description=COALESCE($2,description),
        start_time=COALESCE($3,start_time), end_time=COALESCE($4,end_time),
        location=COALESCE($5,location), is_virtual=COALESCE($6,is_virtual),
        virtual_link=COALESCE($7,virtual_link),
        attendees=COALESCE($8,attendees),
        status=COALESCE($9,status), agenda=COALESCE($10,agenda),
        minutes=COALESCE($11,minutes), updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [title, description, start_time, end_time, location, is_virtual, virtual_link,
       attendees ? JSON.stringify(attendees) : null,
       status, agenda, minutes, id]
    );
    return apiResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id FROM meetings WHERE id = $1', [id]);
    if (existing.rows.length === 0) return apiError(res, 'Meeting not found', 404);
    await query('DELETE FROM meetings WHERE id = $1', [id]);
    return apiResponse(res, { message: 'Meeting deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getUpcomingMeetings = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT m.*, u.name as organizer_name
      FROM meetings m
      LEFT JOIN users u ON m.organizer_id = u.id
      WHERE m.start_time >= NOW() AND m.status = 'scheduled'
      ORDER BY m.start_time ASC
      LIMIT 10
    `);
    return apiResponse(res, result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllMeetings, getMeetingById, createMeeting, updateMeeting, deleteMeeting, getUpcomingMeetings };
