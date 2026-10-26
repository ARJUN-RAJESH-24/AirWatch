import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Station, StationComparisonItem } from '../types';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Calendar, Info } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const Comparison: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  // Default selected stations: Mix of Kerala stations and key national comparison stations
  const [selectedStationCodes, setSelectedStationCodes] = useState<string[]>([
    'KL008', // Plammoodu, Thiruvananthapuram
    'KL004', // Vyttila, Kochi
    'KL006', // Palayam, Kozhikode
    'DL001', // Anand Vihar, Delhi
    'KA001', // City Railway Station, Bengaluru
  ]);
  const [selectedPollutant, setSelectedPollutant] = useState<string>('PM2.5');
  const [startDate, setStartDate] = useState<string>('2019-01-01');
  const [endDate, setEndDate] = useState<string>('2020-07-01');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<StationComparisonItem[]>([]);

  useEffect(() => {
    api.getStations({ limit: 300 })
      .then(res => setStations(res.stations))
      .catch(err => console.error(err));
  }, []);

  const loadComparison = async () => {
    if (selectedStationCodes.length === 0) {
      setComparisonData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStationComparison({
        pollutant: selectedPollutant,
        station_codes: selectedStationCodes.join(','),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setComparisonData(res.comparison);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error retrieving station comparison data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparison();
  }, [selectedStationCodes, selectedPollutant, startDate, endDate]);

  const toggleStation = (code: string) => {
    if (selectedStationCodes.includes(code)) {
      if (selectedStationCodes.length > 1) {
        setSelectedStationCodes(selectedStationCodes.filter(c => c !== code));
      }
    } else {
      if (selectedStationCodes.length < 8) {
        setSelectedStationCodes([...selectedStationCodes, code]);
      }
    }
  };

  // Group stations into Kerala vs National
  const keralaStations = stations.filter(s => s.state.toLowerCase() === 'kerala');
  const otherStations = stations.filter(s => s.state.toLowerCase() !== 'kerala');

  const unit = comparisonData.length > 0 ? comparisonData[0].unit : 'µg/m³';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            Comparative Analytics
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-medium">Multi-Station Evaluation</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Station Concentration Comparison
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Compare ambient pollutant levels between continuous monitoring stations using compatible observation windows,
          identical measurement units, and verifiable completeness thresholds.
        </p>

        {/* Controls Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Pollutant Selector */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Criteria Pollutant:</span>
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

          {/* Date Window */}
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">Window:</span>
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

        {/* Station Multi-Select Tags */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Select Stations to Compare (up to 8):</span>
            <span className="text-[11px] text-slate-400">{selectedStationCodes.length} selected</span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Kerala:</span>
              {keralaStations.map(s => {
                const active = selectedStationCodes.includes(s.station_code);
                return (
                  <button
                    key={s.station_code}
                    type="button"
                    onClick={() => toggleStation(s.station_code)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                      active
                        ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.city} ({s.station_code})
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Metros:</span>
              {otherStations.slice(0, 10).map(s => {
                const active = selectedStationCodes.includes(s.station_code);
                return (
                  <button
                    key={s.station_code}
                    type="button"
                    onClick={() => toggleStation(s.station_code)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                      active
                        ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.city} ({s.station_code})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Mean & Maximum {selectedPollutant} Comparison ({unit})
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Comparing average and peak recorded concentrations across selected monitoring locations
        </p>

        {loading ? (
          <LoadingState height="320px" />
        ) : error ? (
          <ErrorState message={error} onRetry={loadComparison} />
        ) : comparisonData.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="city" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit={` ${unit}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(val: number, name: string) => [`${val} ${unit}`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="avg_value" name="Average Concentration" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="max_value" name="Maximum Peak" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Comparison Summary Table with Completeness */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm">Station Comparison & Data Completeness</h3>
          <p className="text-xs text-slate-500">Summary statistics and sample size validation for the selected window</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Station</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Mean ({unit})</th>
                <th className="py-2.5 px-4">Peak ({unit})</th>
                <th className="py-2.5 px-4">Valid Observations</th>
                <th className="py-2.5 px-4">Data Completeness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {comparisonData.map((item) => (
                <tr key={item.station_code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-medium">
                    <div className="font-semibold text-slate-900">{item.station_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.station_code}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {item.city}, {item.state}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 text-sm">{item.avg_value}</span>
                    <span className="text-slate-400 text-[11px] ml-1">{item.unit}</span>
                  </td>
                  <td className="py-3 px-4 text-rose-600 font-bold">
                    {item.max_value} {item.unit}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium">
                    {item.valid_observations.toLocaleString()} records
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            item.completeness_pct >= 80 ? 'bg-emerald-500' : item.completeness_pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, item.completeness_pct)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-700 text-xs">{item.completeness_pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Academic Integrity Disclosure */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
          <Info className="h-4 w-4 text-sky-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Methodology Note:</strong> Stations cannot be fairly ranked if sampling frequencies or missing observation proportions diverge significantly.
            AirWatch explicitly discloses sample sizes and completeness rates for academic rigor.
          </p>
        </div>
      </div>
    </div>
  );
};
