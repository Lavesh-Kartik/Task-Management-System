require('dotenv').config();
const { supabase } = require('./src/config/db');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  // Clean existing data
  await supabase.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('task_assignees').delete().neq('task_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('🗑️  Cleared existing data in Supabase');

  const salt = await bcrypt.genSalt(12);
  const password123 = await bcrypt.hash('password123', salt);

  // Create users
  const { data: users, error: usersError } = await supabase.from('users').insert([
    { name: 'Alice Admin', email: 'alice@taskflow.com', password: password123, role: 'admin' },
    { name: 'Bob Developer', email: 'bob@taskflow.com', password: password123, role: 'member' },
    { name: 'Carol Designer', email: 'carol@taskflow.com', password: password123, role: 'member' },
    { name: 'Dave QA', email: 'dave@taskflow.com', password: password123, role: 'member' },
  ]).select();

  if (usersError) throw usersError;

  console.log(`👥 Created ${users.length} users`);

  const alice = users.find(u => u.email === 'alice@taskflow.com');
  const bob = users.find(u => u.email === 'bob@taskflow.com');
  const carol = users.find(u => u.email === 'carol@taskflow.com');
  const dave = users.find(u => u.email === 'dave@taskflow.com');

  // Create tasks
  const { data: tasks, error: tasksError } = await supabase.from('tasks').insert([
    {
      title: 'Set up project architecture',
      description: 'Define folder structure, select tech stack, and create initial boilerplate for the new SaaS platform.',
      status: 'done',
      priority: 'high',
      labels: ['Backend', 'Feature'],
      creator_id: alice.id,
      deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      task_order: 0,
    },
    {
      title: 'Design system & component library',
      description: 'Create a consistent design system with Figma. Build reusable React components with Tailwind CSS.',
      status: 'done',
      priority: 'high',
      labels: ['Design', 'Frontend'],
      creator_id: alice.id,
      deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      task_order: 1,
    },
    {
      title: 'User authentication flow',
      description: 'Implement JWT-based login, registration, and password reset. Include email verification.',
      status: 'in_progress',
      priority: 'high',
      labels: ['Backend', 'Feature'],
      creator_id: alice.id,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      task_order: 0,
    },
    {
      title: 'Kanban board implementation',
      description: 'Build drag-and-drop Kanban board using @dnd-kit. Support for To Do, In Progress, Done columns.',
      status: 'in_progress',
      priority: 'medium',
      labels: ['Frontend', 'Feature'],
      creator_id: bob.id,
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      task_order: 1,
    },
    {
      title: 'Write API integration tests',
      description: 'Create comprehensive test suite for all REST endpoints using Jest and Supertest.',
      status: 'in_progress',
      priority: 'medium',
      labels: ['Testing', 'Backend'],
      creator_id: alice.id,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      task_order: 2,
    },
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment to Render + Vercel.',
      status: 'todo',
      priority: 'medium',
      labels: ['Backend', 'Feature'],
      creator_id: alice.id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      task_order: 0,
    },
    {
      title: 'Dashboard analytics charts',
      description: 'Add visual charts for task completion rate, team performance, and deadline tracking.',
      status: 'todo',
      priority: 'low',
      labels: ['Frontend', 'Feature'],
      creator_id: bob.id,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      task_order: 1,
    },
    {
      title: 'Mobile responsive layout',
      description: 'Ensure all pages work perfectly on mobile devices. Fix kanban overflow and navigation.',
      status: 'todo',
      priority: 'medium',
      labels: ['Frontend', 'Design'],
      creator_id: carol.id,
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      task_order: 2,
    },
    {
      title: 'Fix login redirect bug',
      description: 'After password reset, users are redirected to 404 page instead of dashboard.',
      status: 'todo',
      priority: 'high',
      labels: ['Bug', 'Urgent'],
      creator_id: dave.id,
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      task_order: 3,
    },
    {
      title: 'Performance audit & optimization',
      description: 'Run Lighthouse audit. Optimize images, lazy load components, minimize bundle size.',
      status: 'todo',
      priority: 'low',
      labels: ['Frontend', 'Testing'],
      creator_id: alice.id,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      task_order: 4,
    },
  ]).select();

  if (tasksError) throw tasksError;
  console.log(`✅ Created ${tasks.length} tasks`);

  // Map assignees by indexes
  const assigneesAssignments = [
    { task_idx: 0, assignees: [alice.id, bob.id] },
    { task_idx: 1, assignees: [carol.id] },
    { task_idx: 2, assignees: [bob.id] },
    { task_idx: 3, assignees: [carol.id, bob.id] },
    { task_idx: 4, assignees: [dave.id] },
    { task_idx: 5, assignees: [alice.id] },
    { task_idx: 6, assignees: [carol.id] },
    { task_idx: 7, assignees: [carol.id, dave.id] },
    { task_idx: 8, assignees: [bob.id] },
    { task_idx: 9, assignees: [dave.id] },
  ];

  const assigneeInserts = [];
  assigneesAssignments.forEach(({ task_idx, assignees }) => {
    assignees.forEach(uid => assigneeInserts.push({ task_id: tasks[task_idx].id, user_id: uid }));
  });
  
  await supabase.from('task_assignees').insert(assigneeInserts);

  // Create comments
  await supabase.from('comments').insert([
    { task_id: tasks[0].id, author_id: bob.id, content: 'Completed the backend structure. Using MVC pattern with Express.' },
    { task_id: tasks[0].id, author_id: alice.id, content: 'Looks great! Approved for merge. 🎉' },
    { task_id: tasks[2].id, author_id: bob.id, content: 'JWT implementation is 80% done. Working on refresh token logic.' },
    { task_id: tasks[2].id, author_id: alice.id, content: 'Make sure to add rate limiting on the login endpoint.' },
    { task_id: tasks[3].id, author_id: carol.id, content: 'Drag and drop is working. Need to add smooth animations.' },
    { task_id: tasks[4].id, author_id: dave.id, content: 'Setting up the test environment. Will start writing tests tomorrow.' },
    { task_id: tasks[8].id, author_id: dave.id, content: 'Reproduced the bug. It\'s in the router config. Assigning to Bob.' },
    { task_id: tasks[8].id, author_id: bob.id, content: 'On it! Should be a quick fix.' },
  ]);

  console.log('💬 Created comments');

  console.log('\n🎉 Seed complete! Test accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:  alice@taskflow.com / password123');
  console.log('Member: bob@taskflow.com   / password123');
  console.log('Member: carol@taskflow.com / password123');
  console.log('Member: dave@taskflow.com  / password123');

  process.exit(0);
};

seedData().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
