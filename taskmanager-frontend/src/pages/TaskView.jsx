import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Calendar, Tag, User, MessageSquare, Trash2, Edit3, Loader2, Send, CheckCircle, ArrowLeft, History, UserPlus, UserMinus, FileText, AlertCircle } from 'lucide-react';
import { taskAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import { format, isPast, differenceInDays, isValid } from 'date-fns';
import toast from 'react-hot-toast';

const PRIORITY_COLOR = { low: 'bg-slate-100 text-slate-600', medium: 'bg-amber-100 text-amber-700', high: 'bg-rose-100 text-rose-700' };
const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const safeDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isValid(d) ? d : null;
};

// Activity log action icons & colors
const ACTION_CONFIG = {
  created: { icon: FileText, color: 'bg-emerald-100 text-emerald-600', label: 'Created' },
  assigned: { icon: UserPlus, color: 'bg-blue-100 text-blue-600', label: 'Assigned' },
  unassigned: { icon: UserMinus, color: 'bg-amber-100 text-amber-600', label: 'Unassigned' },
  updated_status: { icon: AlertCircle, color: 'bg-indigo-100 text-indigo-600', label: 'Status' },
  updated_priority: { icon: AlertCircle, color: 'bg-amber-100 text-amber-600', label: 'Priority' },
  updated_title: { icon: Edit3, color: 'bg-slate-100 text-slate-600', label: 'Renamed' },
  updated_deadline: { icon: Calendar, color: 'bg-rose-100 text-rose-600', label: 'Deadline' },
  commented: { icon: MessageSquare, color: 'bg-blue-100 text-blue-600', label: 'Comment' },
  deleted_comment: { icon: Trash2, color: 'bg-rose-100 text-rose-600', label: 'Deleted comment' },
};

const DEFAULT_ACTION = { icon: History, color: 'bg-slate-100 text-slate-500', label: 'Activity' };

