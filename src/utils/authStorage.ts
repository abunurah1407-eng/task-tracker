import { User } from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'task-tracker-current-user',
  USERS: 'task-tracker-users',
};

// Mock users for testing
const defaultUsers: User[] = [
  {
    id: '1',
    email: 'admin@etec.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'director@etec.com',
    name: 'Nasser',
    role: 'director',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'faisal@etec.com',
    name: 'Faisal',
    role: 'engineer',
    engineerName: 'Faisal',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    email: 'abeer@etec.com',
    name: 'Abeer',
    role: 'engineer',
    engineerName: 'Abeer',
    createdAt: new Date().toISOString(),
  },
];

export const authStorage = {
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  },

  setCurrentUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  clearCurrentUser: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getMockUsers: (): User[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with default users
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    return defaultUsers;
  },

  saveMockUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },
};

