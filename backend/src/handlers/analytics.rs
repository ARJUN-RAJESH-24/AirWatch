use axum::{
    extract::{Query, State},
    response::IntoResponse,
    Json,
};
use serde_json::json;
use crate::{
    db::DbPool,
    error::AppError,
    models::{
        ComparisonQuery, ExceedanceQuery, ExceedanceReport, PollutantSummary, RegionalSummary,
        StationComparisonItem, TrendPoint, TrendQuery,
    },
};

pub async fn get_trends(
    State(pool): State<DbPool>,
    Query(params): Query<TrendQuery>,
) -> Result<impl IntoResponse, AppError> {
    let pollutant = &params.pollutant;
    let interval = params.interval.as_deref().unwrap_or("daily");

    // Substring date grouping: daily (YYYY-MM-DD), monthly (YYYY-MM), yearly (YYYY)
    let period_expr = match interval {
        "monthly" => "substr(o.observation_timestamp, 1, 7)",
        "yearly" => "substr(o.observation_timestamp, 1, 4)",
        _ => "substr(o.observation_timestamp, 1, 10)",
    };

    let mut sql = format!(
        r#"
        SELECT 
            {} as period,
            round(avg(o.value), 2) as avg_val,
            round(min(o.value), 2) as min_val,
            round(max(o.value), 2) as max_val,
            count(*) as count,
            o.unit
        FROM air_quality_observations o
        JOIN stations s ON s.id = o.station_id
        WHERE o.pollutant_id = '{}'
        "#,
        period_expr,
        pollutant.replace("'", "''")
    );

    if let Some(ref code) = params.station_code {
        sql.push_str(&format!(" AND s.station_code = '{}'", code.replace("'", "''")));
    }
    if let Some(ref ct) = params.city {
        sql.push_str(&format!(" AND s.city = '{}'", ct.replace("'", "''")));
    }
    if let Some(ref st) = params.state {
        sql.push_str(&format!(" AND s.state = '{}'", st.replace("'", "''")));
    }
    if let Some(ref s) = params.start_date {
        sql.push_str(&format!(" AND o.observation_timestamp >= '{}'", s.replace("'", "''")));
    }
    if let Some(ref e) = params.end_date {
        sql.push_str(&format!(" AND o.observation_timestamp <= '{}'", e.replace("'", "''")));
    }

    sql.push_str(&format!(" GROUP BY {}, o.unit ORDER BY period ASC LIMIT 1000", period_expr));

    let rows: Vec<(String, f64, f64, f64, i64, String)> = sqlx::query_as(&sql).fetch_all(&pool).await?;

    let points: Vec<TrendPoint> = rows
        .into_iter()
        .map(|r| TrendPoint {
            period: r.0,
            avg_value: r.1,
            min_value: r.2,
            max_value: r.3,
            count: r.4,
            unit: r.5,
        })
        .collect();

    Ok(Json(json!({
        "pollutant": pollutant,
        "interval": interval,
        "trends": points,
        "count": points.len()
    })))
}

pub async fn get_station_comparison(
    State(pool): State<DbPool>,
    Query(params): Query<ComparisonQuery>,
) -> Result<impl IntoResponse, AppError> {
    let pollutant = &params.pollutant;
    let codes: Vec<String> = params
        .station_codes
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    if codes.is_empty() {
        return Err(AppError::BadRequest("At least one station code must be specified in station_codes".into()));
    }

    let quoted_codes: Vec<String> = codes.iter().map(|c| format!("'{}'", c.replace("'", "''"))).collect();
    let codes_list = quoted_codes.join(",");

    let mut sql = format!(
        r#"
        SELECT 
            s.station_code, s.name, s.city, s.state, o.pollutant_id, o.unit,
            round(avg(o.value), 2) as avg_val,
            round(min(o.value), 2) as min_val,
            round(max(o.value), 2) as max_val,
            count(*) as valid_observations
        FROM air_quality_observations o
        JOIN stations s ON s.id = o.station_id
        WHERE o.pollutant_id = '{}' AND s.station_code IN ({})
        "#,
        pollutant.replace("'", "''"),
        codes_list
    );

    if let Some(ref s) = params.start_date {
        sql.push_str(&format!(" AND o.observation_timestamp >= '{}'", s.replace("'", "''")));
    }
    if let Some(ref e) = params.end_date {
        sql.push_str(&format!(" AND o.observation_timestamp <= '{}'", e.replace("'", "''")));
    }

    sql.push_str(" GROUP BY s.station_code, s.name, s.city, s.state, o.pollutant_id, o.unit ORDER BY avg_val DESC");

    let rows: Vec<(String, String, String, String, String, String, f64, f64, f64, i64)> =
        sqlx::query_as(&sql).fetch_all(&pool).await?;

    let comparison: Vec<StationComparisonItem> = rows
        .into_iter()
        .map(|r| {
            let valid = r.9;
            // Baseline 365 days / period completeness approximation
            let expected = 365.max(valid);
            let pct = (valid as f64 / expected as f64 * 100.0).min(100.0);
            StationComparisonItem {
                station_code: r.0,
                station_name: r.1,
                city: r.2,
                state: r.3,
                pollutant_id: r.4,
                unit: r.5,
                avg_value: r.6,
                min_value: r.7,
                max_value: r.8,
                valid_observations: valid,
                expected_observations: expected,
                completeness_pct: (pct * 100.0).round() / 100.0,
            }
        })
        .collect();

    Ok(Json(json!({
        "pollutant": pollutant,
        "stations_compared": comparison.len(),
        "comparison": comparison
    })))
}