export default function TaskView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('discussion');
  const commentsEndRef = useRef(null);
  
  const { user, isAdmin } = useAuth();
  const { deleteTask, updateTask } = useTask();

  // Auto-scroll to bottom when new comments arrive
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [taskRes, commRes] = await Promise.all([
          taskAPI.getOne(id),
          taskAPI.getComments(id),
        ]);
        setTask(taskRes.data.data);
        setComments(commRes.data.data);
      } catch {
        toast.error('Failed to load task');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  // Fetch activity log when tab switches
  useEffect(() => {
    if (activeTab === 'activity') {
      taskAPI.getActivity(id)
        .then(({ data }) => setActivity(data.data))
        .catch(() => {});
    }
  }, [activeTab, id]);

  // Scroll when comments change
  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await taskAPI.addComment(id, { content: comment.trim() });
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
      await taskAPI.deleteComment(id, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(id);
      navigate(-1);
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleMarkCompleted = async () => {
    try {
      await updateTask(id, { status: 'done' });
      setTask((prev) => ({ ...prev, status: 'done' }));
    } catch {
      toast.error('Failed to update task');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
      </div>
    );
  }

  if (!task) return null;

  const isCreator = task.creator?._id === user?._id;
  const canEdit = isCreator || isAdmin;

  const deadlineDate = safeDate(task.deadline);
  const isOverdue = deadlineDate && isPast(deadlineDate) && task.status !== 'done';
  const daysLeft = deadlineDate ? differenceInDays(deadlineDate, new Date()) : null;

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex justify-end items-center gap-2">
          {task.status !== 'done' && (
            <button
              onClick={handleMarkCompleted}
              className="p-2.5 rounded-xl text-emerald-600 bg-white hover:bg-emerald-50 transition-all shadow-sm border border-slate-200 hover:border-emerald-200 flex items-center gap-2 text-sm font-bold"
              title="Mark as completed"
            >
              <CheckCircle className="w-4 h-4" /> <span className="hidden sm:inline">Mark Done</span>
            </button>
          )}
          {canEdit && (
            <Link
              to={`/tasks/edit/${task._id}`}
              className="p-2.5 rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm border border-slate-200 hover:border-slate-300 flex items-center gap-2 text-sm font-bold"
              title="Edit task"
            >
              <Edit3 className="w-4 h-4" /> <span className="hidden sm:inline">Edit</span>
            </Link>
          )}
          {canEdit && (
            <button
              onClick={() => setShowConfirm(true)}
              className="p-2.5 rounded-xl text-rose-600 bg-white hover:bg-rose-50 transition-all shadow-sm border border-slate-200 hover:border-rose-200 flex items-center gap-2 text-sm font-bold"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      <div className="card bg-white p-8 space-y-8">
        
        {/* Main Info */}
        <div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
              {STATUS_LABEL[task.status]}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${PRIORITY_COLOR[task.priority]}`}>
              {task.priority} Priority
            </span>
            {isOverdue && <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">Overdue</span>}
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight mb-6">
            {task.title}
          </h1>
          
          {task.description && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <p className="text-slate-700 font-medium text-base leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Created by</h3>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-black shadow-sm">
                {getInitials(task.creator?.name)}
              </div>
              <span className="text-sm font-bold text-slate-700">{task.creator?.name}</span>
            </div>
          </div>

          {deadlineDate && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Deadline
              </h3>
              <p className={`text-sm font-bold flex items-center gap-2 ${isOverdue ? 'text-rose-600' : daysLeft !== null && daysLeft <= 3 ? 'text-amber-500' : 'text-slate-700'}`}>
                {format(deadlineDate, 'MMM dd, yyyy')}
                {isOverdue && <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-xs">Overdue</span>}
                {(!isOverdue && daysLeft !== null && daysLeft <= 3) && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs">{daysLeft}d left</span>}
              </p>
            </div>
          )}
        </div>

        {/* Assignees & Labels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
          {task.assignees?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Assignees
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {task.assignees.map((a) => (
                  <div key={a._id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-full pl-1.5 pr-3 py-1.5 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                      {getInitials(a.name)}
                    </div>
                    <span className="text-xs font-bold text-slate-700">{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {task.labels?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Labels
              </h3>
              <div className="flex gap-2 flex-wrap">
                {task.labels.map((l) => (
                  <span key={l} className="px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 shadow-sm rounded-lg text-[11px] font-bold uppercase tracking-wider">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Tab Switcher: Discussion / Activity ── */}
        <div className="pt-8 border-t border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-max mb-4">
            <button
              onClick={() => setActiveTab('discussion')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'discussion' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Discussion ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'activity' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <History className="w-4 h-4" /> Activity Log
            </button>
          </div>

          {/* ── Discussion Tab ── */}
          {activeTab === 'discussion' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col" style={{ height: '380px' }}>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {comments.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-slate-400 font-medium italic">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                )}
                {comments.map((c) => {
                  // Supabase returns created_at, not createdAt
                  const cDate = safeDate(c.created_at || c.createdAt);
                  const formattedDate = cDate ? format(cDate, 'MMM d, h:mm a') : '';
                  const isOwnMessage = c.author?._id === user?._id;
                  
                  return (
                    <div key={c._id} className={`flex gap-3 group ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 mt-0.5 ${isOwnMessage ? 'bg-blue-600' : 'bg-slate-700'}`}>
                        {getInitials(c.author?.name)}
                      </div>

                      {/* Message bubble */}
                      <div className={`max-w-[75%] min-w-[120px] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-bold text-slate-600">{isOwnMessage ? 'You' : c.author?.name}</span>
                          {formattedDate && (
                            <span className="text-[10px] font-medium text-slate-400">{formattedDate}</span>
                          )}
                        </div>
                        <div className={`relative px-4 py-2.5 text-sm font-medium leading-relaxed shadow-sm ${
                          isOwnMessage 
                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md' 
                            : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-md'
                        }`}>
                          {c.content}
                          {/* Delete button */}
                          {(isOwnMessage || isAdmin) && (
                            <button
                              onClick={() => handleDeleteComment(c._id)}
                              className={`absolute -top-2 ${isOwnMessage ? '-left-2' : '-right-2'} w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm ${
                                isOwnMessage ? 'bg-blue-700 text-blue-200 hover:text-white' : 'bg-slate-200 text-slate-400 hover:text-rose-600'
                              }`}
                              title="Delete"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={commentsEndRef} />
              </div>

              {/* Input bar — always pinned at bottom */}
              <form onSubmit={submitComment} className="flex items-center gap-3 px-4 py-3 bg-white border-t border-slate-200 flex-shrink-0">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 text-sm font-medium bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-300 focus:bg-white transition-all placeholder:text-slate-400"
                />
                <button 
                  type="submit" 
                  disabled={submitting || !comment.trim()} 
                  className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-sm"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}

          {/* ── Activity Log Tab ── */}
          {activeTab === 'activity' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden" style={{ height: '380px' }}>
              <div className="h-full overflow-y-auto px-5 py-4">
                {activity.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-slate-400 font-medium italic">No activity recorded yet.</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-slate-200" />
                    
                    <div className="space-y-1">
                      {activity.map((log) => {
                        const config = ACTION_CONFIG[log.action] || DEFAULT_ACTION;
                        const IconComponent = config.icon;
                        const logDate = safeDate(log.created_at);
                        
                        return (
                          <div key={log._id} className="relative flex items-start gap-4 py-2.5 pl-1 group">
                            {/* Icon dot */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${config.color}`}>
                              <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-700">{log.user?.name || 'Unknown'}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${config.color}`}>
                                  {config.label}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">{log.details}</p>
                              {logDate && (
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">{format(logDate, 'MMM d, yyyy · h:mm a')}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
      </div>

      <ConfirmModal 
        isOpen={showConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmText="Delete Task"
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
