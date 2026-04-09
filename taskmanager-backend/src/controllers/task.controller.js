const asyncHandler = require('express-async-handler');
const { supabase } = require('../config/db');
const { createNotification } = require('../utils/notification');
const { logActivity } = require('../utils/activityLog');

const formatTask = (task) => {
  if (!task) return null;
  const formatted = { ...task, _id: task.id };
  formatted.creator = task.creator ? { ...task.creator, _id: task.creator.id } : null;
  if (task.task_assignees) {
    formatted.assignees = task.task_assignees.map(ta => ({
      _id: ta.users?.id,
      name: ta.users?.name,
      email: ta.users?.email,
      avatar: ta.users?.avatar
    }));
    delete formatted.task_assignees;
  }
  return formatted;
};

// @desc    Get all tasks (with filters)
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, assignee, search, sort } = req.query;
  
  let query = supabase.from('tasks').select(`
    *,
    creator:users!tasks_creator_id_fkey(id, name, email, avatar),
    task_assignees(
      users(id, name, email, avatar)
    )
  `);

  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);
  if (search) query = query.ilike('title', `%${search}%`); // basic search

  let sortColumn = 'created_at';
  let matchSort = false;
  if (sort === 'deadline') { sortColumn = 'deadline'; matchSort = true; }
  if (sort === 'priority') { sortColumn = 'priority'; matchSort = false; }
  if (sort === 'order') { sortColumn = 'task_order'; matchSort = true; }
  
  query = query.order(sortColumn, { ascending: matchSort });

  const { data: tasks, error } = await query;

  if (error) {
    res.status(500);
    throw new Error('Failed to fetch tasks');
  }

  let formattedTasks = tasks.map(formatTask);
  
  if (assignee) {
    formattedTasks = formattedTasks.filter(t => 
      t.assignees && t.assignees.some(a => a._id === assignee)
    );
  }

  res.json({ success: true, count: formattedTasks.length, data: formattedTasks });
});

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, deadline, labels, assignees, order } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Task title is required');
  }

  const { data: task, error } = await supabase.from('tasks').insert([{
    title,
    description: description || '',
    status: status || 'todo',
    priority: priority || 'medium',
    deadline: deadline || null,
    labels: labels || [],
    creator_id: req.user._id,
    task_order: order || 0
  }]).select().single();

  if (error) {
    res.status(500);
    throw new Error('Failed to create task');
  }

  // Log activity: task created
  await logActivity({
    taskId: task.id,
    userId: req.user._id,
    action: 'created',
    details: `Created task "${title}"`,
  });

  if (assignees && assignees.length > 0) {
    const assigneeInserts = assignees.map(userId => ({
      task_id: task.id,
      user_id: userId
    }));
    await supabase.from('task_assignees').insert(assigneeInserts);

    // Fetch assignee names for activity log
    const { data: assigneeUsers } = await supabase.from('users').select('id, name').in('id', assignees);
    const nameMap = {};
    (assigneeUsers || []).forEach(u => { nameMap[u.id] = u.name; });
    
    // Log activity: assignees added
    for (const userId of assignees) {
      await logActivity({
        taskId: task.id,
        userId: req.user._id,
        action: 'assigned',
        details: `Assigned ${nameMap[userId] || 'a user'} to the task`,
      });
    }

    // Notify assignees
    for (const userId of assignees) {
      if (userId.toString() !== req.user._id.toString()) {
        await createNotification({
          userId,
          message: `${req.user.name} assigned you to task: "${title}"`,
          type: 'task_assigned',
          link: `/tasks/${task.id}`,
        });
      }
    }
  }

  // Fetch populated task
  const { data: populatedTask } = await supabase.from('tasks').select(`
    *,
    creator:users!tasks_creator_id_fkey(id, name, email, avatar),
    task_assignees(users(id, name, email, avatar))
  `).eq('id', task.id).single();

  res.status(201).json({ success: true, data: formatTask(populatedTask) });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = asyncHandler(async (req, res) => {
  const { data: task, error } = await supabase.from('tasks').select(`
    *,
    creator:users!tasks_creator_id_fkey(id, name, email, avatar),
    task_assignees(users(id, name, email, avatar))
  `).eq('id', req.params.id).single();

  if (error || !task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.json({ success: true, data: formatTask(task) });
});

// @desc    Update task
// @route   PATCH /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const { data: task } = await supabase.from('tasks').select('*').eq('id', req.params.id).single();

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const isCreator = task.creator_id === req.user._id;
  const isAdmin = req.user.role === 'admin';

  if (!isCreator && !isAdmin) {
    if (Object.keys(req.body).filter(k => k !== 'status' && k !== 'order').length > 0) {
      res.status(403);
      throw new Error('You can only update the task status');
    }
  }

  const { title, description, status, priority, deadline, labels, assignees, order } = req.body;
  const updates = {};

  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (deadline !== undefined) updates.deadline = deadline;
  if (labels !== undefined) updates.labels = labels;
  if (order !== undefined) updates.task_order = order;

  if (Object.keys(updates).length > 0) {
    await supabase.from('tasks').update(updates).eq('id', req.params.id);
  }

  // Log field-level changes
  const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
  if (status !== undefined && status !== task.status) {
    await logActivity({
      taskId: task.id,
      userId: req.user._id,
      action: 'updated_status',
      details: `Changed status from "${STATUS_LABEL[task.status] || task.status}" to "${STATUS_LABEL[status] || status}"`,
    });
  }
  if (priority !== undefined && priority !== task.priority) {
    await logActivity({
      taskId: task.id,
      userId: req.user._id,
      action: 'updated_priority',
      details: `Changed priority from "${task.priority}" to "${priority}"`,
    });
  }
  if (title !== undefined && title !== task.title) {
    await logActivity({
      taskId: task.id,
      userId: req.user._id,
      action: 'updated_title',
      details: `Renamed task from "${task.title}" to "${title}"`,
    });
  }
  if (deadline !== undefined && deadline !== task.deadline) {
    await logActivity({
      taskId: task.id,
      userId: req.user._id,
      action: 'updated_deadline',
      details: deadline ? `Set deadline to ${new Date(deadline).toLocaleDateString()}` : 'Removed deadline',
    });
  }

  if (assignees !== undefined) {
    // Get old assignees before replacing
    const { data: oldAssignees } = await supabase.from('task_assignees').select('user_id').eq('task_id', req.params.id);
    const oldAssigneeIds = (oldAssignees || []).map(a => a.user_id);

    await supabase.from('task_assignees').delete().eq('task_id', req.params.id);
    if (assignees.length > 0) {
      await supabase.from('task_assignees').insert(assignees.map(uid => ({ task_id: req.params.id, user_id: uid })));
    }

    // Log assignment changes
    const newlyAdded = assignees.filter(uid => !oldAssigneeIds.includes(uid));
    const removed = oldAssigneeIds.filter(uid => !assignees.includes(uid));

    if (newlyAdded.length > 0) {
      const { data: newUsers } = await supabase.from('users').select('id, name').in('id', newlyAdded);
      const nameMap = {};
      (newUsers || []).forEach(u => { nameMap[u.id] = u.name; });
      for (const uid of newlyAdded) {
        await logActivity({
          taskId: task.id,
          userId: req.user._id,
          action: 'assigned',
          details: `Assigned ${nameMap[uid] || 'a user'} to the task`,
        });
      }
    }

    if (removed.length > 0) {
      const { data: removedUsers } = await supabase.from('users').select('id, name').in('id', removed);
      const nameMap = {};
      (removedUsers || []).forEach(u => { nameMap[u.id] = u.name; });
      for (const uid of removed) {
        await logActivity({
          taskId: task.id,
          userId: req.user._id,
          action: 'unassigned',
          details: `Removed ${nameMap[uid] || 'a user'} from the task`,
        });
      }
    }

    // Notify newly added assignees
    for (const userId of newlyAdded) {
      if (userId.toString() !== req.user._id.toString()) {
        await createNotification({
          userId,
          message: `${req.user.name} assigned you to task: "${task.title}"`,
          type: 'task_assigned',
          link: `/tasks/${task.id}`,
        });
      }
    }
  }

  // Notify assignees if status changed
  if (status !== undefined && status !== task.status) {
    const { data: currentAssignees } = await supabase.from('task_assignees').select('user_id').eq('task_id', req.params.id);
    for (const a of (currentAssignees || [])) {
      if (a.user_id.toString() !== req.user._id.toString()) {
        await createNotification({
          userId: a.user_id,
          message: `${req.user.name} updated task "${task.title}" status to ${status.replace('_', ' ')}`,
          type: 'task_updated',
          link: `/tasks/${task.id}`,
        });
      }
    }
  }

  // Fetch updated fully populated
  const { data: updatedTask } = await supabase.from('tasks').select(`
    *,
    creator:users!tasks_creator_id_fkey(id, name, email, avatar),
    task_assignees(users(id, name, email, avatar))
  `).eq('id', req.params.id).single();

  res.json({ success: true, data: formatTask(updatedTask) });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (creator or admin)
const deleteTask = asyncHandler(async (req, res) => {
  const { data: task } = await supabase.from('tasks').select('*').eq('id', req.params.id).single();

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const isCreator = task.creator_id === req.user._id;
  const isAdmin = req.user.role === 'admin';

  if (!isCreator && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to delete this task');
  }

  // Activity log entry will be cascade-deleted with the task, so we skip logging here
  await supabase.from('tasks').delete().eq('id', req.params.id);

  res.json({ success: true, message: 'Task deleted' });
});

// @desc    Get comments for a task
// @route   GET /api/tasks/:id/comments
// @access  Private
const getComments = asyncHandler(async (req, res) => {
  const { data: comments } = await supabase.from('comments').select(`
    *,
    author:users!comments_author_id_fkey(id, name, email, avatar)
  `).eq('task_id', req.params.id).order('created_at', { ascending: true });

  const formatted = (comments || []).map(c => ({
    ...c,
    _id: c.id,
    author: c.author ? { ...c.author, _id: c.author.id } : null
  }));

  res.json({ success: true, data: formatted });
});

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    res.status(400);
    throw new Error('Comment content is required');
  }

  const { data: task } = await supabase.from('tasks').select('*').eq('id', req.params.id).single();
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const { data: comment, error } = await supabase.from('comments').insert([{
    task_id: req.params.id,
    author_id: req.user._id,
    content
  }]).select().single();

  if (error) {
    res.status(500);
    throw new Error('Failed to create comment');
  }

  // Log activity: comment added
  await logActivity({
    taskId: req.params.id,
    userId: req.user._id,
    action: 'commented',
    details: content.length > 80 ? content.substring(0, 80) + '…' : content,
  });

  const { data: populatedComment } = await supabase.from('comments').select(`
    *, author:users!comments_author_id_fkey(id, name, email, avatar)
  `).eq('id', comment.id).single();

  // Notify the task creator
  if (task.creator_id !== req.user._id) {
    await createNotification({
      userId: task.creator_id,
      message: `${req.user.name} commented on "${task.title}"`,
      type: 'comment_added',
      link: `/tasks/${task.id}`,
    });
  }

  // Notify assignees (except commenter and creator already notified)
  const { data: taskAssignees } = await supabase.from('task_assignees').select('user_id').eq('task_id', req.params.id);
  for (const a of (taskAssignees || [])) {
    if (a.user_id !== req.user._id && a.user_id !== task.creator_id) {
      await createNotification({
        userId: a.user_id,
        message: `${req.user.name} commented on "${task.title}"`,
        type: 'comment_added',
        link: `/tasks/${task.id}`,
      });
    }
  }

  const formatted = { ...populatedComment, _id: populatedComment.id };
  formatted.author = formatted.author ? { ...formatted.author, _id: formatted.author.id } : null;

  res.status(201).json({ success: true, data: formatted });
});

// @desc    Delete comment
// @route   DELETE /api/tasks/:id/comments/:commentId
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const { data: comment } = await supabase.from('comments').select('*').eq('id', req.params.commentId).single();

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  const isAuthor = comment.author_id === req.user._id;
  const isAdmin = req.user.role === 'admin';

  if (!isAuthor && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }

  await supabase.from('comments').delete().eq('id', req.params.commentId);

  // Log activity: comment deleted
  await logActivity({
    taskId: req.params.id,
    userId: req.user._id,
    action: 'deleted_comment',
    details: 'Deleted a comment',
  });

  res.json({ success: true, message: 'Comment deleted' });
});

module.exports = {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getComments,
  addComment,
  deleteComment,
};
