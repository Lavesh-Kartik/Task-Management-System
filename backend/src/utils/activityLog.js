const { supabase } = require('../config/db');

/**
 * Log an activity against a task.
 * @param {Object} params
 * @param {string} params.taskId  - UUID of the task
 * @param {string} params.userId  - UUID of the user performing the action
 * @param {string} params.action  - Short action key (created, updated_status, assigned, commented, deleted, etc.)
 * @param {string} [params.details] - Human-readable detail string
 */
const logActivity = async ({ taskId, userId, action, details = '' }) => {
  try {
    const { error } = await supabase.from('activity_logs').insert([{
      task_id: taskId,
      user_id: userId,
      action,
      details,
    }]);
    if (error) throw error;
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

module.exports = { logActivity };
