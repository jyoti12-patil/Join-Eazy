import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');

export const CountdownTimer = ({ targetDate, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calcTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
      };
    };

    setTimeLeft(calcTimeLeft());
    const interval = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  const { days, hours, minutes, seconds, expired } = timeLeft;

  // Urgency color
  const totalHours = days * 24 + hours;
  let urgencyClass = 'text-slate-500 dark:text-slate-400';
  let bgClass = 'bg-slate-100 dark:bg-slate-800';
  let Icon = Clock;

  if (expired) {
    urgencyClass = 'text-danger-500';
    bgClass = 'bg-danger-50 dark:bg-danger-500/10';
    Icon = AlertTriangle;
  } else if (totalHours < 24) {
    urgencyClass = 'text-danger-500';
    bgClass = 'bg-danger-50 dark:bg-danger-500/10';
    Icon = AlertTriangle;
  } else if (totalHours < 72) {
    urgencyClass = 'text-warning-500';
    bgClass = 'bg-warning-50 dark:bg-warning-500/10';
  }

  if (expired) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${bgClass} ${urgencyClass} ${className}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>Overdue</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${bgClass} ${urgencyClass} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>
        {days > 0 && `${days}d `}
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
};

export default CountdownTimer;
