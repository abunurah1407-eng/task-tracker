import { Task } from '../types';
import { Calendar, Clock } from 'lucide-react';

interface WeeklyViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function WeeklyView({ tasks, onTaskClick }: WeeklyViewProps) {
  const weeks = [1, 2, 3, 4];
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const getTasksByWeek = (week: number) => {
    return tasks.filter(t => t.week === week && t.month === currentMonth && t.year === currentYear);
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="text-indigo-700" size={24} />
        <h2 className="text-2xl font-bold text-gray-900">Weekly View</h2>
      </div>
      <div className="text-sm text-gray-700 mb-4">
        {currentMonth} {currentYear}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {weeks.map(week => {
          const weekTasks = getTasksByWeek(week);
          return (
            <div
              key={week}
              className="border-2 border-gray-200 rounded-lg p-3 min-h-[200px] bg-gray-50"
            >
              <div className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Clock size={16} />
                Week {week}
              </div>
              <div className="text-xs text-gray-500 mb-2">{weekTasks.length} tasks</div>
              <div className="space-y-2">
                {weekTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className={`text-xs p-2 rounded border cursor-pointer hover:shadow-sm transition-all ${getStatusColor(task.status)}`}
                  >
                    <div className="font-medium truncate">{task.service}</div>
                    <div className="text-xs opacity-75">{task.engineer}</div>
                  </div>
                ))}
                {weekTasks.length > 5 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{weekTasks.length - 5} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


