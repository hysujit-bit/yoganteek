import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSortableData } from '../../hooks/useSortableData';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Search, Plus, User, Mail, Phone, Calendar, Heart, Share2, FileText, Check, ArrowUp, ArrowDown } from 'lucide-react';

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
      ? <ArrowUp size={13} style={{ marginLeft: '3px' }} />
      : <ArrowDown size={13} style={{ marginLeft: '3px' }} />;
  };

  const thStyle = (key) => ({
    cursor: 'pointer',
    userSelect: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
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
      <div className="table-container">
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
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setProfileModalOpen(true);
                      }}
                      className="btn btn-outline btn-sm"
                    >
                      <User size={14} /> Full Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
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
    </div>
  );
};
