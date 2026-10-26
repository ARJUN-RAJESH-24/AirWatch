import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  height?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading official environmental telemetry...',
  height = '300px',
}) => {
  return (
    <div
      style={{ minHeight: height }}
      className="flex flex-col items-center justify-center p-8 bg-white/60 rounded-xl border border-slate-200"
    >
      <Loader2 className="h-8 w-8 text-sky-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
      <p className="text-xs text-slate-400 mt-1">Retrieving verified observations from backend database</p>
    </div>
  );
};
