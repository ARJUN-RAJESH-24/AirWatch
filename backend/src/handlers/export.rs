use axum::{
    extract::{Query, State},
    http::{header, HeaderMap, StatusCode},
    response::IntoResponse,
};
use crate::{
    db::DbPool,
    error::AppError,
    models::ObservationQuery,
};

pub async fn export_observations_csv(
    State(pool): State<DbPool>,
    Query(params): Query<ObservationQuery>,
) -> Result<impl IntoResponse, AppError> {
    // Enforce reasonable export bound
    let limit = params.limit.unwrap_or(5000).min(10000);

    let mut sql = String::from(
        r#"
        SELECT 
            s.station_code, s.name as station_name, s.city, s.state,
            o.pollutant_id, o.observation_timestamp, o.value, o.unit,
            o.averaging_period, o.data_quality_status, o.source_dataset, o.record_fingerprint
        FROM air_quality_observations o
        JOIN stations s ON s.id = o.station_id
        WHERE 1=1
        "#
    );

    let mut conditions = Vec::new();
    if let Some(ref st) = params.state {
        conditions.push(format!("s.state = '{}'", st.replace("'", "''")));
    }
    if let Some(ref ct) = params.city {
        conditions.push(format!("s.city = '{}'", ct.replace("'", "''")));
    }
    if let Some(ref code) = params.station_code {
        conditions.push(format!("s.station_code = '{}'", code.replace("'", "''")));
    }
    if let Some(ref p) = params.pollutant {
        conditions.push(format!("o.pollutant_id = '{}'", p.replace("'", "''")));
    }
    if let Some(ref s) = params.start_date {
        conditions.push(format!("o.observation_timestamp >= '{}'", s.replace("'", "''")));
    }
    if let Some(ref e) = params.end_date {
        conditions.push(format!("o.observation_timestamp <= '{}'", e.replace("'", "''")));
    }

    for c in conditions {
        sql.push_str(" AND ");
        sql.push_str(&c);
    }

    sql.push_str(&format!(" ORDER BY o.observation_timestamp DESC LIMIT {}", limit));

    let rows: Vec<(String, String, String, String, String, String, f64, String, String, String, String, String)> =
        sqlx::query_as(&sql).fetch_all(&pool).await?;

    // Build CSV buffer
    let mut wtr = csv::Writer::from_writer(vec![]);
    // Write headers
    wtr.write_record(&[
        "StationCode", "StationName", "City", "State",
        "Pollutant", "ObservationTimestamp", "Value", "Unit",
        "AveragingPeriod", "DataQualityStatus", "SourceDataset", "RecordFingerprint"
    ]).map_err(|e| AppError::Internal(format!("CSV serialization error: {}", e)))?;

    for r in rows {
        wtr.write_record(&[
            &r.0, &r.1, &r.2, &r.3,
            &r.4, &r.5, &r.6.to_string(), &r.7,
            &r.8, &r.9, &r.10, &r.11
        ]).map_err(|e| AppError::Internal(format!("CSV serialization error: {}", e)))?;
    }

    let csv_data = wtr.into_inner().map_err(|e| AppError::Internal(format!("CSV flush error: {}", e)))?;

    let filename = format!("airwatch_observations_{}.csv", chrono::Utc::now().format("%Y%m%d_%H%M%S"));

    let mut headers = HeaderMap::new();
    headers.insert(header::CONTENT_TYPE, "text/csv; charset=utf-8".parse().unwrap());
    headers.insert(
        header::CONTENT_DISPOSITION,
        format!("attachment; filename=\"{}\"", filename).parse().unwrap(),
    );

    Ok((StatusCode::OK, headers, csv_data))
}
