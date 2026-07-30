import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  Pill,
  Package,
  CalendarCheck,
  Bell,
  LogOut,
  X,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const AppLayout = ({ activeTab, setActiveTab, children }) => {
  const { logout } = useAuth();
  const { notifications, unreadCount, drawerOpen, setDrawerOpen, markAsRead, markAllAsRead } = useNotifications();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'leads', label: 'Leads & Enquiries', icon: Users },
    { id: 'patients', label: 'Patients', icon: ClipboardList },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'plans', label: 'Services & Plans', icon: Package },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ];

  const mobileNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'patients', label: 'Patients', icon: ClipboardList },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
  ];

  return (
    <div className="app-container">
      {/* Desktop Left Sidebar */}
      <aside className="desktop-sidebar">
        <div style={{
          padding: '1.5rem 1.25rem',
          borderBottom: '1px solid var(--border-dark)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-gold)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.1rem',
          }}>
            Y
          </div>
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', lineHeight: '1.1', fontWeight: 700 }}>
              Yoganteek
            </h2>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Ops Dashboard
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--sage-primary)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.8)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  marginBottom: '0.35rem',
                  transition: 'background-color 0.2s',
                  textAlign: 'left',
                }}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    backgroundColor: '#D32F2F',
                    color: '#FFF',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '10px',
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-dark)' }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-dark)',
              backgroundColor: 'transparent',
              color: 'rgba(255,255,255,0.75)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-content-wrapper">
        {/* Sticky Header */}
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.4rem', color: 'var(--forest-dark)', fontWeight: 600 }}>
              {navItems.find((n) => n.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Notification Bell Button */}
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              style={{
                position: 'relative',
                background: 'var(--cream-bg)',
                border: '1px solid var(--border-light)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--forest-dark)',
              }}
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  backgroundColor: '#D32F2F',
                  color: '#FFF',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={logout}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', gap: '0.35rem' }}
            >
              <LogOut size={14} />
              <span className="desktop-only">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="page-body">{children}</main>
      </div>

      {/* Slide-In Notification Drawer */}
      {drawerOpen && (
        <div className="modal-overlay" onClick={() => setDrawerOpen(false)} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="slide-drawer" onClick={(e) => e.stopPropagation()}>
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
                <Bell size={18} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFF' }}>Notifications</h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '0.75rem 1.5rem', background: 'var(--cream-bg)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}</span>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--sage-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  Mark All Read
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  <Sparkles size={32} color="var(--sage-primary)" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.9rem' }}>All caught up! No notifications.</p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: item.is_read ? 'var(--cream-card)' : 'var(--sage-light)',
                      border: '1px solid var(--border-light)',
                      marginBottom: '0.65rem',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--forest-dark)' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Clock size={12} /> {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: '4px 0 8px' }}>
                      {item.message}
                    </p>
                    {!item.is_read && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.72rem', gap: '3px' }}
                      >
                        <CheckCircle size={12} /> Mark Read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PWA Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <div style={{ position: 'relative' }}>
                <Icon />
                {item.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-6px',
                    backgroundColor: '#D32F2F',
                    color: '#FFF',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
