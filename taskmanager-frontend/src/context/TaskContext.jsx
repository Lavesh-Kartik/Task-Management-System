import { createContext, useContext, useState, useCallback } from 'react';
import { taskAPI } from '../api';
import toast from 'react-hot-toast';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', sort: 'createdAt' });

  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await taskAPI.getAll({ ...filters, ...params });
      setTasks(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createTask = async (taskData) => {
    try {
      const { data } = await taskAPI.create(taskData);
      setTasks((prev) => [data.data, ...prev]);
      toast.success('Task created!');
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
      throw err;
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const { data } = await taskAPI.update(id, updates);
      setTasks((prev) => prev.map((t) => (t._id === id ? data.data : t)));
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
      throw err;
    }
  };

  const deleteTask = async (id) => {
    try {
      await taskAPI.delete(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
      throw err;
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, loading, filters, setFilters, fetchTasks, createTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTask must be used within TaskProvider');
  return ctx;
};
