import { Engineer, Service, Task, TeamTask } from '../types';
import { engineers as defaultEngineers, services as defaultServices, teamTasks as defaultTeamTasks } from '../data/mockData';

const STORAGE_KEYS = {
  ENGINEERS: 'task-tracker-engineers',
  SERVICES: 'task-tracker-services',
  TASKS: 'task-tracker-tasks',
  TEAM_TASKS: 'task-tracker-team-tasks',
};

export const storage = {
  getEngineers: (): Engineer[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.ENGINEERS);
    return stored ? JSON.parse(stored) : defaultEngineers;
  },

  saveEngineers: (engineers: Engineer[]) => {
    localStorage.setItem(STORAGE_KEYS.ENGINEERS, JSON.stringify(engineers));
  },

  getServices: (): Service[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return stored ? JSON.parse(stored) : defaultServices;
  },

  saveServices: (services: Service[]) => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  },

  getTasks: (): Task[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    return stored ? JSON.parse(stored) : [];
  },

  saveTasks: (tasks: Task[]) => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  getTeamTasks: (): TeamTask[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.TEAM_TASKS);
    return stored ? JSON.parse(stored) : defaultTeamTasks;
  },

  saveTeamTasks: (teamTasks: TeamTask[]) => {
    localStorage.setItem(STORAGE_KEYS.TEAM_TASKS, JSON.stringify(teamTasks));
  },

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
};


