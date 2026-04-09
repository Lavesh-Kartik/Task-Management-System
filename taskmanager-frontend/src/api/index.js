import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('tm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tm_token');
      localStorage.removeItem('tm_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.patch('/auth/profile', data),
};

// Tasks
export const taskAPI = {
  getAll: (params) => API.get('/tasks', { params }),
  getOne: (id) => API.get(`/tasks/${id}`),
  create: (data) => API.post('/tasks', data),
  update: (id, data) => API.patch(`/tasks/${id}`, data),
  delete: (id) => API.delete(`/tasks/${id}`),
  getComments: (id) => API.get(`/tasks/${id}/comments`),
  addComment: (id, data) => API.post(`/tasks/${id}/comments`, data),
  deleteComment: (id, commentId) => API.delete(`/tasks/${id}/comments/${commentId}`),
};

// Users
export const userAPI = {
  getAll: () => API.get('/users'),
  getOne: (id) => API.get(`/users/${id}`),
  updateRole: (id, role) => API.patch(`/users/${id}/role`, { role }),
  delete: (id) => API.delete(`/users/${id}`),
};

// Notifications
export const notificationAPI = {
  getAll: () => API.get('/notifications'),
  markRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllRead: () => API.patch('/notifications/read-all'),
  delete: (id) => API.delete(`/notifications/${id}`),
};

export default API;
