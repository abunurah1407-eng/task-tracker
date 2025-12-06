import { Engineer, Task } from '../types';
import { User, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface EngineerCardProps {
  engineer: Engineer;
  isSelected: boolean;
  onClick: () => void;
  onTaskClick: (task: Task) => void;
  tasks: Task[];
}

export default function EngineerCard({ engineer, isSelected, onClick, onTaskClick, tasks }: EngineerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`${isSelected ? 'bg-main' : 'bg-gray-50'} rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-main-400' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: engineer.color }}
          >
            <User size={20} />
          </div>
          <div>
            <div className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
              {engineer.name}
            </div>
            <div className={`text-sm ${isSelected ? 'text-main-100' : 'text-gray-700'}`}>
              {engineer.tasksTotal} tasks
            </div>
          </div>
        </div>
        <div className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-main-700'}`}>
          {engineer.tasksTotal}
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 w-full"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
          </button>

          {isExpanded && (
            <div className="mt-2 space-y-1">
              {tasks.map(task => (
                <div
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(task);
                  }}
                  className="text-xs bg-white/90 rounded px-2 py-1 hover:bg-white transition-colors cursor-pointer border border-gray-200"
                >
                  <div className="font-semibold text-gray-900">{task.service}</div>
                  <div className="text-gray-600">
                    Week {task.week} • {task.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


