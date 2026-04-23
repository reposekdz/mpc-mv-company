const express = require('express');
const { body } = require('express-validator');
const employeesController = require('../controllers/employeesController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', employeesController.getAllEmployees);
router.get('/stats', employeesController.getEmployeeStats);
router.get('/:id', employeesController.getEmployeeById);

router.post('/',
  authorizeRole('admin', 'manager'),
  [
    body('first_name').notEmpty().trim().isLength({ min: 1, max: 100 }),
    body('last_name').notEmpty().trim().isLength({ min: 1, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('position').notEmpty().trim(),
    body('department').notEmpty().trim(),
    body('hire_date').notEmpty(),
    body('employment_type').optional().isIn(['full_time', 'part_time', 'contract', 'temporary']),
    body('salary').optional().isFloat({ min: 0 }),
    body('hourly_rate').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['active', 'inactive', 'on_leave', 'terminated'])
  ],
  employeesController.createEmployee
);

router.put('/:id',
  authorizeRole('admin', 'manager'),
  [
    body('first_name').optional().trim().isLength({ min: 1, max: 100 }),
    body('last_name').optional().trim().isLength({ min: 1, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('status').optional().isIn(['active', 'inactive', 'on_leave', 'terminated']),
    body('employment_type').optional().isIn(['full_time', 'part_time', 'contract', 'temporary']),
    body('salary').optional().isFloat({ min: 0 })
  ],
  employeesController.updateEmployee
);

router.post('/process-payroll',
  authorizeRole('admin'),
  employeesController.processPayroll
);

router.delete('/:id',
  authorizeRole('admin'),
  employeesController.deleteEmployee
);

router.post('/bulk',
  authorizeRole('admin', 'manager'),
  employeesController.bulkCreateEmployees
);

router.put('/bulk',
  authorizeRole('admin', 'manager'),
  employeesController.bulkUpdateEmployees
);

router.delete('/bulk',
  authorizeRole('admin'),
  employeesController.bulkDeleteEmployees
);

module.exports = router;
