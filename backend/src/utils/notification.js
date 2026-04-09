const { supabase } = require('../config/db');

const createNotification = async ({ userId, message, type = 'general', link = '' }) => {
  try {
    const { error } = await supabase.from('notifications').insert([{
      user_id: userId,
      message,
      type,
      link
    }]);
    if (error) throw error;
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

module.exports = { createNotification };
