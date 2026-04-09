const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  // First registered user becomes admin
  const userCount = await User.countDocuments();
  const assignedRole = userCount === 0 ? 'admin' : role === 'admin' ? 'member' : 'member';

  const user = await User.create({ name, email, password, role: assignedRole });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    },
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});

// @desc    Update profile
// @route   PATCH /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;

  const updated = await user.save();
  res.json({ success: true, data: updated });
});

module.exports = { register, login, getMe, updateProfile };
