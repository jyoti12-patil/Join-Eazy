import React from 'react';

export const Badge = ({ status, text, size = 'sm' }) => {
  const normalized = (status || text || '').toUpperCase();

  let styles = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (['CONFIRMED', 'SUBMITTED', 'COMPLETED', 'ACTIVE'].includes(normalized)) {
    styles = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
  } else if (['PENDING', 'PENDING_CONFIRMATION', 'IN_PROGRESS'].includes(normalized)) {
    styles = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
  } else if (['OVERDUE', 'FAILED', 'MISSED', 'EXPIRED'].includes(normalized)) {
    styles = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
  } else if (['LEADER', 'ADMIN', 'PROFESSOR'].includes(normalized)) {
    styles = 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
  } else if (['GLOBAL', 'ALL GROUPS'].includes(normalized)) {
    styles = 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
  } else if (['TARGETED', 'SPECIFIC GROUPS'].includes(normalized)) {
    styles = 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
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
