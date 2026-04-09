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
    <div className="max-w-lg space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-dark-50">Profile Settings</h1>

      <div className="card p-6">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg glow overflow-hidden">
              {form.avatar ? <img src={form.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(user?.name)}
            </div>
          </div>
          <h2 className="text-lg font-semibold text-dark-100">{user?.name}</h2>
          <span className={`mt-1 badge ${user?.role === 'admin' ? 'bg-brand-600/20 text-brand-400' : 'bg-dark-700 text-dark-400'}`}>
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
              className="input opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-dark-600 mt-1">Email cannot be changed</p>
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
              <div className="mt-2 flex items-center gap-2">
                <img src={form.avatar} alt="Preview" className="w-8 h-8 rounded-full object-cover border border-dark-600" onError={(e) => e.target.style.display = 'none'} />
                <span className="text-xs text-dark-500">Preview</span>
              </div>
            )}
          </div>

          {/* Role (read-only) */}
          <div>
            <label className="label flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Role</label>
            <div className="input opacity-60 cursor-not-allowed capitalize">{user?.role}</div>
            <p className="text-xs text-dark-600 mt-1">Role can only be changed by an admin</p>
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
