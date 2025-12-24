import { X, FileText } from 'lucide-react';
import { Task, Engineer } from '../types';

// Month name to abbreviation mapping
const monthAbbreviations: Record<string, string> = {
  'January': 'Jan',
  'February': 'Feb',
  'March': 'Mar',
  'April': 'Apr',
  'May': 'May',
  'June': 'Jun',
  'July': 'Jul',
  'August': 'Aug',
  'September': 'Sep',
  'October': 'Oct',
  'November': 'Nov',
  'December': 'Dec',
};

interface ServiceEngineersViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearTasks: Task[];
  engineers: Engineer[];
  selectedYear: number;
}

export default function ServiceEngineersViewModal({
  isOpen,
  onClose,
  yearTasks,
  engineers,
  selectedYear,
}: ServiceEngineersViewModalProps) {
  if (!isOpen) return null;

  // Organize data: Service -> Engineer -> Month
  const organizeData = () => {
    const organized: Record<string, Record<string, Record<string, number>>> = {};

    yearTasks.forEach(task => {
      if (!task.service || !task.engineer || !task.month) return;

      if (!organized[task.service]) {
        organized[task.service] = {};
      }
      if (!organized[task.service][task.engineer]) {
        organized[task.service][task.engineer] = {};
      }
      if (!organized[task.service][task.engineer][task.month]) {
        organized[task.service][task.engineer][task.month] = 0;
      }
      organized[task.service][task.engineer][task.month]++;
    });

    return organized;
  };

  const organizedData = organizeData();

  // Get all months in order
  const allMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get engineer color
  const getEngineerColor = (engineerName: string) => {
    const engineer = engineers.find(e => e.name === engineerName);
    return engineer?.color || '#3b82f6';
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const organizedData = organizeData();
    const allMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const reportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Services by Engineers Report - ${selectedYear}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f9fafb; }
            h1 { color: #1f2937; margin-bottom: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .header { margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; }
            .service-card { background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border: 2px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .service-name { font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #cbd5e1; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 10px; border-radius: 6px; }
            .engineer-row { margin-bottom: 8px; padding: 10px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-left: 4px solid #3b82f6; border-radius: 4px; }
            .engineer-label { font-weight: 600; color: #1e40af; margin-right: 10px; min-width: 120px; display: inline-block; }
            .month-badge { display: inline-block; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #10b981; border-radius: 6px; padding: 6px 10px; margin: 3px; font-size: 11px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
            .month-name { color: #065f46; font-weight: 600; }
            .month-count { font-weight: bold; color: #047857; margin-left: 4px; background: #10b981; color: white; padding: 2px 6px; border-radius: 10px; }
            @media print {
              body { padding: 10px; }
              .service-card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Services by Engineers Report</h1>
            <p><strong>Year:</strong> ${selectedYear}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          ${Object.entries(organizedData).map(([service, engineers]) => {
            const totalTasks = Object.values(engineers).reduce((sum, months) => 
              sum + Object.values(months).reduce((s, count) => s + count, 0), 0
            );
            return `
              <div class="service-card">
                <div class="service-name">${service} (${totalTasks} tasks)</div>
                ${Object.entries(engineers).map(([engineerName, months]) => {
                  const engineerTasks = Object.values(months).reduce((sum, count) => sum + count, 0);
                  return `
                    <div class="engineer-row">
                      <span class="engineer-label">${engineerName}:</span>
                      ${allMonths.map(month => {
                        const count = months[month] || 0;
                        if (count === 0) return '';
                        return `
                          <span class="month-badge">
                            <span class="month-name">${monthAbbreviations[month] || month.substring(0, 3)}</span>
                            <span class="month-count">${count}</span>
                          </span>
                        `;
                      }).filter(Boolean).join('')}
                      <span style="margin-left: 10px; font-size: 11px; color: #6b7280;">Total: ${engineerTasks}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(reportContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-main to-main-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Services by Engineers</h2>
            <p className="text-sm text-white opacity-90 mt-1">Year {selectedYear}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-colors backdrop-blur-sm"
            >
              <FileText size={18} />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {Object.keys(organizedData).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No tasks found for {selectedYear}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(organizedData).map(([service, engineers]) => (
                <div key={service} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Service Header */}
                  <div className="px-4 py-3 border-b border-gray-200 bg-indigo-50">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{service}</h3>
                      <span className="text-sm text-gray-500">
                        ({Object.values(engineers).reduce((sum, months) => 
                          sum + Object.values(months).reduce((s, count) => s + count, 0), 0
                        )} tasks)
                      </span>
                    </div>
                  </div>

                  {/* Engineers */}
                  <div className="divide-y divide-gray-100">
                    {Object.entries(engineers).map(([engineerName, months]) => {
                      const engineerTasks = Object.values(months).reduce((sum, count) => sum + count, 0);
                      return (
                        <div key={engineerName} className="px-4 py-3 hover:bg-gray-50">
                          {/* Engineer Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getEngineerColor(engineerName) }}
                            />
                            <span className="text-sm font-medium text-gray-700 min-w-[120px]">
                              {engineerName}:
                            </span>
                            <div className="flex-1 flex flex-wrap gap-2">
                              {allMonths.map(month => {
                                const count = months[month] || 0;
                                if (count === 0) return null;
                                return (
                                  <div
                                    key={month}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded border border-gray-200"
                                  >
                                    <span className="text-xs text-gray-700">
                                      {monthAbbreviations[month] || month.substring(0, 3)}
                                    </span>
                                    <span className="text-xs font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded">
                                      {count}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-xs text-gray-500 ml-2">
                              Total: {engineerTasks}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

