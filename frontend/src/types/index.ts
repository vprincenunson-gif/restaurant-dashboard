// User & Auth
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  avatar?: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Table
export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  location?: string;
  activeOrder?: { id: string; total: number; itemCount: number } | null;
  _count?: { orders: number };
  createdAt: string;
}

// Menu
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  _count?: { items: number };
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  categoryId: string;
  category?: MenuCategory;
  image?: string;
  available: boolean;
  isPopular: boolean;
  prepTime?: number;
}

// Order
export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

export interface Order {
  id: string;
  orderNumber: number;
  tableId?: string;
  table?: { number: number };
  customerId?: string;
  customer?: { name: string; phone?: string };
  userId?: string;
  user?: { name: string };
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  type: 'dine-in' | 'takeaway' | 'delivery';
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  total: number;
  notes?: string;
  paymentMethod?: string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  items: OrderItem[];
  sale?: Sale;
  createdAt: string;
  updatedAt: string;
}

// Inventory
export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  maxStock?: number;
  costPerUnit?: number;
  supplier?: string;
  location?: string;
  expiryDate?: string;
  notes?: string;
  isLowStock?: boolean;
  stockPercentage?: number;
  isActive: boolean;
  createdAt: string;
}

// Staff
export interface Staff {
  id: string;
  userId?: string;
  user?: { email?: string; avatar?: string };
  name: string;
  email?: string;
  phone?: string;
  role: string;
  shift?: string;
  salary?: number;
  hourlyRate?: number;
  address?: string;
  emergencyContact?: string;
  joinDate: string;
  isActive: boolean;
  notes?: string;
}

// Customer
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string;
  isVip: boolean;
  _count?: { orders: number };
  orders?: Order[];
  createdAt: string;
}

// Sale
export interface Sale {
  id: string;
  orderId?: string;
  order?: Order;
  userId?: string;
  user?: { name: string };
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'refunded';
  transactionId?: string;
  notes?: string;
  saleDate: string;
}

// Analytics
export interface DashboardStats {
  todaySales: number;
  todayOrderCount: number;
  monthlyRevenue: number;
  activeOrders: number;
  availableTables: number;
  totalTables: number;
  tableOccupancy: number;
  staffCount: number;
  lowStockCount: number;
  newCustomers: number;
  orderStatusCounts: {
    pending: number;
    preparing: number;
    ready: number;
    completed: number;
    cancelled: number;
  };
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
  label: string;
}

export interface RevenueSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface TopItem {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
  revenue: number;
}

export interface PaymentDistribution {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface PeakHour {
  hour: number;
  label: string;
  orders: number;
  revenue: number;
}

export interface OrderTrend {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

export interface AIInsight {
  type: 'positive' | 'negative' | 'action' | 'trend' | 'info';
  title: string;
  message: string;
  metric?: { label: string; value: string };
}

export interface LowStockAlert {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
  unit: string;
  shortage: number;
  severity: 'critical' | 'high' | 'low';
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
