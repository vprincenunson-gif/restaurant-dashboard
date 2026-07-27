'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { analyticsApi, ordersApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import type { DashboardStats, Order, AIInsight } from '@/types';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  Users,
  Package,
  AlertTriangle,
  UserPlus,
  Target,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAIPowered, setIsAIPowered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes, revenueRes, insightsRes] = await Promise.all([
          analyticsApi.getDashboardStats(),
          ordersApi.list({ limit: '5' }),
          analyticsApi.getRevenue({ days: '7' }),
          analyticsApi.getAIInsights().catch(() => ({ insights: [], isAIPowered: false })),
        ]);

        setStats(statsRes.stats);
        setRecentOrders(ordersRes.orders);
        setRevenueData(revenueRes.revenueData);
        setInsights(insightsRes.insights);
        setIsAIPowered(insightsRes.isAIPowered);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <DashboardLayout><LoadingSpinner fullPage text="Loading dashboard..." /></DashboardLayout>;

  const orderStatusData = stats ? [
    { name: 'Pending', value: stats.orderStatusCounts.pending, color: '#eab308' },
    { name: 'Preparing', value: stats.orderStatusCounts.preparing, color: '#6366f1' },
    { name: 'Ready', value: stats.orderStatusCounts.ready, color: '#22c55e' },
    { name: 'Completed', value: stats.orderStatusCounts.completed, color: '#6b7280' },
    { name: 'Cancelled', value: stats.orderStatusCounts.cancelled, color: '#ef4444' },
  ] : [];

  return (
    <DashboardLayout>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="page-title">Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'}, {user?.name}!</h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening at your restaurant today.</p>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isAIPowered ? 'AI Insights' : 'Insights'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, i) => (
              <div key={i} className="card p-4 border-l-4"
                style={{
                  borderLeftColor: insight.type === 'positive' ? '#22c55e' :
                    insight.type === 'negative' ? '#ef4444' :
                    insight.type === 'action' ? '#3b82f6' : '#eab308'
                }}
              >
                <p className="font-medium text-sm text-gray-900">{insight.title}</p>
                <p className="text-xs text-gray-500 mt-1">{insight.message}</p>
                {insight.metric && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-gray-400">{insight.metric.label}:</span>
                    <span className="font-semibold text-gray-900">{insight.metric.value}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Revenue"
          value={`$${stats?.todaySales.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          color="green"
          onClick={() => window.location.href = '/sales'}
        />
        <StatCard
          title="Active Orders"
          value={stats?.activeOrders || 0}
          icon={ShoppingCart}
          color="blue"
          onClick={() => window.location.href = '/orders'}
        />
        <StatCard
          title="Table Occupancy"
          value={stats ? `${Math.round(stats.tableOccupancy)}%` : '0%'}
          icon={Target}
          color="purple"
          trend={{ value: stats?.tableOccupancy ? Math.round(stats.tableOccupancy / 10) : 0, isPositive: (stats?.tableOccupancy || 0) > 50 }}
        />
        <StatCard
          title="Staff on Duty"
          value={stats?.staffCount || 0}
          icon={Users}
          color="indigo"
          onClick={() => window.location.href = '/staff'}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats?.monthlyRevenue.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Orders Today"
          value={stats?.todayOrderCount || 0}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockCount || 0}
          icon={AlertTriangle}
          color="red"
          onClick={() => window.location.href = '/inventory'}
        />
        <StatCard
          title="New Customers"
          value={stats?.newCustomers || 0}
          icon={UserPlus}
          color="yellow"
          onClick={() => window.location.href = '/customers'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Weekly Revenue</h3>
          </div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#revenueGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Today&apos;s Orders by Status</h3>
          </div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {orderStatusData.filter(d => d.value > 0).map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-500">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
          <button onClick={() => window.location.href = '/orders'} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Table</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.orderNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.table?.number || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.items?.length || 0} items</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${order.total.toFixed(2)}</td>
                  <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
