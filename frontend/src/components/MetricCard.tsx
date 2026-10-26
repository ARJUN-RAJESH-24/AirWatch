import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  badge,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-white border-slate-200 text-slate-900',
    primary: 'bg-sky-50/50 border-sky-200 text-sky-950',
    warning: 'bg-amber-50/50 border-amber-200 text-amber-950',
    danger: 'bg-rose-50/50 border-rose-200 text-rose-950',
    success: 'bg-emerald-50/50 border-emerald-200 text-emerald-950',
  };

  const iconStyles = {
    default: 'bg-slate-100 text-slate-600',
    primary: 'bg-sky-100 text-sky-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    success: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconStyles[variant]}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
      </div>

      {(subtitle || badge) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {badge && <div>{badge}</div>}
        </div>
      )}
    </div>
  );
};
