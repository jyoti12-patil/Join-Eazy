import React, { useState, useEffect } from 'react';

export const ProgressBar = ({ value, max = 100, percentage: propPercentage, label, showPercentage = true, size = 'md', className = '' }) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = propPercentage !== undefined
    ? Math.min(100, Math.max(0, Math.round(propPercentage)))
    : (max > 0 ? Math.min(100, Math.max(0, Math.round(((value || 0) / max) * 100))) : 0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  // Color transitions based on percentage
  const getBarColor = () => {
    if (percentage >= 100) return 'bg-gradient-to-r from-success-400 to-success-500';
    if (percentage >= 67) return 'bg-gradient-to-r from-success-400 to-success-500';
    if (percentage >= 34) return 'bg-gradient-to-r from-warning-400 to-warning-500';
    return 'bg-gradient-to-r from-danger-400 to-danger-500';
  };

  const getGlowClass = () => {
    if (percentage >= 100) return 'shadow-glow-success animate-pulse-glow';
    return '';
  };

  const heights = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className={`text-xs font-bold ${
              percentage >= 100 ? 'text-success-500' : percentage >= 67 ? 'text-success-500' : percentage >= 34 ? 'text-warning-500' : 'text-danger-500'
            }`}>
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden ${heights[size]} ${getGlowClass()}`}>
        <div
          className={`${heights[size]} rounded-full progress-bar-fill ${getBarColor()} relative`}
          style={{ width: `${animatedWidth}%` }}
        >
          {/* Inner shine effect */}
          {animatedWidth > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
