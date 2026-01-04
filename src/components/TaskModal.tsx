import { useState } from 'react';
import { Task, Engineer, Service } from '../types';
import { X, Save, Trash2, Plus, Minus } from 'lucide-react';

interface TaskModalProps {
  task: Task | null;
  engineers: Engineer[];
  services: Service[];
  onSave: (task: Task | Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSaveMultiple?: (tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  onDelete?: () => void;
  onClose: () => void;
  currentEngineer?: string;
  readOnlyEngineer?: boolean;
}

export default function TaskModal({ task, engineers, services, onSave, onSaveMultiple, onDelete, onClose, currentEngineer, readOnlyEngineer }: TaskModalProps) {
  // Map notes to description for backward compatibility
  const taskDescription = task?.description || (task as any)?.notes || '';
  
  const [formData, setFormData] = useState({
    service: task?.service || '',
    engineer: task?.engineer || currentEngineer || '',
    week: task?.week || 1,
    month: task?.month || new Date().toLocaleString('default', { month: 'long' }),
    year: task?.year || new Date().getFullYear(),
    status: task?.status || 'pending' as Task['status'],
    priority: task?.priority || 'medium' as Task['priority'],
    description: taskDescription,
  });
  
  // For bulk creation: multiple descriptions
  const [descriptions, setDescriptions] = useState<string[]>(task ? [taskDescription] : ['']);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task) {
      // Editing: single task
      onSave({ ...task, ...formData });
    } else {
      // Creating: check if multiple descriptions
      const validDescriptions = descriptions.filter(d => d.trim() !== '');
      if (validDescriptions.length === 0) {
        alert('Please add at least one task description');
        return;
      }
      
      if (validDescriptions.length === 1) {
        // Single task
        onSave({ ...formData, description: validDescriptions[0] });
      } else {
        // Multiple tasks
        if (onSaveMultiple) {
          const tasks = validDescriptions.map(desc => ({
            ...formData,
            description: desc,
          }));
          onSaveMultiple(tasks);
        } else {
          // Fallback: create one by one
          validDescriptions.forEach(desc => {
            onSave({ ...formData, description: desc });
          });
        }
      }
    }
  };

  const addDescription = () => {
    setDescriptions([...descriptions, '']);
  };

  const removeDescription = (index: number) => {
    if (descriptions.length > 1) {
      setDescriptions(descriptions.filter((_, i) => i !== index));
    }
  };

  const updateDescription = (index: number, value: string) => {
    const updated = [...descriptions];
    updated[index] = value;
    setDescriptions(updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {task ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service *
              </label>
              <select
                required
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a service</option>
                {services.map(service => (
                  <option key={service.id} value={service.name}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Engineer *
              </label>
              {readOnlyEngineer && currentEngineer ? (
                <input
                  type="text"
                  value={currentEngineer}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              ) : (
                <select
                  required
                  value={formData.engineer}
                  onChange={(e) => setFormData({ ...formData, engineer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select an engineer</option>
                  {engineers.map(engineer => (
                    <option key={engineer.id} value={engineer.name}>
                      {engineer.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Week *
              </label>
              <select
                required
                value={formData.week}
                onChange={(e) => setFormData({ ...formData, week: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {[1, 2, 3, 4].map(week => (
                  <option key={week} value={week}>Week {week}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month *
              </label>
              <select
                required
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <input
                type="number"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="2020"
                max="2030"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Task Description{!task && descriptions.length > 1 ? 's' : ''} *
              </label>
              {!task && (
                <button
                  type="button"
                  onClick={addDescription}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-main hover:text-main-700 hover:bg-main-50 rounded transition-colors"
                >
                  <Plus size={16} />
                  Add Another
                </button>
              )}
            </div>
            {task ? (
              // Editing: single description
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter task description..."
                required
              />
            ) : (
              // Creating: multiple descriptions
              <div className="space-y-2">
                {descriptions.map((desc, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={desc}
                      onChange={(e) => updateDescription(index, e.target.value)}
                      rows={3}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={`Task description ${index + 1}...`}
                      required={index === 0}
                    />
                    {descriptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDescription(index)}
                        className="px-2 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove description"
                      >
                        <Minus size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-500">
                  {descriptions.length > 1 
                    ? `Creating ${descriptions.filter(d => d.trim() !== '').length} tasks with the same configuration`
                    : 'Add multiple descriptions to create multiple tasks at once'}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors"
            >
              <Save size={20} />
              {task ? 'Update Task' : 'Create Task'}
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={20} />
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


