import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Shield, User } from 'lucide-react';

const statusConfig = {
  CONFIRMED: {
    label: 'Submitted',
    icon: CheckCircle2,
    classes: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400 border-success-200 dark:border-success-500/20',
    pulse: false,
  },
  PENDING_CONFIRMATION: {
    label: 'Pending',
    icon: Clock,
    classes: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400 border-warning-200 dark:border-warning-500/20',
    pulse: true,
  },
  OVERDUE: {
    label: 'Overdue',
    icon: AlertTriangle,
    classes: 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400 border-danger-200 dark:border-danger-500/20',
    pulse: false,
  },
  NOT_SUBMITTED: {
    label: 'Not Submitted',
    icon: XCircle,
    classes: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    pulse: false,
  },
  PENDING: {
    label: 'Pending',
    icon: Clock,
    classes: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400 border-warning-200 dark:border-warning-500/20',
    pulse: true,
  },
  INDIVIDUAL: {
    label: 'Individual',
    icon: User,
    classes: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 border-brand-200 dark:border-brand-500/20',
    pulse: false,
  },
  GROUP: {
    label: 'Group',
    icon: Shield,
    classes: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
    pulse: false,
  },
};

export const StatusBadge = ({ status, size = 'sm', className = '' }) => {
  const config = statusConfig[status] || statusConfig.NOT_SUBMITTED;
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-lg border ${config.classes} ${sizeClasses[size]} ${
        config.pulse ? 'animate-pulse' : ''
      } ${className}`}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
