import {
  DataStatus,
  ExceedanceReport,
  IngestionRun,
  Observation,
  PollutantSummary,
  RegionalSummary,
  Station,
  StationComparisonItem,
  TrendPoint,
  DataCompletenessReport,
} from '../types';

const API_BASE = '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.error?.message) {
        errorMsg = errorJson.error.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // System Health & Metadata
  async getDataStatus(): Promise<DataStatus> {
    const res = await fetch(`${API_BASE}/data-status`);
    return handleResponse<DataStatus>(res);
  },

  async getMetadata(): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/metadata`);
    return handleResponse<Record<string, unknown>>(res);
  },

  // Stations
  async getStations(params?: { state?: string; city?: string; limit?: number }): Promise<{ stations: Station[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.state) query.append('state', params.state);
    if (params?.city) query.append('city', params.city);
    if (params?.limit) query.append('limit', params.limit.toString());
    const res = await fetch(`${API_BASE}/stations?${query.toString()}`);
    return handleResponse<{ stations: Station[]; count: number }>(res);
  },

  async getStation(id: string | number): Promise<{ station: Station & { available_pollutants: string[]; latest_aqi: { value: number; category: string; timestamp: string } | null } }> {
    const res = await fetch(`${API_BASE}/stations/${id}`);
    return handleResponse<{ station: Station & { available_pollutants: string[]; latest_aqi: { value: number; category: string; timestamp: string } | null } }>(res);
  },

  // Observations
  async getObservations(params: {
    state?: string;
    city?: string;
    station_code?: string;
    pollutant?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ observations: Observation[]; count: number }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, v.toString());
    });
    const res = await fetch(`${API_BASE}/observations?${query.toString()}`);
    return handleResponse<{ observations: Observation[]; count: number }>(res);
  },

  async getLatestObservations(params?: { state?: string; city?: string; pollutant?: string }): Promise<{ latest_observations: Observation[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.state) query.append('state', params.state);
    if (params?.city) query.append('city', params.city);
    if (params?.pollutant) query.append('pollutant', params.pollutant);
    const res = await fetch(`${API_BASE}/observations/latest?${query.toString()}`);
    return handleResponse<{ latest_observations: Observation[]; count: number }>(res);
  },

  // Analytics
  async getTrends(params: {
    pollutant: string;
    station_code?: string;
    city?: string;
    state?: string;
    interval?: 'daily' | 'monthly' | 'yearly';
    start_date?: string;
    end_date?: string;
  }): Promise<{ pollutant: string; interval: string; trends: TrendPoint[]; count: number }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, v.toString());
    });
    const res = await fetch(`${API_BASE}/analytics/trends?${query.toString()}`);
    return handleResponse<{ pollutant: string; interval: string; trends: TrendPoint[]; count: number }>(res);
  },

  async getStationComparison(params: {
    pollutant: string;
    station_codes: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ pollutant: string; stations_compared: number; comparison: StationComparisonItem[] }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, v.toString());
    });
    const res = await fetch(`${API_BASE}/analytics/station-comparison?${query.toString()}`);
    return handleResponse<{ pollutant: string; stations_compared: number; comparison: StationComparisonItem[] }>(res);
  },

  async getPollutantSummary(): Promise<{ pollutants: PollutantSummary[]; count: number }> {
    const res = await fetch(`${API_BASE}/analytics/pollutant-summary`);
    return handleResponse<{ pollutants: PollutantSummary[]; count: number }>(res);
  },

  async getExceedances(params?: {
    pollutant?: string;
    station_code?: string;
    state?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ exceedance_analysis: ExceedanceReport[]; standards_source: string; count: number }> {
    const query = new URLSearchParams();
    if (params?.pollutant) query.append('pollutant', params.pollutant);
    if (params?.station_code) query.append('station_code', params.station_code);
    if (params?.state) query.append('state', params.state);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    const res = await fetch(`${API_BASE}/analytics/exceedances?${query.toString()}`);
    return handleResponse<{ exceedance_analysis: ExceedanceReport[]; standards_source: string; count: number }>(res);
  },

  async getDataCompleteness(params: {
    station_code: string;
    pollutant?: string;
  }): Promise<DataCompletenessReport> {
    const query = new URLSearchParams();
    query.append('station_code', params.station_code);
    if (params.pollutant) query.append('pollutant', params.pollutant);
    const res = await fetch(`${API_BASE}/analytics/data-completeness?${query.toString()}`);
    return handleResponse<DataCompletenessReport>(res);
  },

  async getRegionalSummary(): Promise<{ regional_summaries: RegionalSummary[]; count: number }> {
    const res = await fetch(`${API_BASE}/analytics/regional-summary`);
    return handleResponse<{ regional_summaries: RegionalSummary[]; count: number }>(res);
  },

  // Export
  getExportUrl(params: {
    state?: string;
    city?: string;
    station_code?: string;
    pollutant?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, v.toString());
    });
    return `${API_BASE}/export/observations.csv?${query.toString()}`;
  },

  // Admin Ingestion Monitoring
  async getIngestionRuns(): Promise<{ ingestion_runs: IngestionRun[]; count: number }> {
    const res = await fetch(`${API_BASE}/admin/ingestion-runs`);
    return handleResponse<{ ingestion_runs: IngestionRun[]; count: number }>(res);
  },

  async triggerIngestion(adminKey: string, scope: 'kerala' | 'all' = 'kerala'): Promise<{ status: string; run_id: string; message: string }> {
    const res = await fetch(`${API_BASE}/admin/ingestion-runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
      },
      body: JSON.stringify({ scope }),
    });
    return handleResponse<{ status: string; run_id: string; message: string }>(res);
  },
};
