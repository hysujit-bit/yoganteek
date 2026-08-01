import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSortableData } from '../../hooks/useSortableData';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Search, Plus, User, Mail, Phone, Calendar, Heart, Share2, FileText, Check, ArrowUp, ArrowDown, Clock, Activity, StickyNote, Trash2, Send } from 'lucide-react';
import { shareText } from '../../utils/share';

export const PatientsModule = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Profile Detail Drawer State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  // Add Patient Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'female',
    health_goals: '',
    medical_history: '',
    coordinator: 'Dr. Jayashree Pattanaik',
  });

  // Share Brief State
  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Timeline Sidebar State
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelinePatient, setTimelinePatient] = useState(null);
  const [activities, setActivities] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getPatients();
      const list = Array.isArray(data) ? data : data.patients || [];
      setPatients(list);
    } catch (err) {
      console.error('Failed to load patients', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      await api.createPatient(newPatientForm);
      setAddModalOpen(false);
      setNewPatientForm({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: 'female',
        health_goals: '',
        medical_history: '',
        coordinator: 'Dr. Jayashree Pattanaik',
      });
      loadPatients();
    } catch (err) {
      alert(`Error creating patient: ${err.message}`);
    }
  };

  const handleShareBrief = async () => {
    if (!shareEmail.trim()) {
      alert('Please enter a team member email address.');
      return;
    }
    try {
      setSharing(true);
      await api.sharePatientBrief(selectedPatient.id, { recipient_email: shareEmail });
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
      setShareEmail('');
    } catch (err) {
      alert(`Failed to share brief: ${err.message}`);
    } finally {
      setSharing(false);
    }
  };

  const handleSharePatient = async (patient) => {
    const lines = [
      'Patient Profile — Yoganteek Wellness',
      '',
      `Name: ${patient.name || '-'}`,
      `Phone: ${patient.phone || '-'}`,
      `Email: ${patient.email || '-'}`,
      `Gender: ${patient.gender || '-'}`,
      `Health Goals: ${patient.health_goals || '-'}`,
      `Medical History: ${patient.medical_history || '-'}`,
      `Coordinator: ${patient.coordinator || '-'}`,
    ];
    try {
      await shareText(lines.join('\n'), `Patient — ${patient.name}`);
    } catch {
      // user cancelled share
    }
  };

  const openTimeline = async (patient) => {
    setTimelinePatient(patient);
    setTimelineOpen(true);
    setActivities([]);
    setNewNote('');
    try {
      setTimelineLoading(true);
      const data = await api.getPatientActivities(patient.id);
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Failed to load activities', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !timelinePatient) return;
    try {
      setAddingNote(true);
      await api.addPatientNote(timelinePatient.id, { note: newNote.trim(), added_by: 'Team' });
      setNewNote('');
      // Reload activities
      const data = await api.getPatientActivities(timelinePatient.id);
      setActivities(data.activities || []);
    } catch (err) {
      alert(`Failed to add note: ${err.message}`);
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!timelinePatient || !confirm('Delete this note?')) return;
    try {
      await api.deletePatientNote(timelinePatient.id, noteId);
      setActivities((prev) => prev.filter((a) => !(a.type === 'note' && a.id === noteId)));
    } catch (err) {
      alert(`Failed to delete note: ${err.message}`);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'patient_created': return <User size={14} />;
      case 'session_scheduled': return <Calendar size={14} />;
      case 'session_completed': return <Check size={14} />;
      case 'session_cancelled': return <span style={{ fontSize: '14px' }}>✕</span>;
      case 'session_no_show': return <span style={{ fontSize: '14px' }}>⏰</span>;
      case 'prescription_created': return <FileText size={14} />;
      case 'prescription_sent': return <Send size={14} />;
      case 'plan_enrolled': return <Activity size={14} />;
      case 'note': return <StickyNote size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'session_completed': return 'var(--status-green)';
      case 'session_scheduled': return 'var(--accent-gold)';
      case 'session_cancelled': return '#D32F2F';
      case 'session_no_show': return '#D32F2F';
      case 'prescription_sent': return 'var(--sage-primary)';
      case 'prescription_created': return 'var(--forest-dark)';
      case 'plan_enrolled': return 'var(--forest-dark)';
      case 'note': return 'var(--accent-gold)';
      default: return 'var(--text-muted)';
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery)
  );

  const { sortedItems, requestSort, sortConfig } = useSortableData(filteredPatients, { key: 'created_at', direction: 'desc' });

  const SortIcon = ({ columnKey }) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={13} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
      : <ArrowDown size={13} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />;
  };

  const thStyle = (key) => ({
    cursor: 'pointer',
    userSelect: 'none',
  });

  return (
    <div>
      {/* Action Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search patient profile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.2rem' }}
            />
          </div>

          <button onClick={() => setAddModalOpen(true)} className="btn btn-forest">
            <Plus size={16} /> New Patient Profile
          </button>
        </div>
      </div>

      {/* Patient Directory Table */}
      <div className="table-container desktop-only-table">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('name')} style={thStyle('name')}>Patient Name<SortIcon columnKey="name" /></th>
              <th>Contact Details</th>
              <th onClick={() => requestSort('health_goals')} style={thStyle('health_goals')}>Health Focus<SortIcon columnKey="health_goals" /></th>
              <th onClick={() => requestSort('coordinator')} style={thStyle('coordinator')}>Coordinator<SortIcon columnKey="coordinator" /></th>
              <th onClick={() => requestSort('status')} style={thStyle('status')}>Status<SortIcon columnKey="status" /></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading patient profiles...</td>
              </tr>
            ) : sortedItems.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No patient profiles found.
                </td>
              </tr>
            ) : (
              sortedItems.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--forest-dark)' }}>{patient.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enrolled: {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'Active'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{patient.email}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{patient.phone}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {patient.health_goals || 'General Wellness'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem' }}>{patient.coordinator || 'Dr. Jayashree'}</div>
                  </td>
                  <td>
                    <Badge variant={patient.status === 'completed' ? 'blue' : 'green'}>
                      {patient.status || 'active'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setProfileModalOpen(true);
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        <User size={14} /> Full Profile
                      </button>
                      <button
                        onClick={() => openTimeline(patient)}
                        className="btn btn-outline btn-sm"
                        title="View patient journey"
                      >
                        <Activity size={14} />
                      </button>
                      <button
                        onClick={() => handleSharePatient(patient)}
                        className="btn btn-outline btn-sm"
                        title="Share patient details"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Patient Cards */}
      <div className="mobile-only-cards">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading patient profiles...</div>
        ) : sortedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No patient profiles found.</div>
        ) : (
          sortedItems.map((patient) => (
            <div key={patient.id} className="booking-card">
              <div className="booking-card-header">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--forest-dark)', fontSize: '0.95rem' }}>{patient.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'Active'}
                  </div>
                </div>
                <Badge variant={patient.status === 'completed' ? 'blue' : 'green'}>
                  {patient.status || 'active'}
                </Badge>
              </div>
              <div className="booking-card-details">
                <div className="booking-detail-row">
                  <span style={{ fontSize: '0.82rem' }}>{patient.email}</span>
                </div>
                {patient.phone && (
                  <div className="booking-detail-row">
                    <a href={`tel:${patient.phone}`} style={{ color: 'var(--forest-dark)', fontWeight: 600, fontSize: '0.82rem' }}>{patient.phone}</a>
                  </div>
                )}
                <div className="booking-detail-row">
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Health: {patient.health_goals || 'General Wellness'}</span>
                </div>
                <div className="booking-detail-row">
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Coordinator: {patient.coordinator || 'Dr. Jayashree'}</span>
                </div>
              </div>
              <div className="booking-card-actions">
                <button
                  onClick={() => { setSelectedPatient(patient); setProfileModalOpen(true); }}
                  className="btn btn-outline btn-sm"
                >
                  <User size={12} /> Full Profile
                </button>
                <button
                  onClick={() => openTimeline(patient)}
                  className="btn btn-outline btn-sm"
                  title="View patient journey"
                >
                  <Activity size={12} />
                </button>
                <button
                  onClick={() => handleSharePatient(patient)}
                  className="btn btn-outline btn-sm"
                  title="Share patient details"
                >
                  <Share2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Patient Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Create New Patient Profile">
        <form onSubmit={handleAddPatient}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={newPatientForm.name}
              onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={newPatientForm.email}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-input"
                value={newPatientForm.phone}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Health Goals & Concerns</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={newPatientForm.health_goals}
              onChange={(e) => setNewPatientForm({ ...newPatientForm, health_goals: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Medical History / Allergies</label>
            <textarea
              className="form-textarea"
              rows="2"
              value={newPatientForm.medical_history}
              onChange={(e) => setNewPatientForm({ ...newPatientForm, medical_history: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setAddModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Patient Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Patient Profile Detail Modal */}
      {selectedPatient && (
        <Modal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          title={`Patient Profile — ${selectedPatient.name}`}
          maxWidth="700px"
        >
          <div>
            <div className="form-grid-2col" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</div>
                <div style={{ fontWeight: 600 }}>{selectedPatient.email || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone</div>
                <div style={{ fontWeight: 600 }}>{selectedPatient.phone || 'N/A'}</div>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--forest-dark)', marginBottom: '0.25rem' }}>Health Goals</h4>
              <p style={{ fontSize: '0.875rem', backgroundColor: 'var(--cream-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                {selectedPatient.health_goals || 'No health goals specified.'}
              </p>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--forest-dark)', marginBottom: '0.25rem' }}>Medical History & Notes</h4>
              <p style={{ fontSize: '0.875rem', backgroundColor: 'var(--cream-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                {selectedPatient.medical_history || 'No medical history noted.'}
              </p>
            </div>

            {/* Share Patient Brief Section */}
            <div style={{ marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--forest-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Share2 size={16} /> Share Internal Patient Brief
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter team member email..."
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
                <button onClick={handleShareBrief} className="btn btn-primary" disabled={sharing} style={{ whiteSpace: 'nowrap' }}>
                  {sharing ? 'Sending...' : 'Send Brief Email'}
                </button>
              </div>
              {shareSuccess && (
                <div style={{ color: 'var(--status-green)', fontSize: '0.8rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} /> Patient Brief emailed successfully!
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Patient Journey Timeline Sidebar */}
      {timelineOpen && (
        <div className="modal-overlay" onClick={() => setTimelineOpen(false)} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="slide-drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '100%' }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--forest-dark)',
              color: '#FFF',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="var(--accent-gold)" />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFF', margin: 0 }}>
                    {timelinePatient?.name}'s Journey
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                    {activities.length} event{activities.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setTimelineOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Add Note Input */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)', background: 'var(--cream-bg)' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={handleAddNote}
                  className="btn btn-primary btn-sm"
                  disabled={!newNote.trim() || addingNote}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {addingNote ? '...' : <><Send size={14} /></>}
                </button>
              </div>
            </div>

            {/* Timeline Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
              {timelineLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading timeline...</div>
              ) : activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <Clock size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p>No events yet. Patient journey will appear here.</p>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  {/* Vertical line */}
                  <div style={{
                    position: 'absolute',
                    left: '11px',
                    top: '8px',
                    bottom: '8px',
                    width: '2px',
                    background: 'var(--border-light)',
                  }} />

                  {activities.map((item, idx) => (
                    <div key={`${item.type}-${item.id}`} style={{
                      display: 'flex',
                      gap: '0.85rem',
                      marginBottom: '1rem',
                      position: 'relative',
                    }}>
                      {/* Icon */}
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: getActivityColor(item.activity_type),
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        zIndex: 1,
                      }}>
                        {getActivityIcon(item.activity_type)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-main)',
                          lineHeight: 1.4,
                        }}>
                          {item.description}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginTop: '4px',
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                        }}>
                          <Clock size={11} />
                          {item.created_at ? new Date(item.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                          {item.created_by && item.created_by !== 'system' && (
                            <span>• by {item.created_by}</span>
                          )}
                        </div>

                        {/* Delete button for notes */}
                        {item.type === 'note' && (
                          <button
                            onClick={() => handleDeleteNote(item.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                              marginTop: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.7rem',
                            }}
                            title="Delete note"
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
