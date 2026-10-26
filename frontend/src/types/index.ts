export interface Station {
  id: number;
  station_code: string;
  name: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  agency?: string;
  status?: string;
  source_dataset: string;
  latest_aqi?: number | null;
  latest_aqi_category?: string | null;
  latest_observation_date?: string | null;
}

export interface Observation {
  id: number;
  station_code: string;
  station_name: string;
  city: string;
  state: string;
  pollutant_id: string;
  observation_timestamp: string;
  value: number;
  unit: string;
  averaging_period: string;
  data_quality_status: string;
  source_dataset: string;
}

export interface TrendPoint {
  period: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  count: number;
  unit: string;
}

export interface StationComparisonItem {
  station_code: string;
  station_name: string;
  city: string;
  state: string;
  pollutant_id: string;
  unit: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  valid_observations: number;
  expected_observations: number;
  completeness_pct: number;
}

export interface PollutantSummary {
  pollutant_id: string;
  canonical_name: string;
  display_name: string;
  unit: string;
  total_observations: number;
  mean: number;
  min: number;
  max: number;
  active_stations: number;
  cpcb_standard_24h: number | null;
}

export interface ExceedanceReport {
  pollutant_id: string;
  standard_id: string;
  standard_name: string;
  averaging_period: string;
  threshold_value: number;
  unit: string;
  total_observations: number;
  exceedance_count: number;
  exceedance_percentage: number;
  highest_recorded_value: number;
  compliance_note: string;
}

export interface DataCompletenessReport {
  station_code: string;
  station_name: string;
  pollutant_id: string;
  time_window_start: string;
  time_window_end: string;
  days_in_window: number;
  expected_observations: number;
  actual_observations: number;
  missing_observations: number;
  completeness_percentage: number;
  data_quality_status: string;
}

export interface RegionalSummary {
  state: string;
  station_count: number;
  total_observations: number;
  avg_pm25: number | null;
  avg_pm10: number | null;
  avg_no2: number | null;
  avg_aqi: number | null;
  last_observation_date: string | null;
}

export interface IngestionRun {
  id: string;
  source_identifier: string;
  status: string;
  start_time: string;
  end_time: string | null;
  records_retrieved: number;
  records_inserted: number;
  records_updated: number;
  records_rejected: number;
  error_details: string | null;
  run_metadata: string | null;
}

export interface DataStatus {
  status: string;
  total_stations: number;
  active_stations: number;
  total_observations: number;
  total_aqi_records: number;
  dataset_start_date: string | null;
  dataset_end_date: string | null;
  last_ingestion_run: {
    run_id: string;
    source: string;
    status: string;
    records_retrieved: number;
    records_inserted: number;
  } | null;
}
