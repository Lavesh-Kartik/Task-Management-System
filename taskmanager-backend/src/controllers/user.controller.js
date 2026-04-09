const asyncHandler = require('express-async-handler');
const { supabase } = require('../config/db');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, role, avatar, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500);
    throw new Error('Failed to fetch users');
  }

  const formattedUsers = users.map(user => ({ ...user, _id: user.id }));
  res.json({ success: true, data: formattedUsers });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, avatar, is_active, created_at')
    .eq('id', req.params.id)
    .single();

  if (error || !user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: { ...user, _id: user.id } });
});

// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['admin', 'member'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role. Must be admin or member');
  }

  const { data: user, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', req.params.id)
    .select('id, name, email, role, avatar, is_active')
    .single();

  if (error || !user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({ success: true, data: { ...user, _id: user.id } });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id) {
    res.status(400);
    throw new Error('You cannot delete your own account from admin panel');
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    res.status(404);
    throw new Error('User not found or delete failed');
  }

  res.json({ success: true, message: 'User deleted' });
});

module.exports = { getUsers, getUser, updateUserRole, deleteUser };
