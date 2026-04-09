const asyncHandler = require('express-async-handler');
const { supabase } = require('../config/db');
const { generateToken } = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  const { data: userExists } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).single();
  if (userExists) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  // First registered user becomes admin
  const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const assignedRole = count === 0 ? 'admin' : role === 'admin' ? 'member' : 'member';

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const { data: user, error } = await supabase.from('users').insert([{
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: assignedRole,
  }]).select().single();

  if (error) {
    res.status(500);
    throw new Error('Failed to create user');
  }

  res.status(201).json({
    success: true,
    data: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user.id),
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

  const { data: user } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single();

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    success: true,
    data: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user.id),
    },
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const { data: user } = await supabase.from('users').select('id, name, email, role, avatar, is_active').eq('id', req.user._id).single();
  res.json({ success: true, data: { ...user, _id: user.id } });
});

// @desc    Update profile
// @route   PATCH /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const updates = {};
  
  if (name !== undefined) updates.name = name;
  if (avatar !== undefined) updates.avatar = avatar;

  const { data: updated, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.user._id)
    .select('id, name, email, role, avatar, is_active')
    .single();

  if (error) {
    res.status(400);
    throw new Error('Profile update failed');
  }

  res.json({ success: true, data: { ...updated, _id: updated.id } });
});

module.exports = { register, login, getMe, updateProfile };
