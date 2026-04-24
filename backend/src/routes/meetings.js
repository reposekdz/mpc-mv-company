const express = require('express');
const { body } = require('express-validator');
const meetingsController = require('../controllers/meetingsController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', meetingsController.getAllMeetings);
router.get('/upcoming', meetingsController.getUpcomingMeetings);
router.get('/:id', meetingsController.getMeetingById);

router.post('/',
  [
    body('title').notEmpty().trim().isLength({ min: 1, max: 255 }),
    body('date').notEmpty(),
    body('start_time').optional(),
    body('end_time').optional(),
    body('location').optional().trim(),
    body('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled']),
    body('priority').optional().isIn(['normal', 'important', 'urgent']),
    body('organizer').optional().trim(),
    body('attendees').optional(),
    body('notes').optional(),
    body('agenda').optional(),
    body('online_link').optional(),
  ],
  meetingsController.createMeeting
);

router.put('/:id',
  [
    body('title').optional().trim().isLength({ min: 1, max: 255 }),
    body('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled']),
    body('priority').optional().isIn(['normal', 'important', 'urgent']),
  ],
  meetingsController.updateMeeting
);

// PATCH for partial updates (notes, status changes)
router.patch('/:id', meetingsController.updateMeeting);

router.delete('/:id',
  authorizeRole('admin', 'manager'),
  meetingsController.deleteMeeting
);

module.exports = router;
