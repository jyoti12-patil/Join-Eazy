import React from 'react';

export const Badge = ({ status, text, size = 'sm' }) => {
  const normalized = (status || text || '').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['CONFIRMED', 'SUBMITTED', 'COMPLETED', 'ACTIVE'].includes(normalized)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['PENDING', 'PENDING_CONFIRMATION', 'IN_PROGRESS'].includes(normalized)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['OVERDUE', 'FAILED', 'MISSED', 'EXPIRED'].includes(normalized)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['LEADER', 'ADMIN', 'PROFESSOR'].includes(normalized)) {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (['GLOBAL', 'ALL GROUPS'].includes(normalized)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (['TARGETED', 'SPECIFIC GROUPS'].includes(normalized)) {
    styles = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  const sizeStyles =
    size === 'xs'
      ? 'text-[11px] px-2 py-0.5'
      : size === 'md'
      ? 'text-xs px-3 py-1 font-semibold'
      : 'text-xs px-2.5 py-0.5 font-medium';

  const label =
    text ||
    (normalized === 'CONFIRMED'
      ? 'Submitted & Confirmed'
      : normalized === 'PENDING_CONFIRMATION'
      ? 'Pending Confirmation'
      : normalized === 'NOT_SUBMITTED'
      ? 'Not Submitted'
      : normalized.replace(/_/g, ' '));

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeStyles} ${styles}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
      {label}
    </span>
  );
};
