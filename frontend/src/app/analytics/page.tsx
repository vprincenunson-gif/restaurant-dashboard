'use client';

import React, { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatCard from '@/components/ui/StatCard';
import type { RevenueDataPoint, TopItem, PaymentDistribution, PeakHour, OrderTrend, AIInsight } from '@/types';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Sparkles } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function AnalyticsPage() {
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<any>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [paymentDist, setPaymentDist] = useState<PaymentDistribution[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [orderTrends, setOrderTrends] = useState<OrderTrend[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAIPowered, setIsAIPowered] = useState(false);
  const [period, setPeriod] = useState('7');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [rev, items, pay, peak, trends, ai] = await Promise.all([
          analyticsApi.getRevenue({ days: period }),
          analyticsApi.getTopItems({ limit: '10', days: period }),
          analyticsApi.getPaymentDistribution({ days: period }),
          analyticsApi.getPeakHours({ days: period }),
          analyticsApi.getOrderTrends({ days: period }),
          analyticsApi.getAIInsights().catch(() => ({ insights: [], isAIPowered: false })),
        ]);
        setRevenueData(rev.revenueData);
        setRevenueSummary(rev.summary);
        setTopItems(items.topItems);
        setPaymentDist(pay.distribution);
        setPeakHours(peak.peakHours);
        setOrderTrends(trends.trends);
        setInsights(ai.insights);
        setIsAIPowered(ai.isAIPowered);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [period]);

  if (loading) return <DashboardLayout><LoadingSpinner fullPage text="Loading analytics..." /></DashboardLayout>;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value?.toFixed?.(2) || entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-gray-500 mt-1">Detailed insights into your restaurant performance</p>
        </div>
        <div className="flex gap-2">
          {['7', '30', '90'].map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === d ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {d === '7' ? '7 Days' : d === '30' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className={`w-5 h-5 ${isAIPowered ? 'text-brand-600' : 'text-gray-400'}`} />
            <h2 className="text-lg font-semibold text-gray-900">{isAIPowered ? 'AI-Generated Insights' : 'Key Insights'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {insights.map((insight, i) => (
              <div key={i} className="card p-4 border-l-4"
                style={{ borderLeftColor: insight.type === 'positive' ? '#22c55e' : insight.type === 'negative' ? '#ef4444' : insight.type === 'action' ? '#3b82f6' : '#eab308' }}>
                <p className="font-medium text-sm text-gray-900">{insight.title}</p>
                <p className="text-xs text-gray-500 mt-1">{insight.message}</p>
                {insight.metric && <div className="mt-2 flex items-center gap-2 text-sm"><span className="text-gray-400">{insight.metric.label}:</span><span className="font-semibold">{insight.metric.value}</span></div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {revenueSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Revenue" value={`$${revenueSummary.totalRevenue.toFixed(2)}`} icon={DollarSign} color="green" />
          <StatCard title="Total Orders" value={revenueSummary.totalOrders} icon={ShoppingCart} color="blue" />
          <StatCard title="Avg Order Value" value={`$${revenueSummary.averageOrderValue.toFixed(2)}`} icon={TrendingUp} color="purple" />
          <StatCard title="Top Period" value={revenueData.reduce((max, d) => d.revenue > max.revenue ? d : max, revenueData[0])?.label || '-'} icon={BarChart3} color="indigo" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Revenue Trend</h3></div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Orders Trend */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Orders Trend</h3></div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Top Selling Items</h3></div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItems.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" width={90} />
                  <Tooltip formatter={(value: number) => [value, 'Sold']} />
                  <Bar dataKey="quantity" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Payment Distribution */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Payment Methods</h3></div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="amount" nameKey="method">
                    {paymentDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Peak Hours</h3></div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={peakHours.filter(h => h.orders > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="orders" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} name="Orders" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Order Trends Over Time</h3></div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={orderTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" tickFormatter={(val) => val?.slice(5) || ''} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" dot={false} />
                  <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} name="Completed" dot={false} />
                  <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} name="Cancelled" dot={false} />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Top Items Table */}
      {topItems.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Item Performance</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {topItems.map((item, i) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{i + 1}. {item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">${item.price.toFixed(2)}</td>
                    <td className="px-6 py-4"><span className="font-semibold text-gray-900">{item.quantity}</span></td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">${item.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
