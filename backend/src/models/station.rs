use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Station {
    pub id: i64,
    pub station_code: String,
    pub name: String,
    pub city: String,
    pub state: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub agency: Option<String>,
    pub status: Option<String>,
    pub source_dataset: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StationWithAqi {
    pub id: i64,
    pub station_code: String,
    pub name: String,
    pub city: String,
    pub state: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub agency: Option<String>,
    pub status: Option<String>,
    pub source_dataset: String,
    pub latest_aqi: Option<i64>,
    pub latest_aqi_category: Option<String>,
    pub latest_observation_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct StationQuery {
    pub state: Option<String>,
    pub city: Option<String>,
    pub status: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}
