import { UserRole } from '../types';

export const permissions = {
  canManageEverything: (role: UserRole): boolean => {
    return role === 'admin';
  },

  canViewAndManageEverything: (role: UserRole): boolean => {
    return role === 'admin' || role === 'director';
  },

  canAddTasks: (role: UserRole): boolean => {
    return role === 'admin' || role === 'director' || role === 'engineer';
  },

  canManageOwnTasks: (role: UserRole): boolean => {
    return role === 'engineer';
  },

  canViewAllTasks: (role: UserRole): boolean => {
    return role === 'admin' || role === 'director';
  },

  canManageUsers: (role: UserRole): boolean => {
    return role === 'admin';
  },

  canViewReports: (role: UserRole): boolean => {
    return role === 'admin' || role === 'director';
  },
};

