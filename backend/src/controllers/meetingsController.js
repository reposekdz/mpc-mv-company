const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const pool = require('../config/db');

const getAllMeetings = async (req, res, next) => {
  try {
    const { status, dateFrom, dateTo, search } = req.query;
    let query = 'SELECT * FROM meetings WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (dateFrom) {
      query += ' AND date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND date <= ?';
      params.push(dateTo);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ? OR organizer LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY date ASC, start_time ASC';

    const [meetings] = await pool.query(query, params);
    
    const parsedMeetings = meetings.map(meeting => ({
      ...meeting,
      attendees: JSON.parse(meeting.attendees || '[]')
    }));

    res.json({ meetings: parsedMeetings, count: parsedMeetings.length });
  } catch (error) {
    next(error);
  }
};

const getMeetingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [meetings] = await pool.query('SELECT * FROM meetings WHERE id = ?', [id]);

    if (meetings.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = {
      ...meetings[0],
      attendees: JSON.parse(meetings[0].attendees || '[]')
    };

    res.json({ meeting });
  } catch (error) {
    next(error);
  }
};

const createMeeting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = uuidv4();
    const {
      title,
      description,
      date,
      start_time,
      end_time,
      location,
      organizer,
      attendees,
      status,
      priority,
      notes,
      agenda
    } = req.body;

    await pool.query(
      `INSERT INTO meetings (
        id, title, description, date, start_time, end_time, location,
        organizer, attendees, status, priority, notes, agenda
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, title, description, date, start_time, end_time, location,
        organizer || req.user.name, JSON.stringify(attendees || []),
        status || 'scheduled', priority || 'normal', notes, agenda
      ]
    );

    const [newMeeting] = await pool.query('SELECT * FROM meetings WHERE id = ?', [id]);
    const parsedMeeting = {
      ...newMeeting[0],
      attendees: JSON.parse(newMeeting[0].attendees || '[]')
    };

    res.status(201).json({ meeting: parsedMeeting, message: 'Meeting created successfully' });
  } catch (error) {
    next(error);
  }
};

const updateMeeting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const [existingMeetings] = await pool.query('SELECT id FROM meetings WHERE id = ?', [id]);

    if (existingMeetings.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const {
      title,
      description,
      date,
      start_time,
      end_time,
      location,
      organizer,
      attendees,
      status,
      priority,
      notes,
      agenda
    } = req.body;

    await pool.query(
      `UPDATE meetings SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        date = COALESCE(?, date),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        location = COALESCE(?, location),
        organizer = COALESCE(?, organizer),
        attendees = COALESCE(?, attendees),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        notes = COALESCE(?, notes),
        agenda = COALESCE(?, agenda)
      WHERE id = ?`,
      [
        title, description, date, start_time, end_time, location, organizer,
        attendees ? JSON.stringify(attendees) : undefined, status, priority,
        notes, agenda, id
      ]
    );

    const [updatedMeeting] = await pool.query('SELECT * FROM meetings WHERE id = ?', [id]);
    const parsedMeeting = {
      ...updatedMeeting[0],
      attendees: JSON.parse(updatedMeeting[0].attendees || '[]')
    };

    res.json({ meeting: parsedMeeting, message: 'Meeting updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existingMeetings] = await pool.query('SELECT id FROM meetings WHERE id = ?', [id]);

    if (existingMeetings.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    await pool.query('DELETE FROM meetings WHERE id = ?', [id]);
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getUpcomingMeetings = async (req, res, next) => {
  try {
    const [meetings] = await pool.query(`
      SELECT * FROM meetings 
      WHERE date >= CURDATE() 
      AND status = 'scheduled'
      ORDER BY date ASC, start_time ASC
      LIMIT 10
    `);

    const parsedMeetings = meetings.map(meeting => ({
      ...meeting,
      attendees: JSON.parse(meeting.attendees || '[]')
    }));

    res.json({ meetings: parsedMeetings });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getUpcomingMeetings
};
