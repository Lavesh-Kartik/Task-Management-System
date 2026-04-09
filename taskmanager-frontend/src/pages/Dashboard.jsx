import { useState, useEffect } from 'react';
import { CheckSquare, Clock, AlertTriangle, TrendingUp, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { format, isPast, isThisWeek } from 'date-fns';
import TaskModal from '../components/tasks/TaskModal';
import TaskDetailModal from '../components/tasks/TaskDetailModal';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="card p-5 flex items-center gap-4 hover:border-dark-600 transition-colors">
    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div>
      <p className="text-2xl font-bold text-dark-50">{value}</p>
      <p className="text-sm text-dark-500">{label}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { tasks, fetchTasks, loading } = useTask();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [editTask, setEditTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter((t) => t.deadline && isPast(new Date(t.deadline)) && t.status !== 'done').length,
  };

  const dueSoon = tasks.filter(
    (t) => t.deadline && isThisWeek(new Date(t.deadline)) && t.status !== 'done'
  ).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 5);

  const recent = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  const PRIORITY_COLOR = { low: 'text-slate-400', medium: 'text-amber-400', high: 'text-red-400' };
  const STATUS_COLOR = { todo: 'badge-todo', in_progress: 'badge-in_progress', done: 'badge-done' };
  const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-dark-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button id="create-task-dashboard-btn" onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={CheckSquare} label="Total Tasks" value={stats.total} color="text-brand-400" bg="bg-brand-600/20" />
            <StatCard icon={Clock} label="In Progress" value={stats.inProgress} color="text-blue-400" bg="bg-blue-500/20" />
            <StatCard icon={TrendingUp} label="Completed" value={stats.done} color="text-green-400" bg="bg-green-500/20" />
            <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} color="text-red-400" bg="bg-red-500/20" />
          </div>

          {/* Progress bar */}
          {stats.total > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-dark-300">Overall Progress</span>
                <span className="text-sm font-bold text-dark-100">{Math.round((stats.done / stats.total) * 100)}%</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-700"
                  style={{ width: `${(stats.done / stats.total) * 100}%` }}
                />
              </div>
              <div className="flex gap-4 mt-3 text-xs text-dark-500">
                <span>{stats.todo} to do</span>
                <span>{stats.inProgress} in progress</span>
                <span>{stats.done} done</span>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Due this week */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-dark-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Due This Week
                </h2>
                <Link to="/board" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {dueSoon.length === 0 ? (
                <p className="text-dark-600 text-sm text-center py-6">🎉 No tasks due this week</p>
              ) : (
                <div className="space-y-3">
                  {dueSoon.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => setDetailTaskId(t._id)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-200 truncate">{t.title}</p>
                        <p className={`text-xs mt-0.5 ${isPast(new Date(t.deadline)) ? 'text-red-400' : 'text-amber-400'}`}>
                          {isPast(new Date(t.deadline)) ? 'Overdue – ' : ''}{format(new Date(t.deadline), 'MMM d')}
                        </p>
                      </div>
                      <span className={`badge ${STATUS_COLOR[t.status]} flex-shrink-0`}>{STATUS_LABEL[t.status]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent tasks */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-dark-200 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-brand-400" /> Recent Tasks
                </h2>
                <Link to="/tasks" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {recent.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-dark-600 text-sm mb-3">No tasks yet. Let's create one!</p>
                  <button onClick={() => setShowCreate(true)} className="btn-primary text-sm py-1.5">
                    <Plus className="w-4 h-4" /> Create Task
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recent.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => setDetailTaskId(t._id)}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-dark-700/50 cursor-pointer transition-colors group"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                      <p className="text-sm text-dark-300 group-hover:text-dark-100 transition-colors flex-1 truncate">{t.title}</p>
                      <span className={`badge ${STATUS_COLOR[t.status]} flex-shrink-0 text-[10px]`}>{STATUS_LABEL[t.status]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showCreate && (
        <TaskModal onClose={() => setShowCreate(false)} onSaved={() => fetchTasks()} />
      )}
      {detailTaskId && (
        <TaskDetailModal
          taskId={detailTaskId}
          onClose={() => setDetailTaskId(null)}
          onEdit={(t) => setEditTask(t)}
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
