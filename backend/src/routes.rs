use axum::{
    routing::{get, post},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::{
    config::Config,
    db::DbPool,
    handlers::{
        admin::{get_ingestion_run, list_ingestion_runs, trigger_ingestion_run},
        analytics::{
            get_data_completeness, get_exceedances, get_pollutant_summary,
            get_regional_summary, get_station_comparison, get_trends,
        },
        export::export_observations_csv,
        health::{get_data_status, get_metadata, health_check, readiness_check},
        observations::{get_latest_observations, get_observation_history, get_observations},
        stations::{get_station_by_id, get_station_observations, get_stations},
    },
};

pub fn create_router(pool: DbPool, _config: Config) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        // Health and Metadata
        .route("/health", get(health_check))
        .route("/ready", get(readiness_check))
        .route("/api/v1/metadata", get(get_metadata))
        .route("/api/v1/data-status", get(get_data_status))
        // Stations
        .route("/api/v1/stations", get(get_stations))
        .route("/api/v1/stations/:id", get(get_station_by_id))
        .route("/api/v1/stations/:id/observations", get(get_station_observations))
        // Observations
        .route("/api/v1/observations", get(get_observations))
        .route("/api/v1/observations/latest", get(get_latest_observations))
        .route("/api/v1/observations/history", get(get_observation_history))
        // Environmental Analytics
        .route("/api/v1/analytics/trends", get(get_trends))
        .route("/api/v1/analytics/station-comparison", get(get_station_comparison))
        .route("/api/v1/analytics/pollutant-summary", get(get_pollutant_summary))
        .route("/api/v1/analytics/exceedances", get(get_exceedances))
        .route("/api/v1/analytics/data-completeness", get(get_data_completeness))
        .route("/api/v1/analytics/regional-summary", get(get_regional_summary))
        // Export
        .route("/api/v1/export/observations.csv", get(export_observations_csv))
        // Admin routes
        .route("/api/v1/admin/ingestion-runs", get(list_ingestion_runs))
        .route("/api/v1/admin/ingestion-runs", post(trigger_ingestion_run))
        .route("/api/v1/admin/ingestion-runs/:id", get(get_ingestion_run))
        .with_state(pool)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}
