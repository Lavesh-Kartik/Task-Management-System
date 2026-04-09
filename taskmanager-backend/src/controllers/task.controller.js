const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const { createNotification } = require('../utils/notification');

// @desc    Get all tasks (with filters)
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, assignee, search, sort } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignees = assignee;
  if (search) filter.$text = { $search: search };

  let sortOption = { createdAt: -1 };
  if (sort === 'deadline') sortOption = { deadline: 1 };
  if (sort === 'priority') sortOption = { priority: -1 };
  if (sort === 'order') sortOption = { order: 1 };

  const tasks = await Task.find(filter)
    .populate('assignees', 'name email avatar')
    .populate('creator', 'name email avatar')
    .sort(sortOption);

  res.json({ success: true, count: tasks.length, data: tasks });
});

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, deadline, labels, assignees, order } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Task title is required');
  }

  const task = await Task.create({
    title,
    description,
    status: status || 'todo',
    priority: priority || 'medium',
    deadline,
    labels,
    assignees,
    order: order || 0,
    creator: req.user._id,
  });

  const populated = await task.populate([
    { path: 'assignees', select: 'name email avatar' },
    { path: 'creator', select: 'name email avatar' },
  ]);

  // Notify assignees
  if (assignees && assignees.length > 0) {
    for (const userId of assignees) {
      if (userId.toString() !== req.user._id.toString()) {
        await createNotification({
          userId,
          message: `${req.user.name} assigned you to task: "${title}"`,
          type: 'task_assigned',
          link: `/tasks/${task._id}`,
        });
      }
    }
  }

  res.status(201).json({ success: true, data: populated });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignees', 'name email avatar')
    .populate('creator', 'name email avatar');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.json({ success: true, data: task });
});

// @desc    Update task
// @route   PATCH /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Only creator or admin can fully update
  const isCreator = task.creator.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCreator && !isAdmin) {
    // Members can only update status
    if (Object.keys(req.body).filter(k => k !== 'status' && k !== 'order').length > 0) {
      res.status(403);
      throw new Error('You can only update the task status');
    }
  }

  const { title, description, status, priority, deadline, labels, assignees, order } = req.body;

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (deadline !== undefined) task.deadline = deadline;
  if (labels !== undefined) task.labels = labels;
  if (assignees !== undefined) task.assignees = assignees;
  if (order !== undefined) task.order = order;

  const updated = await task.save();
  await updated.populate([
    { path: 'assignees', select: 'name email avatar' },
    { path: 'creator', select: 'name email avatar' },
  ]);

  res.json({ success: true, data: updated });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (creator or admin)
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const isCreator = task.creator.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCreator && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to delete this task');
  }

  await task.deleteOne();
  await Comment.deleteMany({ task: req.params.id });

  res.json({ success: true, message: 'Task deleted' });
});

// @desc    Get comments for a task
// @route   GET /api/tasks/:id/comments
// @access  Private
const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ task: req.params.id })
    .populate('author', 'name email avatar')
    .sort({ createdAt: 1 });

  res.json({ success: true, data: comments });
});

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    res.status(400);
    throw new Error('Comment content is required');
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const comment = await Comment.create({
    task: req.params.id,
    author: req.user._id,
    content,
  });

  await comment.populate('author', 'name email avatar');

  // Notify task creator if different user
  if (task.creator.toString() !== req.user._id.toString()) {
    await createNotification({
      userId: task.creator,
      message: `${req.user.name} commented on "${task.title}"`,
      type: 'comment_added',
      link: `/tasks/${task._id}`,
    });
  }

  res.status(201).json({ success: true, data: comment });
});

// @desc    Delete comment
// @route   DELETE /api/tasks/:id/comments/:commentId
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  const isAuthor = comment.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAuthor && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }

  await comment.deleteOne();
  res.json({ success: true, message: 'Comment deleted' });
});

module.exports = {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getComments,
  addComment,
  deleteComment,
};
