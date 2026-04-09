import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Calendar, Tag, Users, AlertTriangle, AlignLeft, Plus, Loader2, ArrowLeft, X, Search } from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { userAPI, taskAPI } from '../api';
import toast from 'react-hot-toast';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'done'];
const LABEL_OPTIONS = ['Frontend', 'Backend', 'Bug', 'Feature', 'Design', 'Testing', 'Urgent'];

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITY_COLORS = { low: 'bg-slate-100 text-slate-600 border-slate-200', medium: 'bg-amber-50 text-amber-700 border-amber-200', high: 'bg-rose-50 text-rose-700 border-rose-200' };

export default function TaskForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createTask, updateTask } = useTask();
  const { user, isAdmin } = useAuth();
  const isEdit = !!id;

  // Auto-assign the current user for new tasks (members only, not admins)
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    deadline: '',
    labels: [],
    assignees: (!isEdit && !isAdmin && user?._id) ? [user._id] : [],
  });
  
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [labelInput, setLabelInput] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [taskCreatorId, setTaskCreatorId] = useState(null);

  useEffect(() => {
    userAPI.getAll()
      .then(({ data }) => setUsers(data.data))
      .catch(() => {});

    if (isEdit) {
      taskAPI.getOne(id)
        .then(({ data }) => {
          const t = data.data;
          setTaskCreatorId(t.creator?._id || t.creator_id);

          // If the current user is NOT the creator and NOT an admin, redirect away
          const creatorId = t.creator?._id || t.creator_id;
          if (creatorId !== user?._id && !isAdmin) {
            toast.error('You can only view this task');
            navigate(`/tasks/${id}`, { replace: true });
            return;
          }

          setForm({
            title: t.title || '',
            description: t.description || '',
            status: t.status || 'todo',
            priority: t.priority || 'medium',
            deadline: t.deadline ? t.deadline.split('T')[0] : '',
            labels: t.labels || [],
            assignees: t.assignees?.map((a) => a._id || a) || [],
          });
        })
        .catch(() => {
          toast.error('Task not found');
          navigate('/');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, navigate, user, isAdmin]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleLabel = (label) => {
    setForm((f) => ({
      ...f,
      labels: f.labels.includes(label) ? f.labels.filter((l) => l !== label) : [...f.labels, label],
    }));
  };

  const removeLabel = (label) => {
    setForm((f) => ({ ...f, labels: f.labels.filter((l) => l !== label) }));
  };

  const addCustomLabel = () => {
    const l = labelInput.trim();
    if (l && !form.labels.includes(l)) {
      setForm((f) => ({ ...f, labels: [...f.labels, l] }));
      setLabelInput('');
    }
  };

  const toggleAssignee = (aid) => {
    setForm((f) => ({
      ...f,
      assignees: f.assignees.includes(aid) ? f.assignees.filter((a) => a !== aid) : [...f.assignees, aid],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, deadline: form.deadline || null };
      if (isEdit) {
        await updateTask(id, payload);
        toast.success('Task updated');
        navigate(`/tasks/${id}`);
      } else {
        const saved = await createTask(payload);
        navigate(`/tasks/${saved._id}`);
      }
    } catch {
      // error handled in context
    } finally {
      setSaving(false);
    }
  };

  // Filter out admin users — admins don't do tasks, only members can be assigned
  const assignableUsers = users.filter((u) => u.role !== 'admin');
  
  const filteredUsers = assignableUsers.filter((u) =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          {isEdit ? 'Edit Task' : 'Create New Task'}
        </h1>
      </div>

      <div className="card bg-white p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="label">Task Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="What needs to be done?"
              className="input text-lg font-bold py-3"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="label flex items-center gap-1.5"><AlignLeft className="w-4 h-4" /> Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Add comprehensive details about this task..."
              rows={4}
              className="input resize-y"
            />
          </div>

          {/* Status + Priority — visual selector cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Status</label>
              <div className="flex gap-2">
                {STATUSES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 ${
                      form.status === s
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setForm((f) => ({ ...f, priority: p }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 ${
                      form.priority === p
                        ? `${PRIORITY_COLORS[p]} shadow-sm`
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="label flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={set('deadline')}
              className="input w-full md:w-1/2"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Labels */}
          <div>
            <label className="label flex items-center gap-1.5"><Tag className="w-4 h-4" /> Labels</label>
            {/* Selected labels */}
            {form.labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.labels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200"
                  >
                    {label}
                    <button type="button" onClick={() => removeLabel(label)} className="hover:text-blue-800 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Quick label toggles */}
            <div className="flex flex-wrap gap-2 mb-3">
              {LABEL_OPTIONS.filter((l) => !form.labels.includes(l)).map((label) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => toggleLabel(label)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all bg-white text-slate-500 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                >
                  + {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 w-full md:w-1/2">
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomLabel())}
                placeholder="Add custom label..."
                className="input flex-1 text-sm py-2"
              />
              <button type="button" onClick={addCustomLabel} className="btn-secondary py-2 px-3">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Assignees — with search */}
          <div>
            <label className="label flex items-center gap-1.5"><Users className="w-4 h-4" /> Assignees</label>
            
            {/* Selected assignees */}
            {form.assignees.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.assignees.map((aid) => {
                  const u = users.find((u) => u._id === aid);
                  if (!u) return null;
                  // The creator (auto-assigned on new tasks) cannot remove themselves
                  const isLockedAssignee = !isEdit && !isAdmin && aid === user?._id;
                  return (
                    <span
                      key={aid}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold bg-slate-800 text-white"
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-black">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      {u.name}
                      {isLockedAssignee ? (
                        <span className="text-[10px] text-slate-400 ml-1">(you)</span>
                      ) : (
                        <button type="button" onClick={() => toggleAssignee(aid)} className="hover:text-slate-300 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search users */}
            {assignableUsers.length > 4 && (
              <div className="relative mb-3 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search team members..."
                  className="input pl-9 py-2 text-sm w-full"
                />
              </div>
            )}
            
            <div className="flex flex-wrap gap-3 max-h-[200px] overflow-y-auto">
              {filteredUsers.filter((u) => !form.assignees.includes(u._id)).map((u) => (
                <button
                  type="button"
                  key={u._id}
                  onClick={() => toggleAssignee(u._id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all border-2 bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-black border border-white">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  {u.name}
                </button>
              ))}
              {filteredUsers.filter((u) => !form.assignees.includes(u._id)).length === 0 && (
                <p className="text-sm text-slate-400 font-medium py-2">
                  {userSearch ? 'No members match your search' : 'All members assigned'}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-8 border-t border-slate-100">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary py-2.5">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary py-2.5 px-6">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
