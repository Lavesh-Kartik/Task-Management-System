import { useState } from 'react';
import { Calendar, MessageSquare, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, differenceInDays, isValid } from 'date-fns';
import { useTask } from '../../context/TaskContext';

const PRIORITY_DOT = { low: 'bg-slate-300', medium: 'bg-amber-500', high: 'bg-rose-500' };
const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
const AVATAR_COLORS = ['from-slate-800 to-slate-700', 'from-blue-600 to-blue-500', 'from-emerald-600 to-emerald-500', 'from-rose-600 to-rose-500'];

const safeDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isValid(d) ? d : null;
};

export default function TaskCard({ task, onClick }) {
  const { updateTask } = useTask();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const d = safeDate(task.deadline);
  const isOverdue = d && isPast(d) && task.status !== 'done';
  const daysLeft = d ? differenceInDays(d, new Date()) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="task-card"
      id={`task-card-${task._id}`}
    >
      {/* Priority indicator */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {task.labels?.slice(0, 2).map((l) => (
            <span key={l} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">{l}</span>
          ))}
          {task.labels?.length > 2 && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">+{task.labels.length - 2}</span>
          )}
        </div>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${PRIORITY_DOT[task.priority]}`} title={`${task.priority} priority`} />
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold tracking-tight text-slate-800 mb-3 leading-snug line-clamp-2">{task.title}</h3>

      {/* Deadline */}
      {d && (
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold mb-4 ${isOverdue ? 'text-rose-500' : daysLeft !== null && daysLeft <= 3 ? 'text-amber-500' : 'text-slate-500'}`}>
          {isOverdue && <AlertTriangle className="w-3 h-3" />}
          <Calendar className="w-3 h-3" />
          <span>{format(d, 'MMM d')}</span>
          {isOverdue ? <span>(overdue)</span> : daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 ? <span>({daysLeft}d left)</span> : daysLeft !== null && daysLeft < 0 ? <span>(due)</span> : null}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Assignees */}
        <div className="flex -space-x-1.5">
          {task.assignees?.slice(0, 3).map((a, i) => (
            <div
              key={a._id}
              title={a.name}
              className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow-sm ring-1 ring-slate-100 hover:z-10 transition-all`}
            >
              {getInitials(a.name)}
            </div>
          ))}
          {task.assignees?.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-bold border-2 border-white shadow-sm ring-1 ring-slate-100">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
        {task.status !== 'done' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateTask(task._id, { status: 'done' });
            }}
            className="p-1.5 rounded-xl text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all"
            title="Mark as completed"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
