import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Calendar as CalendarIcon, Plus, Video, Share2, Mail, MessageSquare, Copy, Check, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';

export const SessionsModule = () => {
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [error, setError] = useState(null);

  // Schedule Session Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    patient_id: '',
    patient_name: '',
    session_date: new Date().toISOString().split('T')[0],
    session_time: '10:00',
    duration_minutes: 45,
    session_type: 'Follow-up Consultation',
    meeting_link: '',
    notes: '',
  });

  // Share Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sessionsData, patientsData] = await Promise.all([
        api.getSessions(false).catch((err) => { console.error('Sessions fetch error:', err); return []; }),
        api.getPatients().catch((err) => { console.error('Patients fetch error:', err); return []; }),
      ]);
      const sessionList = Array.isArray(sessionsData) ? sessionsData : sessionsData.sessions || [];
      const patientList = Array.isArray(patientsData) ? patientsData : patientsData.patients || [];
      setSessions(sessionList);
      setPatients(patientList);
    } catch (err) {
      console.error('Failed to load sessions data', err);
      setError('Failed to load sessions. The backend may be starting up.');
      setSessions([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePatientSelect = (patientId) => {
    const p = patients.find((pat) => String(pat.id) === String(patientId));
    setSessionForm({
      ...sessionForm,
      patient_id: patientId,
      patient_name: p ? p.name : '',
    });
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await api.createSession(sessionForm);
      setAddModalOpen(false);
      setSessionForm({
        patient_id: '',
        patient_name: '',
        session_date: new Date().toISOString().split('T')[0],
        session_time: '10:00',
        duration_minutes: 45,
        session_type: 'Follow-up Consultation',
        meeting_link: '',
        notes: '',
      });
      loadData();
    } catch (err) {
      alert(`Error scheduling session: ${err.message}`);
    }
  };

  const handleSendCallDetailsEmail = async () => {
    if (!selectedSession) return;
    try {
      setSendingEmail(true);
      await api.shareSessionDetails(selectedSession.id, { send_email: true });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) {
      alert(`Failed to send email: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const openWhatsAppShare = () => {
    if (!selectedSession) return;
    const text = encodeURIComponent(
      `Hello ${selectedSession.patient_name}, here are your session details with Dr. Jayashree:\n\nDate: ${selectedSession.session_date}\nTime: ${selectedSession.session_time}\nMeeting Link: ${selectedSession.meeting_link || 'Link will be sent shortly'}\n\nLooking forward to seeing you!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyMeetingLink = () => {
    if (!selectedSession?.meeting_link) return;
    navigator.clipboard.writeText(selectedSession.meeting_link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatTime12 = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    const hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const h12 = hr % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const isUpcoming = (session) => {
    const today = new Date().toISOString().split('T')[0];
    return session.session_date >= today && session.status === 'scheduled';
  };

  const isPast = (session) => {
    const today = new Date().toISOString().split('T')[0];
    return session.session_date < today || session.status === 'completed' || session.status === 'no-show' || session.status === 'cancelled';
  };

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'upcoming') return isUpcoming(s);
    if (activeTab === 'past') return isPast(s);
    return true;
  });

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

  return (
    <div>
      {/* Header Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--cream-bg)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <button
              onClick={() => setActiveTab('upcoming')}
              style={{
                padding: '0.4rem 0.85rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTab === 'upcoming' ? 'var(--forest-dark)' : 'transparent',
                color: activeTab === 'upcoming' ? '#FFF' : 'var(--text-main)',
                fontWeight: activeTab === 'upcoming' ? 600 : 400,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              style={{
                padding: '0.4rem 0.85rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTab === 'past' ? 'var(--forest-dark)' : 'transparent',
                color: activeTab === 'past' ? '#FFF' : 'var(--text-main)',
                fontWeight: activeTab === 'past' ? 600 : 400,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Past ({pastCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '0.4rem 0.85rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTab === 'all' ? 'var(--forest-dark)' : 'transparent',
                color: activeTab === 'all' ? '#FFF' : 'var(--text-main)',
                fontWeight: activeTab === 'all' ? 600 : 400,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              All ({sessions.length})
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={loadData} className="btn btn-outline btn-sm" title="Refresh" style={{ padding: '0.35rem 0.65rem' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
            <button onClick={() => setAddModalOpen(true)} className="btn btn-forest">
              <Plus size={16} /> Schedule Session
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#D32F2F' }}>{error}</span>
          <button onClick={loadData} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {/* Sessions Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Date & Time</th>
              <th>Session Type</th>
              <th>Meeting Link</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading sessions...</td>
              </tr>
            ) : filteredSessions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} color="var(--sage-primary)" style={{ marginBottom: '0.5rem' }} />
                  <p>
                    {activeTab === 'upcoming'
                      ? 'No upcoming sessions scheduled.'
                      : activeTab === 'past'
                        ? 'No past sessions found.'
                        : 'No sessions found. Click "Schedule Session" to add one.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredSessions.map((session) => (
                <tr key={session.id} style={{ backgroundColor: isPast(session) && session.status === 'completed' ? '#FAFFF9' : isPast(session) && session.status === 'no-show' ? '#FFFAF9' : undefined }}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--forest-dark)' }}>{session.patient_name}</div>
                    {session.patient_email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{session.patient_email}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {session.session_date}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={12} /> {formatTime12(session.session_time)} ({session.duration_minutes || 30} mins)
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem' }}>{session.session_type || 'Consultation'}</div>
                  </td>
                  <td>
                    {session.meeting_link ? (
                      <a
                        href={session.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.75rem', gap: '4px' }}
                      >
                        <Video size={13} color="var(--sage-primary)" /> Join Call
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No link yet</span>
                    )}
                  </td>
                  <td>
                    <Badge variant={getStatusVariant(session.status)}>
                      {session.status || 'scheduled'}
                    </Badge>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedSession(session);
                        setShareModalOpen(true);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Share2 size={13} /> Share
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Schedule Session Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Schedule Consultation Session">
        <form onSubmit={handleCreateSession}>
          <div className="form-group">
            <label className="form-label">Select Patient</label>
            <select
              className="form-select"
              value={sessionForm.patient_id}
              onChange={(e) => handlePatientSelect(e.target.value)}
              required
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.phone || p.email})
                </option>
              ))}
            </select>
          </div>

          {!sessionForm.patient_id && (
            <div className="form-group">
              <label className="form-label">Or Patient Name (Manual Input)</label>
              <input
                type="text"
                className="form-input"
                value={sessionForm.patient_name}
                onChange={(e) => setSessionForm({ ...sessionForm, patient_name: e.target.value })}
                placeholder="Patient full name"
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={sessionForm.session_date}
                onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input
                type="time"
                className="form-input"
                value={sessionForm.session_time}
                onChange={(e) => setSessionForm({ ...sessionForm, session_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Session Type</label>
            <select
              className="form-select"
              value={sessionForm.session_type}
              onChange={(e) => setSessionForm({ ...sessionForm, session_type: e.target.value })}
            >
              <option value="Free Consultation">Free Consultation</option>
              <option value="Follow-up Consultation">Follow-up Consultation</option>
              <option value="Initial Assessment">Initial Assessment</option>
              <option value="Yoga Therapy Session">Yoga Therapy Session</option>
              <option value="Group Session">Group Session</option>
              <option value="Corporate Session">Corporate Session</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Zoom / Google Meet URL (optional)</label>
            <input
              type="url"
              className="form-input"
              value={sessionForm.meeting_link}
              onChange={(e) => setSessionForm({ ...sessionForm, meeting_link: e.target.value })}
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setAddModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Share Call Details Action Modal */}
      {selectedSession && (
        <Modal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          title={`Share Call Details — ${selectedSession.patient_name}`}
        >
          <div>
            <div style={{ backgroundColor: 'var(--cream-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--forest-dark)' }}>{selectedSession.patient_name}</div>
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
              <button
                onClick={handleSendCallDetailsEmail}
                className="btn btn-primary"
                disabled={sendingEmail}
                style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
              >
                <Mail size={18} />
                <span>{sendingEmail ? 'Sending Email...' : 'Send Branded Email to Patient'}</span>
              </button>
              {emailSent && <div style={{ color: 'var(--status-green)', fontSize: '0.8rem' }}>Session details email dispatched to patient!</div>}

              <button
                onClick={openWhatsAppShare}
                className="btn btn-forest"
                style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', backgroundColor: '#25D366' }}
              >
                <MessageSquare size={18} />
                <span>Share via WhatsApp</span>
              </button>

              <button
                onClick={copyMeetingLink}
                className="btn btn-outline"
                style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
              >
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
