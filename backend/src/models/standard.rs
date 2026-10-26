use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct EnvironmentalStandard {
    pub id: String,
    pub pollutant_id: String,
    pub standard_name: String,
    pub averaging_period: String,
    pub threshold_value: f64,
    pub unit: String,
    pub area_category: String,
    pub source_authority: String,
    pub effective_date: String,
    pub citation: String,
}
