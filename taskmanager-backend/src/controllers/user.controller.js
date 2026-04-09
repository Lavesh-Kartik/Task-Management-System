const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: user });
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

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({ success: true, data: user });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account from admin panel');
  }

  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});

module.exports = { getUsers, getUser, updateUserRole, deleteUser };
