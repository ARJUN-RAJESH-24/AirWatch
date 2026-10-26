use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrendPoint {
    pub period: String,
    pub avg_value: f64,
    pub min_value: f64,
    pub max_value: f64,
    pub count: i64,
    pub unit: String,
}

#[derive(Debug, Deserialize)]
pub struct TrendQuery {
    pub pollutant: String,
    pub station_code: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub interval: Option<String>, // "daily", "monthly", "yearly"
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StationComparisonItem {
    pub station_code: String,
    pub station_name: String,
    pub city: String,
    pub state: String,
    pub pollutant_id: String,
    pub unit: String,
    pub avg_value: f64,
    pub min_value: f64,
    pub max_value: f64,
    pub valid_observations: i64,
    pub expected_observations: i64,
    pub completeness_pct: f64,
}

#[derive(Debug, Deserialize)]
pub struct ComparisonQuery {
    pub pollutant: String,
    pub station_codes: String, // comma-separated e.g. "KL001,KL002,DL001"
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PollutantSummary {
    pub pollutant_id: String,
    pub canonical_name: String,
    pub display_name: String,
    pub unit: String,
    pub total_observations: i64,
    pub mean: f64,
    pub min: f64,
    pub max: f64,
    pub active_stations: i64,
    pub cpcb_standard_24h: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExceedanceReport {
    pub pollutant_id: String,
    pub standard_id: String,
    pub standard_name: String,
    pub averaging_period: String,
    pub threshold_value: f64,
    pub unit: String,
    pub total_observations: i64,
    pub exceedance_count: i64,
    pub exceedance_percentage: f64,
    pub highest_recorded_value: f64,
    pub compliance_note: String,
}

#[derive(Debug, Deserialize)]
pub struct ExceedanceQuery {
    pub pollutant: Option<String>,
    pub station_code: Option<String>,
    pub state: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataCompletenessReport {
    pub station_code: String,
    pub station_name: String,
    pub pollutant_id: String,
    pub time_window_start: String,
    pub time_window_end: String,
    pub days_in_window: i64,
    pub expected_observations: i64,
    pub actual_observations: i64,
    pub completeness_percentage: f64,
    pub missing_observations: i64,
    pub data_quality_status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionalSummary {
    pub state: String,
    pub station_count: i64,
    pub total_observations: i64,
    pub avg_pm25: Option<f64>,
    pub avg_pm10: Option<f64>,
    pub avg_no2: Option<f64>,
    pub avg_aqi: Option<f64>,
    pub last_observation_date: Option<String>,
}
