import React from 'react';
import { CircleAlert } from 'lucide-react';

export function Loader({ label = 'Loading your account…' }) {
  return (
    <div className="center-state">
      <span className="spinner" />
      <p style={{ marginTop: 14, fontWeight: 600 }}>{label}</p>
    </div>
  );
}

export function ErrorState({ message, retry }) {
  return (
    <div className="notice error">
      <CircleAlert size={19} />
      <span>{message}</span>
      {retry && (
        <button className="text-button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Status({ paid }) {
  return (
    <span className={'status ' + (paid ? 'paid' : 'unpaid')}>
      <span className="status-dot" />
      {paid ? 'Paid' : 'Unpaid'}
    </span>
  );
}

export function IconTile({ children, type = 'blue' }) {
  return <span className={'icon-tile ' + type}>{children}</span>;
}

export function SummaryCard({ label, value, description, icon: Icon, variant = 'default' }) {
  return (
    <div className={'summary-card ' + variant}>
      <div className="summary-top">
        <span>{label}</span>
        <IconTile type={variant === 'due' ? 'orange' : variant === 'paid' ? 'green' : 'blue'}>
          <Icon size={20} />
        </IconTile>
      </div>
      <strong>{value}</strong>
      <small>{description}</small>
    </div>
  );
}

