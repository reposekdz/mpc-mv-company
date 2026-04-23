const express = require('express');
const { body } = require('express-validator');
const consultingController = require('../controllers/consultingController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', consultingController.getAllTopics);
router.get('/:id', consultingController.getTopicById);

router.post('/',
  [
    body('title').notEmpty().trim().isLength({ min: 3, max: 255 }),
    body('description').optional().trim(),
    body('client_name').notEmpty().trim(),
    body('client_email').optional().isEmail().normalizeEmail(),
    body('status').optional().isIn(['new', 'in_progress', 'on_hold', 'completed', 'cancelled']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
  ],
  consultingController.createTopic
);

router.put('/:id',
  [
    body('title').optional().trim().isLength({ min: 3, max: 255 }),
    body('status').optional().isIn(['new', 'in_progress', 'on_hold', 'completed', 'cancelled']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
  ],
  consultingController.updateTopic
);

router.post('/:topicId/replies',
  [body('content').notEmpty().trim()],
  consultingController.addReply
);

router.delete('/:id',
  authorizeRole('admin'),
  consultingController.deleteTopic
);

router.delete('/replies/:replyId',
  authorizeRole('admin'),
  consultingController.deleteReply
);

module.exports = router;
