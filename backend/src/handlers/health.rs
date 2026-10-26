use axum::{extract::State, response::IntoResponse, Json};
use serde_json::json;
use crate::{db::DbPool, error::AppError};

pub async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "healthy",
        "service": "airwatch-backend",
        "version": env!("CARGO_PKG_VERSION"),
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

pub async fn readiness_check(State(pool): State<DbPool>) -> Result<impl IntoResponse, AppError> {
    sqlx::query("SELECT 1")
        .execute(&pool)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Readiness check failed: {}", e)))?;

    Ok(Json(json!({
        "status": "ready",
        "database": "connected",
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}

pub async fn get_metadata() -> impl IntoResponse {
    Json(json!({
        "name": "AirWatch",
        "project": "AirWatch",
        "version": env!("CARGO_PKG_VERSION"),
        "description": "Cloud-Native Environmental Data Analytics Platform Using Official Indian Air Quality Data",
        "standards": {
            "name": "CPCB National Ambient Air Quality Standards (NAAQS) 2009",
            "gazette_notification": "Notification No. B-29016/20/90/PCI-L",
            "effective_date": "2009-11-18"
        },
        "environmental_standards": "CPCB National Ambient Air Quality Standards (NAAQS) 2009",
        "authoritative_sources": [
            {
                "name": "Central Pollution Control Board (CPCB)",
                "ministry": "Ministry of Environment, Forest and Climate Change, Govt of India",
                "portal": "https://airquality.cpcb.gov.in/AQI_India/",
                "program": "Continuous Ambient Air Quality Monitoring System (CAAQMS)"
            },
            {
                "name": "Open Government Data (OGD) Platform India",
                "portal": "https://data.gov.in/",
                "catalog": "Real-Time Air Quality Index (Resource: 3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69)"
            },
            {
                "name": "Kerala State Pollution Control Board (KSPCB)",
                "portal": "https://kspcb.kerala.gov.in/",
                "program": "Kerala Ambient Air Quality Monitoring Network"
            }
        ],
        "provenance_policy": "Full deterministic provenance preserved. No synthetic observations presented as actual data.",
        "ai_ml_disclaimer": "This platform relies purely on deterministic data engineering and statistical computation without artificial intelligence, generative models, or predictive simulation."
    }))
}

pub async fn get_data_status(State(pool): State<DbPool>) -> Result<impl IntoResponse, AppError> {
    // Total stations count
    let (total_stations,): (i64,) = sqlx::query_as("SELECT count(*) FROM stations")
        .fetch_one(&pool)
        .await?;

    // Active stations with observations
    let (active_stations,): (i64,) = sqlx::query_as("SELECT count(DISTINCT station_id) FROM air_quality_observations")
        .fetch_one(&pool)
        .await?;

    // Total observations count
    let (total_observations,): (i64,) = sqlx::query_as("SELECT count(*) FROM air_quality_observations")
        .fetch_one(&pool)
        .await?;

    // Total reported AQI records
    let (total_aqi_records,): (i64,) = sqlx::query_as("SELECT count(*) FROM aqi_observations")
        .fetch_one(&pool)
        .await?;

    // Date range of observations
    let date_range: (Option<String>, Option<String>) = sqlx::query_as(
        "SELECT min(observation_timestamp), max(observation_timestamp) FROM air_quality_observations"
    )
    .fetch_one(&pool)
    .await?;

    // Last ingestion run status
    let last_run: Option<(String, String, String, i64, i64)> = sqlx::query_as(
        "SELECT id, source_identifier, status, records_retrieved, records_inserted
         FROM ingestion_runs ORDER BY start_time DESC LIMIT 1"
    )
    .fetch_optional(&pool)
    .await?;

    // Available pollutants
    let pollutant_rows: Vec<(String,)> = sqlx::query_as("SELECT id FROM pollutants ORDER BY id")
        .fetch_all(&pool)
        .await
        .unwrap_or_default();
    let pollutants: Vec<String> = pollutant_rows.into_iter().map(|p| p.0).collect();

    Ok(Json(json!({
        "status": "operational",
        "total_stations": total_stations,
        "active_stations": active_stations,
        "total_observations": total_observations,
        "total_aqi_records": total_aqi_records,
        "pollutants": pollutants,
        "dataset_start_date": date_range.0,
        "dataset_end_date": date_range.1,
        "last_ingestion_run": last_run.map(|(id, src, st, ret, ins)| json!({
            "run_id": id,
            "source": src,
            "status": st,
            "records_retrieved": ret,
            "records_inserted": ins
        }))
    })))
}
