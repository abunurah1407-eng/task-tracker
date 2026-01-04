import { useState, useEffect } from 'react';
import { Engineer, Service, Task, TeamTask } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { permissions } from '../utils/permissions';
import EngineerCard from './EngineerCard';
import ServicesList from './ServicesList';
import WeeklyView from './WeeklyView';
import TaskChart from './TaskChart';
import TeamTasksSection from './TeamTasksSection';
import TaskModal from './TaskModal';
import SearchBar from './SearchBar';
import NotificationPanel from './NotificationPanel';
import { Plus, Download, LogOut, Bell } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamTasks, setTeamTasks] = useState<TeamTask[]>([]);
  const [selectedEngineer, setSelectedEngineer] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Filter tasks based on user role
  const getVisibleTasks = () => {
    if (!user) return [];
    
    if (permissions.canViewAllTasks(user.role)) {
      return tasks;
    }
    
    // Engineers can only see their own tasks
    if (user.role === 'engineer' && user.engineerName) {
      return tasks.filter(t => t.engineer === user.engineerName);
    }
    
    return [];
  };

  useEffect(() => {
    loadData();
    if (user) {
      checkNotifications();
      checkTaskReminders();
    }
  }, [user]);

  useEffect(() => {
    updateCounts();
    if (user) {
      checkNotifications();
      checkTaskReminders();
    }
  }, [tasks, user]);

  const checkTaskReminders = async () => {
    // Task reminders are now handled by the backend
    // This function can be used for client-side reminders if needed
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

  const loadData = async () => {
    try {
      const [engineersData, servicesData, tasksData, teamTasksData] = await Promise.all([
        api.getEngineers(),
        api.getServices(),
        api.getTasks(),
        api.getTeamTasks(),
      ]);
      
      setEngineers(engineersData);
      setServices(servicesData);
      setTasks(tasksData);
      setTeamTasks(teamTasksData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateCounts = async () => {
    // Reload data from API to get updated counts
    try {
      await loadData();
    } catch (error) {
      console.error('Error updating counts:', error);
    }
  };

  const handleAddTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await api.createTask(task);
      await loadData(); // Reload to get updated counts
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
      await loadData(); // Reload to get updated counts
      setIsTaskModalOpen(false);
      setEditingTask(null);
      await checkNotifications();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      await loadData(); // Reload to get updated counts
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const visibleTasks = getVisibleTasks();
  
  const filteredTasks = visibleTasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.engineer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEngineer = !selectedEngineer || task.engineer === selectedEngineer;
    const matchesService = !selectedService || task.service === selectedService;
    return matchesSearch && matchesEngineer && matchesService;
  });

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

  const totalTasks = engineers.reduce((sum, eng) => sum + eng.tasksTotal, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Task Tracker Dashboard</h1>
              <p className="text-gray-700">Enhanced task tracking and management system</p>
              {user && (
                <p className="text-sm text-gray-600 mt-1">
                  Logged in as <span className="font-semibold">{user.name}</span> ({user.role})
                </p>
              )}
            </div>
            <div className="flex gap-3 items-center">
              {permissions.canViewAllTasks(user?.role || 'engineer') && (
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors shadow-md font-medium"
                >
                  <Download size={20} />
                  Export CSV
                </button>
              )}
              {permissions.canAddTasks(user?.role || 'engineer') && (
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors shadow-md font-medium"
                >
                  <Plus size={20} />
                  Add Task
                </button>
              )}
              <button
                onClick={() => setIsNotificationPanelOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-md font-medium"
              >
                <Bell size={20} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors shadow-md font-medium"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              engineers={engineers}
              services={services}
              selectedEngineer={selectedEngineer}
              selectedService={selectedService}
              onEngineerChange={setSelectedEngineer}
              onServiceChange={setSelectedService}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="text-gray-700 text-sm font-semibold mb-1">Total Engineers</div>
            <div className="text-3xl font-bold text-main">{engineers.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="text-gray-700 text-sm font-semibold mb-1">Total Tasks</div>
            <div className="text-3xl font-bold text-purple-700">{totalTasks}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="text-gray-700 text-sm font-semibold mb-1">Active Services</div>
            <div className="text-3xl font-bold text-pink-700">{services.length}</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Engineers Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Engineers</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {engineers.map(engineer => (
                  <EngineerCard
                    key={engineer.id}
                    engineer={engineer}
                    isSelected={selectedEngineer === engineer.name}
                    onClick={() => setSelectedEngineer(
                      selectedEngineer === engineer.name ? null : engineer.name
                    )}
                    onTaskClick={handleEditTask}
                    tasks={filteredTasks.filter(t => t.engineer === engineer.name)}
                  />
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-red-700">{totalTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Services and Chart Section */}
          <div className="lg:col-span-2 space-y-6">
            <ServicesList
              services={services}
              selectedService={selectedService}
              onServiceSelect={setSelectedService}
              tasks={filteredTasks}
              onTaskClick={handleEditTask}
            />

            <TaskChart engineers={engineers} />
          </div>
        </div>

        {/* Weekly View and Team Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklyView
            tasks={filteredTasks}
            onTaskClick={handleEditTask}
          />
          <TeamTasksSection teamTasks={teamTasks} />
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          task={editingTask}
          engineers={engineers}
          services={services}
          onSave={editingTask ? (task) => handleUpdateTask(task as Task) : handleAddTask}
          onDelete={editingTask && permissions.canManageEverything(user?.role || 'engineer') ? () => {
            handleDeleteTask(editingTask.id);
            setIsTaskModalOpen(false);
            setEditingTask(null);
          } : undefined}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
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


