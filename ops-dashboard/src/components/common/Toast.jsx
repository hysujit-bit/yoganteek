import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'var(--status-green)' : '#e74c3c';
  const Icon = type === 'success' ? CheckCircle2 : XCircle;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1.25rem',
        background: '#fff',
        borderLeft: `4px solid ${bgColor}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        minWidth: '300px',
        maxWidth: '440px',
        animation: 'toastSlideIn 0.3s ease-out',
      }}
    >
      <Icon size={20} color={bgColor} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-main)' }}>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '2px',
          flexShrink: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
