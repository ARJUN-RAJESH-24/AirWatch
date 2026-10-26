import React from 'react';

interface AqiBadgeProps {
  value: number | null | undefined;
  category?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const AqiBadge: React.FC<AqiBadgeProps> = ({ value, category, size = 'md' }) => {
  if (value === null || value === undefined) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
        N/A
      </span>
    );
  }

  // CPCB Official AQI Breakpoints:
  // 0-50 Good, 51-100 Satisfactory, 101-200 Moderate, 201-300 Poor, 301-400 Very Poor, 401-500 Severe
  let cat = category;
  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';

  if (!cat) {
    if (value <= 50) cat = 'Good';
    else if (value <= 100) cat = 'Satisfactory';
    else if (value <= 200) cat = 'Moderate';
    else if (value <= 300) cat = 'Poor';
    else if (value <= 400) cat = 'Very Poor';
    else cat = 'Severe';
  }

  switch (cat.toLowerCase()) {
    case 'good':
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'satisfactory':
      bgClass = 'bg-lime-50 text-lime-800 border-lime-200';
      break;
    case 'moderate':
      bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
      break;
    case 'poor':
      bgClass = 'bg-orange-50 text-orange-800 border-orange-200';
      break;
    case 'very poor':
      bgClass = 'bg-red-50 text-red-700 border-red-200';
      break;
    case 'severe':
      bgClass = 'bg-rose-900 text-rose-50 border-rose-950';
      break;
    default:
      bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${bgClass} ${sizeClasses[size]}`}>
      <span className="font-bold">{value}</span>
      <span className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">({cat})</span>
    </span>
  );
};
