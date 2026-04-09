import { useState, useEffect } from 'react';
import { Users, Shield, Trash2, Crown, UserCheck, Search, Loader2 } from 'lucide-react';
import { userAPI } from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await userAPI.getAll();
      setUsers(data.data);
    } catch {
      toast.error('Failed to load users');
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
    if (!confirm('Remove this user? They will lose access to all tasks.')) return;
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-50 flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-400" /> User Management
          </h1>
          <p className="text-dark-500 text-sm mt-1">Manage roles and access for all team members</p>
        </div>
        <div className="card px-4 py-2 flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-semibold text-dark-200">{users.length} members</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input
          id="user-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="input pl-9 py-2 text-sm"
        />
      </div>

      {/* User table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-dark-700 text-xs font-semibold text-dark-500 uppercase tracking-wider">
            <div className="col-span-5">User</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-dark-700">
            {filtered.map((u) => (
              <div key={u._id} id={`user-row-${u._id}`} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-dark-700/30 transition-colors">
                {/* User info */}
                <div className="col-span-12 sm:col-span-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dark-100 flex items-center gap-1.5">
                      {u.name}
                      {u._id === currentUser?._id && (
                        <span className="text-[10px] font-medium text-brand-400 bg-brand-600/20 px-1.5 py-0.5 rounded-full">You</span>
                      )}
                    </p>
                    <p className="text-xs text-dark-500 truncate">{u.email}</p>
                  </div>
                </div>

                {/* Role */}
                <div className="col-span-6 sm:col-span-3">
                  <span className={`badge ${u.role === 'admin' ? 'bg-brand-600/20 text-brand-400' : 'bg-dark-700 text-dark-400'} gap-1`}>
                    {u.role === 'admin' ? <Crown className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                    {u.role}
                  </span>
                </div>

                {/* Joined */}
                <div className="col-span-6 sm:col-span-2 text-xs text-dark-500">
                  {format(new Date(u.createdAt), 'MMM d, yyyy')}
                </div>

                {/* Actions */}
                <div className="col-span-12 sm:col-span-2 flex items-center justify-end gap-2">
                  {u._id !== currentUser?._id && (
                    <>
                      <button
                        id={`toggle-role-${u._id}`}
                        onClick={() => toggleRole(u._id, u.role)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-dark-100 transition-all font-medium"
                        title={`Make ${u.role === 'admin' ? 'member' : 'admin'}`}
                      >
                        {u.role === 'admin' ? 'Demote' : 'Promote'}
                      </button>
                      <button
                        id={`delete-user-${u._id}`}
                        onClick={() => handleDelete(u._id)}
                        className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Remove user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-dark-500">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}
