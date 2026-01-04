export interface Engineer {
  id: string;
  name: string;
  tasksTotal: number;
  color: string;
  userId?: number; // Reference to users table
  userEmail?: string; // User email if user exists
  userName?: string; // User name if user exists
}

export interface Service {
  id: string;
  name: string;
  count: number;
  assignedTo?: string;
  category: 'primary' | 'secondary';
}

export interface Task {
  id: string;
  service: string;
  engineer: string;
  week: number;
  month: string;
  year: number;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamTask {
  id: string;
  category: string;
  count: number;
  year: number;
}

export type UserRole = 'admin' | 'director' | 'engineer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  engineerName?: string; // For engineers, link to their engineer profile
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'task_reminder' | 'task_completed' | 'task_assigned';
  title: string;
  message: string;
  read: boolean;
  taskId?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}


