const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

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

      await query(
        'INSERT INTO contact_messages (name, email, phone, service_type, subject, message) VALUES ($1,$2,$3,$4,$5,$6)',
        [name, email, phone || null, serviceType || null, subject, message]
      );

      res.status(201).json({ message: 'Message sent successfully. We will contact you soon.' });
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }
);

router.use(authenticateToken);

router.get('/', authorizeRole('admin', 'manager'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/read', authorizeRole('admin', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE contact_messages SET is_read = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM contact_messages WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
