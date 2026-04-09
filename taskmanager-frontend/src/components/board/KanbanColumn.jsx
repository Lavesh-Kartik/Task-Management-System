import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';

const COL_STYLES = {
  todo: { header: 'text-slate-600', dot: 'bg-slate-300', countBg: 'bg-slate-100 text-slate-600' },
  in_progress: { header: 'text-blue-600', dot: 'bg-blue-500', countBg: 'bg-blue-50 text-blue-600' },
  done: { header: 'text-emerald-700', dot: 'bg-emerald-500', countBg: 'bg-emerald-50 text-emerald-700' },
};

export default function KanbanColumn({ status, title, tasks, onTaskClick, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const style = COL_STYLES[status];

  return (
    <div
      ref={setNodeRef}
      className={`kanban-col transition-all duration-200 ${isOver ? 'ring-2 ring-slate-300 bg-slate-50' : ''}`}
      id={`kanban-col-${status}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white z-10 sticky top-0 rounded-t-3xl">
        <div className="flex items-center gap-2.5 flex-1">
          <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
          <span className={`font-bold tracking-wide uppercase text-sm ${style.header}`}>{title}</span>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-black tracking-wider ml-auto ${style.countBg}`}>
            {tasks.length}
          </span>
        </div>
        <button
          id={`add-task-${status}`}
          onClick={() => onAddTask(status)}
          className="p-1.5 ml-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all font-bold"
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
            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center font-semibold text-slate-400 text-sm cursor-pointer hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Plus className="w-5 h-5 mx-auto mb-1 opacity-50" />
            Add a task
          </div>
        )}
      </div>
    </div>
  );
}
