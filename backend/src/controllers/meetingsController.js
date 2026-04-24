const { validationResult } = require('express-validator');
const { query } = require('../config/db');
const { apiResponse, apiError } = require('../utils/apiFeatures');

// Helper: combine date + time string into a timestamp, or return null
const buildTimestamp = (dateStr, timeStr) => {
  if (!dateStr && !timeStr) return null;
  const d = dateStr || new Date().toISOString().split('T')[0];
  if (!timeStr) return `${d} 00:00:00`;
  // timeStr might be "09:00" or "09:00:00"
  return `${d} ${timeStr.length === 5 ? timeStr + ':00' : timeStr}`;
};

// Parse attendees from string or array
const parseAttendees = (attendees) => {
  if (!attendees) return [];
  if (Array.isArray(attendees)) return attendees;
  if (typeof attendees === 'string') {
    return attendees.split(',').map(a => a.trim()).filter(Boolean);
  }
  return [];
};

const SELECT_SQL = `
  SELECT m.*,
    u.name as organizer_name_user,
    COALESCE(m.organizer_name, u.name, 'Manager') as organizer
  FROM meetings m
  LEFT JOIN users u ON m.organizer_id = u.id
`;

const getAllMeetings = async (req, res, next) => {
  try {
    const { status, dateFrom, dateTo, search } = req.query;
    let sql = `${SELECT_SQL} WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (status) {
      sql += ` AND m.status = $${idx++}`;
      params.push(status);
    }
    if (dateFrom) {
      sql += ` AND (m.date >= $${idx} OR m.start_time >= $${idx})`;
      params.push(dateFrom); idx++;
    }
    if (dateTo) {
      sql += ` AND (m.date <= $${idx} OR m.start_time <= $${idx})`;
      params.push(dateTo); idx++;
    }
    if (search) {
      sql += ` AND (m.title ILIKE $${idx} OR m.description ILIKE $${idx+1} OR m.location ILIKE $${idx+2})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      idx += 3;
    }

    sql += ' ORDER BY COALESCE(m.date, m.start_time::date) ASC, m.start_time ASC NULLS LAST';
    const result = await query(sql, params);
    return apiResponse(res, result.rows.map(normalizeRow));
  } catch (error) {
    next(error);
  }
};

const getMeetingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(`${SELECT_SQL} WHERE m.id = $1`, [id]);
    if (result.rows.length === 0) return apiError(res, 'Meeting not found', 404);
    return apiResponse(res, normalizeRow(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

// Normalize a DB row to match the frontend shape
const normalizeRow = (row) => ({
  ...row,
  date: row.date
    ? new Date(row.date).toISOString().split('T')[0]
    : (row.start_time ? new Date(row.start_time).toISOString().split('T')[0] : null),
  start_time: row.start_time
    ? new Date(row.start_time).toTimeString().substring(0, 5)
    : null,
  end_time: row.end_time
    ? new Date(row.end_time).toTimeString().substring(0, 5)
    : null,
  organizer: row.organizer || row.organizer_name_user || 'Manager',
  notes: row.notes || row.minutes || null,
  online_link: row.online_link || row.virtual_link || null,
  priority: row.priority || 'normal',
  attendees: Array.isArray(row.attendees) ? row.attendees.join(', ') : (row.attendees || null),
});

const createMeeting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const {
      title, description, date, start_time, end_time, location,
      organizer, attendees, status, priority, notes, agenda, online_link,
    } = req.body;

    const startTs = buildTimestamp(date, start_time);
    const endTs = buildTimestamp(date, end_time);
    const attendeesList = parseAttendees(attendees);
    const isVirtual = !!(online_link && online_link.startsWith('http'));

    const result = await query(
      `INSERT INTO meetings
        (title, description, organizer_id, organizer_name, start_time, end_time, location,
         is_virtual, virtual_link, attendees, status, agenda, minutes, date, priority, notes, online_link)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        title, description || null,
        req.user?.id || null, organizer || req.user?.name || 'Manager',
        startTs || null, endTs || null, location || null,
        isVirtual, online_link || null,
        JSON.stringify(attendeesList),
        status || 'scheduled', agenda || null,
        notes || null, date || null,
        priority || 'normal', notes || null, online_link || null,
      ]
    );

    const io = req.app.get('io');
    if (io) {
      io.to('managers').emit('meeting-created', result.rows[0]);
      io.to('admins').emit('meeting-created', result.rows[0]);
    }

    return apiResponse(res, normalizeRow(result.rows[0]), {}, 201);
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
      title, description, date, start_time, end_time, location,
      organizer, attendees, status, priority, notes, agenda, online_link,
      minutes, virtual_link, is_virtual,
    } = req.body;

    const startTs = (date || start_time) ? buildTimestamp(date, start_time) : undefined;
    const endTs = (date || end_time) ? buildTimestamp(date, end_time) : undefined;
    const attendeesList = attendees ? parseAttendees(attendees) : undefined;

    const result = await query(
      `UPDATE meetings SET
        title=COALESCE($1,title),
        description=COALESCE($2,description),
        organizer_name=COALESCE($3,organizer_name),
        start_time=COALESCE($4,start_time),
        end_time=COALESCE($5,end_time),
        location=COALESCE($6,location),
        is_virtual=COALESCE($7,is_virtual),
        virtual_link=COALESCE($8,virtual_link),
        online_link=COALESCE($8,online_link),
        attendees=COALESCE($9,attendees),
        status=COALESCE($10,status),
        agenda=COALESCE($11,agenda),
        minutes=COALESCE($12,minutes),
        notes=COALESCE($12,notes),
        date=COALESCE($13,date),
        priority=COALESCE($14,priority),
        updated_at=NOW()
       WHERE id=$15 RETURNING *`,
      [
        title || null,
        description || null,
        organizer || null,
        startTs || null,
        endTs || null,
        location || null,
        is_virtual !== undefined ? is_virtual : null,
        online_link || virtual_link || null,
        attendeesList ? JSON.stringify(attendeesList) : null,
        status || null,
        agenda || null,
        notes || minutes || null,
        date || null,
        priority || null,
        id,
      ]
    );

    const io = req.app.get('io');
    if (io) {
      io.to('managers').emit('meeting-updated', result.rows[0]);
    }

    return apiResponse(res, normalizeRow(result.rows[0]));
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
      ${SELECT_SQL}
      WHERE (m.date >= CURRENT_DATE OR m.start_time >= NOW())
        AND m.status = 'scheduled'
      ORDER BY COALESCE(m.date, m.start_time::date) ASC
      LIMIT 10
    `);
    return apiResponse(res, result.rows.map(normalizeRow));
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllMeetings, getMeetingById, createMeeting, updateMeeting, deleteMeeting, getUpcomingMeetings };
