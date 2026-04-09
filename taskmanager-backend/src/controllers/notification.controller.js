const asyncHandler = require('express-async-handler');
const { supabase } = require('../config/db');

// @desc    Get notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user._id)
    .order('created_at', { ascending: false })
    .limit(50);

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.user._id)
    .eq('read', false);

  if (error) {
    res.status(500);
    throw new Error('Failed to fetch notifications');
  }

  const formatted = notifications.map(n => ({ ...n, _id: n.id, user: n.user_id }));
  res.json({ success: true, data: formatted, unreadCount });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markRead = asyncHandler(async (req, res) => {
  const { data: notification, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user._id)
    .select()
    .single();

  if (error || !notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.json({ success: true, data: { ...notification, _id: notification.id, user: notification.user_id } });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllRead = asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', req.user._id)
    .eq('read', false);
    
  if (error) {
    res.status(500);
    throw new Error('Failed to update notifications');
  }
  
  res.json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  await supabase
    .from('notifications')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user._id);
    
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
