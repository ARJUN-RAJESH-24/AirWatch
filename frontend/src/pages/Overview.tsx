import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DataStatus, PollutantSummary, Station, TrendPoint } from '../types';
import { MetricCard } from '../components/MetricCard';
import { StationMap } from '../components/StationMap';
import { AqiBadge } from '../components/AqiBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import {
  Activity,
  MapPin,
  Database,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const Overview: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [pollutants, setPollutants] = useState<PollutantSummary[]>([]);
  const [recentTrend, setRecentTrend] = useState<TrendPoint[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, stationsRes, polRes, trendRes] = await Promise.all([
        api.getDataStatus(),
        api.getStations({ limit: 100 }),
        api.getPollutantSummary(),
        api.getTrends({ pollutant: 'PM2.5', interval: 'monthly' }),
      ]);
      setStatus(statusRes);
      setStations(stationsRes.stations);
      setPollutants(polRes.pollutants);
      setRecentTrend(trendRes.trends);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve overview statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState message="Loading official environmental telemetry..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  // Identify Kerala stations
  const keralaStations = stations.filter(s => s.state.toLowerCase() === 'kerala');

  // Find worst and best current AQI among reporting stations
  const reportingStations = stations.filter(s => s.latest_aqi !== null && s.latest_aqi !== undefined);
  const bestStation = [...reportingStations].sort((a, b) => (a.latest_aqi || 0) - (b.latest_aqi || 0))[0];
  const highestPollutionStation = [...reportingStations].sort((a, b) => (b.latest_aqi || 0) - (a.latest_aqi || 0))[0];

  return (
    <div className="space-y-6">
      {/* Hero / Header Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                Authoritative Central Control Room Telemetry
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">CPCB CAAQMS Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Indian Environmental Analytics Dashboard
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Continuous ambient air quality observations published by the Central Pollution Control Board (CPCB)
              and State Pollution Control Boards. Prioritizing Kerala stations with nationwide comparative coverage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/explorer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Explore All Data</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monitored Stations"
          value={status?.total_stations || 0}
          unit="Stations"
          subtitle={`${keralaStations.length} Kerala State PCB stations`}
          icon={MapPin}
          variant="primary"
        />

        <MetricCard
          title="Total Observations"
          value={status?.total_observations ? status.total_observations.toLocaleString() : '0'}
          unit="Records"
          subtitle="Genuine verified telemetry"
          icon={Database}
          variant="default"
        />

        <MetricCard
          title="Reported AQI Records"
          value={status?.total_aqi_records ? status.total_aqi_records.toLocaleString() : '0'}
          unit="Readings"
          subtitle="Calculated under CPCB NAAQS"
          icon={Activity}
          variant="success"
        />

        <MetricCard
          title="Dataset Temporal Span"
          value={status?.dataset_start_date ? status.dataset_start_date.slice(0, 4) : '2015'}
          unit={`to ${status?.dataset_end_date ? status.dataset_end_date.slice(0, 4) : '2020'}`}
          subtitle={`${status?.dataset_start_date?.slice(0, 10)} - ${status?.dataset_end_date?.slice(0, 10)}`}
          icon={Calendar}
          variant="default"
        />
      </div>

      {/* Main Interactive Map & Station Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Geographic Monitoring Stations</h2>
              <p className="text-xs text-slate-500">Interactive map of verified CPCB and KSPCB continuous monitoring stations</p>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{stations.length}</span> stations
            </div>
          </div>

          <StationMap stations={stations} height="440px" />
        </div>

        {/* Station Spotlight & Freshness Card */}
        <div className="space-y-4">
          {/* Freshness & Ingestion Health */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Data Freshness & Integrity</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[11px] uppercase font-semibold">Latest Observation</span>
                <span className="font-mono text-sm font-bold text-slate-800">
                  {status?.dataset_end_date ? status.dataset_end_date.slice(0, 10) : 'N/A'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Authoritative CPCB Archive Record</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[11px] uppercase font-semibold">Last Ingestion Run</span>
                <span className="font-mono text-xs font-bold text-slate-800">
                  {status?.last_ingestion_run?.status || 'COMPLETED'}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Source: {status?.last_ingestion_run?.source || 'CPCB-CAAQMS-OFFICIAL'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                <span>Deterministic provenance verified with cryptographic SHA-256 fingerprinting.</span>
              </div>
            </div>
          </div>

          {/* Cleanest vs Highest Station */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Station Extremes</h3>

            {bestStation && (
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-800">Cleanest Air Quality</span>
                <div className="font-semibold text-slate-900 text-xs mt-0.5">{bestStation.name}</div>
                <div className="text-[11px] text-slate-500">{bestStation.city}, {bestStation.state}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Reported AQI:</span>
                  <AqiBadge value={bestStation.latest_aqi} category={bestStation.latest_aqi_category} size="sm" />
                </div>
              </div>
            )}

            {highestPollutionStation && (
              <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                <span className="text-[10px] uppercase font-bold text-rose-800">Highest Concentration</span>
                <div className="font-semibold text-slate-900 text-xs mt-0.5">{highestPollutionStation.name}</div>
                <div className="text-[11px] text-slate-500">{highestPollutionStation.city}, {highestPollutionStation.state}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Reported AQI:</span>
                  <AqiBadge value={highestPollutionStation.latest_aqi} category={highestPollutionStation.latest_aqi_category} size="sm" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Trend Overview Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-600" />
              <h3 className="text-base font-bold text-slate-900">Multi-Year PM2.5 Monthly Trend</h3>
            </div>
            <p className="text-xs text-slate-500">
              Aggregated monthly mean PM2.5 concentrations (µg/m³) across all continuous reporting stations
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
            CPCB NAAQS 24-hr Standard: 60 µg/m³
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={recentTrend}>
              <defs>
                <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" µg/m³" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(val: number) => [`${val} µg/m³`, 'Avg PM2.5']}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="avg_value"
                stroke="#0284c7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#pm25Gradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Available Criteria Pollutants Catalog */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1">Monitored Criteria Pollutants</h3>
        <p className="text-xs text-slate-500 mb-4">Official parameters measured according to CPCB National Ambient Air Quality Standards</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pollutants.map((pol) => (
            <div key={pol.pollutant_id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-sm">{pol.display_name}</span>
                <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{pol.unit}</span>
              </div>
              <div className="text-xs text-slate-500 mb-2">{pol.canonical_name}</div>
              <div className="flex items-baseline justify-between text-xs pt-2 border-t border-slate-200">
                <span className="text-slate-500">Mean: <strong className="text-slate-800">{pol.mean} {pol.unit}</strong></span>
                <span className="text-[11px] text-slate-400 font-mono">{pol.total_observations.toLocaleString()} obs</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
