import { useState, useEffect } from 'react';
import { X, Calendar, Tag, User, MessageSquare, Trash2, Edit3, Clock, Loader2, Send, CheckCircle } from 'lucide-react';
import { taskAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useTask } from '../../context/TaskContext';
import { format, isPast, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

const PRIORITY_COLOR = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export default function TaskDetailModal({ taskId, onClose, onEdit }) {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, isAdmin } = useAuth();
  const { deleteTask, updateTask } = useTask();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [taskRes, commRes] = await Promise.all([
          taskAPI.getOne(taskId),
          taskAPI.getComments(taskId),
        ]);
        setTask(taskRes.data.data);
        setComments(commRes.data.data);
      } catch {
        toast.error('Failed to load task');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [taskId]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await taskAPI.addComment(taskId, { content: comment.trim() });
      setComments((prev) => [...prev, data.data]);
      setComment('');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await taskAPI.deleteComment(taskId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    await deleteTask(taskId);
    onClose();
  };

  const handleMarkCompleted = async () => {
    try {
      await updateTask(taskId, { status: 'done' });
      setTask((prev) => ({ ...prev, status: 'done' }));
    } catch {
      // error handled in context
    }
  };

  if (loading) {
    return (
      <div className="modal-backdrop">
        <div className="modal max-w-2xl flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      </div>
    );
  }

  const isOverdue = task?.deadline && isPast(new Date(task.deadline)) && task.status !== 'done';
  const daysLeft = task?.deadline ? differenceInDays(new Date(task.deadline), new Date()) : null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-dark-700 flex-shrink-0">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`badge badge-${task.status}`}>{STATUS_LABEL[task.status]}</span>
              <span className={`badge ${PRIORITY_COLOR[task.priority]}`}>{task.priority} priority</span>
              {isOverdue && <span className="badge bg-red-500/20 text-red-400">Overdue</span>}
            </div>
            <h2 className="text-xl font-semibold text-dark-100">{task.title}</h2>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {task.status !== 'done' && (
              <button
                onClick={handleMarkCompleted}
                className="p-2 rounded-lg text-dark-500 hover:text-green-400 hover:bg-green-500/10 transition-all"
                title="Mark as completed"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            <button
              id="edit-task-btn"
              onClick={() => { onClose(); onEdit(task); }}
              className="p-2 rounded-lg text-dark-500 hover:text-dark-200 hover:bg-dark-700 transition-all"
              title="Edit task"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              id="delete-task-btn"
              onClick={handleDelete}
              className="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-dark-500 hover:text-dark-200 hover:bg-dark-700 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-5">
            {/* Description */}
            {task.description && (
              <div>
                <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-dark-300 text-sm leading-relaxed whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Created by */}
              <div>
                <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">Created by</h3>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(task.creator?.name)}
                  </div>
                  <span className="text-sm text-dark-200">{task.creator?.name}</span>
                </div>
              </div>

              {/* Deadline */}
              {task.deadline && (
                <div>
                  <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Deadline
                  </h3>
                  <p className={`text-sm font-medium ${isOverdue ? 'text-red-400' : daysLeft !== null && daysLeft <= 3 ? 'text-amber-400' : 'text-dark-200'}`}>
                    {format(new Date(task.deadline), 'MMM dd, yyyy')}
                    {isOverdue ? ' (overdue)' : daysLeft !== null && daysLeft <= 3 ? ` (${daysLeft}d left)` : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Assignees */}
            {task.assignees?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <User className="w-3 h-3" /> Assignees
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {task.assignees.map((a) => (
                    <div key={a._id} className="flex items-center gap-2 bg-dark-700 rounded-full px-3 py-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold">
                        {getInitials(a.name)}
                      </div>
                      <span className="text-xs text-dark-200">{a.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Labels */}
            {task.labels?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Labels
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {task.labels.map((l) => (
                    <span key={l} className="badge bg-brand-600/20 text-brand-300">{l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Comments ({comments.length})
              </h3>
              <div className="space-y-3 mb-4">
                {comments.map((c) => (
                  <div key={c._id} className="flex gap-3 group">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                      {getInitials(c.author?.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-dark-200">{c.author?.name}</span>
                        <span className="text-[10px] text-dark-500">
                          {format(new Date(c.createdAt), 'MMM d, h:mm a')}
                        </span>
                        {(c.author?._id === user?._id || isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className="opacity-0 group-hover:opacity-100 ml-auto text-dark-600 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-dark-300 bg-dark-700 rounded-lg px-3 py-2 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-dark-600 italic">No comments yet. Be the first to comment!</p>
                )}
              </div>

              {/* Comment input */}
              <form onSubmit={submitComment} className="flex gap-2">
                <input
                  id="comment-input"
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="input flex-1 text-sm py-2"
                />
                <button id="submit-comment-btn" type="submit" disabled={submitting} className="btn-primary py-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
