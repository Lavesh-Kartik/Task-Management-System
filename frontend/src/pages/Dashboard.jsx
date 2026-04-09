import { useState, useEffect } from 'react';
import { CheckSquare, Clock, AlertTriangle, TrendingUp, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { isValid, parseISO, format, isPast, isThisWeek } from 'date-fns';

const safeDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isValid(d) ? d : null;
};


const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="card p-6 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors group cursor-pointer">
    <div className="flex items-center justify-between">
      <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0 transition-transform`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <span className="text-3xl font-black text-slate-800">{value}</span>
    </div>
    <p className="text-sm tracking-wide font-semibold text-slate-500 uppercase">{label}</p>
  </div>
);

export default function Dashboard() {
  const { tasks, fetchTasks, loading } = useTask();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter((t) => {
      const d = safeDate(t.deadline);
      return d && isPast(d) && t.status !== 'done';
    }).length,
  };

  const dueSoon = tasks.filter((t) => {
    const d = safeDate(t.deadline);
    return d && isThisWeek(d) && t.status !== 'done';
  }).sort((a, b) => safeDate(a.deadline) - safeDate(b.deadline)).slice(0, 5);

  const recent = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  const PRIORITY_COLOR = { low: 'text-slate-400', medium: 'text-amber-500', high: 'text-red-500' };
  const STATUS_COLOR = { todo: 'badge-todo', in_progress: 'badge-in_progress', done: 'badge-done' };
  const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button id="create-task-dashboard-btn" onClick={() => navigate('/tasks/new')} className="btn-primary">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={CheckSquare} label="Total Tasks" value={stats.total} color="text-slate-700" bg="bg-slate-100" />
            <StatCard icon={Clock} label="In Progress" value={stats.inProgress} color="text-blue-600" bg="bg-blue-50" />
            <StatCard icon={TrendingUp} label="Completed" value={stats.done} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} color="text-rose-600" bg="bg-rose-50" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Progress bar Bento */}
            <div className="lg:col-span-3 card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800 text-lg">Overall Progress</h2>
                <span className="text-lg font-black text-slate-800">{stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all duration-700"
                  style={{ width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` }}
                />
              </div>
              <div className="flex gap-6 mt-4 text-sm font-medium text-slate-500 justify-end">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200"></span>{stats.todo} To Do</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-200"></span>{stats.inProgress} In Progress</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-800"></span>{stats.done} Done</span>
              </div>
            </div>

            {/* Due this week Bento */}
            <div className="card p-6 lg:col-span-1">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-400" /> Due This Week
                </h2>
                <Link to="/board" className="text-xs font-semibold text-slate-400 hover:text-slate-800 flex items-center gap-1 transition-colors uppercase tracking-wider">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {dueSoon.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <p className="text-slate-500 font-medium">🎉 No tasks due this week</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dueSoon.map((t) => {
                    const d = safeDate(t.deadline);
                    const overdue = d && isPast(d);
                    return (
                      <div
                        key={t._id}
                        onClick={() => navigate(`/tasks/${t._id}`)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-100 hover:border-slate-300 transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 truncate transition-colors">{t.title}</p>
                          <p className={`text-xs mt-1 font-medium ${overdue ? 'text-rose-500' : 'text-slate-500'}`}>
                            {overdue ? 'Overdue – ' : ''}{d ? format(d, 'MMM d') : ''}
                          </p>
                        </div>
                        <span className={`badge ${STATUS_COLOR[t.status]} flex-shrink-0`}>{STATUS_LABEL[t.status]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent tasks Bento */}
            <div className="card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-slate-400" /> Recent Tasks
                </h2>
                <Link to="/tasks" className="text-xs font-semibold text-slate-400 hover:text-slate-800 flex items-center gap-1 transition-colors uppercase tracking-wider">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {recent.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 flex flex-col items-center justify-center text-center h-[200px]">
                  <p className="text-slate-500 font-medium mb-4">No tasks yet. Let's create one!</p>
                  <button onClick={() => navigate('/tasks/new')} className="btn-primary text-sm">
                    <Plus className="w-4 h-4" /> Create Task
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recent.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => navigate(`/tasks/${t._id}`)}
                      className="flex items-center gap-4 p-3.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-slate-300 hover:shadow-md cursor-pointer transition-all group"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.priority === 'high' ? 'bg-rose-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                      <p className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors flex-1 truncate">{t.title}</p>
                      <span className={`badge ${STATUS_COLOR[t.status]} flex-shrink-0`}>{STATUS_LABEL[t.status]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
