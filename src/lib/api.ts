// Resolve API base URL.
//   • Default: relative `/api` — works with Vite proxy in dev and with the
//     Vercel rewrite (or single-origin Render deploy) in production.
//   • Override: set VITE_API_URL (e.g. `https://my-backend.onrender.com`)
//     to call a backend on a different origin directly.
//
// Safety net: a hardcoded `http://localhost:*` value would break a production
// build on Vercel/Render, so in production we ignore any localhost override
// and fall back to the relative `/api`.
const ENV_API_URL = (import.meta.env.VITE_API_URL || '').trim();
const IS_PROD_BUILD = !import.meta.env.DEV;
const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/i.test(ENV_API_URL);
const SAFE_ENV_URL = IS_PROD_BUILD && isLocalhost ? '' : ENV_API_URL;
const RAW_API_URL = (SAFE_ENV_URL || '/api').replace(/\/+$/, '');
const API_BASE_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;

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

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (networkError: any) {
      // Browser/network error (DNS, CORS, offline, backend asleep, etc.)
      const reason =
        networkError?.message?.includes('Failed to fetch')
          ? `Cannot reach the server at ${url}. The backend may be sleeping (Render free tier wakes after ~30s on first request), offline, or blocked by CORS.`
          : networkError?.message || 'Network request failed';
      throw new ApiError(reason, 0, { url, cause: networkError?.message });
    }

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

// Uploads API — multipart file uploads (real attachments, no mocks).
// Returns array of { url, originalName, filename, size, mimeType, uploadedAt }.
export interface UploadedFile {
  url: string;
  originalName: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy?: string | null;
}

export const uploadsApi = {
  upload: async (files: File[] | FileList): Promise<UploadedFile[]> => {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return [];
    const fd = new FormData();
    for (const f of fileArr) fd.append('files', f);
    const token = api.getToken();
    const res = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
      credentials: 'include',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(
        json.message || json.error || `Upload failed (HTTP ${res.status})`,
        res.status,
        json
      );
    }
    return (json.data ?? json) as UploadedFile[];
  },
  // Build an absolute URL for a file path returned by the server. The server
  // returns "/uploads/reports/xyz.pdf"; in production with a Vercel rewrite
  // this is already proxied, but a same-origin path works in dev too.
  resolveUrl: (path: string): string => {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path;
    // /uploads/* is served by the backend root, NOT under /api
    if (path.startsWith('/uploads/')) {
      // If a custom API URL is set (different origin), point uploads there.
      if (SAFE_ENV_URL) {
        return SAFE_ENV_URL.replace(/\/+$/, '') + path;
      }
      return path;
    }
    return path;
  },
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
