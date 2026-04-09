import { useState } from 'react';
import { User, Mail, Shield, Save, Loader2, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      updateUser(data.data);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6 animate-fade-in mx-auto mt-2">
      <div className="card p-8">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-slate-800 shadow-xl shadow-slate-200 border-4 border-white flex items-center justify-center text-white text-3xl font-black overflow-hidden relative z-10">
              {form.avatar ? <img src={form.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(user?.name)}
            </div>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{user?.name}</h2>
          <span className={`mt-2 px-3 py-1 rounded-md font-bold tracking-wider uppercase text-[10px] ${user?.role === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
            {user?.role}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="label flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Full Name</label>
            <input
              id="profile-name"
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Your full name"
              required
              className="input"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="label flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email</label>
            <input
              type="email"
              value={user?.email}
              readOnly
              className="input opacity-60 cursor-not-allowed bg-slate-50"
            />
            <p className="text-xs text-slate-400 font-medium mt-1.5">Email cannot be changed</p>
          </div>

          {/* Avatar URL */}
          <div>
            <label className="label flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" />Avatar URL</label>
            <input
              id="profile-avatar"
              type="url"
              value={form.avatar}
              onChange={set('avatar')}
              placeholder="https://example.com/avatar.jpg"
              className="input"
            />
            {form.avatar && (
              <div className="mt-3 flex items-center gap-2.5">
                <img src={form.avatar} alt="Preview" className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" onError={(e) => e.target.style.display = 'none'} />
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Preview</span>
              </div>
            )}
          </div>

          {/* Role (read-only) */}
          <div>
            <label className="label flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Role</label>
            <div className="input opacity-60 flex items-center cursor-not-allowed capitalize bg-slate-50 font-bold">{user?.role}</div>
            <p className="text-xs text-slate-400 font-medium mt-1.5">Role can only be changed by an admin</p>
          </div>

          <button id="save-profile-btn" type="submit" disabled={saving} className="btn-primary w-full justify-center">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
