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
    body('title').notEmpty().trim().isLength({ min: 3, max: 255 }),
    body('date').isDate(),
    body('start_time').notEmpty(),
    body('end_time').notEmpty(),
    body('location').notEmpty().trim(),
    body('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled']),
    body('priority').optional().isIn(['normal', 'important', 'urgent'])
  ],
  meetingsController.createMeeting
);

router.put('/:id',
  [
    body('title').optional().trim().isLength({ min: 3, max: 255 }),
    body('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
  ],
  meetingsController.updateMeeting
);

router.delete('/:id',
  authorizeRole('admin', 'manager'),
  meetingsController.deleteMeeting
);

module.exports = router;
