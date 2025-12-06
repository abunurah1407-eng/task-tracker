import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Task, Engineer } from '../types';
import TaskItem from './TaskItem';

interface GroupedTasksByServiceProps {
  tasks: Task[];
  engineers: Engineer[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

export default function GroupedTasksByService({ tasks, engineers, onEdit, onDelete, getStatusIcon, getStatusColor, getPriorityColor }: GroupedTasksByServiceProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group tasks by service
  const grouped = tasks.reduce((acc, task) => {
    const key = task.service;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const toggleGroup = (service: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(service)) {
      newExpanded.delete(service);
    } else {
      newExpanded.add(service);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div>
      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([service, serviceTasks]) => {
          const isExpanded = expandedGroups.has(service);
          
          return (
            <div key={service} className="border-b border-gray-200 last:border-b-0">
              <button
                onClick={() => toggleGroup(service)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
                  <span className="font-semibold text-gray-900">{service}</span>
                  <span className="text-sm text-gray-500">({serviceTasks.length} task{serviceTasks.length !== 1 ? 's' : ''})</span>
                </div>
              </button>
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {serviceTasks.map((task) => (
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

