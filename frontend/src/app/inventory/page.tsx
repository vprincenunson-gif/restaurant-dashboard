'use client';

import React, { useEffect, useState } from 'react';
import { inventoryApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import type { InventoryItem, LowStockAlert } from '@/types';
import { Package, Plus, Search, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const fetchData = async () => {
    try {
      const [itemsRes, alertsRes] = await Promise.all([
        inventoryApi.list({ limit: '200' }),
        inventoryApi.getLowStockAlerts(),
      ]);
      setItems(itemsRes.items);
      setAlerts(alertsRes.alerts);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(items.map(i => i.category))];

  const handleAdjustStock = async (id: string, quantity: number, operation: string) => {
    try {
      await inventoryApi.adjustStock(id, quantity, operation);
      fetchData();
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner fullPage text="Loading inventory..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="text-gray-500 mt-1">Track stock levels and manage supplies</p>
        </div>
        <div className="flex gap-2">
          {alerts.length > 0 && (
            <button onClick={() => setShowAlertModal(true)} className="btn-secondary relative">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
              {alerts.length} Alerts
            </button>
          )}
          <button onClick={() => { setEditItem(null); setShowAddModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-sm border-none outline-none bg-transparent w-48" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
        </select>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState title="No inventory items" description="Add your first inventory item." icon={<Package className="w-8 h-8 text-gray-400" />}
          action={<button onClick={() => setShowAddModal(true)} className="btn-primary"><Plus className="w-4 h-4 mr-2" /> Add Item</button>} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Min Stock</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${item.isLowStock ? 'bg-red-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">{item.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${item.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      {item.maxStock && (
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                          <div className={`h-full rounded-full ${item.isLowStock ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min((item.quantity / item.maxStock) * 100, 100)}%` }} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.minStock} {item.unit}</td>
                    <td className="px-6 py-4">{item.isLowStock ? <StatusBadge status="low" /> : <StatusBadge status="available" />}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.supplier || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleAdjustStock(item.id, 1, 'add')} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Add stock"><TrendingUp className="w-4 h-4" /></button>
                        <button onClick={() => item.quantity > 0 && handleAdjustStock(item.id, 1, 'remove')} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="Remove stock"><TrendingDown className="w-4 h-4" /></button>
                        <button onClick={() => { setEditItem(item); setShowAddModal(true); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Alert Modal */}
      <Modal isOpen={showAlertModal} onClose={() => setShowAlertModal(false)} title="Low Stock Alerts" size="md">
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded-lg border ${alert.severity === 'critical' ? 'bg-red-50 border-red-200' : alert.severity === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{alert.name}</p>
                  <p className="text-sm text-gray-500">Stock: {alert.quantity} {alert.unit} (Min: {alert.minStock} {alert.unit})</p>
                </div>
                <StatusBadge status={alert.severity} />
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditItem(null); }} title={editItem ? 'Edit Item' : 'Add Inventory Item'} size="md">
        <InventoryForm editItem={editItem} onSuccess={() => { setShowAddModal(false); setEditItem(null); fetchData(); }} onCancel={() => { setShowAddModal(false); setEditItem(null); }} />
      </Modal>
    </DashboardLayout>
  );
}

function InventoryForm({ editItem, onSuccess, onCancel }: { editItem: InventoryItem | null; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: editItem?.name || '', sku: editItem?.sku || '', category: editItem?.category || 'other',
    quantity: editItem?.quantity.toString() || '0', unit: editItem?.unit || 'pcs',
    minStock: editItem?.minStock.toString() || '10', maxStock: editItem?.maxStock?.toString() || '',
    costPerUnit: editItem?.costPerUnit?.toString() || '', supplier: editItem?.supplier || '',
    location: editItem?.location || '', notes: editItem?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError('Name is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const data = { ...form, quantity: parseFloat(form.quantity), minStock: parseFloat(form.minStock), maxStock: form.maxStock ? parseFloat(form.maxStock) : null, costPerUnit: form.costPerUnit ? parseFloat(form.costPerUnit) : null };
      if (editItem) {
        await inventoryApi.update(editItem.id, data);
      } else {
        await inventoryApi.create(data);
      }
      onSuccess();
    } catch (err: any) { setError(err.message || 'Failed to save item.'); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">SKU</label><input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
            {['produce', 'meat', 'dairy', 'dry-goods', 'beverages', 'cleaning', 'other'].map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}</option>
            ))}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label><input type="number" step="0.1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
          <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="input-field">
            {['pcs', 'kg', 'g', 'l', 'ml', 'bag', 'box', 'carton'].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label><input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label><input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Cost/Unit</label><input type="number" step="0.01" value={form.costPerUnit} onChange={e => setForm({ ...form, costPerUnit: e.target.value })} className="input-field" /></div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="input-field" /></div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}</button>
      </div>
    </form>
  );
}
