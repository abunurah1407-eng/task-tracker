import { Engineer, Service } from '../types';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  engineers: Engineer[];
  services: Service[];
  selectedEngineer: string | null;
  selectedService: string | null;
  onEngineerChange: (engineer: string | null) => void;
  onServiceChange: (service: string | null) => void;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  engineers,
  services,
  selectedEngineer,
  selectedService,
  onEngineerChange,
  onServiceChange,
}: SearchBarProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks by service or engineer..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter by Engineer:</span>
          <select
            value={selectedEngineer || ''}
            onChange={(e) => onEngineerChange(e.target.value || null)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Engineers</option>
            {engineers.map(eng => (
              <option key={eng.id} value={eng.name}>{eng.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter by Service:</span>
          <select
            value={selectedService || ''}
            onChange={(e) => onServiceChange(e.target.value || null)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Services</option>
            {services.map(service => (
              <option key={service.id} value={service.name}>{service.name}</option>
            ))}
          </select>
        </div>

        {(selectedEngineer || selectedService || searchQuery) && (
          <button
            onClick={() => {
              onEngineerChange(null);
              onServiceChange(null);
              onSearchChange('');
            }}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}


