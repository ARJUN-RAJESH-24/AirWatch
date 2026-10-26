use sqlx::{any::AnyPoolOptions, AnyPool};
use std::time::Duration;
use crate::error::AppError;

pub type DbPool = AnyPool;

pub async fn create_pool(database_url: &str) -> Result<DbPool, AppError> {
    sqlx::any::install_default_drivers();

    tracing::info!("Connecting to database: {}", sanitize_db_url(database_url));

    let pool = AnyPoolOptions::new()
        .max_connections(30)
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(60))
        .connect(database_url)
        .await
        .map_err(|e| {
            tracing::error!("Failed to connect to database at {}: {:?}", sanitize_db_url(database_url), e);
            AppError::DatabaseError(format!("Connection error: {}", e))
        })?;

    tracing::info!("Database connection pool established successfully.");
    Ok(pool)
}

fn sanitize_db_url(url: &str) -> String {
    if let Some(at_idx) = url.find('@') {
        if let Some(proto_end) = url.find("://") {
            return format!("{}://****{}", &url[..proto_end], &url[at_idx..]);
        }
    }
    url.to_string()
}
