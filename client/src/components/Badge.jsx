import React from 'react';
import { Star, Trophy, Gem, Award, Zap, Target } from 'lucide-react';

const variantMap = {
  default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  success: 'bg-success-50 text-success-600 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20',
  warning: 'bg-warning-50 text-warning-600 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20',
  danger: 'bg-danger-50 text-danger-600 border-danger-200 dark:bg-danger-500/10 dark:text-danger-400 dark:border-danger-500/20',
  brand: 'bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20',
  global: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
};

export const Badge = ({ children, variant = 'default', className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${variantMap[variant] || variantMap.default} ${className}`}
    >
      {children}
    </span>
  );
};

// Milestone badges with icons and scale-in animation
const milestoneConfig = {
  first: {
    icon: Star,
    label: 'First Submission',
    emoji: '⭐',
    color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    description: 'Completed your first assignment submission!',
  },
  halfway: {
    icon: Trophy,
    label: 'Halfway',
    emoji: '🏆',
    color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    description: 'Completed 50% of all assignments!',
  },
  perfect: {
    icon: Gem,
    label: 'Perfect Score',
    emoji: '💎',
    color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
    description: '100% completion rate — flawless!',
  },
  streak: {
    icon: Zap,
    label: 'On Fire',
    emoji: '🔥',
    color: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    description: '3+ assignments submitted in a row!',
  },
  early: {
    icon: Target,
    label: 'Early Bird',
    emoji: '🎯',
    color: 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
    description: 'Submitted before the deadline!',
  },
};

export const MilestoneBadge = ({ type, size = 'sm', showLabel = true, className = '' }) => {
  const config = milestoneConfig[type];
  if (!config) return null;

  const Icon = config.icon;
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-lg border animate-scale-in ${config.color} ${sizeClasses[size]} ${className}`}
      title={config.description}
    >
      <span>{config.emoji}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

export const getMilestones = (completed, total) => {
  const milestones = [];
  if (completed >= 1) milestones.push('first');
  if (total > 0 && completed >= Math.ceil(total / 2)) milestones.push('halfway');
  if (total > 0 && completed >= total) milestones.push('perfect');
  if (completed >= 3) milestones.push('streak');
  return milestones;
};

export default Badge;
