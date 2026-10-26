use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AqiObservation {
    pub id: i64,
    pub station_id: i64,
    pub observation_timestamp: String,
    pub aqi_value: i64,
    pub aqi_category: String,
    pub prominent_pollutant: Option<String>,
    pub source_dataset: String,
    pub record_fingerprint: String,
    pub ingested_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AqiCategorySummary {
    pub category: String,
    pub count: i64,
    pub percentage: f64,
    pub color_code: String,
}

impl AqiCategorySummary {
    pub fn get_color(category: &str) -> &'static str {
        match category.to_lowercase().as_str() {
            "good" => "#00E400",         // Green
            "satisfactory" => "#92D050", // Light green
            "moderate" => "#FFFF00",     // Yellow
            "poor" => "#FF7E00",         // Orange
            "very poor" => "#FF0000",    // Red
            "severe" => "#7E0023",       // Maroon
            _ => "#A0AEC0",              // Gray
        }
    }
}
