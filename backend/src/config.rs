use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub host: String,
    pub port: u16,
    pub cors_origin: String,
    pub admin_api_key: String,
}

impl Config {
    pub fn from_env() -> Self {
        // Load .env file if available
        let _ = dotenvy::dotenv();

        let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| {
            // Default to local SQLite database in workspace root if postgres URL not provided
            let default_sqlite = std::path::Path::new("..").join("airwatch.db");
            if default_sqlite.exists() {
                format!("sqlite://{}", default_sqlite.to_string_lossy().replace("\\", "/"))
            } else if std::path::Path::new("airwatch.db").exists() {
                "sqlite://airwatch.db".to_string()
            } else {
                "sqlite://../airwatch.db?mode=rwc".to_string()
            }
        });

        let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
        let port = env::var("PORT")
            .ok()
            .and_then(|p| p.parse::<u16>().ok())
            .unwrap_or(3001);

        let cors_origin = env::var("CORS_ORIGIN").unwrap_or_else(|_| "*".to_string());
        let admin_api_key = env::var("ADMIN_API_KEY")
            .unwrap_or_else(|_| "airwatch-admin-secret-2026".to_string());

        Self {
            database_url,
            host,
            port,
            cors_origin,
            admin_api_key,
        }
    }
}
