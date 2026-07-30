import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';

export const PasscodeGuard = ({ children }) => {
  const { isAuthenticated, loading, login } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF8F5' }}>
        <div style={{ color: '#3D4F35', fontWeight: 600 }}>Loading Yoganteek Ops...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const res = login(passcode);
    if (!res.success) {
      setError(res.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#3D4F35',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundImage: 'radial-gradient(circle at 50% 30%, #4A5D41 0%, #2A3824 100%)',
    }}>
      <div style={{
        backgroundColor: '#FAF8F5',
        borderRadius: '16px',
        maxWidth: '420px',
        width: '100%',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#EBF0E8',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          color: '#3D4F35',
        }}>
          <Lock size={30} />
        </div>

        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.85rem', color: '#3D4F35', marginBottom: '0.25rem', fontWeight: 700 }}>
          Yoganteek Ops
        </h1>
        <p style={{ color: '#667060', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
          Internal Operations & Patient Care Management
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Team Passcode</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoFocus
              required
              style={{ fontSize: '1rem', padding: '0.75rem' }}
            />
          </div>

          {error && (
            <div style={{ color: '#D32F2F', fontSize: '0.82rem', marginBottom: '1rem', backgroundColor: '#FFEBEE', padding: '0.5rem', borderRadius: '6px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-forest"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', gap: '0.5rem' }}
          >
            {isSubmitting ? 'Verifying...' : 'Access Dashboard'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#949E8E', fontSize: '0.78rem' }}>
          <ShieldCheck size={14} /> Encrypted Session Access
        </div>
      </div>
    </div>
  );
};
