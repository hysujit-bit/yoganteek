import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Modal } from '../common/Modal';
import { Pill, Plus, Trash2, Send, Eye, Check, Sparkles, Heart } from 'lucide-react';

export const PrescriptionBuilder = () => {
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBuilderTab, setActiveBuilderTab] = useState('yoga');
  
  // Builder State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [title, setTitle] = useState('Personalized Holistic Yoga Care Plan');
  const [yogaRoutine, setYogaRoutine] = useState([
    { pose: 'Tadasana (Mountain Pose)', duration: '5 mins', notes: 'Gently align spine and breathe deeply.' },
    { pose: 'Marjaryasana (Cat-Cow)', duration: '10 reps', notes: 'Warm up lower lumbar region.' },
  ]);
  const [breathingExercises, setBreathingExercises] = useState([
    { name: 'Anulom Vilom (Alternate Nostril)', reps: '15 rounds', notes: 'Practice in the morning before breakfast.' },
  ]);
  const [nutritionPlan, setNutritionPlan] = useState([
    { meal: 'Morning (Empty Stomach)', items: ['Warm water with lemon & haldi'], notes: 'Soothes digestion' },
  ]);
  const [lifestyleTips, setLifestyleTips] = useState('Maintain consistent sleep hours (before 10:30 PM). Stay hydrated with 2.5L water daily.');

  // Preview & Send Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [patientsData, rxData] = await Promise.all([
        api.getPatients().catch(() => []),
        api.getPrescriptions().catch(() => []),
      ]);
      setPatients(Array.isArray(patientsData) ? patientsData : patientsData.patients || []);
      setPrescriptions(Array.isArray(rxData) ? rxData : rxData.prescriptions || []);
    } catch (err) {
      console.error('Failed to load prescription data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addYogaPose = () => {
    setYogaRoutine([...yogaRoutine, { pose: '', duration: '', notes: '' }]);
  };

  const removeYogaPose = (index) => {
    setYogaRoutine(yogaRoutine.filter((_, i) => i !== index));
  };

  const addBreathingExercise = () => {
    setBreathingExercises([...breathingExercises, { name: '', reps: '', notes: '' }]);
  };

  const removeBreathingExercise = (index) => {
    setBreathingExercises(breathingExercises.filter((_, i) => i !== index));
  };

  const addNutritionMeal = () => {
    setNutritionPlan([...nutritionPlan, { meal: '', items: [''], notes: '' }]);
  };

  const removeNutritionMeal = (index) => {
    setNutritionPlan(nutritionPlan.filter((_, i) => i !== index));
  };

  const addNutritionItem = (mealIndex) => {
    const copy = [...nutritionPlan];
    copy[mealIndex].items = [...copy[mealIndex].items, ''];
    setNutritionPlan(copy);
  };

  const removeNutritionItem = (mealIndex, itemIndex) => {
    const copy = [...nutritionPlan];
    copy[mealIndex].items = copy[mealIndex].items.filter((_, i) => i !== itemIndex);
    setNutritionPlan(copy);
  };

  const handleSaveAndSend = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient before sending.');
      return;
    }
    const patient = patients.find((p) => String(p.id) === String(selectedPatientId));
    
    try {
      setSending(true);
      const newRx = await api.createPrescription({
        patient_id: selectedPatientId,
        patient_name: patient?.name,
        patient_email: patient?.email,
        title,
        yoga_routine: yogaRoutine,
        breathing_exercises: breathingExercises,
        nutrition_plan: nutritionPlan,
        lifestyle_tips: lifestyleTips,
      });

      const rxId = newRx.id || newRx.prescription?.id;
      if (rxId) {
        await api.sendPrescription(rxId);
      }
      setPreviewModalOpen(false);
      alert(`Care plan successfully emailed to ${patient?.name}!`);
      loadData();
    } catch (err) {
      alert(`Error sending care plan: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Builder Controls */}
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--forest-dark)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Pill color="var(--sage-primary)" /> Build Care Plan & Prescription
          </h3>

          {/* Patient Selector */}
          <div className="form-group">
            <label className="form-label">Select Patient</label>
            <select
              className="form-select"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email || p.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Care Plan Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 4 Builder Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-light)', marginBottom: '1rem', overflowX: 'auto' }}>
            {[
              { id: 'yoga', label: 'Yoga Routine' },
              { id: 'breathing', label: 'Breathing / Pranayama' },
              { id: 'nutrition', label: 'Nutrition Plan' },
              { id: 'lifestyle', label: 'Lifestyle Tips' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveBuilderTab(tab.id)}
                style={{
                  padding: '0.5rem 0.85rem',
                  border: 'none',
                  borderBottom: activeBuilderTab === tab.id ? '2px solid var(--sage-primary)' : '2px solid transparent',
                  background: 'none',
                  color: activeBuilderTab === tab.id ? 'var(--forest-dark)' : 'var(--text-muted)',
                  fontWeight: activeBuilderTab === tab.id ? 600 : 400,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Yoga Routine */}
          {activeBuilderTab === 'yoga' && (
            <div>
              {yogaRoutine.map((item, index) => (
                <div key={index} style={{ padding: '0.75rem', background: 'var(--cream-bg)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', position: 'relative' }}>
                  <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Pose Name (e.g. Tadasana)"
                      value={item.pose}
                      onChange={(e) => {
                        const copy = [...yogaRoutine];
                        copy[index].pose = e.target.value;
                        setYogaRoutine(copy);
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Duration / Reps (e.g. 5 mins)"
                      value={item.duration}
                      onChange={(e) => {
                        const copy = [...yogaRoutine];
                        copy[index].duration = e.target.value;
                        setYogaRoutine(copy);
                      }}
                      style={{ width: '40%' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Practice Notes"
                      value={item.notes}
                      onChange={(e) => {
                        const copy = [...yogaRoutine];
                        copy[index].notes = e.target.value;
                        setYogaRoutine(copy);
                      }}
                      style={{ flex: 1 }}
                    />
                    <button onClick={() => removeYogaPose(index)} style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addYogaPose} className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                <Plus size={14} /> Add Yoga Pose
              </button>
            </div>
          )}

          {/* Tab 2: Breathing Exercises */}
          {activeBuilderTab === 'breathing' && (
            <div>
              {breathingExercises.map((item, index) => (
                <div key={index} style={{ padding: '0.75rem', background: 'var(--cream-bg)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Pranayama Name (e.g. Anulom Vilom)"
                      value={item.name}
                      onChange={(e) => {
                        const copy = [...breathingExercises];
                        copy[index].name = e.target.value;
                        setBreathingExercises(copy);
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Rounds (e.g. 15 rounds)"
                      value={item.reps}
                      onChange={(e) => {
                        const copy = [...breathingExercises];
                        copy[index].reps = e.target.value;
                        setBreathingExercises(copy);
                      }}
                      style={{ width: '40%' }}
                    />
                    <button onClick={() => removeBreathingExercise(index)} style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addBreathingExercise} className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                <Plus size={14} /> Add Pranayama Exercise
              </button>
            </div>
          )}

          {/* Tab 3: Nutrition Plan */}
          {activeBuilderTab === 'nutrition' && (
            <div>
              {nutritionPlan.map((meal, mealIndex) => (
                <div key={mealIndex} style={{ padding: '0.75rem', background: 'var(--cream-bg)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Meal Name (e.g. Morning, Lunch, Dinner)"
                      value={meal.meal}
                      onChange={(e) => {
                        const copy = [...nutritionPlan];
                        copy[mealIndex].meal = e.target.value;
                        setNutritionPlan(copy);
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Food Items</label>
                    {meal.items.map((item, itemIndex) => (
                      <div key={itemIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Food item (e.g. Warm water with lemon)"
                          value={item}
                          onChange={(e) => {
                            const copy = [...nutritionPlan];
                            copy[mealIndex].items[itemIndex] = e.target.value;
                            setNutritionPlan(copy);
                          }}
                          style={{ flex: 1 }}
                        />
                        <button onClick={() => removeNutritionItem(mealIndex, itemIndex)} style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addNutritionItem(mealIndex)} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      <Plus size={12} /> Add Item
                    </button>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Notes (optional)"
                      value={meal.notes}
                      onChange={(e) => {
                        const copy = [...nutritionPlan];
                        copy[mealIndex].notes = e.target.value;
                        setNutritionPlan(copy);
                      }}
                    />
                  </div>
                  <button onClick={() => removeNutritionMeal(mealIndex)} style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                    Remove Meal
                  </button>
                </div>
              ))}
              <button onClick={addNutritionMeal} className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                <Plus size={14} /> Add Meal
              </button>
            </div>
          )}

          {/* Tab 4: Lifestyle */}
          {activeBuilderTab === 'lifestyle' && (
            <div className="form-group">
              <label className="form-label">Lifestyle & Wellness Advice</label>
              <textarea
                className="form-textarea"
                rows="5"
                value={lifestyleTips}
                onChange={(e) => setLifestyleTips(e.target.value)}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={() => setPreviewModalOpen(true)} className="btn btn-primary" style={{ flex: 1 }}>
              <Eye size={16} /> Preview & Email Patient
            </button>
          </div>
        </div>

        {/* Right Column: Prescription History */}
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--forest-dark)', marginBottom: '1.25rem' }}>
            Sent Care Plans & History
          </h3>
          {prescriptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              No care plans dispatched yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {prescriptions.map((rx) => (
                <div key={rx.id} style={{ padding: '0.85rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--forest-dark)' }}>{rx.patient_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rx.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sage-primary)', marginTop: '4px' }}>
                    Sent on: {rx.sent_at ? new Date(rx.sent_at).toLocaleDateString() : 'Draft'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview & Email Modal */}
      <Modal isOpen={previewModalOpen} onClose={() => setPreviewModalOpen(false)} title="Care Plan Preview" maxWidth="650px">
        <div>
          <div style={{ border: '2px solid var(--sage-primary)', borderRadius: 'var(--radius-md)', padding: '1.5rem', background: '#FFF' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: 'var(--forest-dark)' }}>Yoganteek Care Prescription</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dr. Jayashree Pattanaik • Holistic Health</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '0.5rem' }}>🧘‍♀️ Yoga Routine:</div>
              {yogaRoutine.map((y, i) => (
                <div key={i} style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                  • <strong>{y.pose}</strong> ({y.duration}) — <em>{y.notes}</em>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '0.5rem' }}>🫁 Pranayama:</div>
              {breathingExercises.map((b, i) => (
                <div key={i} style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                  • <strong>{b.name}</strong> ({b.reps})
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '0.5rem' }}>🥗 Nutrition Plan:</div>
              {nutritionPlan.map((meal, i) => (
                <div key={i} style={{ fontSize: '0.85rem', marginBottom: '8px', paddingLeft: '0.5rem', borderLeft: '2px solid var(--sage-primary)' }}>
                  <div style={{ fontWeight: 600 }}>{meal.meal || 'Meal'}:</div>
                  {meal.items.map((item, j) => (
                    <div key={j} style={{ marginLeft: '1rem' }}>• {item}</div>
                  ))}
                  {meal.notes && <div style={{ marginLeft: '1rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Note: {meal.notes}</div>}
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '0.5rem' }}>🌿 Lifestyle Advice:</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{lifestyleTips}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={() => setPreviewModalOpen(false)} className="btn btn-outline">
              Edit
            </button>
            <button onClick={handleSaveAndSend} className="btn btn-forest" disabled={sending}>
              <Send size={16} /> {sending ? 'Dispatching Email...' : 'Send Branded Email to Patient'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
