import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import Tasks from './pages/Tasks';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import { Loader2 } from 'lucide-react';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="board" element={<Board />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TaskProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e2a42',
                border: '1px solid #2a3452',
                color: '#f0f4ff',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#1e2a42' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#1e2a42' } },
            }}
          />
        </TaskProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
