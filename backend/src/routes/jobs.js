const express = require('express');
const { body } = require('express-validator');
const jobsController = require('../controllers/jobsController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', jobsController.getAllJobs);
router.get('/stats', jobsController.getJobStats);
router.get('/:id', jobsController.getJobById);

router.post('/',
  authorizeRole('admin', 'manager'),
  [
    body('title').notEmpty().trim().isLength({ min: 3, max: 255 }),
    body('type').isIn(['mining', 'construction']),
    body('location').notEmpty().trim(),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'on_hold', 'cancelled']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('budget').optional().isFloat({ min: 0 }),
    body('progress').optional().isInt({ min: 0, max: 100 })
  ],
  jobsController.createJob
);

router.put('/:id',
  authorizeRole('admin', 'manager'),
  [
    body('title').optional().trim().isLength({ min: 3, max: 255 }),
    body('type').optional().isIn(['mining', 'construction']),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'on_hold', 'cancelled']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('budget').optional().isFloat({ min: 0 }),
    body('progress').optional().isInt({ min: 0, max: 100 })
  ],
  jobsController.updateJob
);

router.delete('/:id',
  authorizeRole('admin'),
  jobsController.deleteJob
);

module.exports = router;
