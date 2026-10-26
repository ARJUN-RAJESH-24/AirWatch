-- AirWatch PostgreSQL Migration 001: Initial Schema
-- Authoritative Indian Environmental Data Analytics Platform

-- 1. Monitoring Stations
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    station_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    agency VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    source_dataset VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stations_state_city ON stations(state, city);
CREATE INDEX IF NOT EXISTS idx_stations_code ON stations(station_code);

-- 2. Pollutants Catalog
CREATE TABLE IF NOT EXISTS pollutants (
    id VARCHAR(50) PRIMARY KEY,
    canonical_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    default_unit VARCHAR(50) NOT NULL,
    description TEXT,
    cpcb_standard_24h DOUBLE PRECISION,
    cpcb_standard_annual DOUBLE PRECISION,
    standard_unit VARCHAR(50) NOT NULL
);

-- 3. Ingestion Runs (Tracking Job Health & Provenance)
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id VARCHAR(64) PRIMARY KEY,
    source_identifier VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'RUNNING', 'COMPLETED', 'FAILED'
    start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMPTZ,
    records_retrieved INTEGER NOT NULL DEFAULT 0,
    records_inserted INTEGER NOT NULL DEFAULT 0,
    records_updated INTEGER NOT NULL DEFAULT 0,
    records_rejected INTEGER NOT NULL DEFAULT 0,
    error_details TEXT,
    run_metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_start ON ingestion_runs(start_time DESC);

-- 4. Raw Data Assets (Raw Payloads & File Archive Metadata)
CREATE TABLE IF NOT EXISTS raw_data_assets (
    id VARCHAR(64) PRIMARY KEY,
    source_identifier VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    storage_location VARCHAR(1024) NOT NULL,
    content_checksum VARCHAR(64) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    retrieval_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    validation_status VARCHAR(50) NOT NULL
);

