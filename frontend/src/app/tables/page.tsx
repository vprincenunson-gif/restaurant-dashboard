'use client';

import React, { useEffect, useState } from 'react';
import { tablesApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import type { Table } from '@/types';
import { Grid3X3, Plus, Users, Coffee } from 'lucide-react';

const statusColors: Record<string, string> = {
  available: 'border-green-500 bg-green-50',
  occupied: 'border-blue-500 bg-blue-50',
  reserved: 'border-yellow-500 bg-yellow-50',
  maintenance: 'border-red-500 bg-red-50',
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await tablesApi.list();
        setTables(res.tables);
      } catch (err) {
        console.error('Failed to fetch tables:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await tablesApi.update(id, { status });
      const res = await tablesApi.list();
      setTables(res.tables);
      setSelectedTable(null);
    } catch (err) {
      console.error('Failed to update table:', err);
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner fullPage text="Loading tables..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tables</h1>
          <p className="text-gray-500 mt-1">Manage table layout and occupancy</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Table
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card text-center">
          <p className="stat-value text-green-600">{tables.filter(t => t.status === 'available').length}</p>
          <p className="stat-label">Available</p>
        </div>
        <div className="stat-card text-center">
          <p className="stat-value text-blue-600">{tables.filter(t => t.status === 'occupied').length}</p>
          <p className="stat-label">Occupied</p>
        </div>
        <div className="stat-card text-center">
          <p className="stat-value text-yellow-600">{tables.filter(t => t.status === 'reserved').length}</p>
          <p className="stat-label">Reserved</p>
        </div>
        <div className="stat-card text-center">
          <p className="stat-value">{tables.length}</p>
          <p className="stat-label">Total</p>
        </div>
      </div>

      {/* Table Grid */}
      {tables.length === 0 ? (
        <EmptyState
          title="No tables configured"
          description="Start by adding your first table."
          action={<button onClick={() => setShowCreateModal(true)} className="btn-primary"><Plus className="w-4 h-4 mr-2" /> Add Table</button>}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${statusColors[table.status] || 'border-gray-200 bg-white'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-gray-900">T{table.number}</span>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Users className="w-3.5 h-3.5" />
                  {table.capacity}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${table.status === 'available' ? 'bg-green-500' : table.status === 'occupied' ? 'bg-blue-500' : table.status === 'reserved' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <span className="text-xs font-medium text-gray-600 capitalize">{table.status}</span>
              </div>
              {table.location && <p className="text-xs text-gray-400 mt-1 capitalize">{table.location}</p>}
              {table.activeOrder && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <p className="text-xs text-blue-700">Active order: ${table.activeOrder.total.toFixed(2)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table Detail Modal */}
      <Modal isOpen={!!selectedTable} onClose={() => setSelectedTable(null)} title={selectedTable ? `Table ${selectedTable.number}` : ''} size="sm">
        {selectedTable && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Capacity</span>
              <span className="font-medium">{selectedTable.capacity} seats</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Location</span>
              <span className="font-medium capitalize">{selectedTable.location || 'Standard'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`badge ${selectedTable.status === 'available' ? 'badge-success' : selectedTable.status === 'occupied' ? 'badge-info' : selectedTable.status === 'reserved' ? 'badge-warning' : 'badge-danger'}`}>
                {selectedTable.status}
              </span>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Change Status</p>
              <div className="flex flex-wrap gap-2">
                {['available', 'occupied', 'reserved', 'maintenance'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selectedTable.id, status)}
                    disabled={status === selectedTable.status}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      status === selectedTable.status
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'hover:bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Table Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Table" size="sm">
        <CreateTableForm
          onSuccess={async () => {
            setShowCreateModal(false);
            const res = await tablesApi.list();
            setTables(res.tables);
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </DashboardLayout>
  );
}

function CreateTableForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number) { setError('Table number is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await tablesApi.create({ number, capacity, location });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create table.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
        <input type="number" value={number} onChange={(e) => setNumber(e.target.value)} className="input-field" min="1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
        <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="input-field" min="1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <select value={location} onChange={(e) => setLocation(e.target.value)} className="input-field">
          <option value="">Standard</option>
          <option value="window">Window</option>
          <option value="outdoor">Outdoor</option>
          <option value="bar">Bar</option>
          <option value="indoor">Indoor</option>
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Creating...' : 'Create Table'}</button>
      </div>
    </form>
  );
}
