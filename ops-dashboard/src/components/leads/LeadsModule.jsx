import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import { useSortableData } from '../../hooks/useSortableData';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Toast } from '../common/Toast';
import { Search, UserCheck, Calendar, CheckCircle2, Loader2, ArrowUp, ArrowDown, Mail, Phone, Info } from 'lucide-react';

export const LeadsModule = ({ onNavigate }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSource, setActiveSource] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [converting, setConverting] = useState(false);
  const [toast, setToast] = useState(null);
  const [newLeadIds, setNewLeadIds] = useState(new Set());
  const prevLeadIdsRef = useRef(new Set());
  const mountedRef = useRef(true);

  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [convertForm, setConvertForm] = useState({
    name: '', email: '', phone: '', health_goals: '', medical_history: '',
    coordinator: 'Dr. Jayashree Pattanaik',
  });

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logLead, setLogLead] = useState(null);
  const [logForm, setLogForm] = useState({
    session_date: new Date().toISOString().split('T')[0],
    session_time: '10:00', meeting_link: '', session_type: 'Free Consultation',
  });
  const [logSaving, setLogSaving] = useState(false);
  const [detailLead, setDetailLead] = useState(null);

  const loadLeads = useCallback(async (isPoll = false) => {
    try {
      if (!isPoll) setLoading(true);
      const data = await api.getLeads();
      const list = Array.isArray(data) ? data : data.leads || [];

      if (isPoll && mountedRef.current) {
        const currentIds = new Set(list.map((l) => `${l.type}-${l.id}`));
        const prevIds = prevLeadIdsRef.current;
        if (prevIds.size > 0) {
          const added = [...currentIds].filter((id) => !prevIds.has(id));
          if (added.length > 0) {
            const newLeads = list.filter((l) => added.includes(`${l.type}-${l.id}`));
            const names = newLeads.map((l) => l.name).join(', ');
            setToast({ message: `New lead${added.length > 1 ? 's' : ''}: ${names}`, type: 'success' });
            setNewLeadIds((prev) => new Set([...prev, ...added]));
            setTimeout(() => setNewLeadIds(new Set()), 8000);
          }
        }
        prevLeadIdsRef.current = currentIds;
      }

      setLeads(list);
      if (!isPoll) prevLeadIdsRef.current = new Set(list.map((l) => `${l.type}-${l.id}`));
    } catch (err) {
      console.error('Failed to load leads', err);
      if (!isPoll) setLeads([]);
    } finally {
      if (!isPoll) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadLeads(false);
    const interval = setInterval(() => loadLeads(true), 60000);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [loadLeads]);

  const handleStatusChange = async (lead, newStatus) => {
    try {
      await api.updateLeadStatus(lead.type || 'lead', lead.id, { status: newStatus });
      setLeads((prev) =>
        prev.map((item) => (item.id === lead.id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      console.error('Status update error', err);
    }
  };

  const openConvertModal = (lead) => {
    setSelectedLead(lead);
    setConvertForm({
      name: lead.name || '', email: lead.email || '', phone: lead.phone || '',
      health_goals: lead.notes || lead.service_interest || '', medical_history: '',
      coordinator: lead.coordinator || 'Dr. Jayashree Pattanaik',
    });
    setConvertModalOpen(true);
  };

  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    if (converting) return;
    try {
      setConverting(true);
      await api.createPatient({
        ...convertForm, lead_id: selectedLead?.id,
        source: selectedLead?.source || 'Lead Conversion',
      });
      if (selectedLead) await handleStatusChange(selectedLead, 'converted');
      setConvertModalOpen(false);
      setToast({ message: `Patient profile created for ${convertForm.name}`, type: 'success' });
      if (onNavigate) onNavigate('patients');
    } catch (err) {
      setToast({ message: err.message || 'Failed to convert lead', type: 'error' });
    } finally {
      setConverting(false);
    }
  };

  const openLogConsultation = (lead) => {
    setLogLead(lead);
    setLogForm({
      session_date: new Date().toISOString().split('T')[0],
      session_time: '10:00', meeting_link: '', session_type: 'Free Consultation',
    });
    setLogModalOpen(true);
  };

  const handleLogConsultation = async (e) => {
    e.preventDefault();
    if (!logLead) return;
    try {
      setLogSaving(true);
      await api.logConsultation(logLead.id, logForm);
      setLogModalOpen(false);
      setToast({ message: `Consultation logged for ${logLead.name}`, type: 'success' });
      loadLeads();
    } catch (err) {
      setToast({ message: err.message || 'Failed to log consultation', type: 'error' });
    } finally {
      setLogSaving(false);
    }
  };

  const filteredLeads = leads.filter((item) => {
    const matchesSource = activeSource === 'all' || item.type === activeSource || item.source?.toLowerCase().includes(activeSource);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch =
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone?.includes(searchQuery);
    return matchesSource && matchesStatus && matchesSearch;
  });

  const { sortedItems, requestSort, sortConfig } = useSortableData(filteredLeads, { key: 'created_at', direction: 'desc' });

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
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--cream-bg)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            {['all', 'lead', 'contact', 'corporate'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSource(tab)}
                style={{
                  padding: '0.4rem 0.85rem', border: 'none', borderRadius: 'var(--radius-sm)',
                  backgroundColor: activeSource === tab ? 'var(--forest-dark)' : 'transparent',
                  color: activeSource === tab ? '#FFF' : 'var(--text-main)',
                  fontWeight: activeSource === tab ? 600 : 400, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'capitalize',
                }}
              >
                {tab === 'all' ? 'All Sources' : tab === 'lead' ? 'Website Leads' : tab === 'contact' ? 'Ad Enquiries' : 'Corporate'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '480px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text" className="form-input" placeholder="Search lead name, email or phone..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: '2.2rem' }}
              />
            </div>
            <select
              className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '150px' }}
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="consultation_booked">Consultation Booked</option>
              <option value="no_show">No-Show</option>
              <option value="converted">Converted</option>
              <option value="not_interested">Not Interested</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Leads Table */}
      <div className="table-container desktop-only-table">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('name')} style={thStyle('name')}>Lead Name<SortIcon columnKey="name" /></th>
              <th onClick={() => requestSort('type')} style={thStyle('type')}>Source<SortIcon columnKey="type" /></th>
              <th>Contact Info</th>
              <th onClick={() => requestSort('created_at')} style={thStyle('created_at')}>Date<SortIcon columnKey="created_at" /></th>
              <th onClick={() => requestSort('status')} style={thStyle('status')}>Status<SortIcon columnKey="status" /></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading enquiries...</td>
              </tr>
            ) : sortedItems.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No matching leads found.
                </td>
              </tr>
            ) : (
              sortedItems.map((lead) => {
                const leadKey = `${lead.type}-${lead.id}`;
                const isNew = newLeadIds.has(leadKey);
                return (
                  <tr key={leadKey} className={isNew ? 'row-highlight' : ''}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--forest-dark)' }}>{lead.name}</div>
                      {lead.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{lead.notes}</div>}
                    </td>
                    <td>
                      <Badge variant={lead.type === 'corporate' ? 'blue' : lead.type === 'contact' ? 'amber' : 'green'}>
                        {lead.source || lead.type || 'Website'}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{lead.email}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lead.phone}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td>
                      <select
                        className="form-select" value={lead.status || 'new'}
                        onChange={(e) => handleStatusChange(lead, e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', borderRadius: '12px' }}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="consultation_booked">Consultation Booked</option>
                        <option value="no_show">No-Show</option>
                        <option value="converted">Converted</option>
                        <option value="not_interested">Not Interested</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setDetailLead(lead)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                          title="View details"
                        >
                          <Info size={12} /> Details
                        </button>
                        {lead.status !== 'converted' && lead.status !== 'not_interested' && (
                          <button
                            onClick={() => openLogConsultation(lead)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                          >
                            <Calendar size={12} /> Log Consultation
                          </button>
                        )}
                        {lead.status === 'converted' ? (
                          <span style={{ fontSize: '0.78rem', color: 'var(--status-green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={13} /> Converted
                          </span>
                        ) : (
                          <button
                            onClick={() => openConvertModal(lead)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                          >
                            <UserCheck size={12} /> Convert
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Lead Cards */}
      <div className="mobile-only-cards">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading enquiries...</div>
        ) : sortedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No matching leads found.</div>
        ) : (
          sortedItems.map((lead) => {
            const leadKey = `${lead.type}-${lead.id}`;
            const isNew = newLeadIds.has(leadKey);
            return (
              <div key={leadKey} className={`booking-card ${isNew ? 'row-highlight' : ''}`}>
                <div className="booking-card-header">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--forest-dark)', fontSize: '0.95rem' }}>{lead.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                  <Badge variant={lead.type === 'corporate' ? 'blue' : lead.type === 'contact' ? 'amber' : 'green'}>
                    {lead.source || lead.type || 'Website'}
                  </Badge>
                </div>

                <div className="booking-card-details">
                  {lead.email && (
                    <div className="booking-detail-row">
                      <Mail size={14} color="var(--sage-primary)" />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lead.email}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="booking-detail-row">
                      <Phone size={14} color="var(--sage-primary)" />
                      <a href={`tel:${lead.phone}`} style={{ color: 'var(--forest-dark)', fontWeight: 600 }}>{lead.phone}</a>
                    </div>
                  )}
                  {lead.notes && (
                    <div className="booking-detail-row">
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{lead.notes}</span>
                    </div>
                  )}
                  <div className="booking-detail-row">
                    <span style={{ fontSize: '0.78rem' }}>Status:</span>
                    <select
                      className="form-select" value={lead.status || 'new'}
                      onChange={(e) => handleStatusChange(lead, e.target.value)}
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.72rem', borderRadius: '12px', width: 'auto' }}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="consultation_booked">Consultation Booked</option>
                      <option value="no_show">No-Show</option>
                      <option value="converted">Converted</option>
                      <option value="not_interested">Not Interested</option>
                    </select>
                  </div>
                </div>

                <div className="booking-card-actions">
                  <button onClick={() => setDetailLead(lead)} className="btn btn-outline btn-sm" style={{ gap: '3px' }}>
                    <Info size={12} /> Details
                  </button>
                  {lead.status !== 'converted' && lead.status !== 'not_interested' && (
                    <button onClick={() => openLogConsultation(lead)} className="btn btn-outline btn-sm" style={{ gap: '3px' }}>
                      <Calendar size={12} /> Log
                    </button>
                  )}
                  {lead.status === 'converted' ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--status-green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle2 size={13} /> Converted
                    </span>
                  ) : (
                    <button onClick={() => openConvertModal(lead)} className="btn btn-primary btn-sm" style={{ gap: '3px' }}>
                      <UserCheck size={12} /> Convert
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title={`Convert Lead to Patient — ${selectedLead?.name}`}
      >
        <form onSubmit={handleConvertSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" value={convertForm.name}
              onChange={(e) => setConvertForm({ ...convertForm, name: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={convertForm.email}
                onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" value={convertForm.phone}
                onChange={(e) => setConvertForm({ ...convertForm, phone: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Health Goals</label>
            <textarea className="form-textarea" rows="3" value={convertForm.health_goals}
              onChange={(e) => setConvertForm({ ...convertForm, health_goals: e.target.value })}
              placeholder="e.g. Stress management, chronic back pain relief, prenatal care..." />
          </div>
          <div className="form-group">
            <label className="form-label">Assigned Care Coordinator</label>
            <input type="text" className="form-input" value={convertForm.coordinator}
              onChange={(e) => setConvertForm({ ...convertForm, coordinator: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setConvertModalOpen(false)} className="btn btn-outline" disabled={converting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={converting} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {converting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : 'Create Patient Profile'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title={`Log Consultation — ${logLead?.name}`}
      >
        <form onSubmit={handleLogConsultation}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Enter the consultation details from the Calendly confirmation. This will create a session record in the dashboard.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Consultation Date</label>
              <input type="date" className="form-input" value={logForm.session_date}
                onChange={(e) => setLogForm({ ...logForm, session_date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Consultation Time</label>
              <input type="time" className="form-input" value={logForm.session_time}
                onChange={(e) => setLogForm({ ...logForm, session_time: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Session Type</label>
            <select className="form-select" value={logForm.session_type}
              onChange={(e) => setLogForm({ ...logForm, session_type: e.target.value })}>
              <option value="Free Consultation">Free Consultation</option>
              <option value="Follow-up Consultation">Follow-up Consultation</option>
              <option value="Initial Assessment">Initial Assessment</option>
              <option value="Yoga Therapy Session">Yoga Therapy Session</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Meeting Link (optional)</label>
            <input type="url" className="form-input" value={logForm.meeting_link}
              onChange={(e) => setLogForm({ ...logForm, meeting_link: e.target.value })}
              placeholder="https://meet.google.com/... or https://zoom.us/j/..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setLogModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={logSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {logSaving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Save Consultation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Lead Detail Slide-out Panel */}
      {detailLead && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} onClick={() => setDetailLead(null)} />
          <div style={{ position: 'relative', width: '380px', maxWidth: '90vw', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.25s ease-out' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--forest-dark)' }}>{detailLead.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{detailLead.email}</div>
              </div>
              <button onClick={() => setDetailLead(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>Health Goal</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-dark)', lineHeight: 1.5 }}>{detailLead.health_goal || '—'}</div>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>Concern</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-dark)', lineHeight: 1.5 }}>{detailLead.concern || '—'}</div>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>Message</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-dark)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{detailLead.message || '—'}</div>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1.25rem 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>{detailLead.phone || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
                  <Badge variant={detailLead.status === 'converted' ? 'green' : detailLead.status === 'no_show' ? 'red' : detailLead.status === 'new' ? 'amber' : 'default'}>{detailLead.status || 'new'}</Badge>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '4px' }}>Source</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>{detailLead.source || 'Website'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '4px' }}>Created</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>{detailLead.created_at ? new Date(detailLead.created_at).toLocaleDateString() : '—'}</div>
                </div>
              </div>
              {detailLead.notes && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>Notes</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>{detailLead.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
