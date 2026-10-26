use axum::{
    extract::{Query, State},
    response::IntoResponse,
    Json,
};
use serde_json::json;
use crate::{
    db::DbPool,
    error::AppError,
    models::ObservationQuery,
};

pub async fn get_observations(
    State(pool): State<DbPool>,
    Query(params): Query<ObservationQuery>,
) -> Result<impl IntoResponse, AppError> {
    let limit = params.limit.unwrap_or(100).min(1000);
    let offset = params.offset.unwrap_or(0);

    let mut sql = String::from(
        r#"
        SELECT 
            o.id, s.station_code, s.name, s.city, s.state,
            o.pollutant_id, o.observation_timestamp, o.value, o.unit,
            o.averaging_period, o.data_quality_status, o.source_dataset
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
    if let Some(sid) = params.station_id {
        conditions.push(format!("o.station_id = {}", sid));
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

    sql.push_str(&format!(" ORDER BY o.observation_timestamp DESC LIMIT {} OFFSET {}", limit, offset));

    let rows: Vec<(i64, String, String, String, String, String, String, f64, String, String, String, String)> =
        sqlx::query_as(&sql).fetch_all(&pool).await?;

    let observations: Vec<_> = rows.into_iter().map(|r| json!({
        "id": r.0,
        "station_code": r.1,
        "station_name": r.2,
        "city": r.3,
        "state": r.4,
        "pollutant_id": r.5,
        "observation_timestamp": r.6,
        "value": r.7,
        "unit": r.8,
        "averaging_period": r.9,
        "data_quality_status": r.10,
        "source_dataset": r.11
    })).collect();

    Ok(Json(json!({
        "observations": observations,
        "count": observations.len(),
        "limit": limit,
        "offset": offset
    })))
}

pub async fn get_latest_observations(
    State(pool): State<DbPool>,
    Query(params): Query<ObservationQuery>,
) -> Result<impl IntoResponse, AppError> {
    let limit = params.limit.unwrap_or(50).min(200);

    let mut sql = String::from(
        r#"
        SELECT 
            o.id, s.station_code, s.name, s.city, s.state,
            o.pollutant_id, o.observation_timestamp, o.value, o.unit,
            o.averaging_period, o.data_quality_status, o.source_dataset
        FROM air_quality_observations o
        JOIN stations s ON s.id = o.station_id
        WHERE 1=1
        "#
    );

    if let Some(ref st) = params.state {
        sql.push_str(&format!(" AND s.state = '{}'", st.replace("'", "''")));
    }
    if let Some(ref ct) = params.city {
        sql.push_str(&format!(" AND s.city = '{}'", ct.replace("'", "''")));
    }
    if let Some(ref p) = params.pollutant {
        sql.push_str(&format!(" AND o.pollutant_id = '{}'", p.replace("'", "''")));
    }

    sql.push_str(&format!(" ORDER BY o.observation_timestamp DESC LIMIT {}", limit));

    let rows: Vec<(i64, String, String, String, String, String, String, f64, String, String, String, String)> =
        sqlx::query_as(&sql).fetch_all(&pool).await?;

    let observations: Vec<_> = rows.into_iter().map(|r| json!({
        "id": r.0,
        "station_code": r.1,
        "station_name": r.2,
        "city": r.3,
        "state": r.4,
        "pollutant_id": r.5,
        "observation_timestamp": r.6,
        "value": r.7,
        "unit": r.8,
        "averaging_period": r.9,
        "data_quality_status": r.10,
        "source_dataset": r.11
    })).collect();

    Ok(Json(json!({
        "latest_observations": observations,
        "count": observations.len()
    })))
}

pub async fn get_observation_history(
    State(pool): State<DbPool>,
    Query(params): Query<ObservationQuery>,
) -> Result<impl IntoResponse, AppError> {
    let pollutant = params.pollutant.as_deref().unwrap_or("PM2.5");
    let limit = params.limit.unwrap_or(365).min(2000);

    let mut sql = format!(
        r#"
        SELECT 
            o.observation_timestamp, round(avg(o.value), 2) as avg_val,
            round(min(o.value), 2) as min_val, round(max(o.value), 2) as max_val,
            count(*) as count, o.unit
        FROM air_quality_observations o
        JOIN stations s ON s.id = o.station_id
        WHERE o.pollutant_id = '{}'
        "#,
        pollutant.replace("'", "''")
    );

    if let Some(ref st) = params.state {
        sql.push_str(&format!(" AND s.state = '{}'", st.replace("'", "''")));
    }
    if let Some(ref ct) = params.city {
        sql.push_str(&format!(" AND s.city = '{}'", ct.replace("'", "''")));
    }
    if let Some(ref code) = params.station_code {
        sql.push_str(&format!(" AND s.station_code = '{}'", code.replace("'", "''")));
    }
    if let Some(ref s) = params.start_date {
        sql.push_str(&format!(" AND o.observation_timestamp >= '{}'", s.replace("'", "''")));
    }
    if let Some(ref e) = params.end_date {
        sql.push_str(&format!(" AND o.observation_timestamp <= '{}'", e.replace("'", "''")));
    }

    sql.push_str(" GROUP BY o.observation_timestamp, o.unit ORDER BY o.observation_timestamp ASC");
    sql.push_str(&format!(" LIMIT {}", limit));

    let rows: Vec<(String, f64, f64, f64, i64, String)> = sqlx::query_as(&sql).fetch_all(&pool).await?;

    let points: Vec<_> = rows.into_iter().map(|r| json!({
        "timestamp": r.0,
        "avg_value": r.1,
        "min_value": r.2,
        "max_value": r.3,
        "count": r.4,
        "unit": r.5
    })).collect();

    Ok(Json(json!({
        "pollutant": pollutant,
        "history": points,
        "count": points.len()
    })))
}
