import { Service, Task } from '../types';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface ServicesListProps {
  services: Service[];
  selectedService: string | null;
  onServiceSelect: (service: string | null) => void;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export default function ServicesList({ services, selectedService, onServiceSelect, tasks }: ServicesListProps) {
  const primaryServices = services.filter(s => s.category === 'primary');
  const secondaryServices = services.filter(s => s.category === 'secondary');

  const getStatusIcon = (count: number) => {
    if (count === 0) return <Circle size={16} className="text-gray-400" />;
    if (count < 5) return <AlertCircle size={16} className="text-yellow-500" />;
    return <CheckCircle size={16} className="text-green-500" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Services</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Services */}
        <div>
          <h3 className="text-lg font-semibold text-indigo-600 mb-3">Primary Services</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {primaryServices.map(service => {
              const serviceTasks = tasks.filter(t => t.service === service.name);
              const isSelected = selectedService === service.name;
              
              return (
                <div
                  key={service.id}
                  onClick={() => onServiceSelect(isSelected ? null : service.name)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.count)}
                    <div>
                      <div className="font-semibold text-gray-900">{service.name}</div>
                      {service.assignedTo && (
                        <div className="text-xs text-gray-600">{service.assignedTo}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-indigo-700">{service.count}</span>
                    {serviceTasks.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {serviceTasks.length} active
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Secondary Services */}
        <div>
          <h3 className="text-lg font-semibold text-purple-600 mb-3">Secondary Services</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {secondaryServices.map(service => {
              const serviceTasks = tasks.filter(t => t.service === service.name);
              const isSelected = selectedService === service.name;
              
              return (
                <div
                  key={service.id}
                  onClick={() => onServiceSelect(isSelected ? null : service.name)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'bg-purple-100 ring-2 ring-purple-400' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.count)}
                    <div className="font-semibold text-gray-900">{service.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-purple-700">{service.count}</span>
                    {serviceTasks.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {serviceTasks.length} active
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


