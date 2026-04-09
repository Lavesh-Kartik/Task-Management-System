require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');
};

const seedData = async () => {
  await connectDB();

  const User = require('./src/models/User');
  const Task = require('./src/models/Task');
  const Comment = require('./src/models/Comment');

  // Clean existing data
  await User.deleteMany({});
  await Task.deleteMany({});
  await Comment.deleteMany({});

  console.log('🗑️  Cleared existing data');

  // Create users
  const users = await User.create([
    { name: 'Alice Admin', email: 'alice@taskflow.com', password: 'password123', role: 'admin' },
    { name: 'Bob Developer', email: 'bob@taskflow.com', password: 'password123', role: 'member' },
    { name: 'Carol Designer', email: 'carol@taskflow.com', password: 'password123', role: 'member' },
    { name: 'Dave QA', email: 'dave@taskflow.com', password: 'password123', role: 'member' },
  ]);

  console.log(`👥 Created ${users.length} users`);

  const [alice, bob, carol, dave] = users;

  // Create tasks
  const tasks = await Task.create([
    {
      title: 'Set up project architecture',
      description: 'Define folder structure, select tech stack, and create initial boilerplate for the new SaaS platform.',
      status: 'done',
      priority: 'high',
      labels: ['Backend', 'Feature'],
      assignees: [alice._id, bob._id],
      creator: alice._id,
      deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      order: 0,
    },
    {
      title: 'Design system & component library',
      description: 'Create a consistent design system with Figma. Build reusable React components with Tailwind CSS.',
      status: 'done',
      priority: 'high',
      labels: ['Design', 'Frontend'],
      assignees: [carol._id],
      creator: alice._id,
      deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      order: 1,
    },
    {
      title: 'User authentication flow',
      description: 'Implement JWT-based login, registration, and password reset. Include email verification.',
      status: 'in_progress',
      priority: 'high',
      labels: ['Backend', 'Feature'],
      assignees: [bob._id],
      creator: alice._id,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      order: 0,
    },
    {
      title: 'Kanban board implementation',
      description: 'Build drag-and-drop Kanban board using @dnd-kit. Support for To Do, In Progress, Done columns.',
      status: 'in_progress',
      priority: 'medium',
      labels: ['Frontend', 'Feature'],
      assignees: [carol._id, bob._id],
      creator: bob._id,
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      order: 1,
    },
    {
      title: 'Write API integration tests',
      description: 'Create comprehensive test suite for all REST endpoints using Jest and Supertest.',
      status: 'in_progress',
      priority: 'medium',
      labels: ['Testing', 'Backend'],
      assignees: [dave._id],
      creator: alice._id,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      order: 2,
    },
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment to Render + Vercel.',
      status: 'todo',
      priority: 'medium',
      labels: ['Backend', 'Feature'],
      assignees: [alice._id],
      creator: alice._id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      order: 0,
    },
    {
      title: 'Dashboard analytics charts',
      description: 'Add visual charts for task completion rate, team performance, and deadline tracking.',
      status: 'todo',
      priority: 'low',
      labels: ['Frontend', 'Feature'],
      assignees: [carol._id],
      creator: bob._id,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      order: 1,
    },
    {
      title: 'Mobile responsive layout',
      description: 'Ensure all pages work perfectly on mobile devices. Fix kanban overflow and navigation.',
      status: 'todo',
      priority: 'medium',
      labels: ['Frontend', 'Design'],
      assignees: [carol._id, dave._id],
      creator: carol._id,
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      order: 2,
    },
    {
      title: 'Fix login redirect bug',
      description: 'After password reset, users are redirected to 404 page instead of dashboard.',
      status: 'todo',
      priority: 'high',
      labels: ['Bug', 'Urgent'],
      assignees: [bob._id],
      creator: dave._id,
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      order: 3,
    },
    {
      title: 'Performance audit & optimization',
      description: 'Run Lighthouse audit. Optimize images, lazy load components, minimize bundle size.',
      status: 'todo',
      priority: 'low',
      labels: ['Frontend', 'Testing'],
      assignees: [dave._id],
      creator: alice._id,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      order: 4,
    },
  ]);

  console.log(`✅ Created ${tasks.length} tasks`);

  // Create comments
  await Comment.create([
    { task: tasks[0]._id, author: bob._id, content: 'Completed the backend structure. Using MVC pattern with Express.' },
    { task: tasks[0]._id, author: alice._id, content: 'Looks great! Approved for merge. 🎉' },
    { task: tasks[2]._id, author: bob._id, content: 'JWT implementation is 80% done. Working on refresh token logic.' },
    { task: tasks[2]._id, author: alice._id, content: 'Make sure to add rate limiting on the login endpoint.' },
    { task: tasks[3]._id, author: carol._id, content: 'Drag and drop is working. Need to add smooth animations.' },
    { task: tasks[4]._id, author: dave._id, content: 'Setting up the test environment. Will start writing tests tomorrow.' },
    { task: tasks[8]._id, author: dave._id, content: 'Reproduced the bug. It\'s in the router config. Assigning to Bob.' },
    { task: tasks[8]._id, author: bob._id, content: 'On it! Should be a quick fix.' },
  ]);

  console.log('💬 Created comments');

  console.log('\n🎉 Seed complete! Test accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:  alice@taskflow.com / password123');
  console.log('Member: bob@taskflow.com   / password123');
  console.log('Member: carol@taskflow.com / password123');
  console.log('Member: dave@taskflow.com  / password123');

  await mongoose.disconnect();
  process.exit(0);
};

seedData().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
