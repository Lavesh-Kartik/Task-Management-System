import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Edit3, Calendar, Loader2, ChevronDown } from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ui/ConfirmModal';
import { format, isPast, isValid } from 'date-fns';

const safeDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isValid(d) ? d : null;
};

const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_CLASS = { todo: 'badge-todo', in_progress: 'badge-in_progress', done: 'badge-done' };
const PRIORITY_DOT = { low: 'bg-slate-500', medium: 'bg-amber-500', high: 'bg-red-500' };

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export default function Tasks() {
  const { tasks, fetchTasks, deleteTask, loading } = useTask();
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [deleteData, setDeleteData] = useState({ isOpen: false, taskId: null });
  const navigate = useNavigate();

  useEffect(() => { fetchTasks(); }, []);

  const filtered = tasks
    .filter((t) => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || t.status === statusFilter;
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      if (sort === 'deadline') return (safeDate(a.deadline) || Infinity) - (safeDate(b.deadline) || Infinity);
      if (sort === 'priority') {
        const P = { high: 3, medium: 2, low: 1 };
        return P[b.priority] - P[a.priority];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">All Tasks</h1>
        <button id="create-task-btn" onClick={() => navigate('/tasks/new')} className="btn-primary">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
      <p className="text-sm font-medium text-slate-500">{filtered.length} task{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center bg-slate-50 border-slate-100">
          <p className="text-slate-500 mb-4 font-medium">No tasks found</p>
          <button onClick={() => navigate('/tasks/new')} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Create First Task
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const d = safeDate(t.deadline);
            const overdue = d && isPast(d) && t.status !== 'done';
            const canAct = t.creator?._id === user?._id || isAdmin;
            return (
              <div
                key={t._id}
                id={`task-row-${t._id}`}
                className="card relative hover:border-slate-300 hover:shadow-md cursor-pointer transition-all group"
                onClick={() => navigate(`/tasks/${t._id}`)}
              >
                {/* Fixed grid row — columns never shift */}
                <div className="grid items-center gap-4 px-5 py-3.5"
                  style={{ gridTemplateColumns: '10px 1fr 80px 100px 150px' }}
                >
                  {/* Col 1: Priority dot */}
                  <div className={`w-2.5 h-2.5 rounded-full ${PRIORITY_DOT[t.priority]}`} />

                  {/* Col 2: Title + description */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold tracking-tight text-slate-800 truncate">{t.title}</h3>
                      {t.labels?.slice(0, 2).map((l) => (
                        <span key={l} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider flex-shrink-0">{l}</span>
                      ))}
                    </div>
                    {t.description && (
                      <p className="text-sm font-medium text-slate-500 truncate mt-0.5">{t.description}</p>
                    )}
                  </div>

                  {/* Col 3: Assignee avatars — fixed 80px */}
                  <div className="hidden sm:flex -space-x-1.5 justify-end">
                    {t.assignees?.slice(0, 3).map((a) => (
                      <div key={a._id} title={a.name}
                        className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow-sm hover:z-10 transition-all">
                        {getInitials(a.name)}
                      </div>
                    ))}
                  </div>

                  {/* Col 4: Deadline — fixed 100px */}
                  <div className="hidden md:flex items-center gap-1.5 justify-end">
                    {d ? (
                      <span className={`flex items-center gap-1.5 text-xs font-semibold ${overdue ? 'text-rose-500' : 'text-slate-500'}`}>
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        {format(d, 'MMM d, yyyy')}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300 font-medium">No deadline</span>
                    )}
                  </div>

                  {/* Col 5: Status badge & Actions — fixed 150px */}
                  <div className="flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${STATUS_CLASS[t.status]} flex-shrink-0 transition-transform duration-300`}>
                        {STATUS_LABEL[t.status]}
                      </span>

                      {/* Actions slide in on hover */}
                      <div 
                        className={`flex items-center overflow-hidden transition-all duration-300 ${canAct ? 'opacity-0 max-w-0 group-hover:max-w-[80px] group-hover:opacity-100' : 'hidden'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-0.5 pl-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tasks/edit/${t._id}`);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteData({ isOpen: true, taskId: t._id });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteData.isOpen}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmText="Delete Task"
        onClose={() => setDeleteData({ isOpen: false, taskId: null })}
        onConfirm={async () => {
          if (deleteData.taskId) {
            try {
              await deleteTask(deleteData.taskId);
            } catch {}
            setDeleteData({ isOpen: false, taskId: null });
          }
        }}
      />
    </div>
  );
}
