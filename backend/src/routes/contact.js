const express = require('express');
const { body } = require('express-validator');
const pool = require('../config/db');
const { validationResult } = require('express-validator');

const router = express.Router();

router.post('/',
  [
    body('name').notEmpty().trim().isLength({ min: 2, max: 255 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('serviceType').optional().isIn(['mining', 'construction', 'fleet', 'analytics', 'safety', 'consulting']),
    body('subject').notEmpty().trim().isLength({ min: 2, max: 255 }),
    body('message').notEmpty().trim().isLength({ min: 10 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, phone, serviceType, subject, message } = req.body;

      await pool.query(
        'INSERT INTO contact_messages (name, email, phone, service_type, subject, message) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, phone || null, serviceType || null, subject, message]
      );

      res.status(201).json({ message: 'Message sent successfully. We will contact you soon.' });

    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }
);

router.get('/', async (req, res) => {
  try {
    const [messages] = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ messages, count: messages.length });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
