import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { IngestionRun, DataStatus } from '../types';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import {
  Play,
  CheckCircle2,
  XCircle,
  Lock,
  RefreshCw,
  Key,
} from 'lucide-react';

export const IngestionMonitor: React.FC = () => {
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Trigger modal state
  const [showTriggerModal, setShowTriggerModal] = useState<boolean>(false);
  const [adminKey, setAdminKey] = useState<string>('');
  const [triggerScope, setTriggerScope] = useState<'kerala' | 'all'>('kerala');
  const [triggering, setTriggering] = useState<boolean>(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);
  const [triggerError, setTriggerError] = useState<string | null>(null);

  const loadIngestionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [runsRes, statusRes] = await Promise.all([
        api.getIngestionRuns(),
        api.getDataStatus(),
      ]);
      setRuns(runsRes.ingestion_runs);
      setStatus(statusRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error retrieving ingestion job history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngestionData();
  }, []);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey) {
      setTriggerError('Administrative API key is required.');
      return;
    }
    setTriggering(true);
    setTriggerError(null);
    setTriggerMessage(null);
    try {
      const res = await api.triggerIngestion(adminKey, triggerScope);
      setTriggerMessage(`Ingestion run ${res.run_id} initiated successfully!`);
      setShowTriggerModal(false);
      setAdminKey('');
      loadIngestionData();
    } catch (err: unknown) {
      setTriggerError(err instanceof Error ? err.message : 'Administrative ingestion trigger failed');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                Data Operations
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Pipeline Telemetry & Job Auditing</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Ingestion Job Monitoring
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Audit data ingestion jobs, track throughput metrics (retrieved, inserted, rejected),
              and monitor authoritative source sync health.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadIngestionData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setShowTriggerModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Trigger Sync (Admin)</span>
            </button>
          </div>
        </div>
      </div>

      {triggerMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{triggerMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Ingested Telemetry</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {status?.total_observations.toLocaleString() || '0'}
          </div>
          <span className="text-[11px] text-slate-400">Total stored observations</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Monitoring Stations</span>
          <div className="text-2xl font-bold text-sky-700 mt-1">
            {status?.total_stations || 0}
          </div>
          <span className="text-[11px] text-slate-400">Stations with ingested history</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Data Freshness</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {status?.dataset_end_date ? status.dataset_end_date.slice(0, 10) : 'N/A'}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Authoritative CPCB Archive</span>
        </div>
      </div>

      {/* Ingestion Runs History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Ingestion Executions</h3>
            <p className="text-xs text-slate-500">Historical job audit log with throughput statistics</p>
          </div>
          <span className="text-xs text-slate-500 font-medium">{runs.length} jobs logged</span>
        </div>

        {loading ? (
          <LoadingState height="240px" />
        ) : error ? (
          <ErrorState message={error} onRetry={loadIngestionData} />
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Run Identifier</th>
                  <th className="py-2.5 px-4">Source</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Execution Time</th>
                  <th className="py-2.5 px-4">Retrieved</th>
                  <th className="py-2.5 px-4">Inserted</th>
                  <th className="py-2.5 px-4">Rejected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] font-medium text-slate-900">
                      {run.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {run.source_identifier}
                    </td>
                    <td className="py-3 px-4">
                      {run.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>COMPLETED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-200">
                          <XCircle className="h-3 w-3" />
                          <span>{run.status}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {run.start_time ? run.start_time.replace('T', ' ').slice(0, 19) : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-900 font-medium">
                      {run.records_retrieved.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-bold">
                      {run.records_inserted.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {run.records_rejected}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Trigger Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
                  <Lock className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Protected Ingestion Sync</h3>
              </div>
              <button
                onClick={() => setShowTriggerModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Administrative endpoints are protected. Please supply the configured <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">ADMIN_API_KEY</code> to trigger a data sync.
            </p>

            {triggerError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {triggerError}
              </div>
            )}

            <form onSubmit={handleTrigger} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Administrative Secret Key</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter ADMIN_API_KEY"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-slate-900 focus:ring-1 focus:ring-sky-500"
                    required
                  />
                  <Key className="h-4 w-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Default dev key: airwatch-admin-secret-2026</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ingestion Target Scope</label>
                <select
                  value={triggerScope}
                  onChange={(e) => setTriggerScope(e.target.value as 'kerala' | 'all')}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-900"
                >
                  <option value="kerala">Kerala Prioritized + Representative Metros (Recommended)</option>
                  <option value="all">Full Nationwide Continuous CAAQMS Dataset</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={triggering}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {triggering ? 'Initiating...' : 'Authenticate & Run Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
