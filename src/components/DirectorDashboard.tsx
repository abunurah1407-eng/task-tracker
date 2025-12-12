import { useState, useEffect } from 'react';
import { Engineer, Service, Task } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskModal from './TaskModal';
import NotificationPanel from './NotificationPanel';
import TaskItem from './TaskItem';
import ImportModal from './ImportModal';
import ServicesSummaryModal from './ServicesSummaryModal';
import EngineerSummaryModal from './EngineerSummaryModal';
import EngineerServicesViewModal from './EngineerServicesViewModal';
import ServiceEngineersViewModal from './ServiceEngineersViewModal';
import Chatbot from './Chatbot';
import GroupedTasksByEngineer from './GroupedTasksByEngineer';
import GroupedTasksByService from './GroupedTasksByService';
import GroupedTasksByStatus from './GroupedTasksByStatus';
import { Plus, Download, LogOut, Bell, Search, CheckCircle, Clock, Circle, FileText, UserPlus, Upload, Layers, ChevronDown, Menu, X, User, RefreshCw, Bot, Mail } from 'lucide-react';
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
  // Summary filters (separate from main filters)
  const [summaryServiceFilter, setSummaryServiceFilter] = useState<string>('all');
  const [summaryEngineerFilter, setSummaryEngineerFilter] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [isServicesSummaryModalOpen, setIsServicesSummaryModalOpen] = useState(false);
  const [isEngineerSummaryModalOpen, setIsEngineerSummaryModalOpen] = useState(false);
  const [isEngineerServicesViewModalOpen, setIsEngineerServicesViewModalOpen] = useState(false);
  const [isServiceEngineersViewModalOpen, setIsServiceEngineersViewModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in-progress'>('all');
  const [isSendingEmails, setIsSendingEmails] = useState(false);

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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-container')) {
        setIsUserMenuOpen(false);
        setIsMenuOpen(false);
      }
    };

    if (isUserMenuOpen || isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen, isMenuOpen]);

  // Cache key for storing data
  const CACHE_KEY = 'director_dashboard_data';
  const CACHE_DURATION = 1 * 60 * 1000; // 1 minute (reduced from 5 minutes for better updates)

  const loadData = async (forceReload: boolean = false) => {
    // Check cache first
    if (!forceReload) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const now = Date.now();
          if (now - timestamp < CACHE_DURATION) {
            setEngineers(data.engineers);
            setServices(data.services);
            setTasks(data.tasks);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error reading cache:', error);
        }
      }
    }

    setIsLoading(true);
    try {
      const [engineersData, servicesData, tasksData] = await Promise.all([
        api.getEngineers(),
        api.getServices(),
        api.getTasks(),
      ]);
      
      setEngineers(engineersData);
      setServices(servicesData);
      setTasks(tasksData);

      // Cache the data
      const cacheData = {
        engineers: engineersData,
        services: servicesData,
        tasks: tasksData,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: cacheData,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHardReload = () => {
    localStorage.removeItem(CACHE_KEY);
    loadData(true);
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
      await loadData(true); // Force reload after creating task
      setIsTaskModalOpen(false);
      setEditingTask(null);
      await checkNotifications();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const handleAddMultipleTasks = async (tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      await api.createTasksBulk(tasks);
      await loadData(true); // Force reload after creating tasks
      setIsTaskModalOpen(false);
      setEditingTask(null);
      await checkNotifications();
      alert(`Successfully created ${tasks.length} tasks!`);
    } catch (error) {
      console.error('Error creating tasks:', error);
      alert('Failed to create tasks. Please try again.');
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      await api.updateTask(updatedTask.id.toString(), updatedTask);
      await loadData(true); // Force reload after updating task
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
      await loadData(true); // Force reload after deleting task
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

  // Get unique years for summary
  const uniqueSummaryYears = Array.from(new Set(tasks.map(t => t.year))).sort((a, b) => b - a);
  
  // Get months for selected year
  const monthsInSelectedYear = Array.from(new Set(
    tasks.filter(t => t.year === selectedYear).map(t => t.month)
  )).sort((a, b) => {
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthOrder.indexOf(a) - monthOrder.indexOf(b);
  });

  // Calculate year-level statistics (with filters)
  const yearTasks = tasks.filter(t => {
    if (t.year !== selectedYear) return false;
    if (summaryServiceFilter !== 'all' && t.service !== summaryServiceFilter) return false;
    if (summaryEngineerFilter !== 'all' && t.engineer !== summaryEngineerFilter) return false;
    return true;
  });

  const yearTotal = yearTasks.length;
  const yearPending = yearTasks.filter(t => t.status === 'pending').length;
  const yearInProgress = yearTasks.filter(t => t.status === 'in-progress').length;
  const yearCompleted = yearTasks.filter(t => t.status === 'completed').length;

  // Calculate month-level statistics
  const monthStats = monthsInSelectedYear.map(month => {
    const monthTasks = yearTasks.filter(t => t.month === month);
    return {
      month,
      total: monthTasks.length,
      pending: monthTasks.filter(t => t.status === 'pending').length,
      inProgress: monthTasks.filter(t => t.status === 'in-progress').length,
      completed: monthTasks.filter(t => t.status === 'completed').length,
    };
  });

  // Calculate weekly breakdown for a specific month
  const getWeeklyBreakdown = (month: string) => {
    const monthTasks = yearTasks.filter(t => t.month === month);
    return [1, 2, 3, 4].map(week => {
      const weekTasks = monthTasks.filter(t => t.week === week);
    return {
      week,
      total: weekTasks.length,
      pending: weekTasks.filter(t => t.status === 'pending').length,
      inProgress: weekTasks.filter(t => t.status === 'in-progress').length,
      completed: weekTasks.filter(t => t.status === 'completed').length,
    };
  });
  };


  const toggleMonthExpansion = (month: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
  };

  // Filter tasks based on active tab
  let filteredTasks = tasks;

  // Apply tab filter first
  if (activeTab === 'pending') {
    filteredTasks = filteredTasks.filter(t => t.status === 'pending');
  } else if (activeTab === 'in-progress') {
    filteredTasks = filteredTasks.filter(t => t.status === 'in-progress');
  }

  // Then apply other filters
  if (statusFilter !== 'all' && activeTab === 'all') {
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
      (t.description && t.description.toLowerCase().includes(query))
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
    const headers = ['Service', 'Engineer', 'Week', 'Month', 'Year', 'Status', 'Priority', 'Description'];
    const rows = filteredTasks.map(task => [
      task.service,
      task.engineer,
      task.week,
      task.month,
      task.year,
      task.status,
      task.priority,
      task.description || '',
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

  const handleSendFollowUpEmails = async () => {
    if (!confirm('Are you sure you want to send follow-up emails to all engineers with pending or in-progress tasks?')) {
      return;
    }

    setIsSendingEmails(true);
    try {
      const result = await api.sendFollowUpEmails();
      alert(`Success! ${result.message}\n\nSent to ${result.results.length} engineer(s):\n${result.results.map(r => `- ${r.engineer} (${r.email}): ${r.pendingCount} pending, ${r.inProgressCount} in-progress`).join('\n')}`);
    } catch (error: any) {
      console.error('Error sending follow-up emails:', error);
      alert(`Failed to send follow-up emails: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSendingEmails(false);
    }
  };

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
                  <td>${task.description || ''}</td>
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

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Card Skeleton */}
        <div className="bg-main rounded-lg shadow-lg p-6 mb-6">
          <div className="h-8 w-48 bg-white bg-opacity-20 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="h-4 w-20 bg-white bg-opacity-30 rounded animate-pulse mb-2"></div>
                <div className="h-8 w-16 bg-white bg-opacity-30 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="h-4 w-32 bg-white bg-opacity-30 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-lg p-6">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Tasks List Skeleton */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Header with Menu */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                Director Dashboard
              </h1>
                  <p className="text-sm text-gray-600 mt-1">
                Welcome, <span className="font-semibold">{user?.name}</span>
              </p>
            </div>
              </div>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-2">
                {/* Actions Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors shadow-md">
                    <Plus size={18} />
                    Actions
                    <ChevronDown size={16} />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
              <button
                        onClick={() => {
                          setEditingTask(null);
                          setIsTaskModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Add Task
              </button>
              <button
                        onClick={() => {
                          setIsImportModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Upload size={16} />
                        Import Excel
                      </button>
                    </div>
                  </div>
                </div>

                {/* Export Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md">
                <Download size={18} />
                    Export
                    <ChevronDown size={16} />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          exportToPDF();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FileText size={16} />
                        Export PDF
                      </button>
                      <button
                        onClick={() => {
                          exportToCSV();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Download size={16} />
                Export CSV
              </button>
                    </div>
                  </div>
                </div>

                {/* Management Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md">
                    <Layers size={18} />
                    Management
                    <ChevronDown size={16} />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link
                        to="/engineers-management"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <UserPlus size={16} />
                        Engineers Management
                      </Link>
                      <Link
                        to="/services-management"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Layers size={16} />
                        Services Management
                      </Link>
                    </div>
                  </div>
                </div>

                {/* User Menu */}
                <div className="relative menu-container">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors shadow-md"
                  >
                    <User size={18} />
                    <span className="hidden lg:inline">{user?.name}</span>
                    <ChevronDown size={16} className={isUserMenuOpen ? 'rotate-180' : ''} />
                  </button>
                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                        <div className="py-1">
                          <div className="px-4 py-2 border-b border-gray-200">
                            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                          </div>
                          <button
                            onClick={() => {
                              setIsNotificationPanelOpen(true);
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Bell size={16} />
                            Notifications
                            {unreadNotificationCount > 0 && (
                              <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {unreadNotificationCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              logout();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <LogOut size={16} />
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 bg-black bg-opacity-50 z-40"
                      onClick={() => setIsMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                      <div className="py-2">
                        <button
                          onClick={() => {
                            handleHardReload();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <RefreshCw size={18} />
                          Hard Reload
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={() => {
                            setEditingTask(null);
                            setIsTaskModalOpen(true);
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Plus size={18} />
                          Add Task
                        </button>
                        <button
                          onClick={() => {
                            setIsImportModalOpen(true);
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Upload size={18} />
                          Import Excel
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={() => {
                            exportToPDF();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <FileText size={18} />
                          Export PDF
                        </button>
                        <button
                          onClick={() => {
                            exportToCSV();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Download size={18} />
                          Export CSV
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Management</div>
              <Link
                to="/engineers-management"
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <UserPlus size={18} />
                Engineers Management
              </Link>
              <Link
                to="/services-management"
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Layers size={18} />
                Services Management
              </Link>
              <button
                          onClick={() => {
                            setIsNotificationPanelOpen(true);
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 relative"
              >
                <Bell size={18} />
                          Notifications
                {unreadNotificationCount > 0 && (
                            <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
                        <div className="border-t border-gray-200 my-1"></div>
              <button
                          onClick={() => {
                            logout();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Year Summary */}
          <div className="bg-main rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold">
                    {selectedYear === currentYear ? 'Current Year Summary' : 'Year Summary'}
                  </h2>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white text-sm focus:ring-2 focus:ring-white focus:outline-none backdrop-blur-sm"
                    style={{ color: 'white' }}
                  >
                    {uniqueSummaryYears.map(year => (
                      <option key={year} value={year} style={{ color: '#1f2937' }}>{year}</option>
                    ))}
                  </select>
                </div>
                
                {/* Summary Filters */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <select
                    value={summaryServiceFilter}
                    onChange={(e) => setSummaryServiceFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white text-sm focus:ring-2 focus:ring-white focus:outline-none backdrop-blur-sm"
                    style={{ color: 'white' }}
                  >
                    <option value="all" style={{ color: '#1f2937' }}>All Services</option>
                    {uniqueServices.map(service => (
                      <option key={service} value={service} style={{ color: '#1f2937' }}>{service}</option>
                    ))}
                  </select>
                  <select
                    value={summaryEngineerFilter}
                    onChange={(e) => setSummaryEngineerFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white text-sm focus:ring-2 focus:ring-white focus:outline-none backdrop-blur-sm"
                    style={{ color: 'white' }}
                  >
                    <option value="all" style={{ color: '#1f2937' }}>All Engineers</option>
                    {engineers.map(engineer => (
                      <option key={engineer.id} value={engineer.name} style={{ color: '#1f2937' }}>{engineer.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIsServicesSummaryModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white text-sm hover:bg-opacity-30 transition-colors backdrop-blur-sm"
                  >
                    <Layers size={16} />
                    View Services Summary
                  </button>
                  <button
                    onClick={() => setIsEngineerSummaryModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white text-sm hover:bg-opacity-30 transition-colors backdrop-blur-sm"
                  >
                    <User size={16} />
                    View Engineers Summary
                  </button>
                  <button
                    onClick={() => setIsEngineerServicesViewModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white text-sm hover:bg-opacity-30 transition-colors backdrop-blur-sm"
                  >
                    <Layers size={16} />
                    Engineer Tasks by Service
                  </button>
                  <button
                    onClick={() => setIsServiceEngineersViewModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white text-sm hover:bg-opacity-30 transition-colors backdrop-blur-sm"
                  >
                    <Layers size={16} />
                    Services by Engineers
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90 mb-1">Total Tasks This Year</div>
                <div className="text-4xl font-bold">{yearTotal}</div>
                </div>
                </div>
            
            {/* Year Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm opacity-90 mb-1">Pending</div>
                <div className="text-2xl font-bold">{yearPending}</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm opacity-90 mb-1">In Progress</div>
                <div className="text-2xl font-bold">{yearInProgress}</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm opacity-90 mb-1">Completed</div>
                <div className="text-2xl font-bold">{yearCompleted}</div>
              </div>
            </div>
            

            {/* Months Breakdown */}
            <div className="border-t border-white border-opacity-30 pt-4">
              <h3 className="text-lg font-semibold mb-3 opacity-90">Months Breakdown</h3>
              <div className="space-y-3">
                {monthStats.map((monthStat) => {
                  const isExpanded = expandedMonths.has(monthStat.month);
                  const weeklyBreakdown = getWeeklyBreakdown(monthStat.month);
                  const isCurrentMonth = monthStat.month === currentMonth && selectedYear === currentYear;
                  
                  return (
                    <div 
                      key={monthStat.month}
                      className={`bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm border-2 ${
                        isCurrentMonth ? 'border-yellow-300 border-opacity-80' : 'border-transparent'
                      }`}
                    >
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleMonthExpansion(monthStat.month)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold opacity-90">
                            {monthStat.month}
                            {isCurrentMonth && (
                              <span className="ml-2 text-xs text-yellow-300">(Current)</span>
                            )}
                          </div>
                          <div className="text-xs opacity-75">
                            Total: {monthStat.total} | 
                            Pending: {monthStat.pending} | 
                            In Progress: {monthStat.inProgress} | 
                            Completed: {monthStat.completed}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-bold">{monthStat.total}</div>
                          <span className="text-xs opacity-75">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Weekly Breakdown (expandable) */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                          <h4 className="text-sm font-semibold mb-3 opacity-90">Weekly Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {weeklyBreakdown.map((weekData) => (
                  <div 
                    key={weekData.week} 
                                className={`bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm border ${
                                  weekData.week === currentWeek && isCurrentMonth
                                    ? 'border-yellow-300 border-opacity-60' 
                                    : 'border-white border-opacity-10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                                  <div className="text-xs font-semibold opacity-90">
                        Week {weekData.week}
                                    {weekData.week === currentWeek && isCurrentMonth && (
                          <span className="ml-1 text-xs text-yellow-300">(Current)</span>
                        )}
                      </div>
                                  <div className="text-sm font-bold">{weekData.total}</div>
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
                      )}
                    </div>
                  );
                })}
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
                  data={statusPieData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => {
                    // Only show label if value > 0 and percent is significant (> 5%)
                    if (value === 0 || percent < 0.05) return '';
                    return `${name}: ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (value === 0) return null;
                    return [`${value} (${((value / statusPieData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%)`, name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value: string) => {
                    const dataEntry = statusPieData.find(d => d.name === value);
                    if (!dataEntry || dataEntry.value === 0) return null;
                    const total = statusPieData.reduce((sum, d) => sum + d.value, 0);
                    const percent = total > 0 ? ((dataEntry.value / total) * 100).toFixed(0) : '0';
                    return `${value}: ${percent}%`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Priority Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityPieData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => {
                    // Only show label if value > 0 and percent is significant (> 5%)
                    if (value === 0 || percent < 0.05) return '';
                    return `${name}: ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (value === 0) return null;
                    return [`${value} (${((value / priorityPieData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%)`, name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value: string) => {
                    const dataEntry = priorityPieData.find(d => d.name === value);
                    if (!dataEntry || dataEntry.value === 0) return null;
                    const total = priorityPieData.reduce((sum, d) => sum + d.value, 0);
                    const percent = total > 0 ? ((dataEntry.value / total) * 100).toFixed(0) : '0';
                    return `${value}: ${percent}%`;
                  }}
                />
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

        {/* Tasks List with Tabs */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between px-4 pt-4">
              <div className="flex space-x-1" role="tablist">
                <button
                  onClick={() => {
                    setActiveTab('all');
                    setStatusFilter('all');
                  }}
                  className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === 'all'
                      ? 'bg-white text-main border-b-2 border-main'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  role="tab"
                  aria-selected={activeTab === 'all'}
                >
                  All Tasks ({tasks.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('pending');
                    setStatusFilter('all');
                  }}
                  className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
                    activeTab === 'pending'
                      ? 'bg-white text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  role="tab"
                  aria-selected={activeTab === 'pending'}
                >
                  <Circle className="text-orange-600" size={16} />
                  Pending Follow-up ({tasks.filter(t => t.status === 'pending').length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('in-progress');
                    setStatusFilter('all');
                  }}
                  className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
                    activeTab === 'in-progress'
                      ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  role="tab"
                  aria-selected={activeTab === 'in-progress'}
                >
                  <Clock className="text-blue-600" size={16} />
                  In Progress Follow-up ({tasks.filter(t => t.status === 'in-progress').length})
                </button>
              </div>
              <div className="flex items-center gap-3">
                {activeTab === 'all' && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeTab === 'all' && `All Tasks (${filteredTasks.length})`}
                {activeTab === 'pending' && `Pending Tasks Follow-up (${filteredTasks.length})`}
                {activeTab === 'in-progress' && `In Progress Tasks Follow-up (${filteredTasks.length})`}
              </h2>
              {(activeTab === 'pending' || activeTab === 'in-progress') && (
                <button
                  onClick={handleSendFollowUpEmails}
                  disabled={isSendingEmails || filteredTasks.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-md"
                >
                  <Mail size={18} />
                  {isSendingEmails ? 'Sending...' : 'Send Follow-up Emails'}
                </button>
              )}
            </div>
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center">
                <Circle className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 text-lg">No tasks found</p>
                <p className="text-gray-500 text-sm mt-2">
                  {activeTab === 'pending' && 'No pending tasks to follow up'}
                  {activeTab === 'in-progress' && 'No in-progress tasks to follow up'}
                  {activeTab === 'all' && 'Try adjusting your filters or add a new task'}
                </p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {activeTab === 'all' ? (
                  // All tasks tab - use existing grouping logic
                  groupBy === 'none' ? (
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
                  )
                ) : (
                  // Pending and In-Progress tabs - always grouped by engineer
                  <GroupedTasksByEngineer tasks={filteredTasks} engineers={engineers} onEdit={handleEditTask} onDelete={handleDeleteTask} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} />
                )}
              </div>
            )}
          </div>
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
          onSaveMultiple={!editingTask ? handleAddMultipleTasks : undefined}
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

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          loadData(true); // Force reload after import
          checkNotifications();
        }}
      />

      {/* Services Summary Modal */}
      <ServicesSummaryModal
        isOpen={isServicesSummaryModalOpen}
        onClose={() => setIsServicesSummaryModalOpen(false)}
        yearTasks={yearTasks}
        monthsInSelectedYear={monthsInSelectedYear}
        selectedYear={selectedYear}
      />

      {/* Engineers Summary Modal */}
      <EngineerSummaryModal
        isOpen={isEngineerSummaryModalOpen}
        onClose={() => setIsEngineerSummaryModalOpen(false)}
        yearTasks={yearTasks}
        monthsInSelectedYear={monthsInSelectedYear}
        selectedYear={selectedYear}
      />

      {/* Engineer Services View Modal */}
      <EngineerServicesViewModal
        isOpen={isEngineerServicesViewModalOpen}
        onClose={() => setIsEngineerServicesViewModalOpen(false)}
        yearTasks={yearTasks}
        engineers={engineers}
        selectedYear={selectedYear}
      />

      {/* Service Engineers View Modal */}
      <ServiceEngineersViewModal
        isOpen={isServiceEngineersViewModalOpen}
        onClose={() => setIsServiceEngineersViewModalOpen(false)}
        yearTasks={yearTasks}
        engineers={engineers}
        selectedYear={selectedYear}
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 z-40">
        {/* Floating Reload Button */}
        <button
          onClick={handleHardReload}
          className="w-14 h-14 bg-gray-700 hover:bg-gray-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          title="Hard Reload (Clear Cache & Refresh)"
        >
          <RefreshCw size={24} />
        </button>

        {/* Floating Chatbot Button */}
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group relative"
          title="Ask Assistant"
        >
          <Bot size={24} />
          {isChatbotOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>
      </div>

      {/* Chatbot */}
      <Chatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />

    </div>
  );
}

