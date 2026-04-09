import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';

const COL_STYLES = {
  todo: { header: 'text-slate-400', dot: 'bg-slate-500', countBg: 'bg-slate-500/20 text-slate-400' },
  in_progress: { header: 'text-blue-400', dot: 'bg-blue-500', countBg: 'bg-blue-500/20 text-blue-400' },
  done: { header: 'text-green-400', dot: 'bg-green-500', countBg: 'bg-green-500/20 text-green-400' },
};

export default function KanbanColumn({ status, title, tasks, onTaskClick, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const style = COL_STYLES[status];

  return (
    <div
      ref={setNodeRef}
      className={`kanban-col transition-all duration-200 ${isOver ? 'ring-2 ring-brand-500/50 bg-dark-800/40' : ''}`}
      id={`kanban-col-${status}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${style.dot}`} />
          <span className={`font-semibold text-sm ${style.header}`}>{title}</span>
          <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${style.countBg}`}>
            {tasks.length}
          </span>
        </div>
        <button
          id={`add-task-${status}`}
          onClick={() => onAddTask(status)}
          className="p-1.5 rounded-lg text-dark-500 hover:text-dark-200 hover:bg-dark-700 transition-all"
          title="Add task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={() => onTaskClick(task._id)} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div
            onClick={() => onAddTask(status)}
            className="border-2 border-dashed border-dark-700 rounded-xl p-6 text-center text-dark-600 text-sm cursor-pointer hover:border-dark-600 hover:text-dark-500 transition-all"
          >
            <Plus className="w-5 h-5 mx-auto mb-1 opacity-50" />
            Add a task
          </div>
        )}
      </div>
    </div>
  );
}