pub async fn get_pollutant_summary(State(pool): State<DbPool>) -> Result<impl IntoResponse, AppError> {
    let sql = r#"
        SELECT 
            p.id, p.canonical_name, p.display_name, p.default_unit,
            count(o.id) as total_observations,
            coalesce(round(avg(o.value), 2), 0.0) as mean_val,
            coalesce(round(min(o.value), 2), 0.0) as min_val,
            coalesce(round(max(o.value), 2), 0.0) as max_val,
            count(DISTINCT o.station_id) as active_stations,
            coalesce(p.cpcb_standard_24h, -1.0) as cpcb_standard_24h
        FROM pollutants p
        LEFT JOIN air_quality_observations o ON o.pollutant_id = p.id
        GROUP BY p.id, p.canonical_name, p.display_name, p.default_unit, p.cpcb_standard_24h
        ORDER BY total_observations DESC
    "#;

    let rows: Vec<(String, String, String, String, i64, f64, f64, f64, i64, f64)> =
        sqlx::query_as(sql).fetch_all(&pool).await?;

    let summaries: Vec<PollutantSummary> = rows
        .into_iter()
        .map(|r| PollutantSummary {
            pollutant_id: r.0,
            canonical_name: r.1,
            display_name: r.2,
            unit: r.3,
            total_observations: r.4,
            mean: r.5,
            min: r.6,
            max: r.7,
            active_stations: r.8,
            cpcb_standard_24h: if r.9 < 0.0 { None } else { Some(r.9) },
        })
        .collect();

    Ok(Json(json!({
        "pollutants": summaries,
        "count": summaries.len()
    })))
}

pub async fn get_exceedances(
    State(pool): State<DbPool>,
    Query(params): Query<ExceedanceQuery>,
) -> Result<impl IntoResponse, AppError> {
    // Join with CPCB NAAQS 24-hr standards
    let mut sql = String::from(
        r#"
        SELECT 
            st.pollutant_id, st.id as standard_id, st.standard_name, st.averaging_period,
            st.threshold_value, st.unit,
            count(o.id) as total_observations,
            coalesce(sum(CASE WHEN o.value > st.threshold_value THEN 1 ELSE 0 END), 0) as exceedance_count,
            coalesce(round(max(o.value), 2), 0.0) as highest_val
        FROM environmental_standards st
        JOIN air_quality_observations o ON o.pollutant_id = st.pollutant_id
        JOIN stations s ON s.id = o.station_id
        WHERE st.averaging_period = '24 Hours'
        "#
    );

    if let Some(ref p) = params.pollutant {
        sql.push_str(&format!(" AND st.pollutant_id = '{}'", p.replace("'", "''")));
    }
    if let Some(ref code) = params.station_code {
        sql.push_str(&format!(" AND s.station_code = '{}'", code.replace("'", "''")));
    }
    if let Some(ref st) = params.state {
        sql.push_str(&format!(" AND s.state = '{}'", st.replace("'", "''")));
    }
    if let Some(ref s) = params.start_date {
        sql.push_str(&format!(" AND o.observation_timestamp >= '{}'", s.replace("'", "''")));
    }
    if let Some(ref e) = params.end_date {
        sql.push_str(&format!(" AND o.observation_timestamp <= '{}'", e.replace("'", "''")));
    }

    sql.push_str(" GROUP BY st.pollutant_id, st.id, st.standard_name, st.averaging_period, st.threshold_value, st.unit");
    sql.push_str(" ORDER BY st.pollutant_id");

    let rows: Vec<(String, String, String, String, f64, String, i64, i64, f64)> =
        sqlx::query_as(&sql).fetch_all(&pool).await?;

    let reports: Vec<ExceedanceReport> = rows
        .into_iter()
        .map(|r| {
            let total = r.6;
            let exceed = r.7;
            let pct = if total > 0 {
                (exceed as f64 / total as f64 * 100.0 * 100.0).round() / 100.0
            } else {
                0.0
            };
            ExceedanceReport {
                pollutant_id: r.0,
                standard_id: r.1,
                standard_name: r.2,
                averaging_period: r.3,
                threshold_value: r.4,
                unit: r.5,
                total_observations: total,
                exceedance_count: exceed,
                exceedance_percentage: pct,
                highest_recorded_value: r.8,
                compliance_note: "Descriptive exceedance analysis against CPCB NAAQS 2009 24-hr threshold. Not a formal legal violation determination.".to_string(),
            }
        })
        .collect();

    let count = reports.len();
    Ok(Json(json!({
        "exceedance_analysis": reports,
        "reports": reports,
        "standards_source": "Central Pollution Control Board (CPCB), Gazette of India Notification 2009",
        "standard_reference": "CPCB National Ambient Air Quality Standards 2009",
        "count": count
    })))
}

