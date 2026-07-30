import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Search, UserCheck, Calendar, FileText, Filter, CheckCircle2 } from 'lucide-react';

export const LeadsModule = ({ onNavigate }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSource, setActiveSource] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Convert Modal State
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [convertForm, setConvertForm] = useState({
    name: '',
    email: '',
    phone: '',
    health_goals: '',
    medical_history: '',
    coordinator: 'Dr. Jayashree Pattanaik',
  });

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await api.getLeads();
      const list = Array.isArray(data) ? data : data.leads || [];
      setLeads(list);
    } catch (err) {
      console.error('Failed to load leads', err);
      // Fallback sample data if API is starting up
      setLeads([
        { id: 1, type: 'lead', source: 'Website Form', name: 'Ananya Roy', email: 'ananya@example.com', phone: '+91 98765 43210', status: 'new', created_at: '2026-07-29', notes: 'Interested in prenatal yoga care.' },
        { id: 2, type: 'contact', source: 'Meta Ad Inquiry', name: 'Karan Sharma', email: 'karan@example.com', phone: '+91 91234 56789', status: 'contacted', created_at: '2026-07-28', notes: 'Spoke on phone, wants follow-up consultation.' },
        { id: 3, type: 'corporate', source: 'Corporate Proposal', name: 'TechCorp Wellness Team', email: 'hr@techcorp.com', phone: '+91 99887 76655', status: 'consultation_booked', created_at: '2026-07-26', notes: 'Requested 50-person corporate yoga workshop proposal.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

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
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      health_goals: lead.notes || lead.service_interest || '',
      medical_history: '',
      coordinator: lead.coordinator || 'Dr. Jayashree Pattanaik',
    });
    setConvertModalOpen(true);
  };

  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createPatient({
        ...convertForm,
        lead_id: selectedLead?.id,
        source: selectedLead?.source || 'Lead Conversion',
      });
      if (selectedLead) {
        await handleStatusChange(selectedLead, 'converted');
      }
      setConvertModalOpen(false);
      alert(`Successfully created patient profile for ${convertForm.name}!`);
      if (onNavigate) onNavigate('patients');
    } catch (err) {
      alert(`Failed to convert lead: ${err.message}`);
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

  return (
    <div>
      {/* Top Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Source Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--cream-bg)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            {['all', 'lead', 'contact', 'corporate'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSource(tab)}
                style={{
                  padding: '0.4rem 0.85rem',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: activeSource === tab ? 'var(--forest-dark)' : 'transparent',
                  color: activeSource === tab ? '#FFF' : 'var(--text-main)',
                  fontWeight: activeSource === tab ? 600 : 400,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'all' ? 'All Sources' : tab === 'lead' ? 'Website Leads' : tab === 'contact' ? 'Ad Enquiries' : 'Corporate'}
              </button>
            ))}
          </div>

          {/* Search & Status Filter */}
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '480px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search lead name, email or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.2rem' }}
              />
            </div>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="consultation_booked">Consultation Booked</option>
              <option value="converted">Converted</option>
              <option value="not_interested">Not Interested</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Lead Name</th>
              <th>Source</th>
              <th>Contact Info</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading enquiries...</td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No matching leads found.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={`${lead.type}-${lead.id}`}>
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
                      className="form-select"
                      value={lead.status || 'new'}
                      onChange={(e) => handleStatusChange(lead, e.target.value)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', borderRadius: '12px' }}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="consultation_booked">Consultation Booked</option>
                      <option value="converted">Converted</option>
                      <option value="not_interested">Not Interested</option>
                    </select>
                  </td>
                  <td>
                    {lead.status === 'converted' ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--status-green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={14} /> Patient Profile Created
                      </span>
                    ) : (
                      <button
                        onClick={() => openConvertModal(lead)}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                      >
                        <UserCheck size={14} /> Convert to Patient
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Convert to Patient Modal */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title={`Convert Lead to Patient — ${selectedLead?.name}`}
      >
        <form onSubmit={handleConvertSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={convertForm.name}
              onChange={(e) => setConvertForm({ ...convertForm, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={convertForm.email}
                onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={convertForm.phone}
                onChange={(e) => setConvertForm({ ...convertForm, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Health Goals</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={convertForm.health_goals}
              onChange={(e) => setConvertForm({ ...convertForm, health_goals: e.target.value })}
              placeholder="e.g. Stress management, chronic back pain relief, prenatal care..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Care Coordinator</label>
            <input
              type="text"
              className="form-input"
              value={convertForm.coordinator}
              onChange={(e) => setConvertForm({ ...convertForm, coordinator: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setConvertModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Patient Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
