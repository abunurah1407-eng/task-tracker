import { useState, useEffect } from 'react';
import { Task, Service } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskModal from './TaskModal';
import AboutModal from './AboutModal';
import { Plus, LogOut, Users, CheckCircle, Clock, Circle, Trash2, ChevronDown, ChevronRight, Menu, X, User, Info } from 'lucide-react';

export default function EngineerDashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

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

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (!user?.engineerName) {
        // User not fully loaded yet or engineerName not set
        setIsLoading(false);
        return;
      }

      const [tasksData, servicesData] = await Promise.all([
        api.getTasks(),
        api.getServices(),
      ]);
      
      // Backend should already filter tasks for engineers, but double-check on frontend
      // Filter to only show engineer's own tasks (case-insensitive comparison)
      const myTasks = tasksData.filter((t: Task) => {
        if (!user?.engineerName) return false;
        // Case-insensitive comparison to handle any name mismatches
        const taskEngineer = t.engineer?.toLowerCase().trim();
        const userEngineer = user.engineerName.toLowerCase().trim();
        return taskEngineer === userEngineer;
      });
      
      setTasks(myTasks);
      setServices(servicesData);
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

  const filteredTasks = tasks.filter(task => {
    if (statusFilter === 'all') return true;
    return task.status === statusFilter;
  });

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

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

  // Group tasks by month, then by week
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

  const tasksByMonth = Object.entries(groupedByMonth)
    .sort(([a], [b]) => {
      // Sort by year first, then by month
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA);
      }
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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

  // State for expanded months and weeks
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // Auto-expand current month and current week
  useEffect(() => {
    const currentMonthKey = `${currentMonth} ${currentYear}`;
    const currentWeekKey = `${currentMonthKey}-${currentWeek}`;
    setExpandedMonths(new Set([currentMonthKey]));
    setExpandedWeeks(new Set([currentWeekKey]));
  }, [currentMonth, currentYear, currentWeek]);

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
                    My Tasks
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Welcome, <span className="font-semibold">{user?.name}</span>
                  </p>
                </div>
              </div>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-2">
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
                <p className="text-blue-100">{summaryMonth} {summaryYear}</p>
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
              All ({tasks.length})
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
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
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
                                            {task.description && (
                                              <p className="text-gray-500 italic">"{task.description}"</p>
                                            )}
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
      </div>
    </div>
  );
}

