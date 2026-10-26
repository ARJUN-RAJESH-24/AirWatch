use axum::{
    extract::{Path, Query, State},
    response::IntoResponse,
    Json,
};
use serde_json::json;
use crate::{
    db::DbPool,
    error::AppError,
    models::{StationQuery, StationWithAqi},
};

pub async fn get_stations(
    State(pool): State<DbPool>,
    Query(query): Query<StationQuery>,
) -> Result<impl IntoResponse, AppError> {
    let limit = query.limit.unwrap_or(100).min(500);
    let offset = query.offset.unwrap_or(0);

    let mut sql = String::from(
        r#"
        SELECT 
            s.id, s.station_code, s.name, s.city, s.state, s.latitude, s.longitude,
            s.agency, s.status, s.source_dataset,
            COALESCE((SELECT aqi_value FROM aqi_observations a WHERE a.station_id = s.id ORDER BY a.observation_timestamp DESC LIMIT 1), -1) as latest_aqi,
            COALESCE((SELECT aqi_category FROM aqi_observations a WHERE a.station_id = s.id ORDER BY a.observation_timestamp DESC LIMIT 1), '') as latest_aqi_category,
            COALESCE((SELECT observation_timestamp FROM air_quality_observations o WHERE o.station_id = s.id ORDER BY o.observation_timestamp DESC LIMIT 1), '') as latest_observation_date
        FROM stations s
        WHERE 1=1
        "#
    );

    let mut conditions = Vec::new();
    if let Some(ref st) = query.state {
        conditions.push(format!("s.state = '{}'", st.replace("'", "''")));
    }
    if let Some(ref ct) = query.city {
        conditions.push(format!("s.city = '{}'", ct.replace("'", "''")));
    }
    if let Some(ref stat) = query.status {
        conditions.push(format!("s.status = '{}'", stat.replace("'", "''")));
    }

    for c in conditions {
        sql.push_str(" AND ");
        sql.push_str(&c);
    }

    sql.push_str(&format!(" ORDER BY s.state, s.city, s.name LIMIT {} OFFSET {}", limit, offset));

    let rows: Vec<(
        i64, String, String, String, String, Option<f64>, Option<f64>,
        Option<String>, Option<String>, String, i64, String, String
    )> = sqlx::query_as(&sql).fetch_all(&pool).await?;

    let stations: Vec<StationWithAqi> = rows.into_iter().map(|r| StationWithAqi {
        id: r.0,
        station_code: r.1,
        name: r.2,
        city: r.3,
        state: r.4,
        latitude: r.5,
        longitude: r.6,
        agency: r.7,
        status: r.8,
        source_dataset: r.9,
        latest_aqi: if r.10 >= 0 { Some(r.10) } else { None },
        latest_aqi_category: if r.11.is_empty() { None } else { Some(r.11) },
        latest_observation_date: if r.12.is_empty() { None } else { Some(r.12) },
    }).collect();

    Ok(Json(json!({
        "stations": stations,
        "count": stations.len(),
        "limit": limit,
        "offset": offset
    })))
}

pub async fn get_station_by_id(
    State(pool): State<DbPool>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    // Check if path is integer ID or station_code
    let query_str = if let Ok(num_id) = id.parse::<i64>() {
        format!("SELECT id, station_code, name, city, state, latitude, longitude, agency, status, source_dataset, created_at, updated_at FROM stations WHERE id = {}", num_id)
    } else {
        format!("SELECT id, station_code, name, city, state, latitude, longitude, agency, status, source_dataset, created_at, updated_at FROM stations WHERE station_code = '{}'", id.replace("'", "''"))
    };

    let row: Option<(
        i64, String, String, String, String, Option<f64>, Option<f64>,
        Option<String>, Option<String>, String, String, String
    )> = sqlx::query_as(&query_str).fetch_optional(&pool).await?;

    match row {
        Some(r) => {
            let station_id = r.0;
            // Fetch available pollutants for this station
            let pollutants: Vec<(String,)> = sqlx::query_as(
                &format!("SELECT DISTINCT pollutant_id FROM air_quality_observations WHERE station_id = {} ORDER BY pollutant_id", station_id)
            )
            .fetch_all(&pool)
            .await?;

            // Fetch latest AQI
            let latest_aqi: Option<(i64, String, String)> = sqlx::query_as(
                &format!("SELECT aqi_value, aqi_category, observation_timestamp FROM aqi_observations WHERE station_id = {} ORDER BY observation_timestamp DESC LIMIT 1", station_id)
            )
            .fetch_optional(&pool)
            .await?;

            Ok(Json(json!({
                "station": {
                    "id": r.0,
                    "station_code": r.1,
                    "name": r.2,
                    "city": r.3,
                    "state": r.4,
                    "latitude": r.5,
                    "longitude": r.6,
                    "agency": r.7,
                    "status": r.8,
                    "source_dataset": r.9,
                    "created_at": r.10,
                    "updated_at": r.11,
                    "available_pollutants": pollutants.into_iter().map(|p| p.0).collect::<Vec<_>>(),
                    "latest_aqi": latest_aqi.map(|a| json!({
                        "value": a.0,
                        "category": a.1,
                        "timestamp": a.2
                    }))
                }
            })))
        }
        None => Err(AppError::NotFound(format!("Station '{}' not found", id))),
    }
}

pub async fn get_station_observations(
    State(pool): State<DbPool>,
    Path(id): Path<String>,
    Query(params): Query<crate::models::ObservationQuery>,
) -> Result<impl IntoResponse, AppError> {
    let limit = params.limit.unwrap_or(100).min(1000);
    let offset = params.offset.unwrap_or(0);

    // Resolve station ID
    let station_id: i64 = if let Ok(num_id) = id.parse::<i64>() {
        num_id
    } else {
        let res: Option<(i64,)> = sqlx::query_as(
            &format!("SELECT id FROM stations WHERE station_code = '{}'", id.replace("'", "''"))
        )
        .fetch_optional(&pool)
        .await?;
        match res {
            Some(r) => r.0,
            None => return Err(AppError::NotFound(format!("Station '{}' not found", id))),
        }
    };

    let mut sql = format!(
        "SELECT id, station_id, pollutant_id, observation_timestamp, value, unit, averaging_period, data_quality_status, source_dataset
         FROM air_quality_observations WHERE station_id = {}",
        station_id
    );

    if let Some(ref p) = params.pollutant {
        sql.push_str(&format!(" AND pollutant_id = '{}'", p.replace("'", "''")));
    }
    if let Some(ref s) = params.start_date {
        sql.push_str(&format!(" AND observation_timestamp >= '{}'", s.replace("'", "''")));
    }
    if let Some(ref e) = params.end_date {
        sql.push_str(&format!(" AND observation_timestamp <= '{}'", e.replace("'", "''")));
    }

    sql.push_str(&format!(" ORDER BY observation_timestamp DESC LIMIT {} OFFSET {}", limit, offset));

    let rows: Vec<(i64, i64, String, String, f64, String, String, String, String)> =
        sqlx::query_as(&sql).fetch_all(&pool).await?;

    let observations: Vec<_> = rows.into_iter().map(|r| json!({
        "id": r.0,
        "station_id": r.1,
        "pollutant_id": r.2,
        "observation_timestamp": r.3,
        "value": r.4,
        "unit": r.5,
        "averaging_period": r.6,
        "data_quality_status": r.7,
        "source_dataset": r.8
    })).collect();

    Ok(Json(json!({
        "station_id": station_id,
        "observations": observations,
        "count": observations.len(),
        "limit": limit,
        "offset": offset
    })))
}
