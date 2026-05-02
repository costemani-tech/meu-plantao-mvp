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
    <div className="empty-state" style={{ padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ 
        width: 64, 
        height: 64, 
        background: 'rgba(255, 255, 255, 0.03)', 
        color: '#94A3B8', 
        borderRadius: '1.5rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: 20,
        marginInline: 'auto'
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 24, maxWidth: 320, marginInline: 'auto', lineHeight: 1.5 }}>
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
