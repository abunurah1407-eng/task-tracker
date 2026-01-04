import { useState, useEffect } from 'react';
import { Engineer, Task } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, Clock, Circle, Search, ChevronDown, ChevronRight } from 'lucide-react';

export default function EngineersView() {
  const { logout } = useAuth();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedEngineer, setSelectedEngineer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'priority' | 'engineer'>('date');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [engineersData, tasksData] = await Promise.all([
        api.getEngineers(),
        api.getTasks(true), // viewAll = true to see all engineers' tasks
      ]);
      
      setEngineers(engineersData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'in-progress':
        return <Clock className="text-main" size={16} />;
      default:
        return <Circle className="text-gray-400" size={16} />;
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
  // Always include all 12 months
  const allMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const taskMonths = Array.from(new Set(tasks.map(t => t.month)));
  const uniqueSummaryMonths = Array.from(new Set([...allMonths, ...taskMonths])).sort((a, b) => {
    return allMonths.indexOf(a) - allMonths.indexOf(b);
  });
  // Always include current year and a range of years (current year ± 2 years)
  const taskYears = Array.from(new Set(tasks.map(t => t.year)));
  const yearRange = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const uniqueSummaryYears = Array.from(new Set([...taskYears, ...yearRange])).sort((a, b) => b - a);

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

  // Calculate statistics (removed unused variables)

  // Filter and sort tasks
  let filteredTasks = tasks;

  // Filter by selected month and year
  filteredTasks = filteredTasks.filter(t => 
    t.month === summaryMonth && t.year === summaryYear
  );

  // Filter by engineer
  if (selectedEngineer) {
    filteredTasks = filteredTasks.filter(t => t.engineer === selectedEngineer);
  }

  // Filter by status
  if (statusFilter !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
  }

  // Filter by priority
  if (priorityFilter !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
  }

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredTasks = filteredTasks.filter(t =>
      t.service.toLowerCase().includes(query) ||
      t.engineer.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query))
    );
  }

  // Sort tasks
  filteredTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'status':
        const statusOrder = { 'pending': 1, 'in-progress': 2, 'completed': 3 };
        return (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
      case 'priority':
        const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      case 'engineer':
        return a.engineer.localeCompare(b.engineer);
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Group tasks by engineer, then by month, then by week
  // State for expanded months and weeks
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // Auto-expand current month and current week
  useEffect(() => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    const getCurrentWeek = () => {
      const now = new Date();
      const dayOfMonth = now.getDate();
      const week = Math.ceil(dayOfMonth / 7);
      return Math.min(week, 4);
    };
    const currentWeek = getCurrentWeek();
    const currentMonthKey = `${currentMonth} ${currentYear}`;
    const currentWeekKey = `${currentMonthKey}-${currentWeek}`;
    setExpandedMonths(new Set([currentMonthKey]));
    setExpandedWeeks(new Set([currentWeekKey]));
  }, []);

  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
      // Also collapse all weeks in this month
      const newWeeks = new Set(expandedWeeks);
      groupedByEngineer.forEach(e => {
        e.byMonth.forEach(m => {
          if (`${m.month} ${m.year}` === monthKey) {
            m.weeks.forEach(w => {
              newWeeks.delete(`${monthKey}-${w.week}`);
            });
          }
        });
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

  const groupedByEngineer = engineers.map(engineer => {
    const engineerTasks = filteredTasks.filter(t => t.engineer === engineer.name);
    
    // Group by month
    const byMonth = engineerTasks.reduce((acc, task) => {
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

    return {
      engineer,
      tasks: engineerTasks,
      byMonth: Object.entries(byMonth)
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
        })),
      stats: {
        total: engineerTasks.length,
        pending: engineerTasks.filter(t => t.status === 'pending').length,
        inProgress: engineerTasks.filter(t => t.status === 'in-progress').length,
        completed: engineerTasks.filter(t => t.status === 'completed').length,
      }
    };
  }).filter(item => item.tasks.length > 0 || !selectedEngineer);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <a
                href="/my-tasks"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
              >
                <ArrowLeft size={18} />
                Back to My Tasks
              </a>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                All Engineers Tasks
              </h1>
              <p className="text-gray-600">
                View tasks from all engineers
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
            >
              Logout
            </button>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-transparent"
                >
                  <option value="date">Sort by Date</option>
                  <option value="status">Sort by Status</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="engineer">Sort by Engineer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Engineer Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedEngineer(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !selectedEngineer
                  ? 'bg-main text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              All Engineers ({filteredTasks.length})
            </button>
            {engineers.map(engineer => {
              const engineerTasks = filteredTasks.filter(t => t.engineer === engineer.name);
              if (engineerTasks.length === 0 && selectedEngineer !== engineer.name) return null;
              return (
                <button
                  key={engineer.id}
                  onClick={() => setSelectedEngineer(
                    selectedEngineer === engineer.name ? null : engineer.name
                  )}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors border-2 ${
                    selectedEngineer === engineer.name
                      ? 'bg-main text-white border-main'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                  }`}
                  style={{
                    borderColor: selectedEngineer === engineer.name ? engineer.color : undefined
                  }}
                >
                  {engineer.name} ({engineerTasks.length})
                </button>
              );
            })}
          </div>
        </div>

        {/* Tasks by Engineer */}
        {selectedEngineer ? (
          // Show tasks for selected engineer
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} for {selectedEngineer}
              </h3>
            </div>
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center">
                <Circle className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 text-lg">No tasks found</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {task.service}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {task.status.replace('-', ' ').toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Week {task.week} • {task.month} {task.year}</p>
                          {task.description && (
                            <p className="text-gray-500 italic">"{task.description}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Show all engineers with their tasks
          <div className="space-y-4">
            {groupedByEngineer.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center">
                <Circle className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 text-lg">No tasks found</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              groupedByEngineer.map(({ engineer, tasks: engineerTasks, stats }) => (
              <div
                key={engineer.id}
                className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
              >
                <div
                  className="p-4 border-b border-gray-200"
                  style={{ borderLeftColor: engineer.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">{engineer.name}</h2>
                      <div className="flex gap-4 mt-1">
                        <p className="text-sm text-gray-600">
                          Total: <span className="font-semibold">{stats.total}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Pending: <span className="font-medium">{stats.pending}</span>
                        </p>
                        <p className="text-sm text-main">
                          In Progress: <span className="font-medium">{stats.inProgress}</span>
                        </p>
                        <p className="text-sm text-green-600">
                          Completed: <span className="font-medium">{stats.completed}</span>
                        </p>
                      </div>
                    </div>
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: engineer.color }}
                    >
                      {stats.total}
                    </div>
                  </div>
                </div>
                {engineerTasks.length > 0 ? (
                  <div>
                    {groupedByEngineer.find(e => e.engineer.id === engineer.id)?.byMonth.map((monthData) => {
                      const monthKey = `${monthData.month} ${monthData.year}`;
                      const isMonthExpanded = expandedMonths.has(monthKey);
                      const totalMonthTasks = monthData.weeks.reduce((sum, w) => sum + w.tasks.length, 0);

                      return (
                        <div key={`${monthData.month}-${monthData.year}`} className="border-t border-gray-200 first:border-t-0">
                          <button
                            onClick={() => toggleMonth(monthKey)}
                            className="w-full bg-gray-50 px-4 py-2 border-b border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                          >
                            <div className="flex items-center gap-3">
                              {isMonthExpanded ? (
                                <ChevronDown size={18} className="text-gray-500" />
                              ) : (
                                <ChevronRight size={18} className="text-gray-500" />
                              )}
                              <h3 className="font-semibold text-gray-700">
                                {monthData.month} {monthData.year}
                              </h3>
                              <span className="text-sm font-normal text-gray-500">
                                ({totalMonthTasks} task{totalMonthTasks !== 1 ? 's' : ''})
                              </span>
                            </div>
                          </button>
                          {isMonthExpanded && (
                            <div>
                              {monthData.weeks.map((weekData) => {
                                const weekKey = `${monthKey}-${weekData.week}`;
                                const isWeekExpanded = expandedWeeks.has(weekKey);

                                return (
                                  <div key={weekData.week} className="border-b border-gray-100 last:border-b-0">
                                    <button
                                      onClick={() => toggleWeek(weekKey)}
                                      className="w-full bg-gray-50 bg-opacity-50 px-6 py-2 border-b border-gray-100 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                                    >
                                      <div className="flex items-center gap-3">
                                        {isWeekExpanded ? (
                                          <ChevronDown size={16} className="text-gray-400" />
                                        ) : (
                                          <ChevronRight size={16} className="text-gray-400" />
                                        )}
                                        <h4 className="text-sm font-medium text-gray-600">
                                          Week {weekData.week}
                                        </h4>
                                        <span className="text-xs font-normal text-gray-500">
                                          ({weekData.tasks.length} task{weekData.tasks.length !== 1 ? 's' : ''})
                                        </span>
                                      </div>
                                    </button>
                                    {isWeekExpanded && (
                                      <div className="divide-y divide-gray-100">
                                        {weekData.tasks.map((task) => (
                                          <div
                                            key={task.id}
                                            className="p-4 hover:bg-gray-50 transition-colors"
                                          >
                                            <div className="flex items-start gap-3">
                                              {getStatusIcon(task.status)}
                                              <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                  <h3 className="text-lg font-semibold text-gray-900">
                                                    {task.service}
                                                  </h3>
                                                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
                                                    {task.status.replace('-', ' ').toUpperCase()}
                                                  </span>
                                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                  }`}>
                                                    {task.priority.toUpperCase()}
                                                  </span>
                                                </div>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                  <p>Week {task.week} • {task.month} {task.year}</p>
                                                  {task.description && (
                                                    <p className="text-gray-500 italic">"{task.description}"</p>
                                                  )}
                                                </div>
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
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No tasks match the current filters
                  </div>
                )}
              </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

