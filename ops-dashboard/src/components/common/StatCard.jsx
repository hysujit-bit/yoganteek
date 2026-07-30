import React from 'react';

export const StatCard = ({ icon: Icon, number, label, subtext, color = '#3D4F35' }) => {
  return (
    <div className="stat-card">
      {Icon && (
        <div className="stat-icon-box" style={{ color: color }}>
          <Icon size={24} />
        </div>
      )}
      <div>
        <div className="stat-number">{number ?? 0}</div>
        <div className="stat-label">{label}</div>
        {subtext && <div style={{ fontSize: '0.75rem', color: '#949E8E', marginTop: '2px' }}>{subtext}</div>}
      </div>
    </div>
  );
};
