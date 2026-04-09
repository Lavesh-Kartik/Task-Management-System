import { useState } from 'react';
import { Calendar, MessageSquare, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, differenceInDays } from 'date-fns';
import { useTask } from '../../context/TaskContext';

const PRIORITY_DOT = { low: 'bg-slate-500', medium: 'bg-amber-500', high: 'bg-red-500' };
const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
const AVATAR_COLORS = ['from-brand-500 to-purple-500', 'from-pink-500 to-rose-500', 'from-emerald-500 to-teal-500', 'from-orange-500 to-amber-500'];

export default function TaskCard({ task, onClick }) {
  const { updateTask } = useTask();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== 'done';
  const daysLeft = task.deadline ? differenceInDays(new Date(task.deadline), new Date()) : null;

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
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {task.labels?.slice(0, 2).map((l) => (
            <span key={l} className="badge bg-brand-600/20 text-brand-400 text-[10px]">{l}</span>
          ))}
          {task.labels?.length > 2 && (
            <span className="badge bg-dark-700 text-dark-500 text-[10px]">+{task.labels.length - 2}</span>
          )}
        </div>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${PRIORITY_DOT[task.priority]}`} title={`${task.priority} priority`} />
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-dark-100 mb-3 leading-relaxed line-clamp-2">{task.title}</h3>

      {/* Deadline */}
      {task.deadline && (
        <div className={`flex items-center gap-1.5 text-[11px] mb-3 ${isOverdue ? 'text-red-400' : daysLeft !== null && daysLeft <= 3 ? 'text-amber-400' : 'text-dark-500'}`}>
          {isOverdue && <AlertTriangle className="w-3 h-3" />}
          <Calendar className="w-3 h-3" />
          <span>{format(new Date(task.deadline), 'MMM d')}</span>
          {isOverdue ? <span>(overdue)</span> : daysLeft !== null && daysLeft <= 3 ? <span>({daysLeft}d left)</span> : null}
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
              className={`w-6 h-6 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[9px] font-bold border border-dark-800 ring-[1.5px] ring-dark-700`}
            >
              {getInitials(a.name)}
            </div>
          ))}
          {task.assignees?.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-dark-400 text-[9px] font-bold border border-dark-800 ring-[1.5px] ring-dark-700">
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
            className="p-1 rounded-md text-dark-500 hover:text-green-400 hover:bg-green-500/10 transition-all"
            title="Mark as completed"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
