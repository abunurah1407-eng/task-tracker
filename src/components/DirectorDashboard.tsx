import { useState, useEffect } from 'react';
import { Engineer, Service, Task } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskModal from './TaskModal';
import NotificationPanel from './NotificationPanel';
import TaskItem from './TaskItem';
import GroupedTasksByEngineer from './GroupedTasksByEngineer';
import GroupedTasksByService from './GroupedTasksByService';
import GroupedTasksByStatus from './GroupedTasksByStatus';
import { Plus, Download, LogOut, Bell, Search, CheckCircle, Clock, Circle, FileText, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export default function DirectorDashboard() {
  const { user, logout } = useAuth();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [engineerFilter, setEngineerFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [weekFilter, setWeekFilter] = useState<number | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'engineer' | 'service' | 'status'>('none');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    loadData();
    if (user) {
      checkNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkNotifications();
    }
  }, [tasks, user]);

  const loadData = async () => {
    try {
      const [engineersData, servicesData, tasksData] = await Promise.all([
        api.getEngineers(),
        api.getServices(),
        api.getTasks(),
      ]);
      
      setEngineers(engineersData);
      setServices(servicesData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const checkNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getUnreadCount();
      setUnreadNotificationCount(data.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleAddTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await api.createTask(task);
      await loadData();
      setIsTaskModalOpen(false);
      setEditingTask(null);
      await checkNotifications();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      await api.updateTask(updatedTask.id.toString(), updatedTask);
      await loadData();
      setIsTaskModalOpen(false);
      setEditingTask(null);
      await checkNotifications();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm(`Are you sure you want to delete the task "${task.service}"?`)) {
      return;
    }
    
    try {
      await api.deleteTask(task.id.toString());
      await loadData();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Get current week, month, year
  const getCurrentWeek = () => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    // Calculate which week of the month (1-4)
    const week = Math.ceil(dayOfMonth / 7);
    return Math.min(week, 4); // Ensure it's between 1-4
  };

  const currentWeek = getCurrentWeek();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  // Initialize summary month/year to current month/year
  const [summaryMonth, setSummaryMonth] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long' });
  });
  const [summaryYear, setSummaryYear] = useState<number>(() => new Date().getFullYear());

  // Calculate selected month tasks (for summary)
  const selectedMonthTasks = tasks.filter(t => 
    t.month === summaryMonth && 
    t.year === summaryYear
  );

  // Get unique months and years for summary selector
  const uniqueSummaryMonths = Array.from(new Set(tasks.map(t => t.month))).sort((a, b) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months.indexOf(a) - months.indexOf(b);
  });
  const uniqueSummaryYears = Array.from(new Set(tasks.map(t => t.year))).sort((a, b) => b - a);

  const selectedMonthPending = selectedMonthTasks.filter(t => t.status === 'pending').length;
  const selectedMonthInProgress = selectedMonthTasks.filter(t => t.status === 'in-progress').length;
  const selectedMonthCompleted = selectedMonthTasks.filter(t => t.status === 'completed').length;

  // Calculate weekly breakdown for selected month
  const weeklyBreakdown = [1, 2, 3, 4].map(week => {
    const weekTasks = selectedMonthTasks.filter(t => t.week === week);
    return {
      week,
      total: weekTasks.length,
      pending: weekTasks.filter(t => t.status === 'pending').length,
      inProgress: weekTasks.filter(t => t.status === 'in-progress').length,
      completed: weekTasks.filter(t => t.status === 'completed').length,
    };
  });

  // Filter tasks
  let filteredTasks = tasks;

  if (statusFilter !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
  }

  if (engineerFilter !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.engineer === engineerFilter);
  }

  if (priorityFilter !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
  }

  if (weekFilter !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.week === weekFilter);
  }

  if (monthFilter !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.month === monthFilter);
  }

  if (yearFilter !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.year === yearFilter);
  }

  if (serviceFilter !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.service === serviceFilter);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredTasks = filteredTasks.filter(t =>
      t.service.toLowerCase().includes(query) ||
      t.engineer.toLowerCase().includes(query) ||
      (t.notes && t.notes.toLowerCase().includes(query))
    );
  }

  // Calculate statistics from filtered tasks
  const totalTasks = filteredTasks.length;
  const pendingTasks = filteredTasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress').length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={18} />;
      case 'in-progress':
        return <Clock className="text-main" size={18} />;
      default:
        return <Circle className="text-gray-400" size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = ['Service', 'Engineer', 'Week', 'Month', 'Year', 'Status', 'Priority', 'Notes'];
    const rows = filteredTasks.map(task => [
      task.service,
      task.engineer,
      task.week,
      task.month,
      task.year,
      task.status,
      task.priority,
      task.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Chart Data Preparation (using filteredTasks for charts)
  const engineerChartData = engineers.map(eng => {
    const engTasks = filteredTasks.filter(t => t.engineer === eng.name);
    return {
      name: eng.name,
      total: engTasks.length,
      pending: engTasks.filter(t => t.status === 'pending').length,
      inProgress: engTasks.filter(t => t.status === 'in-progress').length,
      completed: engTasks.filter(t => t.status === 'completed').length,
    };
  });

  const statusPieData = [
    { name: 'Pending', value: pendingTasks, color: '#9ca3af' },
    { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
    { name: 'Completed', value: completedTasks, color: '#10b981' },
  ];

  const priorityPieData = [
    { name: 'High', value: filteredTasks.filter(t => t.priority === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: filteredTasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: filteredTasks.filter(t => t.priority === 'low').length, color: '#6b7280' },
  ];

  // Service distribution
  const serviceChartData = services
    .map(service => ({
      name: service.name,
      count: filteredTasks.filter(t => t.service === service.name).length,
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 services

  // Monthly distribution (from filtered tasks for trend)
  const monthlyData = filteredTasks.reduce((acc, task) => {
    const key = `${task.month} ${task.year}`;
    if (!acc[key]) {
      acc[key] = { month: key, tasks: 0, completed: 0 };
    }
    acc[key].tasks += 1;
    if (task.status === 'completed') {
      acc[key].completed += 1;
    }
    return acc;
  }, {} as Record<string, { month: string; tasks: number; completed: number }>);

  const monthlyChartData = Object.values(monthlyData).slice(-6); // Last 6 months

  // Engineer performance (completion rate) - from filtered tasks
  const engineerPerformance = engineers.map(eng => {
    const engTasks = filteredTasks.filter(t => t.engineer === eng.name);
    const completed = engTasks.filter(t => t.status === 'completed').length;
    const completionRate = engTasks.length > 0 ? (completed / engTasks.length) * 100 : 0;
    return {
      name: eng.name,
      completionRate: Math.round(completionRate),
      total: engTasks.length,
      completed,
    };
  }).filter(item => item.total > 0);

  // Get unique months, years, and services for filters
  const uniqueMonths = Array.from(new Set(tasks.map(t => t.month))).sort();
  const uniqueYears = Array.from(new Set(tasks.map(t => t.year))).sort((a, b) => b - a);
  const uniqueServices = Array.from(new Set(tasks.map(t => t.service))).sort();

  const exportToPDF = () => {
    // Create a printable report
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Task Tracker Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1f2937; }
            .header { margin-bottom: 30px; }
            .filters { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .filters p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: #3b82f6; color: white; }
            .stats { display: flex; gap: 20px; margin-bottom: 20px; }
            .stat-box { background: #f9fafb; padding: 15px; border-radius: 8px; flex: 1; }
            .stat-label { font-size: 12px; color: #6b7280; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Task Tracker Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Director: ${user?.name}</p>
          </div>
          
          <div class="filters">
            <h3>Applied Filters:</h3>
            <p><strong>Status:</strong> ${statusFilter === 'all' ? 'All' : statusFilter}</p>
            <p><strong>Engineer:</strong> ${engineerFilter === 'all' ? 'All' : engineerFilter}</p>
            <p><strong>Priority:</strong> ${priorityFilter === 'all' ? 'All' : priorityFilter}</p>
            <p><strong>Week:</strong> ${weekFilter === 'all' ? 'All' : `Week ${weekFilter}`}</p>
            <p><strong>Month:</strong> ${monthFilter === 'all' ? 'All' : monthFilter}</p>
            <p><strong>Year:</strong> ${yearFilter === 'all' ? 'All' : yearFilter}</p>
            <p><strong>Service:</strong> ${serviceFilter === 'all' ? 'All' : serviceFilter}</p>
            ${searchQuery ? `<p><strong>Search:</strong> ${searchQuery}</p>` : ''}
          </div>

          <div class="stats">
            <div class="stat-box">
              <div class="stat-label">Total Tasks</div>
              <div class="stat-value">${totalTasks}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Pending</div>
              <div class="stat-value">${pendingTasks}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">In Progress</div>
              <div class="stat-value">${inProgressTasks}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Completed</div>
              <div class="stat-value">${completedTasks}</div>
            </div>
          </div>

          <h2>Tasks (${filteredTasks.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Engineer</th>
                <th>Week</th>
                <th>Month</th>
                <th>Year</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTasks.map(task => `
                <tr>
                  <td>${task.service}</td>
                  <td>${task.engineer}</td>
                  <td>${task.week}</td>
                  <td>${task.month}</td>
                  <td>${task.year}</td>
                  <td>${task.status}</td>
                  <td>${task.priority}</td>
                  <td>${task.notes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Director Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome, <span className="font-semibold">{user?.name}</span>
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
              >
                <FileText size={18} />
                Export PDF
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
              >
                <Download size={18} />
                Export CSV
              </button>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors shadow-md"
              >
                <Plus size={18} />
                Add Task
              </button>
              <Link
                to="/engineers-management"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
              >
                <UserPlus size={18} />
                Engineers Management
              </Link>
              <button
                onClick={() => setIsNotificationPanelOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
              >
                <Bell size={18} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>

          {/* Month Summary */}
          <div className="bg-main rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">
                    {summaryMonth === currentMonth && summaryYear === currentYear 
                      ? 'Current Month Summary' 
                      : 'Month Summary'}
                  </h2>
                  <select
                    value={summaryMonth}
                    onChange={(e) => setSummaryMonth(e.target.value)}
                    className="px-3 py-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white text-sm focus:ring-2 focus:ring-white focus:outline-none backdrop-blur-sm"
                    style={{ color: 'white' }}
                  >
                    {uniqueSummaryMonths.map(month => (
                      <option key={month} value={month} style={{ color: '#1f2937' }}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={summaryYear}
                    onChange={(e) => setSummaryYear(parseInt(e.target.value))}
                    className="px-3 py-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white text-sm focus:ring-2 focus:ring-white focus:outline-none backdrop-blur-sm"
                    style={{ color: 'white' }}
                  >
                    {uniqueSummaryYears.map(year => (
                      <option key={year} value={year} style={{ color: '#1f2937' }}>{year}</option>
                    ))}
                  </select>
                </div>
                <p className="text-main-100">{summaryMonth} {summaryYear}</p>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90 mb-1">Total Tasks This Month</div>
                <div className="text-4xl font-bold">{selectedMonthTasks.length}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm opacity-90 mb-1">Pending</div>
                <div className="text-2xl font-bold">{selectedMonthPending}</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm opacity-90 mb-1">In Progress</div>
                <div className="text-2xl font-bold">{selectedMonthInProgress}</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm opacity-90 mb-1">Completed</div>
                <div className="text-2xl font-bold">{selectedMonthCompleted}</div>
              </div>
            </div>
            
            {/* Weekly Breakdown */}
            <div className="border-t border-white border-opacity-30 pt-4">
              <h3 className="text-lg font-semibold mb-3 opacity-90">Weekly Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {weeklyBreakdown.map((weekData) => (
                  <div 
                    key={weekData.week} 
                    className={`bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm border-2 ${
                      weekData.week === currentWeek && summaryMonth === currentMonth && summaryYear === currentYear
                        ? 'border-yellow-300 border-opacity-80' 
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold opacity-90">
                        Week {weekData.week}
                        {weekData.week === currentWeek && summaryMonth === currentMonth && summaryYear === currentYear && (
                          <span className="ml-1 text-xs text-yellow-300">(Current)</span>
                        )}
                      </div>
                      <div className="text-lg font-bold">{weekData.total}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="opacity-75 mb-0.5">Pending</div>
                        <div className="font-semibold">{weekData.pending}</div>
                      </div>
                      <div>
                        <div className="opacity-75 mb-0.5">In Progress</div>
                        <div className="font-semibold">{weekData.inProgress}</div>
                      </div>
                      <div>
                        <div className="opacity-75 mb-0.5">Done</div>
                        <div className="font-semibold">{weekData.completed}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Engineer Filter */}
              <div>
                <select
                  value={engineerFilter}
                  onChange={(e) => setEngineerFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                >
                  <option value="all">All Engineers</option>
                  {engineers.map(engineer => (
                    <option key={engineer.id} value={engineer.name}>
                      {engineer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Filter */}
              <div>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                >
                  <option value="all">All Services</option>
                  {uniqueServices.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Week Filter */}
              <div>
                <select
                  value={weekFilter}
                  onChange={(e) => setWeekFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                >
                  <option value="all">All Weeks</option>
                  <option value={1}>Week 1</option>
                  <option value={2}>Week 2</option>
                  <option value={3}>Week 3</option>
                  <option value={4}>Week 4</option>
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                >
                  <option value="all">All Months</option>
                  {uniqueMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                >
                  <option value="all">All Years</option>
                  {uniqueYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Engineer Task Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Engineer Task Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engineerChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pending" stackId="a" fill="#9ca3af" />
                <Bar dataKey="inProgress" stackId="a" fill="#3b82f6" />
                <Bar dataKey="completed" stackId="a" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Task Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Priority Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Engineer Performance */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Engineer Completion Rate</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engineerPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
                <Bar dataKey="completionRate" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Task Trend */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Task Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="tasks" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="completed" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Services */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Services by Task Count</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  fontSize={11}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#ec4899" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Tasks ({filteredTasks.length})
            </h2>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Group by:</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'none' | 'engineer' | 'service' | 'status')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
              >
                <option value="none">None</option>
                <option value="engineer">Engineer</option>
                <option value="service">Service</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <Circle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-lg">No tasks found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or add a new task</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              {groupBy === 'none' ? (
                <div className="divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <TaskItem key={task.id} task={task} engineers={engineers} onEdit={handleEditTask} onDelete={handleDeleteTask} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} />
                  ))}
                </div>
              ) : groupBy === 'engineer' ? (
                <GroupedTasksByEngineer tasks={filteredTasks} engineers={engineers} onEdit={handleEditTask} onDelete={handleDeleteTask} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} />
              ) : groupBy === 'service' ? (
                <GroupedTasksByService tasks={filteredTasks} engineers={engineers} onEdit={handleEditTask} onDelete={handleDeleteTask} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} />
              ) : (
                <GroupedTasksByStatus tasks={filteredTasks} engineers={engineers} onEdit={handleEditTask} onDelete={handleDeleteTask} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          onSave={editingTask ? (task) => handleUpdateTask(task as Task) : handleAddTask}
          task={editingTask}
          engineers={engineers}
          services={services}
        />
      )}

      {/* Notification Panel */}
      {user && (
        <NotificationPanel
          userId={user.id}
          isOpen={isNotificationPanelOpen}
          onClose={() => {
            setIsNotificationPanelOpen(false);
            checkNotifications();
          }}
        />
      )}

    </div>
  );
}

