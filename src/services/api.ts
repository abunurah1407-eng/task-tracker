// Use relative URL for production (works with nginx proxy), or absolute URL for development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  }

  async loginAD(username: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login/ad', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  }

  logout() {
    localStorage.removeItem('auth_token');
  }

  // Tasks
  async getTasks(viewAll: boolean = false) {
    const url = viewAll ? '/tasks?viewAll=true' : '/tasks';
    const tasks = await this.request<any[]>(url);
    // Map notes to description for backward compatibility
    return tasks.map(task => ({
      ...task,
      description: task.description || task.notes || '',
    }));
  }

  async getTask(id: string) {
    const task = await this.request<any>(`/tasks/${id}`);
    // Map notes to description for backward compatibility
    return {
      ...task,
      description: task.description || task.notes || '',
    };
  }

  async createTask(task: any) {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async createTasksBulk(tasks: any[]) {
    return this.request<any>('/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    });
  }

  async updateTask(id: string, task: any) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  }

  async deleteTask(id: string) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Engineers (legacy - for engineer records only)
  async getEngineers() {
    return this.request<any[]>('/engineers');
  }

  // Services
  async getServices() {
    return this.request<any[]>('/services');
  }

  async createService(service: { name: string; assignedTo?: string; category: 'primary' | 'secondary' }) {
    return this.request<any>('/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
  }

  async updateService(id: string, service: { name?: string; assignedTo?: string; category?: 'primary' | 'secondary' }) {
    return this.request<any>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(service),
    });
  }

  async deleteService(id: string) {
    return this.request<any>(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  async getUnreadCount() {
    return this.request<{ count: number }>('/notifications/unread');
  }

  async markNotificationAsRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<any>('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  // Team Tasks
  async getTeamTasks() {
    return this.request<any[]>('/team-tasks');
  }

  async createEngineer(engineer: { name: string; color: string }) {
    return this.request<any>('/engineers', {
      method: 'POST',
      body: JSON.stringify(engineer),
    });
  }

  // Engineer Users Management (full user accounts)
  async getEngineerUsers() {
    return this.request<any[]>('/engineers/users');
  }

  async previewCreateEngineerInvitation(user: { name: string; email: string; sendInvitation?: boolean }) {
    return this.request<{
      preview: {
        engineerName: string;
        engineerEmail: string;
        invitationLink: string;
        expiresAt: string;
        expiresDate: string;
        expiresTime: string;
      };
    }>('/engineers/users/preview', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async createEngineerUser(user: { name: string; email: string; color: string; sendInvitation?: boolean; confirm?: boolean }) {
    return this.request<any>('/engineers/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateEngineerUser(id: string, user: { name?: string; email?: string; color?: string }) {
    return this.request<any>(`/engineers/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteEngineerUser(id: string) {
    return this.request<any>(`/engineers/users/${id}`, {
      method: 'DELETE',
    });
  }

  async previewSendInvitation(id: string) {
    return this.request<{
      preview: {
        engineerName: string;
        engineerEmail: string;
        invitationLink: string;
        expiresAt: string;
        expiresDate: string;
        expiresTime: string;
      };
    }>(`/engineers/users/${id}/invite/preview`, {
      method: 'POST',
    });
  }

  async sendInvitation(id: string) {
    return this.request<{ invitationLink: string; expiresAt: string; emailSent?: boolean; emailError?: string }>(`/engineers/users/${id}/invite`, {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    });
  }

  async resetEngineerPassword(id: string, newPassword?: string) {
    return this.request<any>(`/engineers/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  // Email
  async previewFollowUpEmails(engineerIds?: number[]) {
    return this.request<{
      summary: {
        totalEngineers: number;
        engineersWithTasks: number;
        totalPendingTasks: number;
        totalInProgressTasks: number;
        totalTasks: number;
      };
      preview: Array<{
        engineer: string;
        email: string;
        pendingCount: number;
        inProgressCount: number;
        totalTasks: number;
      }>;
    }>('/email/follow-up/preview', {
      method: 'POST',
      body: JSON.stringify({ engineerIds }),
    });
  }

  async sendFollowUpEmails(engineerIds?: number[]) {
    return this.request<{ message: string; results: Array<{ engineer: string; email: string; success: boolean; pendingCount: number; inProgressCount: number }> }>('/email/follow-up', {
      method: 'POST',
      body: JSON.stringify({ engineerIds, confirm: true }),
    });
  }

  // Import
  async previewImport(file: File, month?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (month) {
      formData.append('month', month);
    }

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/import/preview`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Chatbot
  async queryChatbot(query: string) {
    return this.request<{ response: string; tasks: any[]; count: number; filters: any }>('/chatbot', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  async importTasks(file: File, month: string, year: number) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('month', month);
    formData.append('year', year.toString());

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/import/import`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Reminder settings
  async getReminderSettings() {
    return this.request<{
      enabled: boolean;
      frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
      dayOfWeek: number;
      dayName: string;
    }>('/reminder/settings', {
      method: 'GET',
    });
  }

  async updateReminderSettings(settings: {
    enabled?: boolean;
    frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    dayOfWeek?: number;
  }) {
    return this.request<{
      enabled: boolean;
      frequency: string;
      dayOfWeek: number;
      dayName: string;
      message: string;
    }>('/reminder/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async testReminderEmail() {
    return this.request<{ message: string }>('/reminder/test', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();

