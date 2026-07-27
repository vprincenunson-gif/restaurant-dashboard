'use client';

import React, { useEffect, useState } from 'react';
import { ordersApi, menuApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import type { Order, MenuItem } from '@/types';
import { ClipboardList, Search, Plus, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const statusFilters = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await ordersApi.list(params);
      setOrders(res.orders);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const openCreateOrder = async () => {
    try {
      const res = await menuApi.listItems({ available: 'true' });
      setMenuItems(res.items);
      setShowCreateModal(true);
    } catch (err) {
      console.error('Failed to load menu items:', err);
    }
  };

  const getNextStatus = (status: string) => {
    const flow: Record<string, string> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'served',
      served: 'completed',
    };
    return flow[status];
  };

  const getStatusActionLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Confirm',
      confirmed: 'Start Preparing',
      preparing: 'Mark Ready',
      ready: 'Mark Served',
      served: 'Complete',
    };
    return labels[status];
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and track all orders</p>
        </div>
        <button onClick={openCreateOrder} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm border-none outline-none bg-transparent w-48"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1">
            {statusFilters.map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner fullPage text="Loading orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="There are no orders matching your filters."
          icon={<ClipboardList className="w-8 h-8 text-gray-400" />}
          action={
            <button onClick={openCreateOrder} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const nextStatus = getNextStatus(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.orderNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{order.table?.number || '-'}</td>
                      <td className="px-6 py-4"><StatusBadge status={order.type} /></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{order.items?.length || 0}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">${order.total.toFixed(2)}</td>
                      <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-6 py-4"><StatusBadge status={order.paymentStatus} /></td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        {nextStatus && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, nextStatus)}
                            className="btn-primary text-xs px-3 py-1.5"
                          >
                            {getStatusActionLabel(order.status)}
                          </button>
                        )}
                        {order.status === 'completed' && !order.sale && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'completed')}
                            className="btn-secondary text-xs px-3 py-1.5"
                          >
                            Process Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3 py-1.5">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3 py-1.5">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Order" size="lg">
        <CreateOrderForm
          menuItems={menuItems}
          onSuccess={() => { setShowCreateModal(false); fetchOrders(); }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </DashboardLayout>
  );
}

function CreateOrderForm({ menuItems, onSuccess, onCancel }: { menuItems: MenuItem[]; onSuccess: () => void; onCancel: () => void }) {
  const [selectedItems, setSelectedItems] = useState<{ menuItemId: string; quantity: number; notes: string }[]>([]);
  const [orderType, setOrderType] = useState('dine-in');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addItem = (menuItemId: string) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.menuItemId === menuItemId);
      if (existing) {
        return prev.map(i => i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setSelectedItems(prev => prev.map(i => {
      if (i.menuItemId === menuItemId) {
        const newQty = i.quantity + delta;
        return newQty <= 0 ? i : { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const removeItem = (menuItemId: string) => {
    setSelectedItems(prev => prev.filter(i => i.menuItemId !== menuItemId));
  };

  const total = selectedItems.reduce((sum, item) => {
    const menuItem = menuItems.find(m => m.id === item.menuItemId);
    return sum + (menuItem?.price || 0) * item.quantity;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError('Please add at least one item.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await ordersApi.create({
        type: orderType,
        items: selectedItems.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          notes: i.notes,
        })),
        notes,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create order.');
    } finally {
      setSubmitting(false);
    }
  };

  // Group menu items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    const cat = item.category?.name || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
        <div className="flex gap-2">
          {['dine-in', 'takeaway', 'delivery'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setOrderType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                orderType === type ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Menu Items</label>
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-3">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{category}</p>
              <div className="grid grid-cols-2 gap-2">
                {items.map(item => {
                  const isSelected = selectedItems.find(i => i.menuItemId === item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addItem(item.id)}
                      className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                        isSelected ? 'bg-brand-50 border-brand-300' : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="text-gray-500 ml-2">${item.price.toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Selected Items</label>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {selectedItems.map(item => {
              const menuItem = menuItems.find(m => m.id === item.menuItemId);
              return (
                <div key={item.menuItemId} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{menuItem?.name}</p>
                    <p className="text-xs text-gray-500">${((menuItem?.price || 0) * item.quantity).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => updateQuantity(item.menuItemId, -1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100">-</button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.menuItemId, 1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100">+</button>
                    <button type="button" onClick={() => removeItem(item.menuItemId)} className="text-red-500 text-xs hover:text-red-700">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end mt-2">
            <p className="text-lg font-bold text-gray-900">Total: ${total.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input-field" placeholder="Any special instructions..." />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting || selectedItems.length === 0} className="btn-primary">
          {submitting ? 'Creating...' : `Create Order - $${total.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}
