import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Kanban, Users, Settings, CheckSquare, Zap, Plus, ListTodo
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const memberItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, id: 'nav-dashboard' },
  { to: '/board', label: 'Board', icon: Kanban, id: 'nav-board' },
  { to: '/tasks', label: 'My Tasks', icon: CheckSquare, id: 'nav-tasks' },
];

const adminItems = [
  { to: '/admin', label: 'Command Center', icon: Users, id: 'nav-admin' },
];

const taskItems = [
  { to: '/tasks', label: 'All Tasks', icon: ListTodo, id: 'nav-all-tasks' },
  { to: '/tasks/new', label: 'Create Task', icon: Plus, id: 'nav-new-task' },
];

export default function Sidebar() {
  const { user, isAdmin } = useAuth();

  return (
    <aside className="w-60 h-full overflow-hidden bg-white border-r border-slate-200 flex flex-col py-6 px-3 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-800 tracking-tight">TaskFlow</span>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 overflow-y-auto space-y-1">
        {!isAdmin && (
          <>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Workspace</p>
            {memberItems.map(({ to, label, icon: Icon, id }) => (
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
          </>
        )}

        {isAdmin && (
          <>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Admin</p>
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

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-6">Task Management</p>
            {taskItems.map(({ to, label, icon: Icon, id }) => (
              <NavLink
                key={to}
                to={to}
                id={id}
                end={to === '/tasks'}
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
      <div className="border-t border-slate-100 pt-4 px-2 mt-4 flex-shrink-0">
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
