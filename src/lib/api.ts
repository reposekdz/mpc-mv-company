const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(data.error || 'Request failed', response.status, data);
    }

    return data;
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

export const api = new ApiClient();

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// Jobs API
export const jobsApi = {
  getAll: (params?: { status?: string; type?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return api.get(`/jobs${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/jobs/${id}`),
  create: (data: unknown) => api.post('/jobs', data),
  update: (id: string, data: unknown) => api.put(`/jobs/${id}`, data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
  getStats: () => api.get('/jobs/stats'),
};

// Trucks API
export const trucksApi = {
  getAll: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return api.get(`/trucks${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/trucks/${id}`),
  create: (data: unknown) => api.post('/trucks', data),
  update: (id: string, data: unknown) => api.put(`/trucks/${id}`, data),
  delete: (id: string) => api.delete(`/trucks/${id}`),
  getStats: () => api.get('/trucks/stats'),
};

// Employees API
export const employeesApi = {
  getAll: (params?: { department?: string; payment_status?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return api.get(`/employees${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (data: unknown) => api.post('/employees', data),
  update: (id: string, data: unknown) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  getStats: () => api.get('/employees/stats'),
  processPayroll: () => api.post('/employees/process-payroll'),
};

// Reports API
export const reportsApi = {
  getAll: (params?: { type?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return api.get(`/reports${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/reports/${id}`),
  create: (data: unknown) => api.post('/reports', data),
  update: (id: string, data: unknown) => api.put(`/reports/${id}`, data),
  delete: (id: string) => api.delete(`/reports/${id}`),
  getStats: () => api.get('/reports/stats'),
};

// Consulting API
export const consultingApi = {
  getAll: (params?: { category?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return api.get(`/consulting${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/consulting/${id}`),
  create: (data: unknown) => api.post('/consulting', data),
  update: (id: string, data: unknown) => api.put(`/consulting/${id}`, data),
  delete: (id: string) => api.delete(`/consulting/${id}`),
  addReply: (topicId: string, data: unknown) => api.post(`/consulting/${topicId}/replies`, data),
  deleteReply: (replyId: string) => api.delete(`/consulting/replies/${replyId}`),
};

// Meetings API
export const meetingsApi = {
  getAll: (params?: { status?: string; dateFrom?: string; dateTo?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return api.get(`/meetings${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/meetings/${id}`),
  create: (data: unknown) => api.post('/meetings', data),
  update: (id: string, data: unknown) => api.put(`/meetings/${id}`, data),
  delete: (id: string) => api.delete(`/meetings/${id}`),
  getUpcoming: () => api.get('/meetings/upcoming'),
};

// Analytics API
export const analyticsApi = {
  getAll: () => api.get('/analytics'),
  getDashboard: () => api.get('/analytics/dashboard'),
  getTrends: () => api.get('/analytics/trends'),
  create: (data: unknown) => api.post('/analytics', data),
};
