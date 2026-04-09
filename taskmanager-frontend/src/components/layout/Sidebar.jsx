import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Kanban, Users, Settings, CheckSquare, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, id: 'nav-dashboard' },
  { to: '/board', label: 'Board', icon: Kanban, id: 'nav-board' },
  { to: '/tasks', label: 'My Tasks', icon: CheckSquare, id: 'nav-tasks' },
];

const adminItems = [
  { to: '/admin', label: 'Users', icon: Users, id: 'nav-admin' },
];

export default function Sidebar() {
  const { user, isAdmin } = useAuth();

  return (
    <aside className="w-60 min-h-screen bg-dark-900 border-r border-dark-700 flex flex-col py-6 px-3 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-gradient">TaskFlow</span>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 space-y-1">
        <p className="text-[10px] font-semibold text-dark-600 uppercase tracking-wider px-3 mb-2">Workspace</p>
        {navItems.map(({ to, label, icon: Icon, id }) => (
          <NavLink
            key={to}
            to={to}
            id={id}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className="text-[10px] font-semibold text-dark-600 uppercase tracking-wider px-3 pt-4 pb-2">Admin</p>
            {adminItems.map(({ to, label, icon: Icon, id }) => (
              <NavLink
                key={to}
                to={to}
                id={id}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Profile footer */}
      <div className="border-t border-dark-700 pt-4 px-2">
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
