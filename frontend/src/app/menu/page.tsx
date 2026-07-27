'use client';

import React, { useEffect, useState } from 'react';
import { menuApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import type { MenuItem, MenuCategory } from '@/types';
import { UtensilsCrossed, Plus, Search, Edit2, Eye, EyeOff } from 'lucide-react';

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        menuApi.listItems({ limit: '200' }),
        menuApi.listCategories(),
      ]);
      setItems(itemsRes.items);
      setCategories(catsRes.categories);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await menuApi.updateItem(item.id, { available: !item.available });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    const catName = item.category?.name || 'Other';
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) return <DashboardLayout><LoadingSpinner fullPage text="Loading menu..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Menu</h1>
          <p className="text-gray-500 mt-1">Manage your restaurant menu items</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddCategory(true)} className="btn-secondary">
            <Plus className="w-4 h-4 mr-2" /> Category
          </button>
          <button onClick={() => setShowAddItem(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-sm border-none outline-none bg-transparent w-48" />
        </div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input-field w-auto">
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      {Object.keys(groupedItems).length === 0 ? (
        <EmptyState title="No menu items" description="Add your first menu item to get started." icon={<UtensilsCrossed className="w-8 h-8 text-gray-400" />}
          action={<button onClick={() => setShowAddItem(true)} className="btn-primary"><Plus className="w-4 h-4 mr-2" /> Add Item</button>}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
            <div key={categoryName}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{categoryName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryItems.map(item => (
                  <div key={item.id} className={`card p-4 ${!item.available ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          {item.isPopular && <span className="badge-success text-xs">Popular</span>}
                        </div>
                        {item.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-lg font-bold text-gray-900">${item.price.toFixed(2)}</span>
                          {item.prepTime && <span className="text-xs text-gray-400">{item.prepTime} min</span>}
                        </div>
                      </div>
                      <button onClick={() => toggleAvailability(item)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={item.available ? 'Hide from menu' : 'Show on menu'}>
                        {item.available ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeOff className="w-4 h-4 text-red-400" />}
                      </button>
                    </div>
                    {item.cost && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                        <span>Cost: ${item.cost.toFixed(2)}</span>
                        <span>Margin: {((1 - item.cost / item.price) * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      <Modal isOpen={showAddItem} onClose={() => setShowAddItem(false)} title="Add Menu Item" size="md">
        <AddItemForm categories={categories} onSuccess={() => { setShowAddItem(false); fetchData(); }} onCancel={() => setShowAddItem(false)} />
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={showAddCategory} onClose={() => setShowAddCategory(false)} title="Add Category" size="sm">
        <AddCategoryForm onSuccess={() => { setShowAddCategory(false); fetchData(); }} onCancel={() => setShowAddCategory(false)} />
      </Modal>
    </DashboardLayout>
  );
}

function AddItemForm({ categories, onSuccess, onCancel }: { categories: MenuCategory[]; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: '', description: '', price: '', cost: '', categoryId: '', prepTime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) { setError('Name, price, and category are required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await menuApi.createItem({ ...form, price: parseFloat(form.price), cost: form.cost ? parseFloat(form.cost) : null, prepTime: form.prepTime || null });
      onSuccess();
    } catch (err: any) { setError(err.message || 'Failed to create item.'); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input-field" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Price *</label><input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Cost</label><input type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="input-field" /></div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="input-field">
          <option value="">Select category</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label><input type="number" value={form.prepTime} onChange={e => setForm({ ...form, prepTime: e.target.value })} className="input-field" /></div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Adding...' : 'Add Item'}</button>
      </div>
    </form>
  );
}

function AddCategoryForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { setError('Name is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await menuApi.createCategory({ name, sortOrder });
      onSuccess();
    } catch (err: any) { setError(err.message || 'Failed to create category.'); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label><input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="e.g., Appetizers" /></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label><input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="input-field" /></div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Adding...' : 'Add Category'}</button>
      </div>
    </form>
  );
}
