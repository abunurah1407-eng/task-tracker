import { Notification, Task } from '../types';

const STORAGE_KEY = 'task-tracker-notifications';

export const notificationService = {
  getAll: (userId: string): Notification[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all: Notification[] = stored ? JSON.parse(stored) : [];
    return all.filter(n => n.userId === userId);
  },

  getUnread: (userId: string): Notification[] => {
    return notificationService.getAll(userId).filter(n => !n.read);
  },

  markAsRead: (notificationId: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all: Notification[] = stored ? JSON.parse(stored) : [];
    const updated = all.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  markAllAsRead: (userId: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all: Notification[] = stored ? JSON.parse(stored) : [];
    const updated = all.map(n =>
      n.userId === userId && !n.read ? { ...n, read: true } : n
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  create: (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all: Notification[] = stored ? JSON.parse(stored) : [];
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    all.push(newNotification);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return newNotification;
  },

  // Send reminder to engineer about pending tasks
  sendTaskReminder: (_engineerName: string, taskCount: number, userId: string) => {
    return notificationService.create({
      userId,
      type: 'task_reminder',
      title: 'Task Reminder',
      message: `You have ${taskCount} pending task${taskCount !== 1 ? 's' : ''} to complete.`,
      read: false,
    });
  },

  // Notify director when engineer completes a task
  sendTaskCompleted: (engineerName: string, task: Task, directorUserId: string) => {
    return notificationService.create({
      userId: directorUserId,
      type: 'task_completed',
      title: 'Task Completed',
      message: `${engineerName} has completed task: ${task.service}`,
      read: false,
      taskId: task.id,
    });
  },

  // Notify engineer when assigned a new task
  sendTaskAssigned: (_engineerName: string, task: Task, engineerUserId: string) => {
    return notificationService.create({
      userId: engineerUserId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${task.service}`,
      read: false,
      taskId: task.id,
    });
  },
};

