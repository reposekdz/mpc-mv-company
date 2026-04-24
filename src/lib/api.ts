const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        json.message || json.error || `HTTP ${response.status}: Request failed`,
        response.status,
        json
      );
    }

    // Unwrap { success: true, data: ... } API envelope automatically
    return (json.data !== undefined ? json.data : json) as T;
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export { ApiError };
export const api = new ApiClient();

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', credentials),
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post('/auth/register', data),
  getCurrentUser: () => api.get<{ user: any }>('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken?: string }>('/auth/refresh', { refreshToken }),
};

// Jobs API
export const jobsApi = {
  getAll: (params?: { status?: string; type?: string; search?: string }) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([_, v]) => v))
    ).toString();
    return api.get<any[]>(`/jobs${query ? `?${query}` : ''}`);
  },
  getById: (id: string | number) => api.get<any>(`/jobs/${id}`),
  create: (data: unknown) => api.post<any>('/jobs', data),
  update: (id: string | number, data: unknown) => api.put<any>(`/jobs/${id}`, data),
  delete: (id: string | number) => api.delete<any>(`/jobs/${id}`),
  getStats: () => api.get<any>('/jobs/stats'),
};

// Trucks API
export const trucksApi = {
  getAll: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([_, v]) => v))
    ).toString();
    return api.get<any[]>(`/trucks${query ? `?${query}` : ''}`);
  },
  getById: (id: string | number) => api.get<any>(`/trucks/${id}`),
  create: (data: unknown) => api.post<any>('/trucks', data),
  update: (id: string | number, data: unknown) => api.put<any>(`/trucks/${id}`, data),
  delete: (id: string | number) => api.delete<any>(`/trucks/${id}`),
  getStats: () => api.get<any>('/trucks/stats'),
};

// Employees API
export const employeesApi = {
  getAll: (params?: { department?: string; payment_status?: string; search?: string }) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([_, v]) => v))
    ).toString();
    return api.get<any[]>(`/employees${query ? `?${query}` : ''}`);
  },
  getById: (id: string | number) => api.get<any>(`/employees/${id}`),
  create: (data: unknown) => api.post<any>('/employees', data),
  update: (id: string | number, data: unknown) => api.put<any>(`/employees/${id}`, data),
  delete: (id: string | number) => api.delete<any>(`/employees/${id}`),
  getStats: () => api.get<any>('/employees/stats'),
  processPayroll: () => api.post<any>('/employees/process-payroll'),
};

// Reports API
export const reportsApi = {
  getAll: (params?: { type?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([_, v]) => v))
    ).toString();
    return api.get<any[]>(`/reports${query ? `?${query}` : ''}`);
  },
  getById: (id: string | number) => api.get<any>(`/reports/${id}`),
  create: (data: unknown) => api.post<any>('/reports', data),
  update: (id: string | number, data: unknown) => api.put<any>(`/reports/${id}`, data),
  delete: (id: string | number) => api.delete<any>(`/reports/${id}`),
  getStats: () => api.get<any>('/reports/stats'),
};

// Consulting API
export const consultingApi = {
  getAll: (params?: { category?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([_, v]) => v))
    ).toString();
    return api.get<any[]>(`/consulting${query ? `?${query}` : ''}`);
  },
  getById: (id: string | number) => api.get<any>(`/consulting/${id}`),
  create: (data: unknown) => api.post<any>('/consulting', data),
  update: (id: string | number, data: unknown) => api.put<any>(`/consulting/${id}`, data),
  delete: (id: string | number) => api.delete<any>(`/consulting/${id}`),
  addReply: (topicId: string | number, data: unknown) =>
    api.post<any>(`/consulting/${topicId}/replies`, data),
  deleteReply: (replyId: string | number) => api.delete<any>(`/consulting/replies/${replyId}`),
};

// Meetings API
export const meetingsApi = {
  getAll: (params?: { status?: string; dateFrom?: string; dateTo?: string; search?: string }) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([_, v]) => v))
    ).toString();
    return api.get<any[]>(`/meetings${query ? `?${query}` : ''}`);
  },
  getById: (id: string | number) => api.get<any>(`/meetings/${id}`),
  create: (data: unknown) => api.post<any>('/meetings', data),
  update: (id: string | number, data: unknown) => api.put<any>(`/meetings/${id}`, data),
  delete: (id: string | number) => api.delete<any>(`/meetings/${id}`),
  getUpcoming: () => api.get<any[]>('/meetings/upcoming'),
  addNotes: (id: string | number, notes: string) =>
    api.patch<any>(`/meetings/${id}`, { notes }),
};

// Analytics API
export const analyticsApi = {
  getAll: () => api.get<any[]>('/analytics'),
  getDashboard: () => api.get<any>('/analytics/dashboard'),
  getTrends: () => api.get<any>('/analytics/trends'),
  create: (data: unknown) => api.post<any>('/analytics', data),
};

// Contact API
export const contactApi = {
  submit: (data: {
    name: string;
    email: string;
    phone?: string;
    serviceType?: string;
    subject: string;
    message: string;
  }) => api.post<any>('/contact', data),
  getAll: () => api.get<any[]>('/contact'),
  markAsRead: (id: string | number) => api.put<any>(`/contact/${id}/read`, {}),
  delete: (id: string | number) => api.delete<any>(`/contact/${id}`),
};
