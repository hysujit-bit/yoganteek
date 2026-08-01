import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSortableData } from '../../hooks/useSortableData';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Toast } from '../common/Toast';
import { Calendar as CalendarIcon, Plus, Video, Share2, Copy, Check, Clock, RefreshCw, CheckCircle2, ArrowUp, ArrowDown, Users, UserPlus, Trash2, CalendarDays } from 'lucide-react';
import { shareText } from '../../utils/share';

export const SessionsModule = () => {
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [viewTab, setViewTab] = useState('sessions');
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    patient_id: '', patient_name: '', group_id: '',
    session_date: new Date().toISOString().split('T')[0],
    session_time: '10:00', duration_minutes: 45,
    session_type: 'Follow-up Consultation', meeting_link: '', notes: '',
  });

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', description: '', meeting_link: '', coordinator: 'Dr. Jayashree Pattanaik' });
  const [groupDetailModal, setGroupDetailModal] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sessionsData, patientsData, groupsData] = await Promise.all([
        api.getSessions(false).catch(() => []),
        api.getPatients().catch(() => []),
        api.getGroups().catch(() => []),
      ]);
      setSessions(Array.isArray(sessionsData) ? sessionsData : sessionsData.sessions || []);
      setPatients(Array.isArray(patientsData) ? patientsData : patientsData.patients || []);
      setGroups(Array.isArray(groupsData) ? groupsData : groupsData.groups || []);
    } catch (err) {
      console.error('Failed to load sessions data', err);
      setError('Failed to load sessions. The backend may be starting up.');
      setSessions([]);
      setPatients([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handlePatientSelect = (patientId) => {
    const p = patients.find((pat) => String(pat.id) === String(patientId));
    setSessionForm({ ...sessionForm, patient_id: patientId, patient_name: p ? p.name : '' });
  };

  const resetSessionForm = () => {
    setSessionForm({
      patient_id: '', patient_name: '', group_id: '',
      session_date: new Date().toISOString().split('T')[0],
      session_time: '10:00', duration_minutes: 45,
      session_type: 'Follow-up Consultation', meeting_link: '', notes: '',
    });
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...sessionForm };
      if (payload.group_id) {
        payload.session_type = 'Group Session';
        delete payload.patient_id;
      }
      await api.createSession(payload);
      setAddModalOpen(false);
      resetSessionForm();
      loadData();
      setToast({ message: 'Session scheduled successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: `Error: ${err.message}`, type: 'error' });
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.createGroup(groupForm);
      setCreateGroupModalOpen(false);
      setGroupForm({ name: '', description: '', meeting_link: '', coordinator: 'Dr. Jayashree Pattanaik' });
      loadData();
      setToast({ message: 'Group created!', type: 'success' });
    } catch (err) {
      setToast({ message: `Error: ${err.message}`, type: 'error' });
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Delete this group? Members will not be removed.')) return;
    try {
      await api.deleteGroup(id);
      setGroupDetailModal(null);
      loadData();
      setToast({ message: 'Group deleted', type: 'success' });
    } catch (err) {
      setToast({ message: `Error: ${err.message}`, type: 'error' });
    }
  };

  const openGroupDetail = async (group) => {
    setGroupDetailModal(group);
    try {
      const data = await api.getGroupMembers(group.id);
      setGroupMembers(Array.isArray(data) ? data : data.members || []);
    } catch { setGroupMembers([]); }
  };

  const handleAddMembers = async () => {
    if (!selectedPatients.length || !groupDetailModal) return;
    try {
      await api.addGroupMembers(groupDetailModal.id, { patient_ids: selectedPatients });
      setAddMemberModal(false);
      setSelectedPatients([]);
      openGroupDetail(groupDetailModal);
      setToast({ message: 'Members added!', type: 'success' });
    } catch (err) {
      setToast({ message: `Error: ${err.message}`, type: 'error' });
    }
  };

  const handleRemoveMember = async (patientId) => {
    if (!groupDetailModal) return;
    try {
      await api.removeGroupMember(groupDetailModal.id, patientId);
      openGroupDetail(groupDetailModal);
      setToast({ message: 'Member removed', type: 'success' });
    } catch (err) {
      setToast({ message: `Error: ${err.message}`, type: 'error' });
    }
  };

  const handleScheduleGroupSession = async (group) => {
    try {
      await api.createSession({
        group_id: group.id,
        session_date: new Date().toISOString().split('T')[0],
        session_time: '10:00', duration_minutes: 45,
        session_type: 'Group Session',
        meeting_link: group.meeting_link || '',
        notes: `Group session for ${group.name}`,
      });
      loadData();
      setToast({ message: `Session scheduled for ${group.name}!`, type: 'success' });
    } catch (err) {
      setToast({ message: `Error: ${err.message}`, type: 'error' });
    }
  };

  const copyMeetingLink = () => {
    if (!selectedSession?.meeting_link) return;
    navigator.clipboard.writeText(selectedSession.meeting_link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareSession = async () => {
    if (!selectedSession) return;
    const text = `Hello ${selectedSession.group_name || selectedSession.patient_name}, here are your session details:\n\nDate: ${selectedSession.session_date}\nTime: ${formatTime12(selectedSession.session_time)}\nMeeting Link: ${selectedSession.meeting_link || 'Link will be sent shortly'}\n\nLooking forward to seeing you!`;
    await shareText(text, `Session Details - ${selectedSession.session_date}`);
  };

  const formatTime12 = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    const hr = parseInt(h, 10);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const isUpcoming = (s) => {
    const today = new Date().toISOString().split('T')[0];
    return s.session_date >= today && s.status === 'scheduled';
  };

  const isPast = (s) => {
    const today = new Date().toISOString().split('T')[0];
    return s.session_date < today || s.status === 'completed' || s.status === 'no-show' || s.status === 'cancelled';
  };

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'upcoming') return isUpcoming(s);
    if (activeTab === 'past') return isPast(s);
    return true;
  });

  const { sortedItems, requestSort, sortConfig } = useSortableData(filteredSessions, { key: 'session_date', direction: 'desc' });

  const SortIcon = ({ columnKey }) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={13} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
      : <ArrowDown size={13} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />;
  };

  const thStyle = () => ({ cursor: 'pointer', userSelect: 'none' });
  const upcomingCount = sessions.filter(isUpcoming).length;
  const pastCount = sessions.filter(isPast).length;

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'scheduled': return 'amber';
      case 'cancelled': return 'red';
      case 'no-show': return 'red';
      default: return 'amber';
    }
  };

  const tabStyle = (active) => ({
    padding: '0.4rem 0.85rem', border: 'none', borderRadius: 'var(--radius-sm)',
    backgroundColor: active ? 'var(--forest-dark)' : 'transparent',
    color: active ? '#FFF' : 'var(--text-main)',
    fontWeight: active ? 600 : 400, fontSize: '0.82rem', cursor: 'pointer',
  });

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--cream-bg)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <button onClick={() => setViewTab('sessions')} style={tabStyle(viewTab === 'sessions')}>
              <CalendarDays size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Sessions
            </button>
            <button onClick={() => setViewTab('groups')} style={tabStyle(viewTab === 'groups')}>
              <Users size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Groups
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={loadData} className="btn btn-outline btn-sm" title="Refresh" style={{ padding: '0.35rem 0.65rem' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
            {viewTab === 'sessions' ? (
              <button onClick={() => setAddModalOpen(true)} className="btn btn-forest">
                <Plus size={16} /> Schedule Session
              </button>
            ) : (
              <button onClick={() => setCreateGroupModalOpen(true)} className="btn btn-forest">
                <Plus size={16} /> Create Group
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#D32F2F' }}>{error}</span>
          <button onClick={loadData} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {viewTab === 'sessions' && (
        <>
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--cream-bg)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '1rem' }}>
            <button onClick={() => setActiveTab('upcoming')} style={tabStyle(activeTab === 'upcoming')}>Upcoming ({upcomingCount})</button>
            <button onClick={() => setActiveTab('past')} style={tabStyle(activeTab === 'past')}>Past ({pastCount})</button>
            <button onClick={() => setActiveTab('all')} style={tabStyle(activeTab === 'all')}>All ({sessions.length})</button>
          </div>

          <div className="table-container desktop-only-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('patient_name')} style={thStyle()}>Patient/Group<SortIcon columnKey="patient_name" /></th>
                  <th onClick={() => requestSort('session_date')} style={thStyle()}>Date & Time<SortIcon columnKey="session_date" /></th>
                  <th onClick={() => requestSort('session_type')} style={thStyle()}>Type<SortIcon columnKey="session_type" /></th>
                  <th>Meeting Link</th>
                  <th onClick={() => requestSort('status')} style={thStyle()}>Status<SortIcon columnKey="status" /></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading sessions...</td></tr>
                ) : sortedItems.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={36} color="var(--sage-primary)" style={{ marginBottom: '0.5rem' }} />
                    <p>{activeTab === 'upcoming' ? 'No upcoming sessions.' : activeTab === 'past' ? 'No past sessions.' : 'No sessions yet.'}</p>
                  </td></tr>
                ) : (
                  sortedItems.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--forest-dark)' }}>
                          {session.group_name ? `\u{1F465} ${session.group_name}` : session.patient_name}
                        </div>
                        {session.group_name && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Group Session</div>}
                        {session.patient_email && !session.group_name && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{session.patient_email}</div>}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{session.session_date}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={12} /> {formatTime12(session.session_time)} ({session.duration_minutes || 30} mins)
                        </div>
                      </td>
                      <td><div style={{ fontSize: '0.82rem' }}>{session.session_type || 'Consultation'}</div></td>
                      <td>
                        {session.meeting_link ? (
                          <a href={session.meeting_link} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem', gap: '4px' }}>
                            <Video size={13} color="var(--sage-primary)" /> Join
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No link</span>
                        )}
                      </td>
                      <td><Badge variant={getStatusVariant(session.status)}>{session.status || 'scheduled'}</Badge></td>
                      <td>
                        <button onClick={() => { setSelectedSession(session); setShareModalOpen(true); }} className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}>
                          <Share2 size={13} /> Share
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mobile-only-cards">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading sessions...</div>
            ) : sortedItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={36} color="var(--sage-primary)" style={{ marginBottom: '0.5rem' }} />
                <p>{activeTab === 'upcoming' ? 'No upcoming sessions.' : activeTab === 'past' ? 'No past sessions.' : 'No sessions yet.'}</p>
              </div>
            ) : (
              sortedItems.map((session) => (
                <div key={session.id} className="booking-card">
                  <div className="booking-card-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--forest-dark)', fontSize: '0.95rem' }}>
                        {session.group_name ? `\u{1F465} ${session.group_name}` : session.patient_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{session.session_type || 'Consultation'}</div>
                    </div>
                    <Badge variant={getStatusVariant(session.status)}>{session.status || 'scheduled'}</Badge>
                  </div>
                  <div className="booking-card-details">
                    <div className="booking-detail-row">
                      <CalendarIcon size={14} color="var(--sage-primary)" />
                      <span>{session.session_date}</span>
                      <Clock size={14} color="var(--sage-primary)" />
                      <span>{formatTime12(session.session_time)} ({session.duration_minutes || 30}m)</span>
                    </div>
                  </div>
                  <div className="booking-card-actions">
                    {session.meeting_link ? (
                      <a href={session.meeting_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ flex: 1, gap: '4px' }}>
                        <Video size={14} /> Join Call
                      </a>
                    ) : (
                      <button className="btn btn-outline btn-sm" disabled style={{ flex: 1 }}>No Link</button>
                    )}
                    <button onClick={() => { setSelectedSession(session); setShareModalOpen(true); }} className="btn btn-outline btn-sm" style={{ gap: '3px' }}>
                      <Share2 size={13} /> Share
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {viewTab === 'groups' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading groups...</div>
          ) : groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ marginBottom: '0.75rem', color: 'var(--sage-primary)' }} />
              <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No groups yet</p>
              <p style={{ fontSize: '0.85rem' }}>Create a group to schedule recurring yoga sessions for multiple patients.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {groups.map((group) => (
                <div key={group.id} className="card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => openGroupDetail(group)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--forest-dark)', fontSize: '1.05rem' }}>{group.name}</div>
                      {group.description && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{group.description}</div>}
                    </div>
                    <Badge variant="green">{group.member_count || 0} members</Badge>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {group.meeting_link && <span><Video size={12} style={{ verticalAlign: 'middle' }} /> Has link</span>}
                    <span><CalendarIcon size={12} style={{ verticalAlign: 'middle' }} /> {group.coordinator || 'Unassigned'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleScheduleGroupSession(group)} className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', gap: '3px' }}>
                      <Plus size={13} /> Schedule
                    </button>
                    <button onClick={() => openGroupDetail(group)} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', gap: '3px' }}>
                      <Users size={13} /> Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Schedule Session">
        <form onSubmit={handleCreateSession}>
          <div className="form-group">
            <label className="form-label">Session Type</label>
            <select className="form-select" value={sessionForm.session_type} onChange={(e) => setSessionForm({ ...sessionForm, session_type: e.target.value })}>
              <option value="Follow-up Consultation">Follow-up Consultation</option>
              <option value="Free Consultation">Free Consultation</option>
              <option value="Initial Assessment">Initial Assessment</option>
              <option value="Yoga Therapy Session">Yoga Therapy Session</option>
              <option value="Group Session">Group Session</option>
            </select>
          </div>
          {sessionForm.session_type === 'Group Session' ? (
            <div className="form-group">
              <label className="form-label">Select Group</label>
              <select className="form-select" value={sessionForm.group_id} onChange={(e) => setSessionForm({ ...sessionForm, group_id: e.target.value })} required>
                <option value="">-- Choose Group --</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.member_count || 0} members)</option>)}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Select Patient</label>
              <select className="form-select" value={sessionForm.patient_id} onChange={(e) => handlePatientSelect(e.target.value)} required>
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.phone || p.email})</option>)}
              </select>
            </div>
          )}
          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={sessionForm.session_date} onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input type="time" className="form-input" value={sessionForm.session_time} onChange={(e) => setSessionForm({ ...sessionForm, session_time: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Meeting URL (optional)</label>
            <input type="url" className="form-input" value={sessionForm.meeting_link} onChange={(e) => setSessionForm({ ...sessionForm, meeting_link: e.target.value })} placeholder="https://meet.google.com/..." />
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input" rows={2} value={sessionForm.notes} onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} placeholder="Session notes..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setAddModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">Schedule</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={createGroupModalOpen} onClose={() => setCreateGroupModalOpen(false)} title="Create New Group">
        <form onSubmit={handleCreateGroup}>
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input type="text" className="form-input" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="e.g. Morning Yoga, Wellness Group" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <input type="text" className="form-input" value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} placeholder="Short description" />
          </div>
          <div className="form-group">
            <label className="form-label">Meeting URL (optional)</label>
            <input type="url" className="form-input" value={groupForm.meeting_link} onChange={(e) => setGroupForm({ ...groupForm, meeting_link: e.target.value })} placeholder="https://meet.google.com/..." />
          </div>
          <div className="form-group">
            <label className="form-label">Coordinator</label>
            <input type="text" className="form-input" value={groupForm.coordinator} onChange={(e) => setGroupForm({ ...groupForm, coordinator: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setCreateGroupModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-forest">Create Group</button>
          </div>
        </form>
      </Modal>

      {groupDetailModal && (
        <Modal isOpen={!!groupDetailModal} onClose={() => setGroupDetailModal(null)} title={`Group: ${groupDetailModal.name}`}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                {groupDetailModal.description && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{groupDetailModal.description}</div>}
                {groupDetailModal.meeting_link && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--sage-primary)', marginTop: '4px' }}>
                    <Video size={12} style={{ verticalAlign: 'middle' }} /> {groupDetailModal.meeting_link}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setAddMemberModal(true)} className="btn btn-primary btn-sm" style={{ gap: '3px' }}>
                  <UserPlus size={14} /> Add Members
                </button>
                <button onClick={() => handleDeleteGroup(groupDetailModal.id)} className="btn btn-outline btn-sm" style={{ color: '#D32F2F', borderColor: '#FFCDD2' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--forest-dark)' }}>Members ({groupMembers.length})</h4>
            {groupMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No members yet. Click "Add Members" to get started.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {groupMembers.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'var(--cream-bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--forest-dark)' }}>{m.name}</span>
                      {m.email && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{m.email}</span>}
                      {m.phone && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{m.phone}</span>}
                    </div>
                    <button onClick={() => handleRemoveMember(m.id)} className="btn btn-outline btn-sm" style={{ padding: '2px 6px', color: '#D32F2F' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => handleScheduleGroupSession(groupDetailModal)} className="btn btn-primary" style={{ gap: '4px' }}>
                <Plus size={16} /> Schedule Session
              </button>
              <button onClick={() => setGroupDetailModal(null)} className="btn btn-outline">Close</button>
            </div>
          </div>
        </Modal>
      )}

      {addMemberModal && (
        <Modal isOpen={addMemberModal} onClose={() => { setAddMemberModal(false); setSelectedPatients([]); }} title="Add Members to Group">
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Select patients to add to <strong>{groupDetailModal?.name}</strong>:
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {patients.map((p) => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--cream-bg)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedPatients.includes(p.id)}
                    onChange={(e) => setSelectedPatients(e.target.checked ? [...selectedPatients, p.id] : selectedPatients.filter((id) => id !== p.id))}
                  />
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.phone || p.email}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => { setAddMemberModal(false); setSelectedPatients([]); }} className="btn btn-outline">Cancel</button>
              <button onClick={handleAddMembers} className="btn btn-primary" disabled={!selectedPatients.length}>
                Add {selectedPatients.length} Member{selectedPatients.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {selectedSession && (
        <Modal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} title={`Share Details - ${selectedSession.group_name || selectedSession.patient_name}`}>
          <div>
            <div style={{ backgroundColor: 'var(--cream-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--forest-dark)' }}>{selectedSession.group_name || selectedSession.patient_name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {selectedSession.session_date} at {formatTime12(selectedSession.session_time)}
              </div>
              {selectedSession.meeting_link && (
                <div style={{ fontSize: '0.82rem', color: 'var(--sage-primary)', marginTop: '4px', wordBreak: 'break-all' }}>
                  {selectedSession.meeting_link}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={shareSession} className="btn btn-primary" style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}>
                <Share2 size={18} />
                <span>Share via Mobile / Clipboard</span>
              </button>
              <button onClick={copyMeetingLink} className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}>
                {copiedLink ? <Check size={18} color="var(--status-green)" /> : <Copy size={18} />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Meeting Link to Clipboard'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};