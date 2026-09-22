import React from 'react';

const SkeletonLine = ({ className = '' }) => (
  <div className={`skeleton h-4 ${className}`} />
);

const SkeletonCircle = ({ className = '' }) => (
  <div className={`skeleton rounded-full ${className}`} />
);

export const SkeletonCard = ({ lines = 3 }) => (
  <div className="glass-card p-6 space-y-4 animate-fade-in">
    <div className="flex items-center gap-3">
      <SkeletonCircle className="w-10 h-10" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="w-3/4" />
        <SkeletonLine className="w-1/2 h-3" />
      </div>
    </div>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine key={i} className={i === lines - 1 ? 'w-2/3' : 'w-full'} />
    ))}
  </div>
);

export const SkeletonDashboard = () => (
  <div className="w-full px-4 sm:px-6 py-8 space-y-8">
    {/* Stats Row */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <SkeletonLine className="w-1/3 h-3" />
          <SkeletonLine className="w-1/2 h-8" />
        </div>
      ))}
    </div>
    {/* Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="glass-card overflow-hidden">
    <div className="p-4 space-y-3">
      <SkeletonLine className="w-1/4 h-5" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonLine key={c} className="flex-1 h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} lines={2} />
    ))}
  </div>
);

export const SkeletonLoader = SkeletonCard;
export default SkeletonLoader;
