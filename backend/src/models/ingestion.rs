use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct IngestionRun {
    pub id: String,
    pub source_identifier: String,
    pub status: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub records_retrieved: i64,
    pub records_inserted: i64,
    pub records_updated: i64,
    pub records_rejected: i64,
    pub error_details: Option<String>,
    pub run_metadata: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct RawDataAsset {
    pub id: String,
    pub source_identifier: String,
    pub original_filename: Option<String>,
    pub storage_location: String,
    pub content_checksum: String,
    pub content_type: String,
    pub file_size_bytes: i64,
    pub retrieval_timestamp: String,
    pub validation_status: String,
}

#[derive(Debug, Deserialize)]
pub struct IngestionTriggerRequest {
    pub scope: Option<String>, // "kerala" or "all"
    pub max_records: Option<i64>,
}
