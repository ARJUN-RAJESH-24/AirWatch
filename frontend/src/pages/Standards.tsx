import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ExceedanceReport, Station } from '../types';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const Standards: React.FC = () => {
  const [reports, setReports] = useState<ExceedanceReport[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedState, setSelectedState] = useState<string>('Kerala');
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getStations({ limit: 300 })
      .then(res => setStations(res.stations))
      .catch(err => console.error(err));
  }, []);

  const loadExceedances = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getExceedances({
        state: !selectedStation ? selectedState : undefined,
        station_code: selectedStation || undefined,
      });
      setReports(res.exceedance_analysis);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error retrieving exceedance analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExceedances();
  }, [selectedState, selectedStation]);

  const availableStates = Array.from(new Set(stations.map(s => s.state))).sort();
  const availableStations = stations.filter(s => !selectedState || s.state === selectedState);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            Regulatory & Scientific Standards
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-medium">CPCB NAAQS 2009 Standards</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Pollution Standards & Exceedance Analysis
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Evaluate genuine environmental observations against official National Ambient Air Quality Standards (NAAQS)
          published by the Central Pollution Control Board (CPCB) under the Environment (Protection) Act, 1986.
        </p>

        {/* Filters */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">State / Region</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedStation('');
              }}
              className="rounded-lg border border-slate-300 py-1.5 px-3 bg-white text-slate-900"
            >
              <option value="">All States</option>
              {availableStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Station Filter (Optional)</label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="rounded-lg border border-slate-300 py-1.5 px-3 bg-white text-slate-900"
            >
              <option value="">All Stations in {selectedState || 'All States'}</option>
              {availableStations.map(s => (
                <option key={s.station_code} value={s.station_code}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Official CPCB Reference Citation Box */}
      <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-950 flex items-start gap-3">
        <FileText className="h-5 w-5 text-sky-700 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm">Central Pollution Control Board Official Standard Citation</h4>
          <p className="mt-1 text-sky-900 leading-relaxed">
            <strong>Notification:</strong> National Ambient Air Quality Standards (NAAQS), Gazette of India, Extraordinary, Part III-Section 4, No. B-29016/20/90/PCI-L, New Delhi, 18th November 2009.
            Applies to Industrial, Residential, Rural, and other areas.
          </p>
        </div>
      </div>

      {/* Exceedance Cards Grid */}
      {loading ? (
        <LoadingState height="280px" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadExceedances} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => {
            const hasExceedance = report.exceedance_percentage > 0;
            return (
              <div
                key={report.standard_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Criteria Pollutant</span>
                    <h3 className="text-xl font-bold text-slate-900">{report.pollutant_id}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">CPCB Threshold</span>
                    <span className="text-base font-bold text-sky-700 font-mono">
                      {report.threshold_value} {report.unit}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Averaging Period:</span>
                    <span className="font-semibold text-slate-800">{report.averaging_period}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Applicable Standard:</span>
                    <span className="font-semibold text-slate-800">{report.standard_name}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Valid Observations:</span>
                    <span className="font-mono font-medium text-slate-900">{report.total_observations.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Highest Recorded Value:</span>
                    <span className="font-mono font-bold text-rose-600">{report.highest_recorded_value} {report.unit}</span>
                  </div>
                </div>

                {/* Exceedance Bar & Metrics */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-700">Threshold Exceedance Rate</span>
                    <span className={`font-bold ${hasExceedance ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {report.exceedance_percentage}% ({report.exceedance_count.toLocaleString()} days)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        report.exceedance_percentage > 30 ? 'bg-rose-500' : report.exceedance_percentage > 10 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, report.exceedance_percentage))}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Effective: 18 Nov 2009</span>
                  {report.exceedance_percentage === 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Within Standard</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Exceedance Observed</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compliance & Methodology Caveat */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 text-xs text-amber-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          <span>Scientific Disclaimer on Regulatory Compliance</span>
        </div>
        <p className="leading-relaxed">
          The exceedance calculations shown above are descriptive analytics comparing 24-hour daily averages against
          the numerical thresholds established in CPCB NAAQS 2009. Under official regulatory guidelines, formal non-attainment
          determinations require comprehensive continuous sampling schedules (e.g. 104 measurements per year at twice a week frequency)
          and specific statistical percentiles. Exceedance of a daily threshold must not be conflated with a legal violation
          of an annual standard.
        </p>
      </div>
    </div>
  );
};
