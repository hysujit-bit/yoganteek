import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Users, ClipboardList, Calendar, AlertCircle, Video, Share2, ArrowRight, RefreshCw, CheckCircle2, Clock, Bell, Zap, AlertTriangle, Info } from 'lucide-react';

const getTimeUntil = (dateStr, timeStr) => {
  const now = new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const target = new Date(y, m - 1, d, hh, mm);
  const diffMs = target - now;
  if (diffMs < 0) return null;
  const totalMin = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins} min`;
};

const getUrgencyLevel = (dateStr, timeStr) => {
  const now = new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const target = new Date(y, m - 1, d, hh, mm);
  const diffMin = (target - now) / 60000;
  if (diffMin <= 60) return 'critical';
  if (diffMin <= 180) return 'warning';
  return 'info';
};

const bannerStyles = {
  critical: { bg: '#FFEBEE', border: '#FFCDD2', icon: Zap, iconColor: '#D32F2F', labelColor: '#B71C1C', textColor: '#C62828' },
  warning:  { bg: '#FFF3E0', border: '#FFE0B2', icon: AlertTriangle, iconColor: '#ED6C02', labelColor: '#B78103', textColor: '#665000' },
  info:     { bg: '#E8F5E9', border: '#C8E6C9', icon: Info, iconColor: '#2E7D32', labelColor: '#1B5E20', textColor: '#2E7D32' },
  neutral:  { bg: '#F5F5F5', border: '#E0E0E0', icon: Bell, iconColor: '#616161', labelColor: '#424242', textColor: '#616161' },
};

export const DashboardHome = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    open_leads: 0,
    active_patients: 0,
    sessions_today: 0,
    pending_followups: 0,
    today_sessions: [],
    pipeline: { new: 0, contacted: 0, consultation_booked: 0, converted: 0 },
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bannerNow, setBannerNow] = useState(new Date());

  const formatTime12 = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    const hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const h12 = hr % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, sessionsData] = await Promise.all([
        api.getDashboardStats().catch((err) => {
          console.error('Dashboard stats error:', err);
          return null;
        }),
        api.getSessions(false).catch((err) => {
          console.error('Sessions fetch error:', err);
          return { sessions: [] };
        }),
      ]);

      if (statsData) {
        setStats({
          open_leads: statsData.open_leads || 0,
          active_patients: statsData.active_patients || 0,
          sessions_today: statsData.sessions_today || 0,
          pending_followups: statsData.follow_ups_pending || 0,
          today_sessions: statsData.today_sessions || [],
          pipeline: statsData.pipeline || { new: 0, contacted: 0, consultation_booked: 0, converted: 0 },
        });
      }

      const allSessions = Array.isArray(sessionsData) ? sessionsData : sessionsData.sessions || [];
      const today = new Date().toISOString().split('T')[0];
      const upcoming = allSessions
        .filter((s) => s.session_date >= today && s.status === 'scheduled')
        .sort((a, b) => a.session_date.localeCompare(b.session_date) || a.session_time.localeCompare(b.session_time))
        .slice(0, 5);
      setUpcomingSessions(upcoming);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Could not load dashboard data. The backend may be starting up.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => setBannerNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getBanner = () => {
    const today = new Date().toISOString().split('T')[0];
    const allUpcoming = upcomingSessions.filter((s) => s.session_date >= today);
    const nextSession = allUpcoming[0];

    if (stats.pending_followups > 0) {
      return {
        ...bannerStyles.warning,
        label: 'Follow-ups Overdue',
        message: `${stats.pending_followups} patient follow-up${stats.pending_followups > 1 ? 's' : ''} past due — reach out to keep them engaged.`,
      };
    }

    if (stats.sessions_today > 0) {
      const nextToday = (stats.today_sessions || []).find((s) => {
        const [hh, mm] = s.session_time.split(':').map(Number);
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm) > now;
      });
      if (nextToday) {
        const timeUntil = getTimeUntil(today, nextToday.session_time);
        const urgency = getUrgencyLevel(today, nextToday.session_time);
        const label = urgency === 'critical' ? 'Starting Very Soon' : 'Upcoming Today';
        const msg = urgency === 'critical'
          ? `Session with ${nextToday.patient_name} starts in ${timeUntil}.`
          : `${nextToday.patient_name} consultation in ${timeUntil} — prepare your notes.`;
        return { ...bannerStyles[urgency], label, message: msg };
      }
      return {
        ...bannerStyles.info,
        label: 'Today\'s Schedule',
        message: `${stats.sessions_today} consultation${stats.sessions_today > 1 ? 's' : ''} today — all set.`,
      };
    }

    if (nextSession) {
      const timeUntil = getTimeUntil(nextSession.session_date, nextSession.session_time);
      if (timeUntil) {
        return {
          ...bannerStyles.info,
          label: 'Next Consultation',
          message: `Next session: ${nextSession.patient_name} in ${timeUntil} — ${nextSession.session_date} at ${formatTime12(nextSession.session_time)}.`,
        };
      }
    }

    if (stats.open_leads > 3) {
      return {
        ...bannerStyles.warning,
        label: 'Leads Need Attention',
        message: `${stats.open_leads} open lead${stats.open_leads > 1 ? 's' : ''} waiting for a response. Follow up to convert them.`,
      };
    }

    return {
      ...bannerStyles.neutral,
      label: 'All Clear',
      message: 'No urgent items right now. Check bookings or follow up with leads.',
    };
  };

  return (
    <div>
      {/* Error Banner */}
      {error && (
        <div style={{ backgroundColor: '#FFF3E0', border: '1px solid #FFE0B2', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={20} color="var(--status-amber)" />
            <span style={{ fontSize: '0.85rem', color: '#665000' }}>{error}</span>
          </div>
          <button onClick={loadData} className="btn btn-outline btn-sm" style={{ borderColor: '#FFE0B2', color: '#B78103', backgroundColor: '#FFF' }}>
            Retry
          </button>
        </div>
      )}

      {/* Dynamic Attention Banner */}
      {!error && (
        (() => {
          const b = getBanner();
          const BannerIcon = b.icon;
          return (
            <div style={{
              backgroundColor: b.bg,
              border: `1px solid ${b.border}`,
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
                <BannerIcon size={20} color={b.iconColor} />
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: b.labelColor }}>{b.label}: </span>
                  <span style={{ fontSize: '0.85rem', color: b.textColor }}>{b.message}</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('bookings')}
                className="btn btn-outline btn-sm"
                style={{ borderColor: b.border, color: b.labelColor, backgroundColor: '#FFF' }}
              >
                View Schedule <ArrowRight size={14} />
              </button>
            </div>
          );
        })()
      )}

      {/* Stat Cards Grid */}
      <div className="stat-grid">
        <StatCard icon={Users} number={stats.open_leads} label="Open Leads" subtext="Awaiting response" color="#3D4F35" />
        <StatCard icon={ClipboardList} number={stats.active_patients} label="Active Patients" subtext="Enrolled care plans" color="#7A8B6F" />
        <StatCard icon={Calendar} number={stats.sessions_today} label="Sessions Today" subtext="Scheduled consultations" color="#C4A265" />
        <StatCard icon={AlertCircle} number={stats.pending_followups} label="Follow-ups Due" subtext="Pending action" color="#D32F2F" />
      </div>

      {/* Main Grid: Today's Sessions & Upcoming Sessions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Today's Sessions Section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--forest-dark)' }}>Today's Sessions</h3>
            <button onClick={loadData} className="btn btn-outline btn-sm" style={{ padding: '4px 8px' }} title="Refresh">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {(stats.today_sessions || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} color="var(--sage-primary)" style={{ marginBottom: '0.5rem' }} />
              <p>No consultations scheduled for today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(stats.today_sessions || []).map((session) => (
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
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {formatTime12(session.session_time)} - {session.session_type || 'Consultation'}
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

        {/* Upcoming Sessions Section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--forest-dark)' }}>Upcoming Sessions</h3>
            <button onClick={() => onNavigate('sessions')} className="btn btn-outline btn-sm">
              View All <ArrowRight size={14} />
            </button>
          </div>

          {upcomingSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <Calendar size={36} color="var(--sage-primary)" style={{ marginBottom: '0.5rem' }} />
              <p>No upcoming sessions scheduled.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--cream-bg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--forest-dark)', fontSize: '0.9rem' }}>
                      {session.patient_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Calendar size={12} /> {session.session_date} at {formatTime12(session.session_time)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {session.session_type || 'Consultation'}
                    </div>
                  </div>
                  <div>
                    {session.meeting_link ? (
                      <a
                        href={session.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}
                      >
                        <Video size={12} /> Join
                      </a>
                    ) : (
                      <Badge variant="amber">No link</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lead Pipeline Overview */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--forest-dark)', marginBottom: '1.25rem' }}>
          Lead Pipeline Progress
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 500 }}>New Inquiries</span>
              <span style={{ fontWeight: 700 }}>{stats.pipeline.new || 0}</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--sage-light)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, ((stats.pipeline.new || 0) / 10) * 100)}%`, height: '100%', backgroundColor: 'var(--sage-primary)', transition: 'width 0.5s ease' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 500 }}>Contacted / Follow-up</span>
              <span style={{ fontWeight: 700 }}>{stats.pipeline.contacted || 0}</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--status-amber-bg)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, ((stats.pipeline.contacted || 0) / 10) * 100)}%`, height: '100%', backgroundColor: 'var(--status-amber)', transition: 'width 0.5s ease' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 500 }}>Consultation Booked</span>
              <span style={{ fontWeight: 700 }}>{stats.pipeline.consultation_booked || 0}</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--status-blue-bg)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, ((stats.pipeline.consultation_booked || 0) / 10) * 100)}%`, height: '100%', backgroundColor: 'var(--status-blue)', transition: 'width 0.5s ease' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 500 }}>Converted Patients</span>
              <span style={{ fontWeight: 700 }}>{stats.pipeline.converted || 0}</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--status-green-bg)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, ((stats.pipeline.converted || 0) / 10) * 100)}%`, height: '100%', backgroundColor: 'var(--status-green)', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Manage leads and inquiries</span>
          <button onClick={() => onNavigate('leads')} className="btn btn-outline btn-sm">
            Open Leads Board <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
