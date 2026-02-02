import { useState, useEffect, useMemo } from 'react';
import { Task, Service } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskModal from './TaskModal';
import AboutModal from './AboutModal';
import ImportModal from './ImportModal';
import UndoImport from './UndoImport';
import { Plus, LogOut, Users, CheckCircle, Clock, Circle, Trash2, ChevronDown, ChevronRight, Menu, X, User, Info, Upload, FileSpreadsheet, Download } from 'lucide-react';

export default function EngineerDashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [exportMonth, setExportMonth] = useState<string>('all');
  const [exportYear, setExportYear] = useState<number>(() => new Date().getFullYear());
  const [exportService, setExportService] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    
    const loadDataAsync = async () => {
      if (!user?.engineerName) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        // Use Promise.all to fetch both in parallel
        const [tasksData, servicesData] = await Promise.all([
          api.getTasks(),
          api.getServices(),
        ]);
        
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        // Backend already filters tasks for engineers, so use data directly
        // No need for additional frontend filtering
        setTasks(tasksData);
        setServices(servicesData);
        setIsInitialLoad(false);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (user?.engineerName) {
      loadDataAsync();
    }

    return () => {
      isMounted = false;
    };
  }, [user?.engineerName]); // Only reload when engineerName changes

  const loadTasks = async () => {
    if (!user?.engineerName) return;
    
    try {
      const [tasksData, servicesData] = await Promise.all([
        api.getTasks(),
        api.getServices(),
      ]);
      setTasks(tasksData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-container')) {
        setIsUserMenuOpen(false);
        setIsMenuOpen(false);
        setIsActionMenuOpen(false);
      }
    };

    if (isUserMenuOpen || isMenuOpen || isActionMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen, isMenuOpen, isActionMenuOpen]);

  const loadData = async () => {
    if (!user?.engineerName) {
      setIsLoading(false);
      return;
    }

    // Don't show loading spinner on refresh, only on initial load
    if (isInitialLoad) {
      setIsLoading(true);
    }
    
    try {
      // Use Promise.all to fetch both in parallel
      const [tasksData, servicesData] = await Promise.all([
        api.getTasks(),
        api.getServices(),
      ]);
      
      // Backend already filters tasks for engineers, so use data directly
      setTasks(tasksData);
      setServices(servicesData);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Auto-assign to current engineer
      const taskToCreate = {
        ...task,
        engineer: user?.engineerName || '',
      };
      
      await api.createTask(taskToCreate);
      await loadData();
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const handleAddMultipleTasks = async (tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      // Auto-assign to current engineer
      const tasksToCreate = tasks.map(task => ({
        ...task,
        engineer: user?.engineerName || '',
      }));
      
      await api.createTasksBulk(tasksToCreate);
      await loadData();
      setIsTaskModalOpen(false);
      setEditingTask(null);
      alert(`Successfully created ${tasks.length} tasks!`);
    } catch (error) {
      console.error('Error creating tasks:', error);
      alert('Failed to create tasks. Please try again.');
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      await api.updateTask(updatedTask.id.toString(), updatedTask);
      await loadData();
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleUpdateStatus = async (task: Task, newStatus: 'pending' | 'in-progress' | 'completed') => {
    try {
      const updatedTask = { ...task, status: newStatus };
      await api.updateTask(task.id.toString(), updatedTask);
      await loadData();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task status. Please try again.');
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

  const exportToCSV = (startDate?: string, endDate?: string, month?: string, year?: number, service?: string) => {
    // Filter tasks by various criteria
    let filteredTasks = tasks;
    
    console.log('📤 Export filters:', { startDate, endDate, month, year, service, totalTasks: tasks.length });
    
    // Determine which filtering method to use: month/year OR date range (not both)
    // Priority: month/year > year only > date range
    const useMonthYearFilter = month && month !== 'all' && year;
    const useYearOnlyFilter = year && month === 'all';
    const useDateRangeFilter = startDate && endDate && month === 'all' && !year;
    
    console.log('🔍 Filter mode:', { 
      useMonthYearFilter, 
      useYearOnlyFilter, 
      useDateRangeFilter, 
      month, 
      year, 
      service,
      startDate, 
      endDate,
      totalTasks: tasks.length 
    });
    
    // Filter by month and year if provided (takes priority over date range)
    if (useMonthYearFilter) {
      filteredTasks = filteredTasks.filter(task => {
        const taskYear = typeof task.year === 'string' ? parseInt(task.year, 10) : task.year;
        const matches = task.month === month && taskYear === year;
        return matches;
      });
      console.log(`✅ Filtered by month/year (${month} ${year}):`, filteredTasks.length, 'tasks');
    } else if (useYearOnlyFilter) {
      // Filter by year only (if "all months" selected)
      filteredTasks = filteredTasks.filter(task => {
        const taskYear = typeof task.year === 'string' ? parseInt(task.year, 10) : task.year;
        const matches = taskYear === year;
        return matches;
      });
      console.log(`✅ Filtered by year only (${year}, all months):`, filteredTasks.length, 'tasks');
      if (filteredTasks.length === 0 && tasks.length > 0) {
        console.warn('⚠️ No tasks match year filter. Available years:', 
          Array.from(new Set(tasks.map(t => {
            const y = typeof t.year === 'string' ? parseInt(t.year, 10) : t.year;
            return y;
          }))));
        console.log('📋 Sample tasks:', tasks.slice(0, 5).map(t => ({ 
          id: t.id, 
          month: t.month, 
          year: t.year, 
          yearType: typeof t.year,
          engineer: t.engineer 
        })));
      }
    }
    
    // Filter by service if provided (apply after date/month/year filters)
    if (service && service !== 'all') {
      const beforeServiceFilter = filteredTasks.length;
      filteredTasks = filteredTasks.filter(task => {
        const matches = task.service === service;
        return matches;
      });
      console.log(`✅ Filtered by service (${service}):`, filteredTasks.length, 'tasks (was', beforeServiceFilter, ')');
      if (filteredTasks.length === 0 && beforeServiceFilter > 0) {
        console.warn('⚠️ No tasks match service filter. Available services:', 
          Array.from(new Set(tasks.map(t => t.service))));
      }
    }
    
    // Filter by date range if provided (only use if month/year filter is NOT being used)
    if (useDateRangeFilter) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Start of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      
      filteredTasks = filteredTasks.filter(task => {
        // Create a date range from task's year, month, and week
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = monthNames.indexOf(task.month);
        if (monthIndex === -1) return false;
        
        // Calculate the approximate date range for the week
        // Week 1: days 1-7, Week 2: days 8-14, Week 3: days 15-21, Week 4: days 22-28
        const weekStartDay = (task.week - 1) * 7 + 1;
        const weekEndDay = Math.min(task.week * 7, new Date(task.year, monthIndex + 1, 0).getDate());
        
        const taskStartDate = new Date(task.year, monthIndex, weekStartDay);
        const taskEndDate = new Date(task.year, monthIndex, weekEndDay);
        taskEndDate.setHours(23, 59, 59, 999);
        
        // Check if task's date range overlaps with the selected date range
        return taskStartDate <= end && taskEndDate >= start;
      });
      console.log(`✅ Filtered by date range (${startDate} to ${endDate}):`, filteredTasks.length, 'tasks');
    }
    
    console.log('📊 Final filtered tasks for export:', filteredTasks.length);
    
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
    // Generate filename based on filters
    let filename = 'tasks';
    if (month && month !== 'all' && year) {
      filename += `-${month}-${year}`;
    } else if (year) {
      filename += `-${year}`;
    }
    if (service && service !== 'all') {
      filename += `-${service.replace(/\s+/g, '-')}`;
    }
    if (startDate && endDate) {
      filename += `-${startDate}_to_${endDate}`;
    }
    if (filename === 'tasks') {
      filename += `-${new Date().toISOString().split('T')[0]}`;
    }
    a.download = `${filename}.csv`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportClick = () => {
    // Set default dates (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setExportStartDate(firstDay.toISOString().split('T')[0]);
    setExportEndDate(lastDay.toISOString().split('T')[0]);
    setIsExportModalOpen(true);
  };

  const handleExportConfirm = () => {
    // Determine which filter method to use
    // If month is 'all' and year is set, use year filter (ignore date range)
    // If month is specific, use month/year filter (ignore date range)
    // If month is 'all' and no year, use date range if provided
    const useMonthYearFilter = exportMonth !== 'all' && exportYear;
    const useYearOnlyFilter = exportMonth === 'all' && exportYear;
    const useDateRange = exportMonth === 'all' && !exportYear && exportStartDate && exportEndDate;
    
    console.log('🔍 Export confirm:', { 
      exportMonth, 
      exportYear, 
      exportService, 
      exportStartDate, 
      exportEndDate,
      useMonthYearFilter,
      useYearOnlyFilter,
      useDateRange
    });
    
    exportToCSV(
      useDateRange ? exportStartDate : undefined, 
      useDateRange ? exportEndDate : undefined, 
      exportMonth, // Pass 'all' if all months, or the specific month
      exportYear,
      exportService !== 'all' ? exportService : undefined
    );
    setIsExportModalOpen(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'in-progress':
        return <Clock className="text-main" size={20} />;
      default:
        return <Circle className="text-gray-400" size={20} />;
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

  // Get current month and year
  const getCurrentWeek = () => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const week = Math.ceil(dayOfMonth / 7);
    return Math.min(week, 4);
  };

  const currentWeek = getCurrentWeek();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  // Initialize summary year and month
  const [summaryYear, setSummaryYear] = useState<number>(() => new Date().getFullYear());
  const [summaryMonth, setSummaryMonth] = useState<string | null>(null); // null = all months


  // Memoize filtered tasks and counts to avoid recalculating on every render
  // Filter by selected year and optionally by month
  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      // Filter by selected year (ensure type consistency)
      const taskYear = typeof task.year === 'string' ? parseInt(task.year, 10) : task.year;
      if (taskYear !== summaryYear) {
        return false;
      }
      
      // Filter by month if selected
      if (summaryMonth !== null && task.month !== summaryMonth) {
        return false;
      }
      
      // Filter by status
      if (statusFilter === 'all') return true;
      return task.status === statusFilter;
    });
    return filtered;
  }, [tasks, statusFilter, summaryYear, summaryMonth]);

  const { pendingCount, inProgressCount, completedCount } = useMemo(() => {
    const yearTasks = tasks.filter(t => {
      const taskYear = typeof t.year === 'string' ? parseInt(t.year, 10) : t.year;
      if (taskYear !== summaryYear) return false;
      if (summaryMonth !== null && t.month !== summaryMonth) return false;
      return true;
    });
    return {
      pendingCount: yearTasks.filter(t => t.status === 'pending').length,
      inProgressCount: yearTasks.filter(t => t.status === 'in-progress').length,
      completedCount: yearTasks.filter(t => t.status === 'completed').length,
    };
  }, [tasks, summaryYear, summaryMonth]);

  // Memoize selected year/month tasks
  const selectedMonthTasks = useMemo(() => {
    return tasks.filter(t => {
      const taskYear = typeof t.year === 'string' ? parseInt(t.year, 10) : t.year;
      if (taskYear !== summaryYear) return false;
      if (summaryMonth !== null && t.month !== summaryMonth) return false;
      return true;
    });
  }, [tasks, summaryYear, summaryMonth]);

  // Memoize unique months and years
  const { uniqueSummaryMonths, uniqueSummaryYears } = useMemo(() => {
    const allMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const taskMonths = Array.from(new Set(tasks.map(t => t.month)));
    // Always include all 12 months
    const allAvailableMonths = Array.from(new Set([...allMonths, ...taskMonths])).sort((a, b) => {
      return allMonths.indexOf(a) - allMonths.indexOf(b);
    });
    // Extract years from tasks, ensuring they're numbers
    const taskYears = Array.from(new Set(tasks.map(t => {
      const year = typeof t.year === 'string' ? parseInt(t.year, 10) : t.year;
      return year;
    }))).filter(y => !isNaN(y));
    const currentYear = new Date().getFullYear();
    // Always include current year and a range of years (current year ± 2 years)
    const yearRange = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const allYears = Array.from(new Set([...taskYears, ...yearRange])).sort((a, b) => b - a);
    return {
      uniqueSummaryMonths: allAvailableMonths,
      uniqueSummaryYears: allYears,
    };
  }, [tasks]);

  const { selectedMonthPending, selectedMonthInProgress, selectedMonthCompleted } = useMemo(() => {
    return {
      selectedMonthPending: selectedMonthTasks.filter(t => t.status === 'pending').length,
      selectedMonthInProgress: selectedMonthTasks.filter(t => t.status === 'in-progress').length,
      selectedMonthCompleted: selectedMonthTasks.filter(t => t.status === 'completed').length,
    };
  }, [selectedMonthTasks]);

  // Memoize grouped tasks by month and week
  const tasksByMonth = useMemo(() => {
    const groupedByMonth = filteredTasks.reduce((acc, task) => {
      const monthKey = `${task.month} ${task.year}`;
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: task.month,
          year: task.year,
          weeks: {} as Record<number, Task[]>
        };
      }
      if (!acc[monthKey].weeks[task.week]) {
        acc[monthKey].weeks[task.week] = [];
      }
      acc[monthKey].weeks[task.week].push(task);
      return acc;
    }, {} as Record<string, { month: string; year: number; weeks: Record<number, Task[]> }>);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    return Object.entries(groupedByMonth)
      .sort(([a], [b]) => {
        // Sort by year first, then by month
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');
        if (yearA !== yearB) {
          return parseInt(yearB) - parseInt(yearA);
        }
        return months.indexOf(monthB) - months.indexOf(monthA);
      })
      .map(([, data]) => ({
        month: data.month,
        year: data.year,
        weeks: Object.entries(data.weeks)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([week, tasks]) => ({
            week: parseInt(week),
            tasks: tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          }))
      }));
  }, [filteredTasks]);

  // State for expanded months and weeks
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // Auto-expand selected month and current week for selected year
  useEffect(() => {
    // Use selected month if set, otherwise find first month with tasks or use current month
    const yearTasks = tasks.filter(t => {
      const taskYear = typeof t.year === 'string' ? parseInt(t.year, 10) : t.year;
      return taskYear === summaryYear;
    });
    const monthToExpand = summaryMonth || (yearTasks.length > 0 ? yearTasks[0].month : currentMonth);
    const currentMonthKey = `${monthToExpand} ${summaryYear}`;
    const currentWeekKey = `${currentMonthKey}-${currentWeek}`;
    setExpandedMonths(new Set([currentMonthKey]));
    setExpandedWeeks(new Set([currentWeekKey]));
  }, [tasks, currentMonth, summaryYear, summaryMonth, currentWeek]);

  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
      // Also collapse all weeks in this month
      const newWeeks = new Set(expandedWeeks);
      tasksByMonth.forEach(m => {
        if (`${m.month} ${m.year}` === monthKey) {
          m.weeks.forEach(w => {
            newWeeks.delete(`${monthKey}-${w.week}`);
          });
        }
      });
      setExpandedWeeks(newWeeks);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  const toggleWeek = (weekKey: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekKey)) {
      newExpanded.delete(weekKey);
    } else {
      newExpanded.add(weekKey);
    }
    setExpandedWeeks(newExpanded);
  };

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-3">
              {[1, 2].map(i => (
                <div key={i} className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="h-4 w-16 bg-white bg-opacity-30 rounded animate-pulse mb-2"></div>
                <div className="h-6 w-12 bg-white bg-opacity-30 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks List Skeleton */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Only show full skeleton on initial load, show content with loading state on refresh
  if (isLoading && isInitialLoad) {
    return <SkeletonLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading indicator for background refresh */}
      {isLoading && !isInitialLoad && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white text-center py-1 text-sm">
          Refreshing...
        </div>
      )}
      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Header with Menu */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    My Tasks
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Welcome, <span className="font-semibold">{user?.name}</span>
                  </p>
                </div>
              </div>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-2">
                {/* Action Menu Dropdown */}
                <div className="relative menu-container">
                  <button
                    onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors shadow-md"
                  >
                    <Upload size={18} />
                    Actions
                    <ChevronDown size={16} className={isActionMenuOpen ? 'rotate-180' : ''} />
                  </button>
                  {isActionMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setIsActionMenuOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setEditingTask(null);
                              setIsTaskModalOpen(true);
                              setIsActionMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Plus size={18} />
                            Add Task
                          </button>
                          <button
                            onClick={() => {
                              setIsImportModalOpen(true);
                              setIsActionMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <FileSpreadsheet size={18} />
                            Import Excel
                          </button>
                          <button
                            onClick={() => {
                              handleExportClick();
                              setIsActionMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Download size={18} />
                            Export Excel
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <a
                  href="/engineers"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                >
                  <Users size={18} />
                  Engineers
                </a>
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
                          <FileSpreadsheet size={18} />
                          Import Excel
                        </button>
                        <button
                          onClick={() => {
                            exportToCSV();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Download size={18} />
                          Export Excel
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <a
                          href="/engineers"
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Users size={18} />
                          View All Engineers
                        </a>
                        <div className="border-t border-gray-200 my-1"></div>
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

          {/* Undo Import */}
          <UndoImport onUndoComplete={loadTasks} />

          {/* Year Summary */}
          <div className="bg-main rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-2xl font-bold">
                    {summaryYear === currentYear 
                      ? 'Current Year Summary' 
                      : 'Year Summary'}
                  </h2>
                  <select
                    value={summaryYear}
                    onChange={(e) => {
                      const newYear = parseInt(e.target.value, 10);
                      setSummaryYear(newYear);
                      setSummaryMonth(null); // Always show all months for selected year
                    }}
                    className="px-3 py-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white text-sm focus:ring-2 focus:ring-white focus:outline-none backdrop-blur-sm"
                    style={{ color: 'white' }}
                  >
                    {uniqueSummaryYears.map(year => (
                      <option key={year} value={year} style={{ color: '#1f2937' }}>{year}</option>
                    ))}
                  </select>
                </div>
                <p className="text-blue-100 mt-2">
                  All Months {summaryYear}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90 mb-1">
                  Total Tasks ({summaryYear})
                </div>
                <div className="text-4xl font-bold">{selectedMonthTasks.length}</div>
                <div className="text-xs opacity-75 mt-2">Total All Tasks: {tasks.length}</div>
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
          </div>

          {/* Add Task Button */}
          <div className="mb-4">
            <button
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-main text-white rounded-lg hover:bg-main-700 transition-colors shadow-md font-medium"
            >
              <Plus size={20} />
              Add New Task
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-main text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All ({filteredTasks.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-gray-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('in-progress')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'in-progress'
                  ? 'bg-main text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>

        {/* Tasks List - Grouped by Month and Week */}
        <div key={`tasks-${summaryYear}`} className="bg-white rounded-lg shadow-lg border border-gray-200">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <Circle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-lg">No tasks found</p>
              <p className="text-gray-500 text-sm mt-2">
                {statusFilter !== 'all' 
                  ? `No ${statusFilter} tasks.`
                  : 'Click "Add New Task" to get started.'}
              </p>
            </div>
          ) : (
            <div>
              {tasksByMonth.map((monthData) => {
                const monthKey = `${monthData.month} ${monthData.year}`;
                const isMonthExpanded = expandedMonths.has(monthKey);
                const totalMonthTasks = monthData.weeks.reduce((sum, w) => sum + w.tasks.length, 0);

                return (
                  <div key={monthKey} className="border-b border-gray-200 last:border-b-0">
                    {/* Month Header */}
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        {isMonthExpanded ? (
                          <ChevronDown size={20} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-500" />
                        )}
                        <span className="font-semibold text-gray-900">
                          {monthData.month} {monthData.year}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({totalMonthTasks} task{totalMonthTasks !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </button>

                    {/* Weeks within Month */}
                    {isMonthExpanded && (
                      <div>
                        {monthData.weeks.map((weekData) => {
                          const weekKey = `${monthKey}-${weekData.week}`;
                          const isWeekExpanded = expandedWeeks.has(weekKey);

                          return (
                            <div key={weekData.week} className="border-b border-gray-100 last:border-b-0">
                              {/* Week Header */}
                              <button
                                onClick={() => toggleWeek(weekKey)}
                                className="w-full px-6 py-2 bg-gray-50 bg-opacity-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-3">
                                  {isWeekExpanded ? (
                                    <ChevronDown size={18} className="text-gray-400" />
                                  ) : (
                                    <ChevronRight size={18} className="text-gray-400" />
                                  )}
                                  <span className="text-sm font-medium text-gray-700">
                                    Week {weekData.week}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({weekData.tasks.length} task{weekData.tasks.length !== 1 ? 's' : ''})
                                  </span>
                                </div>
                              </button>

                              {/* Tasks within Week */}
                              {isWeekExpanded && (
                                <div className="divide-y divide-gray-100">
                                  {weekData.tasks.map((task) => (
                                    <div
                                      key={task.id}
                                      className="p-4 hover:bg-gray-50 transition-colors"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-2">
                                            {getStatusIcon(task.status)}
                                            <h3 className="text-lg font-semibold text-gray-900">
                                              {task.service}
                                            </h3>
                                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
                                              {task.status.replace('-', ' ').toUpperCase()}
                                            </span>
                                          </div>
                                          <div className="text-sm text-gray-600 space-y-1">
                                            <p>Week {task.week} • {task.month} {task.year}</p>
                                            <p>Priority: <span className="font-medium">{task.priority}</span></p>
                                            <p className="text-gray-500 italic">"{task.description || 'No description'}"</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                          <button
                                            onClick={() => handleEditTask(task)}
                                            className="px-3 py-1 text-sm bg-main-100 text-main-700 rounded hover:bg-main-200 transition-colors"
                                          >
                                            Edit
                                          </button>
                                          {task.status !== 'pending' && (
                                            <button
                                              onClick={() => handleUpdateStatus(task, 'pending')}
                                              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                            >
                                              Set Pending
                                            </button>
                                          )}
                                          {task.status !== 'in-progress' && (
                                            <button
                                              onClick={() => handleUpdateStatus(task, 'in-progress')}
                                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                            >
                                              Start
                                            </button>
                                          )}
                                          {task.status !== 'completed' && (
                                            <button
                                              onClick={() => handleUpdateStatus(task, 'completed')}
                                              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                            >
                                              Complete
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleDeleteTask(task)}
                                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                                            title="Delete task"
                                          >
                                            <Trash2 size={14} />
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Export Modal */}
        {isExportModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Download className="text-main" size={24} />
                  <h2 className="text-2xl font-bold text-gray-900">Export Tasks</h2>
                </div>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                  >
                    <option value="all">All Months</option>
                    {uniqueSummaryMonths.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={exportYear}
                    onChange={(e) => setExportYear(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                  >
                    {uniqueSummaryYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Service
                  </label>
                  <select
                    value={exportService}
                    onChange={(e) => setExportService(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                  >
                    <option value="all">All Services</option>
                    {services.map(service => (
                      <option key={service.id} value={service.name}>{service.name}</option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500 mb-3 text-center">OR use date range</p>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can filter by Month/Year/Service or use a date range. 
                    If both are provided, date range takes priority. 
                    The export will only include tasks for the logged-in engineer ({user?.engineerName}).
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportConfirm}
                  disabled={
                    // Enable if: date range provided OR year provided OR service selected
                    !((exportStartDate && exportEndDate) || exportYear || (exportService && exportService !== 'all'))
                  }
                  className="px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Download size={18} />
                  Export
                </button>
              </div>
            </div>
          </div>
        )}

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
            engineers={[]}
            services={services}
            currentEngineer={user?.engineerName || ''}
            readOnlyEngineer={true}
          />
        )}

        {/* About Modal */}
        <AboutModal
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
        />

        {/* Import Modal */}
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportComplete={loadData}
        />
      </div>
    </div>
  );
}

