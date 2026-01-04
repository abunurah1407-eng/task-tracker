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
import AboutModal from './AboutModal';
import ReminderSettings from './ReminderSettings';
import { Plus, Download, LogOut, Bell, Search, CheckCircle, Clock, Circle, FileText, UserPlus, Upload, Layers, ChevronDown, Menu, X, User, RefreshCw, Bot, Mail, Info, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [yearFilter, setYearFilter] = useState<number | 'all'>(() => new Date().getFullYear());
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
  const [isChartSelectionModalOpen, setIsChartSelectionModalOpen] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState({
    engineerTaskDistribution: true,
    monthlyTaskTrend: true,
    statusDistribution: true,
    priorityDistribution: true,
    engineerCompletionRate: true,
    topServices: true,
  });
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isReminderSettingsOpen, setIsReminderSettingsOpen] = useState(false);

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

  // Sync yearFilter with selectedYear when selectedYear changes
  useEffect(() => {
    setYearFilter(selectedYear);
  }, [selectedYear]);

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

  // Calculate year-level statistics (with filters) - use yearFilter
  const yearTasks = tasks.filter(t => {
    if (yearFilter !== 'all' && t.year !== yearFilter) return false;
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

  // Tasks filtered by selected year for charts (independent of other filters)
  const selectedYearTasksForCharts = tasks.filter(t => t.year === selectedYear);

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

  // Chart Data Preparation - Filter by selected year for Engineer Task Distribution
  // Use full tasks list filtered by selectedYear (not filteredTasks which may have other filters)
  const engineerChartData = engineers.map(eng => {
    // Filter tasks for this engineer in the selected year only
    const engTasks = tasks.filter(t => 
      t.engineer === eng.name && t.year === selectedYear
    );
    return {
      name: eng.name,
      total: engTasks.length,
      pending: engTasks.filter(t => t.status === 'pending').length,
      inProgress: engTasks.filter(t => t.status === 'in-progress').length,
      completed: engTasks.filter(t => t.status === 'completed').length,
    };
  });

  // Calculate max value for engineer chart (sum of all statuses per engineer)
  const engineerMaxValue = Math.max(...engineerChartData.map(eng => eng.pending + eng.inProgress + eng.completed), 0);
  const engineerYAxisTicks = [];
  for (let i = 0; i <= Math.ceil(engineerMaxValue / 200) * 200; i += 200) {
    engineerYAxisTicks.push(i);
  }

  // Status Distribution Pie Chart - Filter by selected year
  const statusPieData = [
    { name: 'Pending', value: selectedYearTasksForCharts.filter(t => t.status === 'pending').length, color: '#9ca3af' },
    { name: 'In Progress', value: selectedYearTasksForCharts.filter(t => t.status === 'in-progress').length, color: '#3b82f6' },
    { name: 'Completed', value: selectedYearTasksForCharts.filter(t => t.status === 'completed').length, color: '#10b981' },
  ];

  // Priority Distribution Pie Chart - Filter by selected year
  const priorityPieData = [
    { name: 'High', value: selectedYearTasksForCharts.filter(t => t.priority === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: selectedYearTasksForCharts.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: selectedYearTasksForCharts.filter(t => t.priority === 'low').length, color: '#6b7280' },
  ];

  // Service Distribution Chart - Filter by selected year
  const serviceChartData = services
    .map(service => ({
      name: service.name,
      count: selectedYearTasksForCharts.filter(t => t.service === service.name).length,
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 services

  // Monthly distribution (from filtered tasks for trend) - Show selected year
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Filter tasks for selected year only
  const selectedYearTasks = filteredTasks.filter(t => t.year === selectedYear);
  
  // Create data for all months in selected year
  const monthlyData = selectedYearTasks.reduce((acc, task) => {
    const key = `${task.month} ${task.year}`;
    if (!acc[key]) {
      acc[key] = { month: task.month, year: task.year, monthKey: key, tasks: 0, completed: 0 };
    }
    acc[key].tasks += 1;
    if (task.status === 'completed') {
      acc[key].completed += 1;
    }
    return acc;
  }, {} as Record<string, { month: string; year: number; monthKey: string; tasks: number; completed: number }>);
  
  // Generate all 12 months for selected year, including months with 0 tasks
  const allMonthsData: { month: string; year: number; monthKey: string; tasks: number; completed: number }[] = [];
  monthNames.forEach(month => {
    const key = `${month} ${selectedYear}`;
    if (monthlyData[key]) {
      allMonthsData.push(monthlyData[key]);
    } else {
      // Include month even if no tasks
      allMonthsData.push({ month, year: selectedYear, monthKey: key, tasks: 0, completed: 0 });
    }
  });
  
  // Sort by month order
  const monthlyChartData = allMonthsData.sort((a, b) => {
    return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
  }).map(item => ({
    month: item.monthKey,
    tasks: item.tasks,
    completed: item.completed
  }));

  // Calculate max value for monthly chart (max of tasks or completed)
  const monthlyMaxValue = Math.max(
    ...monthlyChartData.map(item => Math.max(item.tasks, item.completed)),
    0
  );
  const monthlyYAxisTicks = [];
  for (let i = 0; i <= Math.ceil(monthlyMaxValue / 200) * 200; i += 200) {
    monthlyYAxisTicks.push(i);
  }

  // Engineer performance (completion rate) - Filter by selected year
  const engineerPerformance = engineers.map(eng => {
    const engTasks = selectedYearTasksForCharts.filter(t => t.engineer === eng.name);
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
    setIsSendingEmails(true);
    try {
      // First, get preview of emails to be sent
      const preview = await api.previewFollowUpEmails();
      
      if (preview.preview.length === 0) {
        alert('No engineers have pending or in-progress tasks. No emails to send.');
        setIsSendingEmails(false);
        return;
      }

      // Build summary message
      const summaryMessage = `
Email Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Engineers: ${preview.summary.totalEngineers}
Engineers with Tasks: ${preview.summary.engineersWithTasks}
Total Emails to Send: ${preview.summary.engineersWithTasks}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Tasks:
  • Pending: ${preview.summary.totalPendingTasks}
  • In Progress: ${preview.summary.totalInProgressTasks}
  • Total: ${preview.summary.totalTasks}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Engineers who will receive emails:
${preview.preview.map((p, i) => 
  `${i + 1}. ${p.engineer} (${p.email})\n   - Pending: ${p.pendingCount}, In Progress: ${p.inProgressCount}, Total: ${p.totalTasks}`
).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Do you want to send these ${preview.summary.engineersWithTasks} email(s)?`;

      // Show preview and get confirmation
      if (!confirm(summaryMessage)) {
        setIsSendingEmails(false);
        return;
      }

      // Send the emails
      const result = await api.sendFollowUpEmails();
      
      // Show results
      const successCount = result.results.filter(r => r.success).length;
      const failCount = result.results.filter(r => !r.success).length;
      
      let resultMessage = `Email sending completed!\n\n`;
      resultMessage += `Successfully sent: ${successCount}\n`;
      if (failCount > 0) {
        resultMessage += `Failed: ${failCount}\n`;
      }
      resultMessage += `\nDetails:\n${result.results.map(r => 
        `${r.success ? '✓' : '✗'} ${r.engineer} (${r.email}): ${r.pendingCount} pending, ${r.inProgressCount} in-progress`
      ).join('\n')}`;
      
      alert(resultMessage);
    } catch (error: any) {
      console.error('Error sending follow-up emails:', error);
      alert(`Failed to send follow-up emails: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSendingEmails(false);
    }
  };

  const exportServicesSummaryToPDF = () => {
    // Create a printable report with services and task counts only
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Calculate service counts from all tasks
    const serviceCounts = services.map(service => ({
      name: service.name,
      count: tasks.filter(t => t.service === service.name).length,
    })).filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);

    const reportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Services Summary Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f9fafb; }
            h1 { color: #1f2937; margin-bottom: 10px; }
            .header { margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #3b82f6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
            th { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; font-weight: bold; font-size: 14px; }
            td { font-size: 13px; background: white; }
            tr:nth-child(even) td { background: #f9fafb; }
            .total-row { font-weight: bold; background: #e0f2fe !important; }
            .total-row td { background: #e0f2fe !important; color: #0c4a6e; font-size: 14px; }
            @media print {
              body { padding: 10px; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Services Summary Report</h1>
            <p><strong>Total Tasks:</strong> ${tasks.length}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Director:</strong> ${user?.name}</p>
          </div>
          
          <h2>Services Task Count</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 80%;">Service Name</th>
                <th style="width: 20%; text-align: center;">Number of Tasks</th>
              </tr>
            </thead>
            <tbody>
              ${serviceCounts.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: center; font-weight: bold;">${item.count}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td><strong>Total</strong></td>
                <td style="text-align: center;"><strong>${tasks.length}</strong></td>
              </tr>
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
            body { font-family: Arial, sans-serif; padding: 20px; background: #f9fafb; }
            h1 { color: #1f2937; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .header { margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #3b82f6; }
            .filters { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #818cf8; }
            .filters p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; font-weight: bold; }
            .stats { display: flex; gap: 20px; margin-bottom: 20px; }
            .stat-box { padding: 15px; border-radius: 8px; flex: 1; border: 2px solid; }
            .stat-box.total { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-color: #0ea5e9; }
            .stat-box.pending { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-color: #f59e0b; }
            .stat-box.in-progress { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-color: #3b82f6; }
            .stat-box.completed { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-color: #10b981; }
            .stat-label { font-size: 12px; font-weight: 600; margin-bottom: 5px; }
            .stat-box.total .stat-label { color: #0369a1; }
            .stat-box.pending .stat-label { color: #d97706; }
            .stat-box.in-progress .stat-label { color: #2563eb; }
            .stat-box.completed .stat-label { color: #059669; }
            .stat-value { font-size: 24px; font-weight: bold; }
            .stat-box.total .stat-value { color: #0c4a6e; }
            .stat-box.pending .stat-value { color: #b45309; }
            .stat-box.in-progress .stat-value { color: #1e40af; }
            .stat-box.completed .stat-value { color: #047857; }
            .status-pending { background: #fef3c7; color: #92400e; font-weight: bold; padding: 4px 8px; border-radius: 4px; }
            .status-in-progress { background: #dbeafe; color: #1e40af; font-weight: bold; padding: 4px 8px; border-radius: 4px; }
            .status-completed { background: #d1fae5; color: #065f46; font-weight: bold; padding: 4px 8px; border-radius: 4px; }
            .priority-high { background: #fee2e2; color: #991b1b; font-weight: bold; padding: 4px 8px; border-radius: 4px; }
            .priority-medium { background: #fef3c7; color: #92400e; font-weight: bold; padding: 4px 8px; border-radius: 4px; }
            .priority-low { background: #f3f4f6; color: #374151; font-weight: bold; padding: 4px 8px; border-radius: 4px; }
            tr:nth-child(even) { background: #f9fafb; }
            tr:hover { background: #f3f4f6; }
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
            <div class="stat-box total">
              <div class="stat-label">Total Tasks</div>
              <div class="stat-value">${totalTasks}</div>
            </div>
            <div class="stat-box pending">
              <div class="stat-label">Pending</div>
              <div class="stat-value">${pendingTasks}</div>
            </div>
            <div class="stat-box in-progress">
              <div class="stat-label">In Progress</div>
              <div class="stat-value">${inProgressTasks}</div>
            </div>
            <div class="stat-box completed">
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
              ${filteredTasks.map(task => {
                const statusClass = task.status === 'pending' ? 'status-pending' : 
                                  task.status === 'in-progress' ? 'status-in-progress' : 
                                  'status-completed';
                const priorityClass = task.priority === 'high' ? 'priority-high' : 
                                     task.priority === 'medium' ? 'priority-medium' : 
                                     'priority-low';
                return `
                <tr>
                  <td>${task.service}</td>
                  <td>${task.engineer}</td>
                  <td>${task.week}</td>
                  <td>${task.month}</td>
                  <td>${task.year}</td>
                  <td><span class="${statusClass}">${task.status}</span></td>
                  <td><span class="${priorityClass}">${task.priority}</span></td>
                  <td>${task.description || ''}</td>
                </tr>
              `;
              }).join('')}
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

  const exportAllChartsToPDF = async (selectedChartIds?: string[]) => {
    // Get selected charts or use all if not specified
    const allChartIds = [
      'engineerTaskDistribution',
      'monthlyTaskTrend',
      'statusDistribution',
      'priorityDistribution',
      'engineerCompletionRate',
      'topServices'
    ];

    const chartIds = selectedChartIds || allChartIds.filter(id => selectedCharts[id as keyof typeof selectedCharts]);

    if (chartIds.length === 0) {
      alert('Please select at least one chart to export.');
      return;
    }

    const chartTitlesMap: { [key: string]: string } = {
      'engineerTaskDistribution': 'Engineer Task Distribution',
      'monthlyTaskTrend': 'Monthly Task Trend',
      'statusDistribution': 'Task Status Distribution',
      'priorityDistribution': 'Priority Distribution',
      'engineerCompletionRate': 'Engineer Completion Rate',
      'topServices': 'Top Services by Task Count'
    };

    const chartTitles = chartIds.map(id => chartTitlesMap[id] || id);

    // Show loading message with progress
    const loadingMessage = document.createElement('div');
    loadingMessage.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px 40px; border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.2); z-index: 10000; font-family: Arial, sans-serif; text-align: center; min-width: 300px;';
    loadingMessage.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #1f2937;">Generating PDF...</div>
      <div style="font-size: 14px; color: #6b7280; margin-bottom: 15px;" id="progress-text">Preparing charts...</div>
      <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
        <div id="progress-bar" style="height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); width: 0%; transition: width 0.3s;"></div>
      </div>
    `;
    document.body.appendChild(loadingMessage);

    const updateProgress = (current: number, total: number) => {
      const progressText = document.getElementById('progress-text');
      const progressBar = document.getElementById('progress-bar');
      if (progressText) {
        progressText.textContent = `Processing chart ${current} of ${total}...`;
      }
      if (progressBar) {
        progressBar.style.width = `${(current / total) * 100}%`;
      }
    };

    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);

      // Minimal yield to browser before starting
      await new Promise(resolve => requestAnimationFrame(resolve));

      for (let i = 0; i < chartIds.length; i++) {
        const chartId = chartIds[i];
        const chartTitle = chartTitles[i];
        const element = document.querySelector(`[data-chart-id="${chartId}"]`) as HTMLElement;
        
        if (!element) {
          console.warn(`Chart element not found: ${chartId}`);
          continue;
        }

        updateProgress(i + 1, chartIds.length);

        // Single yield to ensure browser stays responsive
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Ultra-optimized html2canvas options for maximum speed
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 0.75, // Further reduced for much faster rendering
          logging: false,
          useCORS: false, // Disable CORS for speed
          allowTaint: true,
          removeContainer: true,
          width: element.offsetWidth,
          height: element.offsetHeight,
          foreignObjectRendering: false,
          imageTimeout: 0,
          proxy: undefined, // No proxy
          ignoreElements: (el) => {
            // Skip non-essential elements
            return el.tagName === 'BUTTON' || el.classList.contains('hidden');
          },
          onclone: (clonedDoc) => {
            // Hide interactive elements
            const clonedElement = clonedDoc.querySelector(`[data-chart-id="${chartId}"]`);
            if (clonedElement) {
              const buttons = clonedElement.querySelectorAll('button');
              buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');
              // Hide tooltips and other interactive elements
              const tooltips = clonedElement.querySelectorAll('[class*="tooltip"], [class*="Tooltip"]');
              tooltips.forEach(tooltip => (tooltip as HTMLElement).style.display = 'none');
            }
          }
        });

        // Minimal yield after capture
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Use JPEG with lower quality for much faster processing and smaller size
        const imgData = canvas.toDataURL('image/jpeg', 0.75); // JPEG with compression - much faster
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Yield before PDF operations
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Add new page for each chart (except first)
        if (i > 0) {
          pdf.addPage();
        }

        // Add title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(chartTitle, margin, margin + 10);

        // Add chart image (JPEG format)
        pdf.addImage(imgData, 'JPEG', margin, margin + 15, imgWidth, imgHeight);

        // Clear canvas from memory immediately
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        canvas.width = 0;
        canvas.height = 0;

        // Minimal yield after each chart
        await new Promise(resolve => requestAnimationFrame(resolve));
      }

      updateProgress(chartIds.length, chartIds.length);

      // Small delay before saving
      await new Promise(resolve => setTimeout(resolve, 200));

      // Save PDF
      pdf.save(`Task_Tracker_Charts_Report.pdf`);
      
      // Update message before closing
      const progressText = document.getElementById('progress-text');
      if (progressText) {
        progressText.textContent = 'PDF generated successfully!';
      }
      
      setTimeout(() => {
        document.body.removeChild(loadingMessage);
      }, 500);
    } catch (error) {
      console.error('Error exporting charts to PDF:', error);
      const progressText = document.getElementById('progress-text');
      if (progressText) {
        progressText.textContent = 'Error generating PDF. Please try again.';
        progressText.style.color = '#ef4444';
      }
      setTimeout(() => {
        if (document.body.contains(loadingMessage)) {
          document.body.removeChild(loadingMessage);
        }
      }, 2000);
    }
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
                      <button
                        onClick={() => {
                          exportServicesSummaryToPDF();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FileText size={16} />
                        Export Services Summary (Numbers Only)
                      </button>
                      <button
                        onClick={() => {
                          setIsChartSelectionModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FileText size={16} />
                        Export Charts as PDF
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
                              setIsReminderSettingsOpen(true);
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Settings size={16} />
                            Reminder Settings
                          </button>
                          <button
                            onClick={() => {
                              setIsAboutModalOpen(true);
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Info size={16} />
                            About
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
                        <button
                          onClick={() => {
                            exportServicesSummaryToPDF();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <FileText size={18} />
                          Export Services Summary (Numbers Only)
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
                          <button
                            onClick={() => {
                              setIsReminderSettingsOpen(true);
                              setIsMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Settings size={18} />
                            Reminder Settings
                          </button>
                          <button
                            onClick={() => {
                              setIsAboutModalOpen(true);
                              setIsMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Info size={18} />
                            About
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
                <div className="text-sm opacity-90 mb-1 flex items-center justify-end gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/60 animate-pulse"></div>
                  Total Tasks This Year
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">{yearTotal}</div>
                </div>
                </div>
            
            {/* Year Stats - Color Coded */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-orange-500/30 to-orange-600/20 border-2 border-orange-400/50 rounded-lg p-4 backdrop-blur-sm shadow-lg">
                <div className="text-sm opacity-90 mb-1 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                  Pending
                </div>
                <div className="text-2xl font-bold text-orange-100">{yearPending}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-2 border-blue-400/50 rounded-lg p-4 backdrop-blur-sm shadow-lg">
                <div className="text-sm opacity-90 mb-1 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  In Progress
                </div>
                <div className="text-2xl font-bold text-blue-100">{yearInProgress}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/30 to-green-600/20 border-2 border-green-400/50 rounded-lg p-4 backdrop-blur-sm shadow-lg">
                <div className="text-sm opacity-90 mb-1 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  Completed
                </div>
                <div className="text-2xl font-bold text-green-100">{yearCompleted}</div>
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
                      className={`bg-gradient-to-r from-white/25 to-white/15 rounded-lg p-4 backdrop-blur-sm border-2 shadow-lg ${
                        isCurrentMonth 
                          ? 'border-yellow-300 border-opacity-80 shadow-yellow-500/20' 
                          : 'border-white/30'
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
                          <div className="text-xs opacity-75 flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-white/60"></span>
                              Total: <span className="font-semibold">{monthStat.total}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                              Pending: <span className="font-semibold text-orange-200">{monthStat.pending}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                              In Progress: <span className="font-semibold text-blue-200">{monthStat.inProgress}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-400"></span>
                              Completed: <span className="font-semibold text-green-200">{monthStat.completed}</span>
                            </span>
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
                                className={`bg-gradient-to-br from-white/15 to-white/5 rounded-lg p-3 backdrop-blur-sm border shadow-md ${
                                  weekData.week === currentWeek && isCurrentMonth
                                    ? 'border-yellow-300 border-opacity-60 shadow-yellow-500/20' 
                                    : 'border-white/20'
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
                      <div className="bg-orange-500/20 rounded p-2 border border-orange-400/30">
                        <div className="opacity-90 mb-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                          Pending
                        </div>
                        <div className="font-bold text-orange-200">{weekData.pending}</div>
                      </div>
                      <div className="bg-blue-500/20 rounded p-2 border border-blue-400/30">
                        <div className="opacity-90 mb-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          In Progress
                        </div>
                        <div className="font-bold text-blue-200">{weekData.inProgress}</div>
                      </div>
                      <div className="bg-green-500/20 rounded p-2 border border-green-400/30">
                        <div className="opacity-90 mb-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          Done
                        </div>
                        <div className="font-bold text-green-200">{weekData.completed}</div>
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
        <div className="space-y-6 mb-6">
          {/* Engineer Task Distribution - Full Width */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200" data-chart-id="engineerTaskDistribution">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Engineer Task Distribution ({selectedYear})</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={engineerChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis 
                  domain={[0, engineerMaxValue > 0 ? Math.ceil(engineerMaxValue / 200) * 200 : 200]}
                  ticks={engineerYAxisTicks}
                  tickFormatter={(value) => value.toString()}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="pending" stackId="a" fill="url(#pendingGradient)" />
                <Bar dataKey="inProgress" stackId="a" fill="url(#inProgressGradient)" />
                <Bar dataKey="completed" stackId="a" fill="url(#completedGradient)" />
                <defs>
                  <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="inProgressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Task Trend - Full Width */}
          <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-lg shadow-lg p-6 border-2 border-cyan-200/50" data-chart-id="monthlyTaskTrend">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded"></div>
              Monthly Task Trend ({selectedYear})
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis 
                  domain={[0, monthlyMaxValue > 0 ? Math.ceil(monthlyMaxValue / 200) * 200 : 200]}
                  ticks={monthlyYAxisTicks}
                  tickFormatter={(value) => value.toString()}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    return [`${value} tasks`, name];
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="tasks" stackId="1" stroke="#3b82f6" fill="url(#tasksAreaGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="completed" stackId="2" stroke="#10b981" fill="url(#completedAreaGradient)" strokeWidth={2} />
                <defs>
                  <linearGradient id="tasksAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="completedAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Rest of Charts - 2 columns (6 cols each) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution Pie Chart */}
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-lg shadow-lg p-6 border-2 border-purple-200/50" data-chart-id="statusDistribution">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded"></div>
                Task Status Distribution ({selectedYear})
              </h2>
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
            <div className="bg-gradient-to-br from-white to-red-50/30 rounded-lg shadow-lg p-6 border-2 border-red-200/50" data-chart-id="priorityDistribution">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded"></div>
                Priority Distribution ({selectedYear})
              </h2>
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
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-lg shadow-lg p-6 border-2 border-purple-200/50" data-chart-id="engineerCompletionRate">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-indigo-600 rounded"></div>
                Engineer Completion Rate ({selectedYear})
              </h2>
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
                  <Bar dataKey="completionRate" fill="url(#completionGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                      <stop offset="50%" stopColor="#7c3aed" stopOpacity={1} />
                      <stop offset="100%" stopColor="#6d28d9" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Services */}
            <div className="bg-gradient-to-br from-white to-pink-50/30 rounded-lg shadow-lg p-6 border-2 border-pink-200/50" data-chart-id="topServices">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-rose-600 rounded"></div>
                Top Services by Task Count ({selectedYear})
              </h2>
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
                  <Bar dataKey="count" fill="url(#serviceGradient)" radius={[0, 8, 8, 0]} />
                  <defs>
                    <linearGradient id="serviceGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
                      <stop offset="50%" stopColor="#f472b6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#f9a8d4" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
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
                  All Tasks
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
                  Pending Follow-up ({tasks.filter(t => t.status === 'pending' && (yearFilter === 'all' || t.year === yearFilter)).length})
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
                  In Progress Follow-up ({tasks.filter(t => t.status === 'in-progress' && (yearFilter === 'all' || t.year === yearFilter)).length})
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
                {activeTab === 'all' && `All Tasks`}
                {activeTab === 'pending' && `Pending Tasks Follow-up`}
                {activeTab === 'in-progress' && `In Progress Tasks Follow-up`}
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

      {/* Chart Selection Modal for PDF Export */}
      {isChartSelectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Select Charts to Export</h2>
              <button
                onClick={() => setIsChartSelectionModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCharts.engineerTaskDistribution}
                  onChange={(e) => setSelectedCharts({ ...selectedCharts, engineerTaskDistribution: e.target.checked })}
                  className="w-5 h-5 text-main focus:ring-main rounded"
                />
                <span className="text-gray-700 font-medium">Engineer Task Distribution</span>
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCharts.monthlyTaskTrend}
                  onChange={(e) => setSelectedCharts({ ...selectedCharts, monthlyTaskTrend: e.target.checked })}
                  className="w-5 h-5 text-main focus:ring-main rounded"
                />
                <span className="text-gray-700 font-medium">Monthly Task Trend</span>
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCharts.statusDistribution}
                  onChange={(e) => setSelectedCharts({ ...selectedCharts, statusDistribution: e.target.checked })}
                  className="w-5 h-5 text-main focus:ring-main rounded"
                />
                <span className="text-gray-700 font-medium">Task Status Distribution</span>
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCharts.priorityDistribution}
                  onChange={(e) => setSelectedCharts({ ...selectedCharts, priorityDistribution: e.target.checked })}
                  className="w-5 h-5 text-main focus:ring-main rounded"
                />
                <span className="text-gray-700 font-medium">Priority Distribution</span>
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCharts.engineerCompletionRate}
                  onChange={(e) => setSelectedCharts({ ...selectedCharts, engineerCompletionRate: e.target.checked })}
                  className="w-5 h-5 text-main focus:ring-main rounded"
                />
                <span className="text-gray-700 font-medium">Engineer Completion Rate</span>
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCharts.topServices}
                  onChange={(e) => setSelectedCharts({ ...selectedCharts, topServices: e.target.checked })}
                  className="w-5 h-5 text-main focus:ring-main rounded"
                />
                <span className="text-gray-700 font-medium">Top Services by Task Count</span>
              </label>
            </div>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => {
                  setSelectedCharts({
                    engineerTaskDistribution: true,
                    monthlyTaskTrend: true,
                    statusDistribution: true,
                    priorityDistribution: true,
                    engineerCompletionRate: true,
                    topServices: true,
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => {
                  setSelectedCharts({
                    engineerTaskDistribution: false,
                    monthlyTaskTrend: false,
                    statusDistribution: false,
                    priorityDistribution: false,
                    engineerCompletionRate: false,
                    topServices: false,
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Deselect All
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsChartSelectionModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const selectedIds = Object.entries(selectedCharts)
                    .filter(([_, selected]) => selected)
                    .map(([chartId]) => chartId);
                  
                  if (selectedIds.length === 0) {
                    alert('Please select at least one chart to export.');
                    return;
                  }
                  
                  setIsChartSelectionModalOpen(false);
                  exportAllChartsToPDF(selectedIds);
                }}
                className="flex-1 px-4 py-2 bg-main text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Export Selected ({Object.values(selectedCharts).filter(Boolean).length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Settings Modal */}
      {isReminderSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Reminder Settings</h2>
              <button
                onClick={() => setIsReminderSettingsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <ReminderSettings />
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

    </div>
  );
}

