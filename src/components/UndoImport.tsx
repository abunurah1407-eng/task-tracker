import { useState, useEffect } from 'react';
import { Undo2, X, Clock } from 'lucide-react';
import { api } from '../services/api';

interface LastImportInfo {
  taskIds: number[];
  imported: number;
  month: string;
  year: number;
  timestamp: string;
}

interface UndoImportProps {
  onUndoComplete: () => void;
}

export default function UndoImport({ onUndoComplete }: UndoImportProps) {
  const [lastImport, setLastImport] = useState<LastImportInfo | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLastImport();
  }, []);

  const loadLastImport = () => {
    try {
      const stored = localStorage.getItem('lastImport');
      if (stored) {
        const importInfo = JSON.parse(stored) as LastImportInfo;
        setLastImport(importInfo);
      }
    } catch (err) {
      console.error('Failed to load last import info:', err);
    }
  };

  const handleUndo = async () => {
    if (!lastImport) return;

    if (!confirm(`Are you sure you want to undo the last import and delete ${lastImport.imported} tasks from ${lastImport.month} ${lastImport.year}?`)) {
      return;
    }

    setIsUndoing(true);
    setError(null);

    try {
      await api.undoImport(lastImport.taskIds);
      localStorage.removeItem('lastImport');
      setLastImport(null);
      onUndoComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to undo import');
    } finally {
      setIsUndoing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.removeItem('lastImport');
    setLastImport(null);
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const importTime = new Date(timestamp);
    const diffMs = now.getTime() - importTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (!lastImport) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 transition-colors"
        title="Dismiss"
      >
        <X size={16} />
      </button>
      
      <div className="flex items-start gap-3 pr-6">
        <div className="flex-shrink-0 mt-0.5">
          <Clock className="text-blue-600" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-blue-800 font-medium text-sm">
            Last import: {lastImport.imported} tasks to {lastImport.month} {lastImport.year}
          </p>
          <p className="text-blue-600 text-xs mt-1">
            {formatTimeAgo(lastImport.timestamp)}
          </p>
          {error && (
            <p className="text-red-600 text-xs mt-1">{error}</p>
          )}
        </div>
        <button
          onClick={handleUndo}
          disabled={isUndoing}
          className="flex-shrink-0 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isUndoing ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              Undoing...
            </>
          ) : (
            <>
              <Undo2 size={14} />
              Undo
            </>
          )}
        </button>
      </div>
    </div>
  );
}

