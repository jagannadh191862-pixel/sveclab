import {
  User,
  Lab,
  TimeSlot,
  Booking,
  Department,
  Year,
  BatchSection,
  Subject,
  Faculty,
  ScheduleResponse,
  AuditLog,
  SystemSettings
} from '../types';

const API_BASE = '/api';

function getAuthToken(): string | null {
  return localStorage.getItem('svec_auth_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        // Clear token on 401 session expiry
        localStorage.removeItem('svec_auth_token');
        localStorage.removeItem('svec_auth_user');
      }
      throw new Error(data.error || 'Request failed');
    }
    return data as T;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  return {} as T;
}

export const api = {
  // Public
  getPublicSettings: () => request<{ success: boolean; settings: SystemSettings }>('/settings/public'),

  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData: any) =>
    request<{ success: boolean; message: string; verificationToken?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  verifyEmail: (token: string) =>
    request<{ success: boolean; message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getProfile: () => request<{ success: boolean; user: User }>('/auth/me'),

  updateProfile: (data: { name: string; department_id?: number | null }) =>
    request<{ success: boolean; message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Schedule
  getSchedule: (params: { date?: string; department?: string; lab_id?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.department) query.set('department', params.department);
    if (params.lab_id) query.set('lab_id', String(params.lab_id));
    if (params.search) query.set('search', params.search);
    return request<ScheduleResponse>(`/schedule?${query.toString()}`);
  },

  // Labs
  getLabs: (params?: { department?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return request<{ success: boolean; count: number; labs: Lab[] }>(`/labs?${query.toString()}`);
  },

  getLabById: (id: number) =>
    request<{ success: boolean; lab: Lab; upcomingBookings: any[] }>(`/labs/${id}`),

  createLab: (labData: Partial<Lab>) =>
    request<{ success: boolean; message: string; lab: Lab }>('/labs', {
      method: 'POST',
      body: JSON.stringify(labData),
    }),

  updateLab: (id: number, labData: Partial<Lab>) =>
    request<{ success: boolean; message: string; lab: Lab }>(`/labs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(labData),
    }),

  toggleLabStatus: (id: number) =>
    request<{ success: boolean; message: string; newStatus: string }>(`/labs/${id}/toggle`, {
      method: 'PATCH',
    }),

  // Bookings
  createBooking: (bookingData: any) =>
    request<{ success: boolean; message: string; booking: Booking }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),

  getMyBookings: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return request<{ success: boolean; count: number; bookings: Booking[] }>(`/bookings/my?${query.toString()}`);
  },

  getAllBookings: (params?: any) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
      });
    }
    return request<{ success: boolean; total: number; page: number; totalPages: number; bookings: Booking[] }>(
      `/bookings/all?${query.toString()}`
    );
  },

  cancelBooking: (id: number, reason?: string) =>
    request<{ success: boolean; message: string; bookingId: string }>(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  adminUpdateBooking: (id: number, payload: any) =>
    request<{ success: boolean; message: string; booking: Booking }>(`/bookings/${id}/admin-update`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  adminDeleteBooking: (id: number, reason?: string) =>
    request<{ success: boolean; message: string }>(`/bookings/${id}/admin-delete`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }),

  // Master Data
  getDepartments: () => request<{ success: boolean; departments: Department[] }>('/master/departments'),
  createDepartment: (data: { code: string; name: string }) =>
    request<{ success: boolean; department: Department }>('/master/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDepartment: (id: number, data: Partial<Department>) =>
    request<{ success: boolean; department: Department }>(`/master/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getYears: () => request<{ success: boolean; years: Year[] }>('/master/years'),
  createYear: (data: { year_name: string; display_order?: number }) =>
    request<{ success: boolean; year: Year }>('/master/years', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateYear: (id: number, data: Partial<Year>) =>
    request<{ success: boolean; year: Year }>(`/master/years/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getBatches: (params?: { department_id?: number; year_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.department_id) query.set('department_id', String(params.department_id));
    if (params?.year_id) query.set('year_id', String(params.year_id));
    return request<{ success: boolean; batches: BatchSection[] }>(`/master/batches?${query.toString()}`);
  },
  createBatch: (data: { department_id: number; year_id: number; section_name: string }) =>
    request<{ success: boolean; batch: BatchSection }>('/master/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBatch: (id: number, data: Partial<BatchSection>) =>
    request<{ success: boolean; batch: BatchSection }>(`/master/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getSubjects: (params?: { department_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.department_id) query.set('department_id', String(params.department_id));
    return request<{ success: boolean; subjects: Subject[] }>(`/master/subjects?${query.toString()}`);
  },
  createSubject: (data: { code: string; name: string; department_id: number }) =>
    request<{ success: boolean; subject: Subject }>('/master/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSubject: (id: number, data: Partial<Subject>) =>
    request<{ success: boolean; subject: Subject }>(`/master/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getFaculty: (params?: { department_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.department_id) query.set('department_id', String(params.department_id));
    return request<{ success: boolean; faculty: Faculty[] }>(`/master/faculty?${query.toString()}`);
  },
  createFaculty: (data: { name: string; department_id: number; email?: string; designation?: string }) =>
    request<{ success: boolean; faculty: Faculty }>('/master/faculty', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFaculty: (id: number, data: Partial<Faculty>) =>
    request<{ success: boolean; faculty: Faculty }>(`/master/faculty/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getTimeSlots: () => request<{ success: boolean; slots: TimeSlot[] }>('/master/time-slots'),
  updateTimeSlot: (id: number, data: { start_time: string; end_time: string }) =>
    request<{ success: boolean; slot: TimeSlot }>(`/master/time-slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Reports
  getDailyScheduleReport: (params: { date?: string; department_id?: any; lab_id?: any }) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.department_id) query.set('department_id', String(params.department_id));
    if (params.lab_id) query.set('lab_id', String(params.lab_id));
    return request<{ success: boolean; date: string; total: number; records: any[] }>(`/reports/daily-schedule?${query.toString()}`);
  },

  getDateRangeReport: (params: { startDate?: string; endDate?: string; department_id?: any; lab_id?: any; status?: string }) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.department_id) query.set('department_id', String(params.department_id));
    if (params.lab_id) query.set('lab_id', String(params.lab_id));
    if (params.status) query.set('status', params.status);
    return request<{ success: boolean; startDate: string; endDate: string; total: number; records: any[] }>(`/reports/date-range?${query.toString()}`);
  },

  getLabUtilizationReport: (params: { startDate?: string; endDate?: string; department_id?: any }) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.department_id) query.set('department_id', String(params.department_id));
    return request<{ success: boolean; startDate: string; endDate: string; daysCount: number; records: any[] }>(`/reports/lab-utilization?${query.toString()}`);
  },

  getFacultyUsageReport: (params: { startDate?: string; endDate?: string; department_id?: any }) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.department_id) query.set('department_id', String(params.department_id));
    return request<{ success: boolean; startDate: string; endDate: string; total: number; records: any[] }>(`/reports/faculty-usage?${query.toString()}`);
  },

  getDepartmentUsageReport: (params: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    return request<{ success: boolean; records: any[] }>(`/reports/department-usage?${query.toString()}`);
  },

  getCancelledBookingsReport: (params: { startDate?: string; endDate?: string; department_id?: any; lab_id?: any }) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.department_id) query.set('department_id', String(params.department_id));
    if (params.lab_id) query.set('lab_id', String(params.lab_id));
    return request<{ success: boolean; startDate: string; endDate: string; total: number; records: any[] }>(`/reports/cancelled?${query.toString()}`);
  },

  // Audit Logs
  getAuditLogs: (params?: { booking_id?: string; action?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.booking_id) query.set('booking_id', params.booking_id);
    if (params?.action) query.set('action', params.action);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{ success: boolean; total: number; page: number; totalPages: number; logs: AuditLog[] }>(`/audit-logs?${query.toString()}`);
  },

  // Users
  getUsers: (params?: { role?: string; status?: string; department_id?: any; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.status) query.set('status', params.status);
    if (params?.department_id) query.set('department_id', String(params.department_id));
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{ success: boolean; total: number; page: number; totalPages: number; users: User[] }>(`/users?${query.toString()}`);
  },

  updateUserStatus: (id: number, status: 'active' | 'inactive') =>
    request<{ success: boolean; message: string }>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updateUserRole: (id: number, role: 'user' | 'administrator') =>
    request<{ success: boolean; message: string }>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  // Settings
  getAdminSettings: () => request<{ success: boolean; settings: SystemSettings }>('/settings'),
  updateSettings: (settings: Partial<SystemSettings>) =>
    request<{ success: boolean; message: string; settings: SystemSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};
