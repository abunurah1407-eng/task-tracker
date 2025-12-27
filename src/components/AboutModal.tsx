import { X, Info } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Info className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">About</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">System Name</label>
            <p className="text-lg font-medium text-gray-900 mt-1">Task Tracker</p>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Version</label>
            <p className="text-lg font-medium text-gray-900 mt-1">1.0.0</p>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Developed by</label>
            <p className="text-lg font-medium text-gray-900 mt-1">Eng. Mohammed Ageeli</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contact #</label>
            <p className="text-lg font-medium text-gray-900 mt-1">
              <a 
                href="tel:+966507801929" 
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                +966507801929
              </a>
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-main text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

