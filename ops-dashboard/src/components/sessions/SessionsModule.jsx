import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Calendar as CalendarIcon, Plus, Video, Share2, Mail, MessageSquare, Copy, Check, Clock } from 'lucide-react';

export const SessionsModule = () => {
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  
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
      const [sessionsData, patientsData] = await Promise.all([
        api.getSessions(false).catch(() => []),
        api.getPatients().catch(() => []),
      ]);
      const sessionList = Array.isArray(sessionsData) ? sessionsData : sessionsData.sessions || [];
      const patientList = Array.isArray(patientsData) ? patientsData : patientsData.patients || [];
      setSessions(sessionList);
      setPatients(patientList);
    } catch (err) {
      console.error('Failed to load sessions data', err);
      // Fallback sample data
      setSessions([
        { id: 1, patient_name: 'Meera Singh', session_date: '2026-07-30', session_time: '10:30 AM', duration_minutes: 45, session_type: 'Prenatal Yoga Care', meeting_link: 'https://meet.google.com/abc-defg-hij', status: 'scheduled' },
        { id: 2, patient_name: 'Rajesh Kumar', session_date: '2026-07-30', session_time: '02:00 PM', duration_minutes: 30, session_type: 'Pranayama Therapy', meeting_link: 'https://zoom.us/j/123456789', status: 'scheduled' },
      ]);
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
      `Hello ${selectedSession.patient_name}, here are your session details with Dr. Jayashree:\n\n📅 Date: ${selectedSession.session_date}\n⏰ Time: ${selectedSession.session_time}\n🔗 Meeting Link: ${selectedSession.meeting_link || 'Link will be sent shortly'}\n\nLooking forward to seeing you!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyMeetingLink = () => {
    if (!selectedSession?.meeting_link) return;
    navigator.clipboard.writeText(selectedSession.meeting_link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div>
      {/* Header Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--cream-bg)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.4rem 0.85rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'list' ? 'var(--forest-dark)' : 'transparent',
                color: viewMode === 'list' ? '#FFF' : 'var(--text-main)',
                fontWeight: viewMode === 'list' ? 600 : 400,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '0.4rem 0.85rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'calendar' ? 'var(--forest-dark)' : 'transparent',
                color: viewMode === 'calendar' ? '#FFF' : 'var(--text-main)',
                fontWeight: viewMode === 'calendar' ? 600 : 400,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Calendar Schedule
            </button>
          </div>

          <button onClick={() => setAddModalOpen(true)} className="btn btn-forest">
            <Plus size={16} /> Schedule Session
          </button>
        </div>
      </div>

      {/* Sessions List View */}
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
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No sessions scheduled yet.
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--forest-dark)' }}>{session.patient_name}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{session.session_date}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={12} /> {session.session_time} ({session.duration_minutes || 30} mins)
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
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pending Link</span>
                    )}
                  </td>
                  <td>
                    <Badge variant={session.status === 'completed' ? 'green' : 'amber'}>
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
                      <Share2 size={13} /> Share Call Details
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
            <label className="form-label">Zoom / Google Meet URL</label>
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
                📅 {selectedSession.session_date} at {selectedSession.session_time}
              </div>
              {selectedSession.meeting_link && (
                <div style={{ fontSize: '0.82rem', color: 'var(--sage-primary)', marginTop: '4px', wordBreak: 'break-all' }}>
                  🔗 {selectedSession.meeting_link}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Option 1: Send Branded HTML Email */}
              <button
                onClick={handleSendCallDetailsEmail}
                className="btn btn-primary"
                disabled={sendingEmail}
                style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
              >
                <Mail size={18} />
                <span>{sendingEmail ? 'Sending Email...' : 'Send Branded Email to Patient'}</span>
              </button>
              {emailSent && <div style={{ color: 'var(--status-green)', fontSize: '0.8rem' }}>✓ Session details email dispatched to patient!</div>}

              {/* Option 2: Share via WhatsApp */}
              <button
                onClick={openWhatsAppShare}
                className="btn btn-forest"
                style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', backgroundColor: '#25D366' }}
              >
                <MessageSquare size={18} />
                <span>Share via WhatsApp</span>
              </button>

              {/* Option 3: Copy Meeting Link */}
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
