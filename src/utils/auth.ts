import { User } from '../types';

const STORAGE_KEY = 'task-tracker-user';
const TEST_USERS_KEY = 'task-tracker-test-users';

// Test users for development (in production, use AD)
const defaultTestUsers: User[] = [
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

export const auth = {
  // Initialize test users if not exists
  initTestUsers: () => {
    const existing = localStorage.getItem(TEST_USERS_KEY);
    if (!existing) {
      localStorage.setItem(TEST_USERS_KEY, JSON.stringify(defaultTestUsers));
    }
  },

  // Login with email/password (for testing)
  login: async (email: string, _password: string): Promise<User | null> => {
    // In production, this would authenticate with AD
    // For testing, we use simple email/password
    
    auth.initTestUsers();
    const users = JSON.parse(localStorage.getItem(TEST_USERS_KEY) || '[]') as User[];
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // Simple password check (in production, use AD authentication)
    // For testing, any password works
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return user;
    }
    
    return null;
  },

  // AD Login (for production)
  loginWithAD: async (): Promise<User | null> => {
    // This would integrate with your AD provider
    // For now, return null as placeholder
    // In production, implement actual AD authentication
    return null;
  },

  // Logout
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Get current user
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return auth.getCurrentUser() !== null;
  },

  // Check user permissions
  hasPermission: (user: User | null, permission: 'manage_all' | 'view_all' | 'manage_own'): boolean => {
    if (!user) return false;
    
    switch (user.role) {
      case 'admin':
        return permission === 'manage_all' || permission === 'view_all' || permission === 'manage_own';
      case 'director':
        return permission === 'manage_all' || permission === 'view_all' || permission === 'manage_own';
      case 'engineer':
        return permission === 'manage_own';
      default:
        return false;
    }
  },

  // Check if user can manage a specific task
  canManageTask: (user: User | null, taskEngineer: string): boolean => {
    if (!user) return false;
    
    if (user.role === 'admin' || user.role === 'director') {
      return true;
    }
    
    if (user.role === 'engineer') {
      return user.engineerName === taskEngineer;
    }
    
    return false;
  },
};

