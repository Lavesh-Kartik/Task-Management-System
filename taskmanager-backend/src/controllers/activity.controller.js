const asyncHandler = require('express-async-handler');
const { supabase } = require('../config/db');

// @desc    Get activity logs for a task
// @route   GET /api/tasks/:id/activity
// @access  Private
const getTaskActivity = asyncHandler(async (req, res) => {
  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select(`
      *,
      user:users!activity_logs_user_id_fkey(id, name, email, avatar)
    `)
    .eq('task_id', req.params.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    res.status(500);
    throw new Error('Failed to fetch activity logs');
  }

  const formatted = (logs || []).map(l => ({
    ...l,
    _id: l.id,
    user: l.user ? { ...l.user, _id: l.user.id } : null,
  }));

  res.json({ success: true, data: formatted });
});

module.exports = { getTaskActivity };
