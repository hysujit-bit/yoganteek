import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Package, Plus, CheckCircle, CreditCard, User } from 'lucide-react';

export const PlansModule = () => {
  const [plans, setPlans] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Plan Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({
    patient_id: '',
    service_name: '1-on-1 Personalized Yoga Care',
    plan_type: 'Individual 12-Session Package',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    sessions_total: 12,
    sessions_completed: 0,
    amount_paid: 15000,
    payment_status: 'paid',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, patientsData] = await Promise.all([
        api.getPatientPlans().catch(() => []),
        api.getPatients().catch(() => []),
      ]);
      setPlans(Array.isArray(plansData) ? plansData : plansData.plans || []);
      setPatients(Array.isArray(patientsData) ? patientsData : patientsData.patients || []);
    } catch (err) {
      console.error('Failed to load plans data', err);
      setPlans([
        { id: 1, patient_name: 'Meera Singh', service_name: 'Postnatal Rehabilitation Care', plan_type: 'Individual 12-Session', sessions_completed: 4, sessions_total: 12, amount_paid: 15000, payment_status: 'paid', start_date: '2026-07-01' },
        { id: 2, patient_name: 'Rajesh Kumar', service_name: 'Hypertension Yoga Therapy', plan_type: 'Individual 8-Session', sessions_completed: 6, sessions_total: 8, amount_paid: 10000, payment_status: 'paid', start_date: '2026-07-10' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      await api.createPatientPlan(planForm);
      setAddModalOpen(false);
      loadData();
    } catch (err) {
      alert(`Error enrolling plan: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--forest-dark)' }}>Patient Service Enrollments</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Track consultation packages, session completion & payments</p>
          </div>
          <button onClick={() => setAddModalOpen(true)} className="btn btn-forest">
            <Plus size={16} /> Enroll Patient in Plan
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Service & Package</th>
              <th>Session Progress</th>
              <th>Payment Info</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading active enrollments...</td>
              </tr>
            ) : plans.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No active service plans enrolled yet.
                </td>
              </tr>
            ) : (
              plans.map((plan) => {
                const percent = Math.round(((plan.sessions_completed || 0) / (plan.sessions_total || 1)) * 100);
                return (
                  <tr key={plan.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--forest-dark)' }}>{plan.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Started: {plan.start_date || 'Recent'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{plan.service_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{plan.plan_type}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '180px' }}>
                        <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--sage-light)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', backgroundColor: 'var(--sage-primary)' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{plan.sessions_completed}/{plan.sessions_total}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>₹{plan.amount_paid?.toLocaleString() || 0}</div>
                    </td>
                    <td>
                      <Badge variant={plan.payment_status === 'paid' ? 'green' : 'amber'}>
                        {plan.payment_status || 'paid'}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Enroll Plan Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Enroll Patient in Service Package">
        <form onSubmit={handleCreatePlan}>
          <div className="form-group">
            <label className="form-label">Select Patient</label>
            <select
              className="form-select"
              value={planForm.patient_id}
              onChange={(e) => setPlanForm({ ...planForm, patient_id: e.target.value })}
              required
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Service Name</label>
            <input
              type="text"
              className="form-input"
              value={planForm.service_name}
              onChange={(e) => setPlanForm({ ...planForm, service_name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Total Sessions</label>
              <input
                type="number"
                className="form-input"
                value={planForm.sessions_total}
                onChange={(e) => setPlanForm({ ...planForm, sessions_total: Number(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Amount Paid (₹)</label>
              <input
                type="number"
                className="form-input"
                value={planForm.amount_paid}
                onChange={(e) => setPlanForm({ ...planForm, amount_paid: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setAddModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Enroll Service Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
