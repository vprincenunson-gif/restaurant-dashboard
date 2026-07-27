'use client';

import React, { useEffect, useState } from 'react';
import { staffApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import type { Staff } from '@/types';
import { Users, Plus, Phone, Mail, Calendar } from 'lucide-react';

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState<Staff | null>(null);

  const fetchData = async () => {
    try {
      const res = await staffApi.list({ limit: '100' });
      setStaff(res.staff);
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredStaff = roleFilter ? staff.filter(s => s.role === roleFilter) : staff;
  const roles = [...new Set(staff.map(s => s.role))];

  const roleCounts = roles.reduce((acc, role) => ({ ...acc, [role]: staff.filter(s => s.role === role).length }), {} as Record<string, number>);

  if (loading) return <DashboardLayout><LoadingSpinner fullPage text="Loading staff..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff</h1>
          <p className="text-gray-500 mt-1">Manage your team members</p>
        </div>
        <button onClick={() => { setEditMember(null); setShowAddModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Staff
        </button>
      </div>

      {/* Role Summary */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={() => setRoleFilter('')} className={`px-4 py-2 rounded-lg text-sm font-medium border ${!roleFilter ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
          All ({staff.length})
        </button>
        {roles.map(role => (
          <button key={role} onClick={() => setRoleFilter(role)} className={`px-4 py-2 rounded-lg text-sm font-medium border capitalize ${roleFilter === role ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {role} ({roleCounts[role]})
          </button>
        ))}
      </div>

      {filteredStaff.length === 0 ? (
        <EmptyState title="No staff found" description="Add your first team member." icon={<Users className="w-8 h-8 text-gray-400" />}
          action={<button onClick={() => setShowAddModal(true)} className="btn-primary"><Plus className="w-4 h-4 mr-2" /> Add Staff</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map(member => (
            <div key={member.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                  </div>
                </div>
                <StatusBadge status={member.isActive ? 'active' : 'inactive'} />
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {member.email && <div className="flex items-center gap-2 text-gray-500"><Mail className="w-4 h-4" />{member.email}</div>}
                {member.phone && <div className="flex items-center gap-2 text-gray-500"><Phone className="w-4 h-4" />{member.phone}</div>}
                {member.shift && <div className="flex items-center gap-2 text-gray-500"><Calendar className="w-4 h-4" />{member.shift} shift</div>}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                {member.salary && <span>${member.salary.toLocaleString()}/yr</span>}
              </div>
              <div className="mt-3">
                <button onClick={() => { setEditMember(member); setShowAddModal(true); }} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                  Edit Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditMember(null); }} title={editMember ? 'Edit Staff' : 'Add Staff Member'} size="md">
        <StaffForm editMember={editMember} onSuccess={() => { setShowAddModal(false); setEditMember(null); fetchData(); }} onCancel={() => { setShowAddModal(false); setEditMember(null); }} />
      </Modal>
    </DashboardLayout>
  );
}

function StaffForm({ editMember, onSuccess, onCancel }: { editMember: Staff | null; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: editMember?.name || '', email: editMember?.email || '', phone: editMember?.phone || '',
    role: editMember?.role || 'waiter', shift: editMember?.shift || 'morning',
    salary: editMember?.salary?.toString() || '', hourlyRate: editMember?.hourlyRate?.toString() || '',
    address: editMember?.address || '', emergencyContact: editMember?.emergencyContact || '', notes: editMember?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError('Name is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const data = { ...form, salary: form.salary ? parseFloat(form.salary) : null, hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null };
      if (editMember) {
        await staffApi.update(editMember.id, data);
      } else {
        await staffApi.create(data);
      }
      onSuccess();
    } catch (err: any) { setError(err.message || 'Failed to save staff.'); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field">
            {['waiter', 'chef', 'manager', 'host', 'bartender', 'cleaner'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
          <select value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })} className="input-field">
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Salary</label><input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} className="input-field" placeholder="Annual" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label><input type="number" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} className="input-field" /></div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-field" /></div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : editMember ? 'Update' : 'Add Staff'}</button>
      </div>
    </form>
  );
}
