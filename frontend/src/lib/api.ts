const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Build URL with query params
  let url = `${API_URL}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const { params, ...fetchOptions } = options;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string, phone?: string) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    }),
  googleLogin: (credential: string) =>
    request<{ user: any; token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),
  getProfile: () => request<{ user: any }>('/auth/me'),
  updateProfile: (data: any) =>
    request<{ user: any }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Orders API
export const ordersApi = {
  list: (params?: Record<string, any>) =>
    request<{ orders: any[]; pagination: any }>('/orders', { params }),
  getById: (id: string) => request<{ order: any }>(`/orders/${id}`),
  create: (data: any) =>
    request<{ order: any }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: string, status: string) =>
    request<{ order: any }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  update: (id: string, data: any) =>
    request<{ order: any }>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getStatusCounts: () => request<{ counts: any }>('/orders/status-counts'),
  delete: (id: string) => request<{ message: string }>(`/orders/${id}`, { method: 'DELETE' }),
};

// Tables API
export const tablesApi = {
  list: (params?: Record<string, any>) =>
    request<{ tables: any[] }>('/tables', { params }),
  getById: (id: string) => request<{ table: any }>(`/tables/${id}`),
  create: (data: any) =>
    request<{ table: any }>('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ table: any }>(`/tables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<{ message: string }>(`/tables/${id}`, { method: 'DELETE' }),
};

// Inventory API
export const inventoryApi = {
  list: (params?: Record<string, any>) =>
    request<{ items: any[]; pagination: any }>('/inventory', { params }),
  getById: (id: string) => request<{ item: any }>(`/inventory/${id}`),
  create: (data: any) =>
    request<{ item: any }>('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ item: any }>(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  adjustStock: (id: string, quantity: number, operation?: string) =>
    request<{ item: any }>(`/inventory/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity, operation }),
    }),
  delete: (id: string) => request<{ message: string }>(`/inventory/${id}`, { method: 'DELETE' }),
  getLowStockAlerts: () => request<{ alerts: any[]; count: number }>('/inventory/low-stock'),
};

// Staff API
export const staffApi = {
  list: (params?: Record<string, any>) =>
    request<{ staff: any[]; pagination: any }>('/staff', { params }),
  getById: (id: string) => request<{ staff: any }>(`/staff/${id}`),
  create: (data: any) =>
    request<{ staff: any }>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ staff: any }>(`/staff/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<{ message: string }>(`/staff/${id}`, { method: 'DELETE' }),
  getStats: () => request<{ stats: any }>('/staff/stats'),
};

// Customers API
export const customersApi = {
  list: (params?: Record<string, any>) =>
    request<{ customers: any[]; pagination: any }>('/customers', { params }),
  getById: (id: string) => request<{ customer: any }>(`/customers/${id}`),
  create: (data: any) =>
    request<{ customer: any }>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ customer: any }>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<{ message: string }>(`/customers/${id}`, { method: 'DELETE' }),
};

// Sales API
export const salesApi = {
  list: (params?: Record<string, any>) =>
    request<{ sales: any[]; summary: any; pagination: any }>('/sales', { params }),
  getById: (id: string) => request<{ sale: any }>(`/sales/${id}`),
  create: (data: any) =>
    request<{ sale: any }>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ sale: any }>(`/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getTodaySummary: () => request<{ summary: any }>('/sales/today'),
  voidSale: (id: string) =>
    request<{ sale: any }>(`/sales/${id}/void`, { method: 'PATCH' }),
};

// Analytics API
export const analyticsApi = {
  getDashboardStats: () => request<{ stats: DashboardStats }>('/analytics/dashboard'),
  getRevenue: (params?: Record<string, any>) =>
    request<{ revenueData: RevenueDataPoint[]; summary: RevenueSummary }>('/analytics/revenue', { params }),
  getTopItems: (params?: Record<string, any>) =>
    request<{ topItems: TopItem[] }>('/analytics/top-items', { params }),
  getPaymentDistribution: (params?: Record<string, any>) =>
    request<{ distribution: PaymentDistribution[]; total: number }>('/analytics/payment-distribution', { params }),
  getPeakHours: (params?: Record<string, any>) =>
    request<{ peakHours: PeakHour[] }>('/analytics/peak-hours', { params }),
  getOrderTrends: (params?: Record<string, any>) =>
    request<{ trends: OrderTrend[] }>('/analytics/order-trends', { params }),
  getAIInsights: () => request<{ insights: AIInsight[]; isAIPowered: boolean }>('/analytics/ai-insights'),
};

// Menu API
export const menuApi = {
  listItems: (params?: Record<string, any>) =>
    request<{ items: MenuItem[]; pagination: any }>('/menu/items', { params }),
  createItem: (data: any) =>
    request<{ item: MenuItem }>('/menu/items', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id: string, data: any) =>
    request<{ item: MenuItem }>(`/menu/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteItem: (id: string) => request<{ message: string }>(`/menu/items/${id}`, { method: 'DELETE' }),
  listCategories: () => request<{ categories: MenuCategory[] }>('/menu/categories'),
  createCategory: (data: any) =>
    request<{ category: MenuCategory }>('/menu/categories', { method: 'POST', body: JSON.stringify(data) }),
};

// Utility: set auth token
export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

// Need to import types at top - these are used in the analytics API return types
import type { DashboardStats, RevenueDataPoint, RevenueSummary, TopItem, PaymentDistribution, PeakHour, OrderTrend, AIInsight, MenuItem, MenuCategory } from '@/types';
