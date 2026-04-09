import { useState, useEffect, useMemo } from 'react';
import { Users, Shield, Trash2, Crown, UserCheck, Search, Loader2, BarChart3, CheckCircle, Clock } from 'lucide-react';
import { userAPI, taskAPI } from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { format, isValid, isPast } from 'date-fns';
import ConfirmModal from '../components/ui/ConfirmModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const safeDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isValid(d) ? d : null;
};

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const COLORS = {
  todo: '#64748b',
  in_progress: '#3b82f6',
  done: '#10b981',
  low: '#94a3b8',
  medium: '#f59e0b',
  high: '#ef4444'
};

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user: currentUser } = useAuth();
  const [deleteData, setDeleteData] = useState({ isOpen: false, userId: null });
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, tasksRes] = await Promise.all([
        userAPI.getAll(),
        taskAPI.getAll()
      ]);
      setUsers(usersRes.data.data);
      setTasks(tasksRes.data.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    try {
      await userAPI.updateRole(userId, newRole);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await userAPI.delete(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success('User removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const filtered = users.filter(
    (u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const overdueTasks = tasks.filter(t => {
      const d = safeDate(t.deadline);
      return d && isPast(d) && t.status !== 'done';
    }).length;

    const statusData = [
      { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: COLORS.todo },
      { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: COLORS.in_progress },
      { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: COLORS.done }
    ].filter(d => d.value > 0);

    const priorityData = [
      { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: COLORS.low },
      { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: COLORS.medium },
      { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: COLORS.high }
    ];

    return { completedTasks, overdueTasks, statusData, priorityData };
  }, [tasks]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-slate-800" /> Admin Command Center
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1 mb-0">System overview and user access management</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl w-max">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Users
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        </div>
      ) : activeTab === 'dashboard' ? (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-6 border-slate-100 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Users</p>
                <p className="text-2xl font-black text-slate-800">{users.length}</p>
              </div>
            </div>
            <div className="card p-6 border-slate-100 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Tasks</p>
                <p className="text-2xl font-black text-slate-800">{tasks.length}</p>
              </div>
            </div>
            <div className="card p-6 border-slate-100 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-black text-slate-800">{stats.completedTasks}</p>
              </div>
            </div>
            <div className="card p-6 border-slate-100 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Overdue</p>
                <p className="text-2xl font-black text-slate-800">{stats.overdueTasks}</p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Status Chart */}
            <div className="card p-6 border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6">Task Status Distribution</h3>
              <div className="h-[300px] w-full">
                {stats.statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {stats.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 800 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium">No tasks available</div>
                )}
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {stats.statusData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>

            {/* Task Priority Chart */}
            <div className="card p-6 border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6">Tasks by Priority</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.priorityData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                    <RechartsTooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 800 }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {stats.priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="user-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input pl-9 py-2.5 text-sm w-full"
            />
          </div>

          {/* User table */}
          <div className="card overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-wider">
              <div className="col-span-5">User</div>
              <div className="col-span-3">Role</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const d = safeDate(u.createdAt);
                return (
                <div key={u._id} id={`user-row-${u._id}`} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors">
                  <div className="col-span-12 sm:col-span-5 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-black shadow-sm flex-shrink-0">
                      {getInitials(u.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        {u.name}
                        {u._id === currentUser?._id && (
                          <span className="text-[10px] font-black tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">You</span>
                        )}
                      </p>
                      <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{u.email}</p>
                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase flex items-center w-max gap-1.5 ${u.role === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {u.role === 'admin' ? <Crown className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      {u.role}
                    </span>
                  </div>

                  <div className="col-span-6 sm:col-span-2 text-xs font-semibold text-slate-500">
                    {d ? format(d, 'MMM d, yyyy') : 'Unknown'}
                  </div>

                  <div className="col-span-12 sm:col-span-2 flex items-center justify-end gap-2">
                    {u._id !== currentUser?._id && (
                      <>
                        <button
                          onClick={() => toggleRole(u._id, u.role)}
                          className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all font-bold uppercase tracking-wider"
                          title={`Make ${u.role === 'admin' ? 'member' : 'admin'}`}
                        >
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>
                        <button
                          onClick={() => setDeleteData({ isOpen: true, userId: u._id })}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Remove user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )})}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-500 font-medium">No users found</div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteData.isOpen}
        title="Remove User"
        message="Are you sure you want to remove this user? They will lose access to all tasks and data."
        confirmText="Remove User"
        onClose={() => setDeleteData({ isOpen: false, userId: null })}
        onConfirm={() => {
          if (deleteData.userId) {
            handleDelete(deleteData.userId);
            setDeleteData({ isOpen: false, userId: null });
          }
        }}
      />
    </div>
  );
}
