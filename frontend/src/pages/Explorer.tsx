import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Observation, Station, TrendPoint } from '../types';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const Explorer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedState, setSelectedState] = useState<string>(searchParams.get('state') || 'Kerala');
  const [selectedCity, setSelectedCity] = useState<string>(searchParams.get('city') || '');
  const [selectedStation, setSelectedStation] = useState<string>(searchParams.get('station') || 'KL008');
  const [selectedPollutant, setSelectedPollutant] = useState<string>(searchParams.get('pollutant') || 'PM2.5');
  const [interval, setInterval] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [startDate, setStartDate] = useState<string>(searchParams.get('start_date') || '2019-01-01');
  const [endDate, setEndDate] = useState<string>(searchParams.get('end_date') || '2020-07-01');

  // Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [totalObsCount, setTotalObsCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  // Load Station Directory
  useEffect(() => {
    api.getStations({ limit: 300 })
      .then(res => setStations(res.stations))
      .catch(err => console.error('Failed to load stations', err));
  }, []);

  // Update URL search params
  useEffect(() => {
    const params: Record<string, string> = {
      pollutant: selectedPollutant,
      station: selectedStation,
    };
    if (selectedState) params.state = selectedState;
    if (selectedCity) params.city = selectedCity;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    setSearchParams(params);
  }, [selectedState, selectedCity, selectedStation, selectedPollutant, startDate, endDate, setSearchParams]);

  // Load Observations & Trends
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendRes, obsRes] = await Promise.all([
        api.getTrends({
          pollutant: selectedPollutant,
          station_code: selectedStation || undefined,
          state: !selectedStation ? selectedState : undefined,
          interval,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
        api.getObservations({
          pollutant: selectedPollutant,
          station_code: selectedStation || undefined,
          state: !selectedStation ? selectedState : undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
      ]);

      setTrends(trendRes.trends);
      setObservations(obsRes.observations);
      setTotalObsCount(obsRes.count);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error retrieving air quality observations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStation, selectedPollutant, selectedState, interval, startDate, endDate, page]);

  // Distinct states and cities
  const availableStates = Array.from(new Set(stations.map(s => s.state))).sort();
  const availableCities = Array.from(
    new Set(stations.filter(s => !selectedState || s.state === selectedState).map(s => s.city))
  ).sort();
  const availableStations = stations.filter(
    s => (!selectedState || s.state === selectedState) && (!selectedCity || s.city === selectedCity)
  );

  // Compute summary stats from trend points
  const totalPoints = trends.reduce((acc, t) => acc + t.count, 0);
  const minVal = trends.length > 0 ? Math.min(...trends.map(t => t.min_value)) : 0;
  const maxVal = trends.length > 0 ? Math.max(...trends.map(t => t.max_value)) : 0;
  const weightedSum = trends.reduce((acc, t) => acc + t.avg_value * t.count, 0);
  const avgVal = totalPoints > 0 ? (weightedSum / totalPoints).toFixed(2) : '0';
  const unit = trends.length > 0 ? trends[0].unit : 'µg/m³';

  const exportUrl = api.getExportUrl({
    station_code: selectedStation || undefined,
    state: !selectedStation ? selectedState : undefined,
    pollutant: selectedPollutant,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                Air Quality Explorer
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Granular Time-Series & Observations</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Investigate Station Observations
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Filter official measurements by state, city, monitoring station, pollutant, and temporal interval.
            </p>
          </div>

          <a
            href={exportUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="h-4 w-4 text-sky-600" />
            <span>Export Filtered CSV</span>
          </a>
        </div>

        {/* Filters Panel */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs">
          {/* State */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">State / UT</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedCity('');
                setSelectedStation('');
              }}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-900 focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All States</option>
              {availableStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">City</label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedStation('');
              }}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-900 focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All Cities</option>
              {availableCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Station */}
          <div className="lg:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Monitoring Station</label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-900 focus:ring-1 focus:ring-sky-500 font-medium"
            >
              <option value="">All Stations in Selection</option>
              {availableStations.map(s => (
                <option key={s.station_code} value={s.station_code}>
                  {s.name} ({s.station_code})
                </option>
              ))}
            </select>
          </div>

          {/* Pollutant */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pollutant</label>
            <select
              value={selectedPollutant}
              onChange={(e) => setSelectedPollutant(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-900 focus:ring-1 focus:ring-sky-500 font-semibold text-sky-700"
            >
              <option value="PM2.5">PM2.5 (Fine Particulates)</option>
              <option value="PM10">PM10 (Respirable)</option>
              <option value="NO2">NO2 (Nitrogen Dioxide)</option>
              <option value="SO2">SO2 (Sulfur Dioxide)</option>
              <option value="CO">CO (Carbon Monoxide)</option>
              <option value="O3">O3 (Ozone)</option>
              <option value="NH3">NH3 (Ammonia)</option>
            </select>
          </div>

          {/* Interval */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Interval</label>
            <div className="flex rounded-lg border border-slate-300 overflow-hidden bg-slate-100 p-0.5">
              {(['daily', 'monthly', 'yearly'] as const).map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInterval(i)}
                  className={`flex-1 py-1 rounded text-center font-medium capitalize transition-colors ${
                    interval === i ? 'bg-white text-sky-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date Window */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-800"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Average Value</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {avgVal} <span className="text-xs font-normal text-slate-500">{unit}</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Minimum Recorded</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {minVal} <span className="text-xs font-normal text-slate-500">{unit}</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Maximum Recorded</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {maxVal} <span className="text-xs font-normal text-slate-500">{unit}</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Valid Observations</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {totalPoints.toLocaleString()} <span className="text-xs font-normal text-slate-500">records</span>
          </div>
        </div>
      </div>

      {/* Time-Series Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {selectedPollutant} Concentration Time-Series ({unit})
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated {interval} observations plotted over the requested date range
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
            <Info className="h-3.5 w-3.5 text-sky-600" />
            <span>Missing observations left unplotted</span>
          </div>
        </div>

        {loading ? (
          <LoadingState height="320px" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : trends.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit={` ${unit}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(val: number) => [`${val} ${unit}`, `${selectedPollutant} Mean`]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="avg_value"
                  name={`${selectedPollutant} Average`}
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={interval !== 'daily'}
                />
                <Line
                  type="monotone"
                  dataKey="max_value"
                  name="Maximum"
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="min_value"
                  name="Minimum"
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Raw Observations Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Official Observation Records</h3>
            <p className="text-xs text-slate-500">Database telemetry records with provenance</p>
          </div>
          <div className="text-xs text-slate-500">
            Page {page} • Showing up to {pageSize} per page
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Station</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Pollutant</th>
                <th className="py-2.5 px-4">Measured Value</th>
                <th className="py-2.5 px-4">Quality Status</th>
                <th className="py-2.5 px-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {observations.map((obs) => (
                <tr key={obs.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-[11px] font-medium text-slate-900">
                    {obs.observation_timestamp.slice(0, 10)}
                  </td>
                  <td className="py-2.5 px-4 font-medium">
                    <div>{obs.station_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{obs.station_code}</div>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {obs.city}, {obs.state}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-sky-800">
                    {obs.pollutant_id}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-bold text-slate-900 text-sm">{obs.value}</span>
                    <span className="text-[11px] text-slate-500 ml-1">{obs.unit}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        obs.data_quality_status === 'VALID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {obs.data_quality_status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                    {obs.source_dataset}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-medium"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-slate-600 font-medium">Page {page} {totalObsCount > 0 ? `(Total: ${totalObsCount.toLocaleString()} observations)` : ''}</span>

          <button
            type="button"
            disabled={observations.length < pageSize}
            onClick={() => setPage(p => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-medium"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
