const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getComments,
  addComment,
  deleteComment,
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTask).patch(updateTask).delete(deleteTask);
router.route('/:id/comments').get(getComments).post(addComment);
router.delete('/:id/comments/:commentId', deleteComment);

module.exports = router;
