const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    Get notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

  res.json({ success: true, data: notifications, unreadCount });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.json({ success: true, data: notification });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
