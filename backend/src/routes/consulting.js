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
    body('description').notEmpty().trim(),
    body('category').isIn(['performance', 'strategy', 'operations', 'finance'])
  ],
  consultingController.createTopic
);

router.put('/:id',
  [
    body('title').optional().trim().isLength({ min: 3, max: 255 }),
    body('status').optional().isIn(['open', 'resolved', 'in_discussion'])
  ],
  consultingController.updateTopic
);

router.post('/:topicId/replies',
  [
    body('content').notEmpty().trim()
  ],
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
