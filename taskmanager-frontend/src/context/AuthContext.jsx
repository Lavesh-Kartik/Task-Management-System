import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('tm_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authAPI.getMe();
        setUser(data.data);
        localStorage.setItem('tm_user', JSON.stringify(data.data));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const login = (userData) => {
    const { token, ...rest } = userData;
    localStorage.setItem('tm_token', token);
    localStorage.setItem('tm_user', JSON.stringify(rest));
    setUser(rest);
  };

  const logout = () => {
    localStorage.removeItem('tm_token');
    localStorage.removeItem('tm_user');
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('tm_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
