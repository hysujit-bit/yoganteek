import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSortableData } from '../../hooks/useSortableData';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Calendar, Clock, User, Phone, Mail, Edit2, XCircle, CheckCircle2, Video, RefreshCw, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

export const BookingsModule = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [error, setError] = useState(null);
  const [syncMessage, setSyncMessage] = useState(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  const [editForm, setEditForm] = useState({
    booking_date: '',
    booking_time: '',
    meeting_link: '',
    assigned_doctor: '',
    notes: '',
    status: '',
  });
  const [saving, setSaving] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBookings();
      const list = Array.isArray(data) ? data : data.bookings || [];
      setBookings(list);
    } catch (err) {
      console.error('Failed to load bookings', err);
      setError('Failed to load bookings. The backend may be starting up.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const syncCalendar = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const result = await api.syncGoogleCalendar(30);
      setSyncMessage(`Synced ${result.count || 0} event(s) from Google Calendar`);
      await loadBookings();
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err) {
      console.error('Failed to sync calendar', err);
      setSyncMessage('Sync failed. Please try again.');
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const formatTime12 = (time24) => {
    if (!time24) return '';
    const [h, m] = String(time24).split(':');
    const hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const h12 = hr % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const isUpcoming = (b) => {
    const today = new Date().toISOString().split('T')[0];
    return b.booking_date >= today && b.status === 'confirmed';
  };

  const isPast = (b) => {
    const today = new Date().toISOString().split('T')[0];
    return b.booking_date < today || b.status === 'completed' || b.status === 'cancelled';
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'upcoming') return isUpcoming(b);
    if (activeTab === 'past') return isPast(b);
    return true;
  });

  const { sortedItems, requestSort, sortConfig } = useSortableData(filteredBookings, { key: 'booking_date', direction: 'desc' });

  const SortIcon = ({ columnKey }) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={13} style={{ marginLeft: '3px' }} />
      : <ArrowDown size={13} style={{ marginLeft: '3px' }} />;
  };

  const thStyle = (key) => ({
    cursor: 'pointer',
    userSelect: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
  });

  const upcomingCount = bookings.filter(isUpcoming).length;
  const pastCount = bookings.filter(isPast).length;

  const openEditModal = (booking) => {
    setEditBooking(booking);
    setEditForm({
      booking_date: booking.booking_date || '',
      booking_time: booking.booking_time ? String(booking.booking_time).slice(0, 5) : '',
      meeting_link: booking.meeting_link || '',
      assigned_doctor: booking.assigned_doctor || '',
      notes: booking.notes || '',
      status: booking.status || 'confirmed',
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editBooking) return;
    try {
      setSaving(true);
      await api.updateBooking(editBooking.id, editForm);
      setEditModalOpen(false);
      loadBookings();
    } catch (err) {
      alert(`Failed to update booking: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (booking) => {
    if (!confirm(`Cancel booking for ${booking.patient_name}?`)) return;
    try {
      await api.cancelBooking(booking.id);
      loadBookings();
    } catch (err) {
      alert(`Failed to cancel: ${err.message}`);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'confirmed': return 'green';
      case 'completed': return 'blue';
      case 'cancelled': return 'red';
      case 'rescheduled': return 'amber';
      default: return 'green';
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--cream-bg)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <button
              onClick={() => setActiveTab('upcoming')}
              style={{
                padding: '0.4rem 0.85rem', border: 'none', borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTab === 'upcoming' ? 'var(--forest-dark)' : 'transparent',
                color: activeTab === 'upcoming' ? '#FFF' : 'var(--text-main)',
                fontWeight: activeTab === 'upcoming' ? 600 : 400, fontSize: '0.82rem', cursor: 'pointer',
              }}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              style={{
                padding: '0.4rem 0.85rem', border: 'none', borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTab === 'past' ? 'var(--forest-dark)' : 'transparent',
                color: activeTab === 'past' ? '#FFF' : 'var(--text-main)',
                fontWeight: activeTab === 'past' ? 600 : 400, fontSize: '0.82rem', cursor: 'pointer',
              }}
            >
              Past ({pastCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '0.4rem 0.85rem', border: 'none', borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTab === 'all' ? 'var(--forest-dark)' : 'transparent',
                color: activeTab === 'all' ? '#FFF' : 'var(--text-main)',
                fontWeight: activeTab === 'all' ? 600 : 400, fontSize: '0.82rem', cursor: 'pointer',
              }}
            >
              All ({bookings.length})
            </button>
          </div>

          <button onClick={loadBookings} className="btn btn-outline btn-sm" style={{ padding: '0.35rem 0.65rem' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
          <button
            onClick={syncCalendar}
            disabled={syncing}
            className="btn btn-primary btn-sm"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', gap: '6px' }}
          >
            <Calendar size={14} className={syncing ? 'spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Calendar'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <AlertCircle size={18} color="#D32F2F" />
          <span style={{ fontSize: '0.85rem', color: '#D32F2F' }}>{error}</span>
          <button onClick={loadBookings} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {/* Sync Message */}
      {syncMessage && (
        <div style={{
          backgroundColor: syncMessage.includes('failed') ? '#FFEBEE' : '#E8F5E9',
          border: `1px solid ${syncMessage.includes('failed') ? '#FFCDD2' : '#C8E6C9'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <CheckCircle2 size={18} color={syncMessage.includes('failed') ? '#D32F2F' : '#2E7D32'} />
          <span style={{ fontSize: '0.85rem', color: syncMessage.includes('failed') ? '#D32F2F' : '#2E7D32' }}>{syncMessage}</span>
        </div>
      )}

      {/* Bookings Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('patient_name')} style={thStyle('patient_name')}>Patient<SortIcon columnKey="patient_name" /></th>
              <th>Contact</th>
              <th onClick={() => requestSort('booking_date')} style={thStyle('booking_date')}>Date & Time<SortIcon columnKey="booking_date" /></th>
              <th>Meeting</th>
              <th onClick={() => requestSort('assigned_doctor')} style={thStyle('assigned_doctor')}>Assigned To<SortIcon columnKey="assigned_doctor" /></th>
              <th onClick={() => requestSort('status')} style={thStyle('status')}>Status<SortIcon columnKey="status" /></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading bookings...</td></tr>
            ) : sortedItems.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <Calendar size={36} color="var(--sage-primary)" style={{ marginBottom: '0.5rem' }} />
                  <p>
                    {activeTab === 'upcoming'
                      ? 'No upcoming bookings. Share the booking link: yoganteek.com/book-consultation.html'
                      : activeTab === 'past'
                        ? 'No past bookings found.'
                        : 'No bookings yet.'}
                  </p>
                </td>
              </tr>
            ) : (
              sortedItems.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--forest-dark)' }}>{b.patient_name}</div>
                    {b.health_goal && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.health_goal}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={12} color="var(--text-muted)" /> {b.patient_email}
                    </div>
                    {b.patient_phone && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Phone size={12} /> {b.patient_phone}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{b.booking_date}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={12} /> {formatTime12(b.booking_time)} ({b.duration_minutes || 30} mins)
                    </div>
                  </td>
                  <td>
                    {b.meeting_link ? (
                      <a href={b.meeting_link} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}>
                        <Video size={12} /> Join
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No link</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem' }}>{b.assigned_doctor || '—'}</div>
                  </td>
                  <td>
                    <Badge variant={getStatusVariant(b.status)}>{b.status}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => openEditModal(b)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                        title="Edit booking"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      {b.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancel(b)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px', color: '#D32F2F', borderColor: '#FFCDD2' }}
                          title="Cancel booking"
                        >
                          <XCircle size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Reschedule Modal */}
      {editBooking && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Booking — ${editBooking.patient_name}`}
        >
          <form onSubmit={handleUpdate}>
            <div style={{ backgroundColor: 'var(--cream-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Original Booking</div>
              <div style={{ fontWeight: 600 }}>{editBooking.booking_date} at {formatTime12(editBooking.booking_time)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">New Date</label>
                <input type="date" className="form-input" value={editForm.booking_date} onChange={(e) => setEditForm({ ...editForm, booking_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">New Time</label>
                <input type="time" className="form-input" value={editForm.booking_time} onChange={(e) => setEditForm({ ...editForm, booking_time: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Doctor</label>
              <input type="text" className="form-input" value={editForm.assigned_doctor} onChange={(e) => setEditForm({ ...editForm, assigned_doctor: e.target.value })} placeholder="Dr. Jayashree Pattanaik" />
            </div>

            <div className="form-group">
              <label className="form-label">Meeting Link</label>
              <input type="url" className="form-input" value={editForm.meeting_link} onChange={(e) => setEditForm({ ...editForm, meeting_link: e.target.value })} placeholder="https://meet.google.com/..." />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" rows="2" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Internal notes..." />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Update Booking'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
