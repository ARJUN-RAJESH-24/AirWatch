import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Station, TrendPoint } from '../types';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { Info } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const Historical: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('KL008'); // Plammoodu, Thiruvananthapuram
  const [selectedPollutant, setSelectedPollutant] = useState<string>('PM2.5');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [monthlyTrends, setMonthlyTrends] = useState<TrendPoint[]>([]);
  const [yearlyTrends, setYearlyTrends] = useState<TrendPoint[]>([]);

  useEffect(() => {
    api.getStations({ limit: 300 })
      .then(res => setStations(res.stations))
      .catch(err => console.error(err));
  }, []);

  const loadHistorical = async () => {
    setLoading(true);
    setError(null);
    try {
      const [monthlyRes, yearlyRes] = await Promise.all([
        api.getTrends({
          pollutant: selectedPollutant,
          station_code: selectedStation || undefined,
          interval: 'monthly',
        }),
        api.getTrends({
          pollutant: selectedPollutant,
          station_code: selectedStation || undefined,
          interval: 'yearly',
        }),
      ]);

      setMonthlyTrends(monthlyRes.trends);
      setYearlyTrends(yearlyRes.trends);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error retrieving historical time series data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistorical();
  }, [selectedStation, selectedPollutant]);

  // Seasonal grouping (CPCB standard Indian seasons):
  // Winter (Dec, Jan, Feb)
  // Pre-Monsoon / Summer (Mar, Apr, May)
  // Monsoon (Jun, Jul, Aug, Sep)
  // Post-Monsoon (Oct, Nov)
  const seasons = {
    Winter: { sum: 0, count: 0 },
    'Pre-Monsoon': { sum: 0, count: 0 },
    Monsoon: { sum: 0, count: 0 },
    'Post-Monsoon': { sum: 0, count: 0 },
  };

  monthlyTrends.forEach((t) => {
    const month = parseInt(t.period.slice(5, 7), 10);
    if (month === 12 || month === 1 || month === 2) {
      seasons.Winter.sum += t.avg_value * t.count;
      seasons.Winter.count += t.count;
    } else if (month >= 3 && month <= 5) {
      seasons['Pre-Monsoon'].sum += t.avg_value * t.count;
      seasons['Pre-Monsoon'].count += t.count;
    } else if (month >= 6 && month <= 9) {
      seasons.Monsoon.sum += t.avg_value * t.count;
      seasons.Monsoon.count += t.count;
    } else if (month === 10 || month === 11) {
      seasons['Post-Monsoon'].sum += t.avg_value * t.count;
      seasons['Post-Monsoon'].count += t.count;
    }
  });

  const seasonalData = Object.entries(seasons).map(([name, data]) => ({
    season: name,
    avg: data.count > 0 ? parseFloat((data.sum / data.count).toFixed(2)) : 0,
    observations: data.count,
  }));

  const unit = monthlyTrends.length > 0 ? monthlyTrends[0].unit : 'µg/m³';

  // Overall min/max in historical record
  const allMax = monthlyTrends.length > 0 ? Math.max(...monthlyTrends.map(t => t.max_value)) : 0;
  const allMin = monthlyTrends.length > 0 ? Math.min(...monthlyTrends.map(t => t.min_value)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            Historical Trend Analysis
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-medium">Multi-Year Evolution & Seasonality</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Long-Term Environmental Records
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Examine multi-year trends, monthly distributions, and seasonal variation across official Indian monitoring stations.
        </p>

        {/* Filters */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Monitoring Station</label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="rounded-lg border border-slate-300 py-1.5 px-3 bg-white text-slate-900 font-medium"
            >
              <option value="">All Stations (National Aggregation)</option>
              {stations.map(s => (
                <option key={s.station_code} value={s.station_code}>
                  {s.name} ({s.city}, {s.state})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Criteria Pollutant</label>
            <select
              value={selectedPollutant}
              onChange={(e) => setSelectedPollutant(e.target.value)}
              className="rounded-lg border border-slate-300 py-1.5 px-3 bg-white text-slate-900 font-bold text-sky-700"
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
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Historical Minimum</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {allMin} <span className="text-xs font-normal text-slate-500">{unit}</span>
          </div>
          <span className="text-[11px] text-slate-400">Lowest clean baseline</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Historical Maximum</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {allMax} <span className="text-xs font-normal text-slate-500">{unit}</span>
          </div>
          <span className="text-[11px] text-slate-400">Peak event recorded</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Available Years</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {yearlyTrends.length} <span className="text-xs font-normal text-slate-500">Years</span>
          </div>
          <span className="text-[11px] text-slate-400">Continuous archive</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Months Ingested</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {monthlyTrends.length} <span className="text-xs font-normal text-slate-500">Periods</span>
          </div>
          <span className="text-[11px] text-slate-400">Granular monthly intervals</span>
        </div>
      </div>

      {/* Annual Summary Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Annual Average Concentrations ({unit})
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Year-over-year mean values for {selectedPollutant} across the observation archive
        </p>

        {loading ? (
          <LoadingState height="260px" />
        ) : error ? (
          <ErrorState message={error} onRetry={loadHistorical} />
        ) : yearlyTrends.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit={` ${unit}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(val: number) => [`${val} ${unit}`, `${selectedPollutant} Annual Mean`]}
                />
                <Bar dataKey="avg_value" name="Annual Mean" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Seasonal Cycle Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Seasonal Variation Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Aggregated according to standard Indian meteorological seasons
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="season" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit={` ${unit}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(val: number) => [`${val} ${unit}`, 'Seasonal Mean']}
                />
                <Bar dataKey="avg" name="Mean Concentration" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Seasonal Pattern Summary
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Observed meteorological trends in CPCB observations
            </p>

            <div className="space-y-3 text-xs">
              {seasonalData.map((s) => (
                <div key={s.season} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{s.season}</span>
                    <span className="text-[11px] text-slate-500 block">{s.observations.toLocaleString()} valid observations</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">{s.avg}</span>
                    <span className="text-slate-500 text-[11px] ml-1">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500">
            <Info className="h-4 w-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <p>
              Precipitation washout during the monsoon typically depresses particulate concentrations,
              whereas atmospheric temperature inversions in winter trap boundary-layer emissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
