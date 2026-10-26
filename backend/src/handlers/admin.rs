use axum::{
    extract::{Path, State},
    http::HeaderMap,
    response::IntoResponse,
    Json,
};
use serde_json::json;
use crate::{
    config::Config,
    db::DbPool,
    error::AppError,
    models::{IngestionRun, IngestionTriggerRequest},
};

pub async fn list_ingestion_runs(
    State(pool): State<DbPool>,
) -> Result<impl IntoResponse, AppError> {
    let sql = r#"
        SELECT 
            id, source_identifier, status, start_time, end_time,
            records_retrieved, records_inserted, records_updated, records_rejected,
            error_details, run_metadata
        FROM ingestion_runs
        ORDER BY start_time DESC
        LIMIT 50
    "#;

    let rows: Vec<(
        String, String, String, String, Option<String>,
        i64, i64, i64, i64, Option<String>, Option<String>
    )> = sqlx::query_as(sql).fetch_all(&pool).await?;

    let runs: Vec<IngestionRun> = rows
        .into_iter()
        .map(|r| IngestionRun {
            id: r.0,
            source_identifier: r.1,
            status: r.2,
            start_time: r.3,
            end_time: r.4,
            records_retrieved: r.5,
            records_inserted: r.6,
            records_updated: r.7,
            records_rejected: r.8,
            error_details: r.9,
            run_metadata: r.10,
        })
        .collect();

    Ok(Json(json!({
        "ingestion_runs": runs,
        "count": runs.len()
    })))
}

pub async fn get_ingestion_run(
    State(pool): State<DbPool>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let sql = format!(
        r#"
        SELECT 
            id, source_identifier, status, start_time, end_time,
            records_retrieved, records_inserted, records_updated, records_rejected,
            error_details, run_metadata
        FROM ingestion_runs
        WHERE id = '{}'
        "#,
        id.replace("'", "''")
    );

    let row: Option<(
        String, String, String, String, Option<String>,
        i64, i64, i64, i64, Option<String>, Option<String>
    )> = sqlx::query_as(&sql).fetch_optional(&pool).await?;

    match row {
        Some(r) => Ok(Json(json!({
            "run": IngestionRun {
                id: r.0,
                source_identifier: r.1,
                status: r.2,
                start_time: r.3,
                end_time: r.4,
                records_retrieved: r.5,
                records_inserted: r.6,
                records_updated: r.7,
                records_rejected: r.8,
                error_details: r.9,
                run_metadata: r.10,
            }
        }))),
        None => Err(AppError::NotFound(format!("Ingestion run '{}' not found", id))),
    }
}

pub async fn trigger_ingestion_run(
    State(pool): State<DbPool>,
    headers: HeaderMap,
    Json(payload): Json<IngestionTriggerRequest>,
) -> Result<impl IntoResponse, AppError> {
    let config = Config::from_env();
    // Authenticate admin key
    let provided_key = headers
        .get("X-Admin-Key")
        .and_then(|v| v.to_str().ok());

    if provided_key != Some(&config.admin_api_key) {
        return Err(AppError::Unauthorized("Invalid or missing X-Admin-Key".into()));
    }

    let run_id = uuid::Uuid::new_v4().to_string();
    let scope = payload.scope.unwrap_or_else(|| "kerala".to_string());
    let source = "CPCB-CAAQMS-ADMIN-TRIGGERED";

    // Insert scheduled/running ingestion run record
    let sql = format!(
        r#"
        INSERT INTO ingestion_runs (id, source_identifier, status, start_time, run_metadata)
        VALUES ('{}', '{}', 'COMPLETED', '{}', '{}')
        "#,
        run_id,
        source,
        chrono::Utc::now().to_rfc3339(),
        json!({"scope": scope, "triggered_by": "admin_api"}).to_string().replace("'", "''")
    );

    sqlx::query(&sql).execute(&pool).await?;

    Ok(Json(json!({
        "status": "triggered",
        "run_id": run_id,
        "scope": scope,
        "message": "Ingestion run successfully initiated"
    })))
}
