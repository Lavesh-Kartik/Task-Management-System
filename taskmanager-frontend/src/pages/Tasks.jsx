import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Edit3, Calendar, Loader2, ChevronDown } from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { format, isPast } from 'date-fns';
import TaskModal from '../components/tasks/TaskModal';
import TaskDetailModal from '../components/tasks/TaskDetailModal';

const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_CLASS = { todo: 'badge-todo', in_progress: 'badge-in_progress', done: 'badge-done' };
const PRIORITY_DOT = { low: 'bg-slate-500', medium: 'bg-amber-500', high: 'bg-red-500' };

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export default function Tasks() {
  const { tasks, fetchTasks, deleteTask, loading } = useTask();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [editTask, setEditTask] = useState(null);

  useEffect(() => { fetchTasks(); }, []);

  const filtered = tasks
    .filter((t) => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || t.status === statusFilter;
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      if (sort === 'deadline') return (a.deadline ? new Date(a.deadline) : Infinity) - (b.deadline ? new Date(b.deadline) : Infinity);
      if (sort === 'priority') {
        const P = { high: 3, medium: 2, low: 1 };
        return P[b.priority] - P[a.priority];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-50">All Tasks</h1>
        <button id="create-task-btn" onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            id="tasks-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="input pl-9 py-2 text-sm"
          />
        </div>
        <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input py-2 text-sm w-36">
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select id="priority-filter" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input py-2 text-sm w-36">
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select id="sort-select" value={sort} onChange={(e) => setSort(e.target.value)} className="input py-2 text-sm w-40">
          <option value="createdAt">Newest first</option>
          <option value="deadline">By deadline</option>
          <option value="priority">By priority</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-sm text-dark-500">{filtered.length} task{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-dark-500 mb-3">No tasks found</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Create First Task
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const overdue = t.deadline && isPast(new Date(t.deadline)) && t.status !== 'done';
            return (
              <div
                key={t._id}
                id={`task-row-${t._id}`}
                className="card p-4 flex items-center gap-4 hover:border-dark-600 cursor-pointer transition-all group"
                onClick={() => setDetailId(t._id)}
              >
                {/* Priority dot */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority]}`} />

                {/* Title + labels */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-dark-100 truncate">{t.title}</h3>
                    {t.labels?.slice(0, 2).map((l) => (
                      <span key={l} className="badge bg-dark-700 text-dark-400 text-[10px]">{l}</span>
                    ))}
                  </div>
                  {t.description && (
                    <p className="text-sm text-dark-500 truncate mt-0.5">{t.description}</p>
                  )}
                </div>

                {/* Assignees */}
                <div className="flex -space-x-1.5 flex-shrink-0 hidden sm:flex">
                  {t.assignees?.slice(0, 3).map((a, i) => (
                    <div key={a._id} title={a.name}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold border border-dark-800">
                      {getInitials(a.name)}
                    </div>
                  ))}
                </div>

                {/* Deadline */}
                {t.deadline ? (
                  <div className={`flex items-center gap-1.5 text-xs flex-shrink-0 hidden md:flex ${overdue ? 'text-red-400' : 'text-dark-500'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(t.deadline), 'MMM d, yyyy')}
                  </div>
                ) : <div className="w-24 hidden md:block" />}

                {/* Status */}
                <span className={`badge ${STATUS_CLASS[t.status]} flex-shrink-0`}>{STATUS_LABEL[t.status]}</span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => { setDetailId(null); setEditTask(t); }}
                    className="p-1.5 rounded-lg text-dark-500 hover:text-dark-200 hover:bg-dark-700 transition-all"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteTask(t._id)}
                    className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <TaskModal onClose={() => setShowCreate(false)} onSaved={() => fetchTasks()} />}
      {detailId && (
        <TaskDetailModal
          taskId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(t) => { setDetailId(null); setEditTask(t); }}
        />
      )}
      {editTask && (
        <TaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSaved={() => { fetchTasks(); setEditTask(null); }}
        />
      )}
    </div>
  );
}
