import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell, Search, LogOut, User, ChevronDown, CheckCheck,
  Trash2, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../api';

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function Navbar({ onSearch }) {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(data.data);
      setUnread(data.unreadCount);
    } catch {}
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    onSearch?.(e.target.value);
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    setUnread(0);
  };

  const markRead = async (id) => {
    await notificationAPI.markRead(id);
    setNotifications((n) => n.map((x) => x._id === id ? { ...x, read: true } : x));
    setUnread((u) => Math.max(0, u - 1));
  };

  const deleteNotif = async (id) => {
    await notificationAPI.delete(id);
    const n = notifications.find((x) => x._id === id);
    setNotifications((prev) => prev.filter((x) => x._id !== id));
    if (!n?.read) setUnread((u) => Math.max(0, u - 1));
  };

  return (
    <header className="h-16 border-b border-dark-700 bg-dark-900/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input
          id="global-search"
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={handleSearch}
          className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-9 pr-4 py-2 text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            id="notif-btn"
            onClick={() => { setShowNotif(!showNotif); setShowUser(false); }}
            className="relative p-2 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-all"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl animate-slide-in overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
                <span className="font-semibold text-sm text-dark-100">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-dark-500 text-sm py-8">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => !n.read && markRead(n._id)}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-dark-700/50 last:border-0 cursor-pointer hover:bg-dark-700/50 transition-colors ${!n.read ? 'bg-brand-600/5' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-brand-500' : 'bg-dark-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-dark-200 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-dark-500 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif(n._id); }}
                        className="text-dark-600 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            id="user-menu-btn"
            onClick={() => { setShowUser(!showUser); setShowNotif(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-dark-800 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(user?.name)}
            </div>
            <span className="text-sm font-medium text-dark-200 max-w-24 truncate hidden sm:block">{user?.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-dark-500" />
          </button>

          {showUser && (
            <div className="absolute right-0 top-12 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl animate-slide-in overflow-hidden">
              <div className="px-4 py-3 border-b border-dark-700">
                <p className="text-sm font-medium text-dark-100 truncate">{user?.name}</p>
                <p className="text-xs text-dark-500 truncate">{user?.email}</p>
                <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${user?.role === 'admin' ? 'bg-brand-600/20 text-brand-400' : 'bg-dark-700 text-dark-400'}`}>
                  {user?.role}
                </span>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowUser(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-700 transition-colors"
              >
                <User className="w-4 h-4" /> Profile
              </Link>
              <button
                id="logout-btn"
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-dark-700 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
