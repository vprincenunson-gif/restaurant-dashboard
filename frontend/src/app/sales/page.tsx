'use client';

import React, { useEffect, useState } from 'react';
import { salesApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import type { Sale } from '@/types';
import { DollarSign, Search, Filter, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [paymentFilter, setPaymentFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (paymentFilter) params.paymentMethod = paymentFilter;
      const res = await salesApi.list(params);
      setSales(res.sales);
      setSummary(res.summary);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSales(); }, [page, paymentFilter]);

  const handleVoid = async (id: string) => {
    if (window.confirm('Are you sure you want to void this sale?')) {
      try {
        await salesApi.voidSale(id);
        fetchSales();
      } catch (err) {
        console.error('Failed to void sale:', err);
      }
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner fullPage text="Loading sales..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="text-gray-500 mt-1">Track revenue and payment records</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary"><Plus className="w-4 h-4 mr-2" /> Record Sale</button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat-card"><p className="stat-value text-brand-600">${summary.totalAmount.toFixed(2)}</p><p className="stat-label">Total Revenue (This Page)</p></div>
          <div className="stat-card"><p className="stat-value">{summary.totalSales}</p><p className="stat-label">Total Transactions</p></div>
          <div className="stat-card"><p className="stat-value">${summary.totalSales ? (summary.totalAmount / summary.totalSales).toFixed(2) : '0.00'}</p><p className="stat-label">Average Order Value</p></div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search transactions..." className="text-sm border-none outline-none bg-transparent w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {['', 'cash', 'card', 'upi'].map(method => (
            <button key={method} onClick={() => { setPaymentFilter(method); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${paymentFilter === method ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
              {method ? method.charAt(0).toUpperCase() + method.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {sales.length === 0 ? (
        <EmptyState title="No sales found" description="Sales records appear when orders are completed." icon={<DollarSign className="w-8 h-8 text-gray-400" />} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Staff</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(sale.saleDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{sale.order?.orderNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">${sale.amount.toFixed(2)}</td>
                    <td className="px-6 py-4"><StatusBadge status={sale.paymentMethod} /></td>
                    <td className="px-6 py-4"><StatusBadge status={sale.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{sale.user?.name || '-'}</td>
                    <td className="px-6 py-4">
                      {sale.status === 'completed' && (
                        <button onClick={() => handleVoid(sale.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Void</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3 py-1.5"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3 py-1.5"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Record Sale Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Record Sale" size="sm">
        <SaleForm onSuccess={() => { setShowAddModal(false); fetchSales(); }} onCancel={() => setShowAddModal(false)} />
      </Modal>
    </DashboardLayout>
  );
}

function SaleForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setError('Valid amount is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await salesApi.create({ amount: parseFloat(amount), paymentMethod });
      onSuccess();
    } catch (err: any) { setError(err.message || 'Failed to record sale.'); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label><input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input-field" placeholder="0.00" /></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="input-field">
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
          <option value="online">Online</option>
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Recording...' : 'Record Sale'}</button>
      </div>
    </form>
  );
}
