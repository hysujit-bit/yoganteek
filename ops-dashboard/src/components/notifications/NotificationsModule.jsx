import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Badge } from '../common/Badge';
import { Bell, CheckCircle2, Clock, Filter, AlertTriangle, Trash2, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

export const NotificationsModule = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading, fetchNotifications } = useNotifications();
  const [filterPriority, setFilterPriority] = useState('all');
  const [showRead, setShowRead] = useState(false);
  const [clearing, setClearing] = useState(false);

  const filtered = notifications
    .filter((n) => {
      if (!showRead && n.is_read) return false;
      return filterPriority === 'all' || n.priority === filterPriority;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const handleClearRead = async () => {
    try {
      setClearing(true);
      await api.deleteReadNotifications();
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to clear read notifications', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Bell size={22} color="var(--sage-primary)" />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--forest-dark)' }}>Smart Notifications & Alerts</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{unreadCount} unread alert{unreadCount !== 1 ? 's' : ''} active</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowRead(!showRead)}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {showRead ? <EyeOff size={14} /> : <Eye size={14} />}
              {showRead ? 'Hide Read' : 'Show Read'}
            </button>

            <select
              className="form-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{ width: '140px' }}
            >
              <option value="all">All Priorities</option>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>

            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="btn btn-outline btn-sm">
                <CheckCircle2 size={14} /> Mark All Read
              </button>
            )}

            {notifications.some((n) => n.is_read) && (
              <button onClick={handleClearRead} className="btn btn-outline btn-sm" disabled={clearing}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--status-red)' }}>
                <Trash2 size={14} /> {clearing ? 'Clearing...' : 'Clear Read'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>Loading alerts...</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            No notifications found.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                backgroundColor: item.is_read ? 'var(--cream-card)' : 'var(--sage-light)',
                borderLeft: `4px solid ${item.priority === 'high' ? 'var(--status-red)' : item.priority === 'medium' ? 'var(--status-amber)' : 'var(--sage-primary)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--forest-dark)', fontSize: '0.95rem' }}>
                    {item.title}
                  </span>
                  <Badge variant={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'amber' : 'green'}>
                    {item.priority || 'medium'}
                  </Badge>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: '4px 0' }}>{item.message}</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent alert'}
                </div>
              </div>

              {!item.is_read && (
                <button onClick={() => markAsRead(item.id)} className="btn btn-outline btn-sm">
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
