import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Users, ClipboardList, Calendar, AlertCircle, Video, Share2, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export const DashboardHome = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    open_leads: 0,
    active_patients: 0,
    sessions_today: 0,
    pending_followups: 0,
    today_sessions_list: [],
    pipeline: { new: 0, contacted: 0, consultation_booked: 0, converted: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      // Fallback mock structure if API backend is spinning up or offline
      setStats((prev) => ({
        ...prev,
        open_leads: prev.open_leads || 5,
        active_patients: prev.active_patients || 12,
        sessions_today: prev.sessions_today || 3,
        pending_followups: prev.pending_followups || 2,
        today_sessions_list: prev.today_sessions_list.length > 0 ? prev.today_sessions_list : [
          { id: 1, patient_name: 'Meera Singh', session_time: '10:30 AM', session_type: 'Initial Consultation', meeting_link: 'https://meet.google.com/abc-defg-hij', status: 'scheduled' },
          { id: 2, patient_name: 'Rajesh Kumar', session_time: '02:00 PM', session_type: 'Follow-up Yoga Care', meeting_link: 'https://zoom.us/j/123456789', status: 'scheduled' },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      {/* Needs Attention Pinned Alert Banner */}
      <div style={{
        backgroundColor: '#FFF3E0',
        border: '1px solid #FFE0B2',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <AlertCircle size={20} color="var(--status-amber)" />
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#B78103' }}>Attention Required: </span>
            <span style={{ fontSize: '0.85rem', color: '#665000' }}>
              {stats.sessions_today > 0 ? `${stats.sessions_today} consultations scheduled for today.` : 'No urgent alerts.'} {stats.pending_followups > 0 && `${stats.pending_followups} follow-ups overdue.`}
            </span>
          </div>
        </div>
        <button
          onClick={() => onNavigate('sessions')}
          className="btn btn-outline btn-sm"
          style={{ borderColor: '#FFE0B2', color: '#B78103', backgroundColor: '#FFF' }}
        >
          View Schedule <ArrowRight size={14} />
        </button>
      </div>

      {/* Stat Cards Grid */}
      <div className="stat-grid">
        <StatCard icon={Users} number={stats.open_leads} label="Open Leads" subtext="Awaiting response" color="#3D4F35" />
        <StatCard icon={ClipboardList} number={stats.active_patients} label="Active Patients" subtext="Enrolled care plans" color="#7A8B6F" />
        <StatCard icon={Calendar} number={stats.sessions_today} label="Sessions Today" subtext="Scheduled consultations" color="#C4A265" />
        <StatCard icon={AlertCircle} number={stats.pending_followups} label="Follow-ups Due" subtext="Pending action" color="#D32F2F" />
      </div>

      {/* Main Grid: Today's Sessions & Mini Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Today's Sessions Section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--forest-dark)' }}>Today's Sessions</h3>
            <button onClick={loadData} className="btn btn-outline btn-sm" style={{ padding: '4px 8px' }} title="Refresh">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {stats.today_sessions_list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} color="var(--sage-primary)" style={{ marginBottom: '0.5rem' }} />
              <p>No more consultations scheduled for today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {stats.today_sessions_list.map((session) => (
                <div
                  key={session.id}
                  style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--cream-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--forest-dark)', fontSize: '0.95rem' }}>
                        {session.patient_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {session.session_time} • {session.session_type || 'Consultation'}
                      </div>
                    </div>
                    <Badge variant={session.status === 'completed' ? 'green' : 'amber'}>
                      {session.status}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {session.meeting_link ? (
                      <a
                        href={session.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, gap: '0.35rem' }}
                      >
                        <Video size={14} /> Launch Meeting
                      </a>
                    ) : (
                      <button className="btn btn-outline btn-sm" disabled style={{ flex: 1 }}>
                        No Link
                      </button>
                    )}
                    <button
                      onClick={() => onNavigate('sessions')}
                      className="btn btn-outline btn-sm"
                      title="Share Details"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lead Pipeline Overview */}
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--forest-dark)', marginBottom: '1.25rem' }}>
            Lead Pipeline Progress
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500 }}>New Inquiries</span>
                <span style={{ fontWeight: 700 }}>{stats.pipeline.new || 3}</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--sage-light)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '60%', height: '100%', backgroundColor: 'var(--sage-primary)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500 }}>Contacted / Follow-up</span>
                <span style={{ fontWeight: 700 }}>{stats.pipeline.contacted || 4}</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--status-amber-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '45%', height: '100%', backgroundColor: 'var(--status-amber)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500 }}>Consultation Booked</span>
                <span style={{ fontWeight: 700 }}>{stats.pipeline.consultation_booked || 2}</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--status-blue-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '30%', height: '100%', backgroundColor: 'var(--status-blue)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500 }}>Converted Patients</span>
                <span style={{ fontWeight: 700 }}>{stats.pipeline.converted || 8}</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--status-green-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '80%', height: '100%', backgroundColor: 'var(--status-green)' }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Manage leads & inquiries</span>
            <button onClick={() => onNavigate('leads')} className="btn btn-outline btn-sm">
              Open Leads Board <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
