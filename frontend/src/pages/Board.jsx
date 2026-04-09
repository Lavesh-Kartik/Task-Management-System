import { useState, useEffect } from 'react';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, Filter, Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { useTask } from '../context/TaskContext';
import KanbanColumn from '../components/board/KanbanColumn';
import TaskCard from '../components/board/TaskCard';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const COLUMNS = [
  { status: 'todo', title: 'To Do' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
];

const PRIORITIES = ['', 'low', 'medium', 'high'];

export default function Board() {
  const { tasks, fetchTasks, updateTask, loading, filters, setFilters } = useTask();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const navigate = useNavigate();
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  const filtered = tasks.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  const getColumnTasks = (status) =>
    filtered.filter((t) => t.status === status).sort((a, b) => a.order - b.order);

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find((t) => t._id === active.id));
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    // Determine target status (column droppable or card's column)
    const overTask = tasks.find((t) => t._id === over.id);
    const targetStatus = COLUMNS.find((c) => c.status === over.id)?.status || overTask?.status;

    if (!targetStatus) return;

    try {
      await updateTask(activeTask._id, { status: targetStatus });
    } catch {
      toast.error('Failed to move task');
    }
  };

  const openCreate = (status) => {
    // optional: could pass state to preset status, but we default to todo in new task page.
    navigate('/tasks/new');
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-full max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex-shrink-0">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mr-auto">Task Board</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="board-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter tasks..."
            className="input pl-9 py-2 text-sm w-48"
          />
        </div>

        {/* Priority filter */}
        <select
          id="board-priority-filter"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="input py-2 text-sm w-36"
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <button id="board-create-btn" onClick={() => openCreate('todo')} className="btn-primary">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex items-center justify-center h-64 flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
            {COLUMNS.map(({ status, title }) => (
              <KanbanColumn
                key={status}
                status={status}
                title={title}
                tasks={getColumnTasks(status)}
                onTaskClick={(id) => navigate(`/tasks/${id}`)}
                onAddTask={openCreate}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="shadow-2xl opacity-90 cursor-grabbing bg-slate-50 z-50 rounded-xl">
                <TaskCard task={activeTask} onClick={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

    </div>
  );
}
