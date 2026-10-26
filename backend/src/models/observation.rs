use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Observation {
    pub id: i64,
    pub station_id: i64,
    pub pollutant_id: String,
    pub observation_timestamp: String,
    pub value: f64,
    pub unit: String,
    pub min_value: Option<f64>,
    pub max_value: Option<f64>,
    pub averaging_period: String,
    pub source_dataset: String,
    pub record_fingerprint: String,
    pub data_quality_status: String,
    pub ingested_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObservationWithStation {
    pub id: i64,
    pub station_code: String,
    pub station_name: String,
    pub city: String,
    pub state: String,
    pub pollutant_id: String,
    pub observation_timestamp: String,
    pub value: f64,
    pub unit: String,
    pub averaging_period: String,
    pub data_quality_status: String,
    pub source_dataset: String,
}

#[derive(Debug, Deserialize)]
pub struct ObservationQuery {
    pub state: Option<String>,
    pub city: Option<String>,
    pub station_id: Option<i64>,
    pub station_code: Option<String>,
    pub pollutant: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}
