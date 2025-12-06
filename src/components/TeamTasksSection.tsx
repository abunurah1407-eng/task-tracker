import { TeamTask } from '../types';
import { Users } from 'lucide-react';

interface TeamTasksSectionProps {
  teamTasks: TeamTask[];
}

export default function TeamTasksSection({ teamTasks }: TeamTasksSectionProps) {
  const total = teamTasks.reduce((sum, task) => sum + task.count, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Users className="text-purple-700" size={24} />
        <h2 className="text-2xl font-bold text-gray-900">Nasser 2025</h2>
      </div>
      <div className="text-sm text-gray-700 mb-4 font-medium">Teams Tasks</div>

      <div className="space-y-3">
        {teamTasks.map(task => (
          <div
            key={task.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="font-semibold text-gray-900">{task.category}</div>
            <div className="text-lg font-bold text-purple-700">{task.count}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-300">
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-900">TOTAL 2025 TASKS</span>
          <span className="text-xl font-bold text-red-700">{total}</span>
        </div>
      </div>
    </div>
  );
}


