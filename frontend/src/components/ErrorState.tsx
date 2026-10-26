import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Service Unavailable',
  message,
  onRetry,
}) => {
  return (
    <div className="p-6 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 my-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs text-rose-700 mt-1">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-rose-300 text-rose-800 text-xs font-semibold hover:bg-rose-100 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Retry Request</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
