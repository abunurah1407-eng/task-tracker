import { Edit, Trash2 } from 'lucide-react';
import { Task, Engineer } from '../types';

interface TaskItemProps {
  task: Task;
  engineers: Engineer[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

export default function TaskItem({ task, onEdit, onDelete, getStatusIcon, getStatusColor, getPriorityColor }: TaskItemProps) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-200">
      <div className="flex items-start gap-4">
        {getStatusIcon(task.status)}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {task.service}
            </h3>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
              {task.status.replace('-', ' ').toUpperCase()}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority.toUpperCase()}
            </span>
            <span className="text-sm text-gray-500">
              • {task.engineer}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Week {task.week} • {task.month} {task.year}</p>
            {task.description && (
              <p className="text-gray-500 italic">"{task.description}"</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-main hover:bg-main-50 rounded transition-colors"
            title="Edit task"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete task"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

