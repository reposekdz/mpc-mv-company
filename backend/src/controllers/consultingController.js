const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const pool = require('../config/db');

const getAllTopics = async (req, res, next) => {
  try {
    const { category, status, search } = req.query;
    let query = 'SELECT * FROM consulting_topics WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR author LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const [topics] = await pool.query(query, params);
    res.json(topics);
  } catch (error) {
    next(error);
  }
};

const getTopicById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [topics] = await pool.query('SELECT * FROM consulting_topics WHERE id = ?', [id]);

    if (topics.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const [replies] = await pool.query(
      'SELECT * FROM consulting_replies WHERE topic_id = ? ORDER BY date ASC, created_at ASC',
      [id]
    );

    res.json({ ...topics[0], replies });
  } catch (error) {
    next(error);
  }
};

const createTopic = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = uuidv4();
    const {
      title,
      description,
      author,
      date,
      category,
      status
    } = req.body;

    await pool.query(
      `INSERT INTO consulting_topics (
        id, title, description, author, date, category, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id, title, description, author || req.user.name, date || new Date(),
        category, status || 'open'
      ]
    );

    const [newTopic] = await pool.query('SELECT * FROM consulting_topics WHERE id = ?', [id]);
    res.status(201).json({ topic: newTopic[0], message: 'Topic created successfully' });
  } catch (error) {
    next(error);
  }
};

const updateTopic = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const [existingTopics] = await pool.query('SELECT id FROM consulting_topics WHERE id = ?', [id]);

    if (existingTopics.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const {
      title,
      description,
      category,
      status
    } = req.body;

    await pool.query(
      `UPDATE consulting_topics SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        status = COALESCE(?, status)
      WHERE id = ?`,
      [
        title, description, category, status, id
      ]
    );

    const [updatedTopic] = await pool.query('SELECT * FROM consulting_topics WHERE id = ?', [id]);
    res.json({ topic: updatedTopic[0], message: 'Topic updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteTopic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existingTopics] = await pool.query('SELECT id FROM consulting_topics WHERE id = ?', [id]);

    if (existingTopics.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    await pool.query('DELETE FROM consulting_topics WHERE id = ?', [id]);
    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const addReply = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topicId } = req.params;
    const [existingTopics] = await pool.query('SELECT id FROM consulting_topics WHERE id = ?', [topicId]);

    if (existingTopics.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const id = uuidv4();
    const { author, content, date } = req.body;

    await pool.query(
      `INSERT INTO consulting_replies (
        id, topic_id, author, content, date
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        id, topicId, author || req.user.name, content, date || new Date()
      ]
    );

    const [newReply] = await pool.query('SELECT * FROM consulting_replies WHERE id = ?', [id]);
    res.status(201).json({ reply: newReply[0], message: 'Reply added successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteReply = async (req, res, next) => {
  try {
    const { replyId } = req.params;
    const [existingReplies] = await pool.query('SELECT id FROM consulting_replies WHERE id = ?', [replyId]);

    if (existingReplies.length === 0) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    await pool.query('DELETE FROM consulting_replies WHERE id = ?', [replyId]);
    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  addReply,
  deleteReply
};