pub async fn get_data_completeness(
    State(pool): State<DbPool>,
    Query(params): Query<crate::models::ObservationQuery>,
) -> Result<impl IntoResponse, AppError> {
    let station_code = params.station_code.as_deref().unwrap_or("KL008");
    let pollutant = params.pollutant.as_deref().unwrap_or("PM2.5");

    let sql = format!(
        r#"
        SELECT 
            s.station_code, s.name, o.pollutant_id,
            COALESCE(min(o.observation_timestamp), '') as first_obs,
            COALESCE(max(o.observation_timestamp), '') as last_obs,
            count(DISTINCT substr(o.observation_timestamp, 1, 10)) as actual_days
        FROM air_quality_observations o
        JOIN stations s ON s.id = o.station_id
        WHERE s.station_code = '{}' AND o.pollutant_id = '{}'
        GROUP BY s.station_code, s.name, o.pollutant_id
        "#,
        station_code.replace("'", "''"),
        pollutant.replace("'", "''")
    );

    let row: Option<(String, String, String, String, String, i64)> =
        sqlx::query_as(&sql).fetch_optional(&pool).await?;

    match row {
        Some((code, name, pol, first, last, actual)) if !first.is_empty() && !last.is_empty() => {
            // Calculate days between first and last observation
            let days_between = match (
                chrono::NaiveDate::parse_from_str(&first[..10], "%Y-%m-%d"),
                chrono::NaiveDate::parse_from_str(&last[..10], "%Y-%m-%d"),
            ) {
                (Ok(d1), Ok(d2)) => (d2 - d1).num_days() + 1,
                _ => actual.max(1),
            };

            let expected = days_between.max(actual);
            let pct = (actual as f64 / expected as f64 * 100.0 * 100.0).round() / 100.0;
            let missing = (expected - actual).max(0);

            Ok(Json(json!({
                "station_code": code,
                "station_name": name,
                "pollutant_id": pol,
                "time_window_start": first,
                "time_window_end": last,
                "days_in_window": days_between,
                "expected_observations": expected,
                "actual_observations": actual,
                "missing_observations": missing,
                "completeness_percentage": pct,
                "data_quality_status": if pct >= 80.0 { "HIGH" } else if pct >= 50.0 { "MODERATE" } else { "LOW" }
            })))
        }
        _ => Err(AppError::NotFound(format!("No observations found for station {} and pollutant {}", station_code, pollutant))),
    }
}

pub async fn get_regional_summary(State(pool): State<DbPool>) -> Result<impl IntoResponse, AppError> {
    let sql = r#"
        SELECT 
            s.state,
            count(DISTINCT s.id) as station_count,
            count(o.id) as total_observations,
            COALESCE(round(avg(CASE WHEN o.pollutant_id = 'PM2.5' THEN o.value END), 2), -1.0) as avg_pm25,
            COALESCE(round(avg(CASE WHEN o.pollutant_id = 'PM10' THEN o.value END), 2), -1.0) as avg_pm10,
            COALESCE(round(avg(CASE WHEN o.pollutant_id = 'NO2' THEN o.value END), 2), -1.0) as avg_no2,
            COALESCE(max(o.observation_timestamp), '') as last_obs
        FROM stations s
        LEFT JOIN air_quality_observations o ON o.station_id = s.id
        GROUP BY s.state
        ORDER BY total_observations DESC
    "#;

    let rows: Vec<(String, i64, i64, f64, f64, f64, String)> =
        sqlx::query_as(sql).fetch_all(&pool).await?;

    let summaries: Vec<RegionalSummary> = rows
        .into_iter()
        .map(|r| RegionalSummary {
            state: r.0,
            station_count: r.1,
            total_observations: r.2,
            avg_pm25: if r.3 < 0.0 { None } else { Some(r.3) },
            avg_pm10: if r.4 < 0.0 { None } else { Some(r.4) },
            avg_no2: if r.5 < 0.0 { None } else { Some(r.5) },
            avg_aqi: None,
            last_observation_date: if r.6.is_empty() { None } else { Some(r.6) },
        })
        .collect();

    Ok(Json(json!({
        "regional_summaries": summaries,
        "count": summaries.len()
    })))
}
