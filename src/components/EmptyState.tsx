'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ 
  icon = <Calendar size={48} />, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="empty-state" style={{ padding: '60px 24px', borderStyle: 'dashed', borderWidth: 2 }}>
      <div style={{ 
        width: 80, 
        height: 80, 
        background: 'var(--accent-blue-light)', 
        color: 'var(--accent-blue)', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: 24,
        opacity: 0.8
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 300, marginInline: 'auto' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
