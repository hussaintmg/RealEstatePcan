'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Building,
  Phone,
  Mail,
  Video,
  Eye,
  FileSignature,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AsyncState, AccessDeniedState } from '@/components/ui/AsyncState';

interface AppointmentItem {
  _id: string;
  title: string;
  type: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  notes?: string;
  propertyId?: {
    _id: string;
    title: string;
    slug: string;
    location?: { city?: string; address?: string };
  };
  leadId?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  customerId?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  assignedAgentId?: {
    _id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
}

const APPOINTMENT_TYPES = [
  { key: 'in_person_viewing', label: 'In-Person Property Viewing', icon: Building },
  { key: 'virtual_3d_walkthrough', label: 'Virtual 3D Tour / Remote Walkthrough', icon: Video },
  { key: 'investment_consultation', label: 'Investment Portfolio Advisory', icon: User },
  { key: 'contract_signing', label: 'Formal Contract Signing', icon: FileSignature },
];

const TIME_SLOTS = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState('in_person_viewing');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [notes, setNotes] = useState('');

  // Selectable properties
  const [properties, setProperties] = useState<any[]>([]);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);

      const res = await fetch(`/api/appointments?${params.toString()}`);
      if (res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch appointments schedule.');

      const data = await res.json();
      setAppointments(data.appointments || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Error loading appointments');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const loadProperties = async () => {
    try {
      const res = await fetch('/api/properties?limit=50');
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (e) {
      console.error('Failed loading properties:', e);
    }
  };

  const handleOpenCreate = () => {
    loadProperties();
    // Default date to tomorrow
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setDate(tomorrow.toISOString().split('T')[0]);
    setIsCreateModalOpen(true);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !attendeeName.trim() || !attendeeEmail.trim() || !attendeePhone.trim() || !date) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type,
          date,
          timeSlot,
          attendeeName: attendeeName.trim(),
          attendeeEmail: attendeeEmail.trim(),
          attendeePhone: attendeePhone.trim(),
          propertyId: propertyId || undefined,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to schedule appointment.');
      }

      setIsCreateModalOpen(false);
      // Reset form
      setTitle('');
      setAttendeeName('');
      setAttendeeEmail('');
      setAttendeePhone('');
      setNotes('');
      fetchAppointments();
    } catch (err: any) {
      setFormError(err.message || 'Failed to schedule appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to update status.');
      }
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  if (accessDenied) {
    return (
      <AccessDeniedState
        title="Viewings Schedule Restricted"
        message="Your security role does not permit access to scheduled viewings and appointments."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments & Viewings"
        description="Coordinate in-person private viewings, virtual 3D walkthroughs, and client contract signings with agent conflict detection."
        actions={
          <Button onClick={handleOpenCreate} icon={Plus} className="shadow-lg shadow-emerald-500/20">
            Schedule Viewing
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="w-full sm:w-64">
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search by attendee or title..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Confirmation</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">All Viewing Types</option>
            {APPOINTMENT_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Viewings: <span className="text-emerald-400 font-semibold">{total}</span>
        </div>
      </div>

      {/* Main List Grid */}
      <AsyncState
        status={loading ? 'loading' : error ? 'error' : appointments.length === 0 ? 'empty' : 'success'}
        errorMessage={error}
        emptyTitle="No appointments scheduled"
        emptyDescription="Schedule a private viewing or virtual walkthrough by clicking Schedule Viewing."
        onRetry={fetchAppointments}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((appt) => {
            const typeObj = APPOINTMENT_TYPES.find((t) => t.key === appt.type) || APPOINTMENT_TYPES[0];
            const Icon = typeObj.icon;

            return (
              <div
                key={appt._id}
                className="bg-slate-900/50 border border-white/10 hover:border-emerald-500/30 rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium bg-slate-800/80 px-2.5 py-1 rounded-full border border-white/5">
                      <Icon className="w-3.5 h-3.5 text-emerald-400" />
                      {typeObj.label}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        appt.status === 'confirmed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : appt.status === 'completed'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : appt.status === 'cancelled'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {appt.status}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white mt-2 line-clamp-1">{appt.title}</h3>

                  <div className="mt-3 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(appt.date).toLocaleDateString()} • {appt.timeSlot}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-medium">{appt.attendeeName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {appt.attendeeEmail}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {appt.attendeePhone}
                      </span>
                    </div>

                    {appt.propertyId && (
                      <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-slate-300">
                        <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{appt.propertyId.title}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Status Action:</span>
                  <div className="flex items-center gap-1.5">
                    {appt.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(appt._id, 'confirmed')}
                        disabled={actionLoading}
                        className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                      >
                        Confirm
                      </button>
                    )}
                    {appt.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusChange(appt._id, 'completed')}
                        disabled={actionLoading}
                        className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}
                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(appt._id, 'cancelled')}
                        disabled={actionLoading}
                        className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-400 px-3 font-mono">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </AsyncState>

      {/* Schedule Viewing Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule Property Viewing or Consultation"
        size="lg"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-300 mb-1">Meeting Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VIP Private Viewing - Penthouse 18"
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Appointment Type *</label>
              <select
                required
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {APPOINTMENT_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Associated Property</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- General Consultation (No Unit) --</option>
                {properties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Time Slot *</label>
              <select
                required
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Attendee Name *</label>
              <input
                type="text"
                required
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
                placeholder="Client full name"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Attendee Email *</label>
              <input
                type="email"
                required
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Attendee Phone *</label>
              <input
                type="tel"
                required
                value={attendeePhone}
                onChange={(e) => setAttendeePhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">Special Requirements / Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Client interested in high-floor units and payment milestone flexibility."
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading} className="shadow-lg shadow-emerald-500/20">
              Confirm Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
