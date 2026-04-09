import { useState, useEffect } from 'react';
import { X, Calendar, Tag, Users, AlertTriangle, AlignLeft, Plus, Loader2 } from 'lucide-react';
import { useTask } from '../../context/TaskContext';
import { userAPI } from '../../api';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'done'];
const LABEL_OPTIONS = ['Frontend', 'Backend', 'Bug', 'Feature', 'Design', 'Testing', 'Urgent'];

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

export default function TaskModal({ task, initialStatus, onClose, onSaved }) {
  const { createTask, updateTask } = useTask();
  const isEdit = !!task;

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || initialStatus || 'todo',
    priority: task?.priority || 'medium',
    deadline: task?.deadline ? task.deadline.split('T')[0] : '',
    labels: task?.labels || [],
    assignees: task?.assignees?.map((a) => a._id || a) || [],
  });
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [labelInput, setLabelInput] = useState('');

  useEffect(() => {
    userAPI.getAll().then(({ data }) => setUsers(data.data)).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleLabel = (label) => {
    setForm((f) => ({
      ...f,
      labels: f.labels.includes(label) ? f.labels.filter((l) => l !== label) : [...f.labels, label],
    }));
  };

  const addCustomLabel = () => {
    const l = labelInput.trim();
    if (l && !form.labels.includes(l)) {
      setForm((f) => ({ ...f, labels: [...f.labels, l] }));
      setLabelInput('');
    }
  };

  const toggleAssignee = (id) => {
    setForm((f) => ({
      ...f,
      assignees: f.assignees.includes(id) ? f.assignees.filter((a) => a !== id) : [...f.assignees, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, deadline: form.deadline || null };
      let saved;
      if (isEdit) {
        saved = await updateTask(task._id, payload);
      } else {
        saved = await createTask(payload);
      }
      onSaved?.(saved);
      onClose();
    } catch {
      // error handled in context
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-dark-100">{isEdit ? 'Edit Task' : 'Create New Task'}</h2>
          <button id="close-modal-btn" onClick={onClose} className="text-dark-500 hover:text-dark-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="label">Title *</label>
            <input
              id="task-title"
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="What needs to be done?"
              className="input text-base font-medium"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="label flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5" />Description</label>
            <textarea
              id="task-description"
              value={form.description}
              onChange={set('description')}
              placeholder="Add more details..."
              rows={3}
              className="input resize-none"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select id="task-status" value={form.status} onChange={set('status')} className="input">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />Priority</label>
              <select id="task-priority" value={form.priority} onChange={set('priority')} className="input">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Deadline</label>
            <input
              id="task-deadline"
              type="date"
              value={form.deadline}
              onChange={set('deadline')}
              className="input"
            />
          </div>

          {/* Labels */}
          <div>
            <label className="label flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Labels</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {LABEL_OPTIONS.map((label) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => toggleLabel(label)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    form.labels.includes(label)
                      ? 'bg-brand-600/30 text-brand-300 border border-brand-500/50'
                      : 'bg-dark-700 text-dark-400 border border-dark-600 hover:border-dark-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomLabel())}
                placeholder="Custom label..."
                className="input flex-1 text-sm py-1.5"
              />
              <button type="button" onClick={addCustomLabel} className="btn-secondary py-1.5 px-3">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="label flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Assignees</label>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => (
                <button
                  type="button"
                  key={u._id}
                  onClick={() => toggleAssignee(u._id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    form.assignees.includes(u._id)
                      ? 'bg-brand-600/30 text-brand-300 border border-brand-500/50'
                      : 'bg-dark-700 text-dark-400 border border-dark-600 hover:border-dark-500'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-dark-700">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button id="save-task-btn" type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
