import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Task, Engineer } from '../types';
import TaskItem from './TaskItem';

interface GroupedTasksByStatusProps {
  tasks: Task[];
  engineers: Engineer[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

const statusOrder = ['pending', 'in-progress', 'completed'];
const statusLabels: Record<string, string> = {
  'pending': 'Pending',
  'in-progress': 'In Progress',
  'completed': 'Completed'
};

export default function GroupedTasksByStatus({ tasks, engineers, onEdit, onDelete, getStatusIcon, getStatusColor, getPriorityColor }: GroupedTasksByStatusProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group tasks by status
  const grouped = tasks.reduce((acc, task) => {
    const key = task.status;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const toggleGroup = (status: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(status)) {
      newExpanded.delete(status);
    } else {
      newExpanded.add(status);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div>
      {statusOrder
        .filter(status => grouped[status] && grouped[status].length > 0)
        .map((status) => {
          const statusTasks = grouped[status];
          const isExpanded = expandedGroups.has(status);
          
          return (
            <div key={status} className="border-b border-gray-200 last:border-b-0">
              <button
                onClick={() => toggleGroup(status)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(status)}`}>
                    {statusLabels[status] || status.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">({statusTasks.length} task{statusTasks.length !== 1 ? 's' : ''})</span>
                </div>
              </button>
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {statusTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      engineers={engineers}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

