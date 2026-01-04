import { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface ImportPreview {
  sheetName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  engineers: string[];
  services: string[];
  statusCounts: {
    pending: number;
    'in-progress': number;
    completed: number;
  };
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ImportModal({ isOpen, onClose, onImportComplete }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long' });
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(null);
      setError(null);
      setImportResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreview(null);

    try {
      const previewData = await api.previewImport(file, selectedMonth);
      setPreview(previewData);
    } catch (err: any) {
      setError(err.message || 'Failed to preview file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !preview) {
      setError('Please preview the file first');
      return;
    }

    if (!confirm(`Are you sure you want to import ${preview.validRows} tasks for ${selectedMonth} ${selectedYear}?`)) {
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const result = await api.importTasks(file, selectedMonth, selectedYear);
      setImportResult(result);
      setTimeout(() => {
        onImportComplete();
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to import tasks');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setImportResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-main" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Import Tasks from Excel</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: File Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              1. Select Excel File
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls,.xlsm"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-main transition-colors">
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-main">
                      <FileSpreadsheet size={20} />
                      <span className="font-medium">{file.name}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <Upload className="mx-auto mb-2" size={32} />
                      <p>Click to select Excel file</p>
                      <p className="text-xs mt-1">.xlsx, .xls, .xlsm</p>
                    </div>
                  )}
                </div>
              </label>
              {file && (
                <button
                  onClick={handlePreview}
                  disabled={isLoading}
                  className="px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? 'Analyzing...' : 'Preview'}
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Month/Year Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              2. Select Month and Year
            </label>
            <div className="flex items-center gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
              >
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Preview Summary */}
          {preview && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileSpreadsheet className="text-main" size={20} />
                Import Preview
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Total Rows</div>
                  <div className="text-2xl font-bold text-gray-900">{preview.totalRows}</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Valid Rows</div>
                  <div className="text-2xl font-bold text-green-600">{preview.validRows}</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Invalid Rows</div>
                  <div className="text-2xl font-bold text-red-600">{preview.invalidRows}</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Sheet Name</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">{preview.sheetName}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Pending</div>
                  <div className="text-xl font-bold text-gray-600">{preview.statusCounts.pending}</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">In Progress</div>
                  <div className="text-xl font-bold text-blue-600">{preview.statusCounts['in-progress']}</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Completed</div>
                  <div className="text-xl font-bold text-green-600">{preview.statusCounts.completed}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-600 mb-2">Engineers ({preview.engineers.length})</div>
                  <div className="bg-white rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {preview.engineers.map(eng => (
                        <span key={eng} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {eng}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-2">Services ({preview.services.length})</div>
                  <div className="bg-white rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {preview.services.slice(0, 20).map(service => (
                        <span key={service} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {service}
                        </span>
                      ))}
                      {preview.services.length > 20 && (
                        <span className="text-xs text-gray-500">+{preview.services.length - 20} more</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    Will import to: <span className="text-main">{selectedMonth} {selectedYear}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {preview.validRows} tasks will be imported
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-green-800 font-medium">Import Successful!</p>
                <p className="text-green-600 text-sm mt-1">
                  Imported: {importResult.imported} tasks | Skipped: {importResult.skipped} rows
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {preview && !importResult && (
            <button
              onClick={handleImport}
              disabled={isImporting || preview.validRows === 0}
              className="px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Confirm Import
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

