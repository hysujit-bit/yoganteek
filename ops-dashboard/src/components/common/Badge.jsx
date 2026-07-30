import React from 'react';

export const Badge = ({ children, variant = 'green', style = {} }) => {
  const variantMap = {
    green: 'badge-green',
    amber: 'badge-amber',
    red: 'badge-red',
    blue: 'badge-blue',
  };

  const className = `badge ${variantMap[variant] || 'badge-green'}`;

  return (
    <span className={className} style={style}>
      {children}
    </span>
  );
};
