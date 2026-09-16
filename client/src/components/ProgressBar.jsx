import React from 'react';

export const ProgressBar = ({
  percentage = 0,
  showLabel = true,
  height = 'h-3',
  color = 'indigo',
  subtitle,
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)));

  let barColor = 'from-brand-500 to-indigo-600';
  if (clamped === 100) {
    barColor = 'from-emerald-500 to-teal-600';
  } else if (clamped < 30 && clamped > 0) {
    barColor = 'from-amber-400 to-amber-500';
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold text-slate-700">
          <span>{subtitle || 'Progress'}</span>
          <span className="font-mono text-slate-900">{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 ${height}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
