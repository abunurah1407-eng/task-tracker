const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
    return this.request<any[]>(url);
  }

  async getTask(id: string) {
    return this.request<any>(`/tasks/${id}`);
  }

  async createTask(task: any) {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
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

  async createEngineerUser(user: { name: string; email: string; color: string; sendInvitation?: boolean }) {
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

  async sendInvitation(id: string) {
    return this.request<{ invitationLink: string; expiresAt: string }>(`/engineers/users/${id}/invite`, {
      method: 'POST',
    });
  }

  async resetEngineerPassword(id: string, newPassword?: string) {
    return this.request<any>(`/engineers/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }
}

export const api = new ApiService();

