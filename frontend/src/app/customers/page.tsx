'use client';

import React, { useEffect, useState } from 'react';
import { customersApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import type { Customer } from '@/types';
import { UserCircle, Search, Plus, Star, Phone, Mail, ChevronRight } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showVipOnly, setShowVipOnly] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchCustomers = async () => {
    try {
      const params: any = { limit: '100' };
      if (showVipOnly) params.isVip = 'true';
      const res = await customersApi.list(params);
      setCustomers(res.customers);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [showVipOnly]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  if (loading) return <DashboardLayout><LoadingSpinner fullPage text="Loading customers..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-gray-500 mt-1">View customer history and preferences</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary"><Plus className="w-4 h-4 mr-2" /> Add Customer</button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-sm border-none outline-none bg-transparent w-48" />
        </div>
        <button onClick={() => setShowVipOnly(!showVipOnly)} className={`px-4 py-2 rounded-lg text-sm font-medium border ${showVipOnly ? 'bg-yellow-50 text-yellow-700 border-yellow-300' : 'bg-white text-gray-600 border-gray-200'}`}>
          <Star className="w-4 h-4 inline mr-1" /> VIP Only
        </button>
      </div>

      {filteredCustomers.length === 0 ? (
        <EmptyState title="No customers found" description="Customer profiles appear when orders are placed." icon={<UserCircle className="w-8 h-8 text-gray-400" />} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => (
            <div key={customer.id} className="card p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCustomer(customer)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-bold">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                      {customer.isVip && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <p className="text-xs text-gray-500">{customer._count?.orders || 0} visits</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Total Spent</p>
                  <p className="font-semibold text-gray-900">${customer.totalSpent.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Visits</p>
                  <p className="font-semibold text-gray-900">{customer.totalVisits}</p>
                </div>
              </div>
              {customer.lastVisit && (
                <p className="mt-3 text-xs text-gray-400">Last visit: {new Date(customer.lastVisit).toLocaleDateString()}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Customer Detail Modal */}
      <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title={selectedCustomer?.name || ''} size="lg">
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  {selectedCustomer.email && <span className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{selectedCustomer.email}</span>}
                  {selectedCustomer.phone && <span className="text-sm text-gray-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{selectedCustomer.phone}</span>}
                </div>
              </div>
              {selectedCustomer.isVip && <StatusBadge status="active" />}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-900">{selectedCustomer.totalVisits}</p><p className="text-sm text-gray-500">Visits</p></div>
              <div className="text-center p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-900">${selectedCustomer.totalSpent.toFixed(2)}</p><p className="text-sm text-gray-500">Total Spent</p></div>
              <div className="text-center p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-900">${selectedCustomer.totalVisits ? (selectedCustomer.totalSpent / selectedCustomer.totalVisits).toFixed(2) : '0.00'}</p><p className="text-sm text-gray-500">Avg/Visit</p></div>
            </div>
            {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Recent Orders</h4>
                <div className="space-y-2">
                  {selectedCustomer.orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order #{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">${order.total.toFixed(2)}</span>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Customer Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Customer" size="sm">
        <CustomerForm onSuccess={() => { setShowAddModal(false); fetchCustomers(); }} onCancel={() => setShowAddModal(false)} />
      </Modal>
    </DashboardLayout>
  );
}

function CustomerForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { setError('Name is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await customersApi.create({ name, email, phone });
      onSuccess();
    } catch (err: any) { setError(err.message || 'Failed to create customer.'); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={name} onChange={e => setName(e.target.value)} className="input-field" /></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" /></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="input-field" /></div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Adding...' : 'Add Customer'}</button>
      </div>
    </form>
  );
}
