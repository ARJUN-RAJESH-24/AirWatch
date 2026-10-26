use airwatch_backend::{
    config::Config,
    db::create_pool,
    routes::create_router,
};
use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use http_body_util::BodyExt;
use serde_json::Value;
use tower::ServiceExt;

async fn setup_test_app() -> axum::Router {
    let mut config = Config::from_env();
    // Use the workspace database
    if std::path::Path::new("../airwatch.db").exists() {
        config.database_url = "sqlite://../airwatch.db".to_string();
    } else if std::path::Path::new("airwatch.db").exists() {
        config.database_url = "sqlite://airwatch.db".to_string();
    }
    let pool = create_pool(&config.database_url)
        .await
        .expect("Failed to connect to test database");
    create_router(pool, config)
}

#[tokio::test]
async fn test_health_check() {
    let app = setup_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["status"], "healthy");
    assert_eq!(json["service"], "airwatch-backend");
}

#[tokio::test]
async fn test_readiness_check() {
    let app = setup_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/ready")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["status"], "ready");
    assert_eq!(json["database"], "connected");
}

#[tokio::test]
async fn test_system_metadata() {
    let app = setup_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/metadata")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["name"], "AirWatch");
    assert!(json["standards"]["name"]
        .as_str()
        .unwrap()
        .contains("National Ambient Air Quality Standards"));
    assert!(json["authoritative_sources"].is_array());
}

#[tokio::test]
async fn test_data_status_metrics() {
    let app = setup_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/data-status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: Value = serde_json::from_slice(&body).unwrap();
    assert!(json["total_stations"].as_i64().unwrap() > 0);
    assert!(json["total_observations"].as_i64().unwrap() > 0);
    assert!(json["pollutants"].is_array());
}

#[tokio::test]
async fn test_stations_list_and_kerala_filter() {
    let app = setup_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/stations?state=Kerala")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    let status = response.status();
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8_lossy(&body);
    println!("Response status: {}, body: {}", status, body_str);
    assert_eq!(status, StatusCode::OK);

    let json: Value = serde_json::from_slice(&body).unwrap();
    let stations = json["stations"].as_array().unwrap();
    assert!(!stations.is_empty(), "Should return Kerala monitoring stations");

    for stn in stations {
        assert_eq!(stn["state"].as_str().unwrap(), "Kerala");
    }
}

#[tokio::test]
async fn test_single_station_lookup() {
    let app = setup_test_app().await;

    // Test existing Kerala station KL008 (Plammoodu, Thiruvananthapuram)
    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/stations/KL008")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["station"]["station_code"], "KL008");
    assert_eq!(json["station"]["state"], "Kerala");
}

#[tokio::test]
async fn test_nonexistent_station_returns_404() {
    let app = setup_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/stations/NONEXISTENT_STATION_CODE_9999")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_observations_pagination() {
    let app = setup_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/observations?limit=10&offset=0")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: Value = serde_json::from_slice(&body).unwrap();
    let obs = json["observations"].as_array().unwrap();
    assert!(obs.len() <= 10);
    assert_eq!(json["limit"].as_i64().unwrap(), 10);
}

#[tokio::test]
async fn test_pollutant_summary_analytics() {
    let app = setup_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/analytics/pollutant-summary")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: Value = serde_json::from_slice(&body).unwrap();
    let summaries = json["pollutants"].as_array().unwrap();
    assert!(!summaries.is_empty());
}

#[tokio::test]
async fn test_exceedance_analytics() {
    let app = setup_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/analytics/exceedances?state=Kerala")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: Value = serde_json::from_slice(&body).unwrap();
    assert!(json["reports"].is_array());
    assert!(json["standard_reference"].is_string());
}

#[tokio::test]
async fn test_admin_trigger_unauthorized() {
    let app = setup_test_app().await;

    // Trigger without X-Admin-Key should be rejected with 401 Unauthorized
    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/admin/ingestion-runs")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"scope": "kerala"}"#))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}
