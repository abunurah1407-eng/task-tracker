import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Task, Engineer } from '../types';
import TaskItem from './TaskItem';

interface GroupedTasksByEngineerProps {
  tasks: Task[];
  engineers: Engineer[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

export default function GroupedTasksByEngineer({ tasks, engineers, onEdit, onDelete, getStatusIcon, getStatusColor, getPriorityColor }: GroupedTasksByEngineerProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group tasks by engineer
  const grouped = tasks.reduce((acc, task) => {
    const key = task.engineer;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const toggleGroup = (engineer: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(engineer)) {
      newExpanded.delete(engineer);
    } else {
      newExpanded.add(engineer);
    }
    setExpandedGroups(newExpanded);
  };

  // Get engineer color
  const getEngineerColor = (engineerName: string) => {
    const engineer = engineers.find(e => e.name === engineerName);
    return engineer?.color || '#3b82f6';
  };

  return (
    <div>
      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([engineer, engineerTasks]) => {
          const isExpanded = expandedGroups.has(engineer);
          const engineerColor = getEngineerColor(engineer);
          
          return (
            <div key={engineer} className="border-b border-gray-200 last:border-b-0">
              <button
                onClick={() => toggleGroup(engineer)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: engineerColor }}
                  />
                  <span className="font-semibold text-gray-900">{engineer}</span>
                  <span className="text-sm text-gray-500">({engineerTasks.length} task{engineerTasks.length !== 1 ? 's' : ''})</span>
                </div>
              </button>
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {engineerTasks.map((task) => (
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

