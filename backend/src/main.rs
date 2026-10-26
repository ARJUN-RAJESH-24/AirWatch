use std::net::SocketAddr;
use tokio::signal;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use airwatch_backend::{
    config::Config,
    db::create_pool,
    routes::create_router,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "airwatch_backend=debug,tower_http=debug,axum=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env();
    tracing::info!("Starting AirWatch Backend Service v{}", env!("CARGO_PKG_VERSION"));
    tracing::info!("Environment configuration loaded. Database: [CONFIGURED]");

    // Establish database connection
    let pool = create_pool(&config.database_url).await?;

    // Create Axum application router
    let app = create_router(pool, config.clone());

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("AirWatch API listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    tracing::info!("AirWatch backend server stopped gracefully.");
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
            tracing::info!("Received Ctrl+C signal. Initiating graceful shutdown...");
        },
        _ = terminate => {
            tracing::info!("Received terminate signal. Initiating graceful shutdown...");
        },
    }
}
