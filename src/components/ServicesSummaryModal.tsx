import { X, FileText } from 'lucide-react';
import { Task } from '../types';

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

interface ServicesSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearTasks: Task[];
  monthsInSelectedYear: string[];
  selectedYear: number;
}

export default function ServicesSummaryModal({
  isOpen,
  onClose,
  yearTasks,
  monthsInSelectedYear,
  selectedYear,
}: ServicesSummaryModalProps) {
  if (!isOpen) return null;

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const servicesData = getServicesSummaryPerService();
    
    const reportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Services Summary Report - ${selectedYear}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f9fafb; }
            h1 { color: #1f2937; margin-bottom: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .header { margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; }
            .service-card { background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border: 2px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .service-name { font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #cbd5e1; }
            .service-stats { display: flex; gap: 20px; margin-bottom: 10px; flex-wrap: wrap; }
            .stat-item { font-size: 12px; padding: 8px 12px; border-radius: 6px; border: 1px solid; }
            .stat-item.total { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-color: #0ea5e9; }
            .stat-item.pending { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-color: #f59e0b; }
            .stat-item.in-progress { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-color: #3b82f6; }
            .stat-item.completed { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-color: #10b981; }
            .stat-label { font-weight: 600; }
            .stat-item.total .stat-label { color: #0369a1; }
            .stat-item.pending .stat-label { color: #d97706; }
            .stat-item.in-progress .stat-label { color: #2563eb; }
            .stat-item.completed .stat-label { color: #059669; }
            .stat-value { font-weight: bold; font-size: 14px; }
            .stat-item.total .stat-value { color: #0c4a6e; }
            .stat-item.pending .stat-value { color: #b45309; }
            .stat-item.in-progress .stat-value { color: #1e40af; }
            .stat-item.completed .stat-value { color: #047857; }
            .months-table { width: 100%; border-collapse: collapse; margin-top: 10px; border-top: 2px solid #e5e7eb; padding-top: 10px; }
            .months-table th { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: 1px solid #1e40af; padding: 8px; font-size: 11px; font-weight: 600; text-align: center; }
            .months-table td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; font-weight: bold; text-align: center; }
            .months-table td:not(.zero) { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); color: #065f46; }
            .months-table td.zero { color: #9ca3af; background: #f9fafb; }
            @media print {
              body { padding: 10px; }
              .service-card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Services Summary Report</h1>
            <p><strong>Year:</strong> ${selectedYear}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          ${servicesData.map(({ service, total, pending, inProgress, completed, months }) => `
            <div class="service-card">
              <div class="service-name">${service}</div>
              <div class="service-stats">
                <div class="stat-item total">
                  <span class="stat-label">Total:</span>
                  <span class="stat-value">${total}</span>
                </div>
                <div class="stat-item pending">
                  <span class="stat-label">Pending:</span>
                  <span class="stat-value">${pending}</span>
                </div>
                <div class="stat-item in-progress">
                  <span class="stat-label">In Progress:</span>
                  <span class="stat-value">${inProgress}</span>
                </div>
                <div class="stat-item completed">
                  <span class="stat-label">Completed:</span>
                  <span class="stat-value">${completed}</span>
                </div>
              </div>
              ${months.length > 0 ? `
                <table class="months-table">
                  <thead>
                    <tr>
                      ${months.map(({ month }) => `
                        <th title="${month}">${monthAbbreviations[month] || month.substring(0, 3)}</th>
                      `).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      ${months.map(({ total: monthTotal }) => `
                        <td class="${monthTotal === 0 ? 'zero' : ''}">${monthTotal}</td>
                      `).join('')}
                    </tr>
                  </tbody>
                </table>
              ` : '<div style="color: #9ca3af; font-style: italic; margin-top: 10px;">No tasks found for this service</div>'}
            </div>
          `).join('')}
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

  // Calculate services summary per service (services -> months hierarchy)
  const getServicesSummaryPerService = () => {
    // Get all unique services from yearTasks
    const uniqueServices = Array.from(new Set(yearTasks.map(t => t.service)));
    
    return uniqueServices.map(service => {
      const serviceTasks = yearTasks.filter(t => t.service === service);
      
      // Calculate month breakdown for this service - include all months
      const monthCounts = monthsInSelectedYear.map(month => {
        const monthTasks = serviceTasks.filter(t => t.month === month);
        return {
          month,
          total: monthTasks.length,
        };
      }); // Show all months, even with 0 tasks

      // Calculate totals for the service
      const serviceTotal = serviceTasks.length;
      const servicePending = serviceTasks.filter(t => t.status === 'pending').length;
      const serviceInProgress = serviceTasks.filter(t => t.status === 'in-progress').length;
      const serviceCompleted = serviceTasks.filter(t => t.status === 'completed').length;

      return {
        service,
        total: serviceTotal,
        pending: servicePending,
        inProgress: serviceInProgress,
        completed: serviceCompleted,
        months: monthCounts,
      };
    }).sort((a, b) => b.total - a.total); // Sort by total tasks descending
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-main to-main-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Services Summary</h2>
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
          <div className="space-y-3">
            {getServicesSummaryPerService().map(({ service, total, pending, inProgress, completed, months }) => (
              <div key={service} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                {/* Service Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold text-gray-900 truncate" title={service}>
                        {service}
                      </div>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-gray-600">Total:</span>
                          <span className="text-sm font-bold text-gray-900">{total}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                          <span className="text-sm text-gray-600">Pending:</span>
                          <span className="text-sm font-semibold text-gray-900">{pending}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                          <span className="text-sm text-gray-600">In Progress:</span>
                          <span className="text-sm font-semibold text-gray-900">{inProgress}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-400"></span>
                          <span className="text-sm text-gray-600">Completed:</span>
                          <span className="text-sm font-semibold text-gray-900">{completed}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <div className="bg-main bg-opacity-10 rounded-lg px-4 py-2 border border-main border-opacity-20">
                        <div className="text-lg font-bold text-main">{total}</div>
                      </div>
                    </div>
                  </div>

                  {/* Months - Table Format */}
                  {months.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-full">
                          <thead>
                            <tr>
                              {months.map(({ month }) => {
                                const monthAbbr = monthAbbreviations[month] || month.substring(0, 3);
                                return (
                                  <th
                                    key={month}
                                    className="px-2 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 text-center whitespace-nowrap"
                                    title={month}
                                  >
                                    {monthAbbr}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {months.map(({ month, total: monthTotal }) => (
                                <td
                                  key={month}
                                  className={`px-2 py-2 text-sm font-bold border border-gray-300 text-center ${
                                    monthTotal > 0 
                                      ? 'text-gray-900 bg-white' 
                                      : 'text-gray-400 bg-gray-50'
                                  }`}
                                >
                                  {monthTotal}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {months.length === 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-500 text-center py-2 italic">
                        No tasks found for this service in the selected year
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {getServicesSummaryPerService().length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8 bg-white rounded-lg border border-gray-200">
                No services found for the selected year
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