-- 5. Air Quality Observations (Granular Pollutant Measurements)
CREATE TABLE IF NOT EXISTS air_quality_observations (
    id BIGSERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    pollutant_id VARCHAR(50) NOT NULL REFERENCES pollutants(id),
    observation_timestamp TIMESTAMPTZ NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(50) NOT NULL,
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    averaging_period VARCHAR(50) NOT NULL DEFAULT '24 Hours',
    source_dataset VARCHAR(255) NOT NULL,
    record_fingerprint VARCHAR(64) UNIQUE NOT NULL,
    data_quality_status VARCHAR(50) NOT NULL DEFAULT 'VALID',
    ingestion_run_id VARCHAR(64) REFERENCES ingestion_runs(id) ON DELETE SET NULL,
    raw_asset_id VARCHAR(64) REFERENCES raw_data_assets(id) ON DELETE SET NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_obs_station_pollutant_time ON air_quality_observations(station_id, pollutant_id, observation_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_obs_pollutant_time ON air_quality_observations(pollutant_id, observation_timestamp);
CREATE INDEX IF NOT EXISTS idx_obs_time ON air_quality_observations(observation_timestamp);
CREATE INDEX IF NOT EXISTS idx_obs_fingerprint ON air_quality_observations(record_fingerprint);

-- 6. Reported AQI Observations (Reported Index Values)
CREATE TABLE IF NOT EXISTS aqi_observations (
    id BIGSERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    observation_timestamp TIMESTAMPTZ NOT NULL,
    aqi_value INTEGER NOT NULL,
    aqi_category VARCHAR(50) NOT NULL, -- 'Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe'
    prominent_pollutant VARCHAR(50),
    source_dataset VARCHAR(255) NOT NULL,
    record_fingerprint VARCHAR(64) UNIQUE NOT NULL,
    ingestion_run_id VARCHAR(64) REFERENCES ingestion_runs(id) ON DELETE SET NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aqi_station_time ON aqi_observations(station_id, observation_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_aqi_category ON aqi_observations(aqi_category);

-- 7. Environmental Standards Catalog (CPCB NAAQS & WHO Guidelines)
CREATE TABLE IF NOT EXISTS environmental_standards (
    id VARCHAR(100) PRIMARY KEY,
    pollutant_id VARCHAR(50) NOT NULL REFERENCES pollutants(id),
    standard_name VARCHAR(255) NOT NULL,
    averaging_period VARCHAR(50) NOT NULL,
    threshold_value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(50) NOT NULL,
    area_category VARCHAR(100) NOT NULL,
    source_authority VARCHAR(255) NOT NULL,
    effective_date DATE NOT NULL,
    citation TEXT NOT NULL
);

-- Seed Reference Pollutants
INSERT INTO pollutants (id, canonical_name, display_name, default_unit, description, cpcb_standard_24h, cpcb_standard_annual, standard_unit) VALUES
('PM2.5', 'Particulate Matter 2.5', 'PM2.5 (Fine Particulates)', 'µg/m³', 'Particulate matter with an aerodynamic diameter <= 2.5 micrometers.', 60.0, 40.0, 'µg/m³'),
('PM10', 'Particulate Matter 10', 'PM10 (Respirable Particulates)', 'µg/m³', 'Particulate matter with an aerodynamic diameter <= 10 micrometers.', 100.0, 60.0, 'µg/m³'),
('NO2', 'Nitrogen Dioxide', 'NO2', 'µg/m³', 'Nitrogen dioxide from combustion emissions and vehicular exhaust.', 80.0, 40.0, 'µg/m³'),
('SO2', 'Sulfur Dioxide', 'SO2', 'µg/m³', 'Sulfur dioxide primarily emitted from coal combustion and industrial refineries.', 80.0, 50.0, 'µg/m³'),
('CO', 'Carbon Monoxide', 'CO', 'mg/m³', 'Toxic odorless gas resulting from incomplete combustion of carbon-based fuels.', 4.0, 2.0, 'mg/m³'),
('O3', 'Ozone', 'O3 (Ozone)', 'µg/m³', 'Ground-level photochemical oxidant formed by VOCs and NOx in sunlight.', 180.0, 100.0, 'µg/m³'),
('NH3', 'Ammonia', 'NH3', 'µg/m³', 'Ammonia gas originating from fertilizer manufacturing, agriculture, and livestock waste.', 400.0, 100.0, 'µg/m³')
ON CONFLICT (id) DO NOTHING;

-- Seed Official CPCB NAAQS 2009 Standards
INSERT INTO environmental_standards (id, pollutant_id, standard_name, averaging_period, threshold_value, unit, area_category, source_authority, effective_date, citation) VALUES
('NAAQS-PM25-24H', 'PM2.5', 'CPCB NAAQS 2009', '24 Hours', 60.0, 'µg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India'),
('NAAQS-PM25-ANNUAL', 'PM2.5', 'CPCB NAAQS 2009', 'Annual', 40.0, 'µg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India'),
('NAAQS-PM10-24H', 'PM10', 'CPCB NAAQS 2009', '24 Hours', 100.0, 'µg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India'),
('NAAQS-PM10-ANNUAL', 'PM10', 'CPCB NAAQS 2009', 'Annual', 60.0, 'µg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India'),
('NAAQS-NO2-24H', 'NO2', 'CPCB NAAQS 2009', '24 Hours', 80.0, 'µg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India'),
('NAAQS-NO2-ANNUAL', 'NO2', 'CPCB NAAQS 2009', 'Annual', 40.0, 'µg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India'),
('NAAQS-SO2-24H', 'SO2', 'CPCB NAAQS 2009', '24 Hours', 80.0, 'µg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India'),
('NAAQS-SO2-ANNUAL', 'SO2', 'CPCB NAAQS 2009', 'Annual', 50.0, 'µg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India'),
('NAAQS-CO-8H', 'CO', 'CPCB NAAQS 2009', '8 Hours', 2.0, 'mg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India'),
('NAAQS-CO-1H', 'CO', 'CPCB NAAQS 2009', '1 Hour', 4.0, 'mg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India'),
('NAAQS-O3-8H', 'O3', 'CPCB NAAQS 2009', '8 Hours', 100.0, 'µg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India'),
('NAAQS-O3-1H', 'O3', 'CPCB NAAQS 2009', '1 Hour', 180.0, 'µg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India'),
('NAAQS-NH3-24H', 'NH3', 'CPCB NAAQS 2009', '24 Hours', 400.0, 'µg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India'),
('NAAQS-NH3-ANNUAL', 'NH3', 'CPCB NAAQS 2009', 'Annual', 100.0, 'µg/m³', 'Industrial, Residential, Rural and other Areas', 'Central Pollution Control Board', '2009-11-18', 'Notification No. B-29016/20/90/PCI-L, Gazette of India')
ON CONFLICT (id) DO NOTHING;
