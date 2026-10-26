# AirWatch Database Data Dictionary

The AirWatch schema uses a normalized relational design implemented in PostgreSQL 16 (with SQLite dual-dialect compatibility).

---

## 1. Table: `stations`
Stores metadata and coordinates for authoritative continuous ambient air quality monitoring stations.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` / `SERIAL` | `PRIMARY KEY` | Internal synthetic primary key |
| `station_code` | `VARCHAR(100)` | `NOT NULL, UNIQUE` | Official CPCB / KSPCB station identifier (e.g. `KL008`) |
| `name` | `VARCHAR(255)` | `NOT NULL` | Human-readable station location name |
| `city` | `VARCHAR(100)` | `NOT NULL` | City or municipality |
| `state` | `VARCHAR(100)` | `NOT NULL` | Indian State or Union Territory |
| `latitude` | `DOUBLE PRECISION` | `NULLABLE` | WGS84 Geographic Latitude |
| `longitude` | `DOUBLE PRECISION` | `NULLABLE` | WGS84 Geographic Longitude |
| `agency` | `VARCHAR(255)` | `NULLABLE` | Monitoring agency (e.g. `CPCB`, `KSPCB`, `DPCC`) |
| `status` | `VARCHAR(50)` | `DEFAULT 'Active'` | Operational status (`Active`, `Inactive`) |
| `source_dataset`| `VARCHAR(255)` | `NOT NULL` | Provenance source identifier |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Row creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Row last update timestamp |

**Indexes**:
- `idx_stations_state_city`: `(state, city)`
- `idx_stations_code`: `(station_code)`
- `idx_stations_state_id`: `(state, id)`

---

## 2. Table: `pollutants`
Master catalog of tracked atmospheric pollutants with official measurement unit conventions and reference thresholds.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(50)` | `PRIMARY KEY` | Unique pollutant identifier (e.g. `PM2.5`, `PM10`, `NO2`) |
| `canonical_name` | `VARCHAR(100)` | `NOT NULL` | Scientific chemical designation (e.g. `Particulate Matter < 2.5 µm`) |
| `display_name` | `VARCHAR(100)` | `NOT NULL` | Common display name (e.g. `PM2.5`) |
| `default_unit` | `VARCHAR(50)` | `NOT NULL` | Primary measurement unit (`µg/m³` or `mg/m³`) |
| `description` | `TEXT` | `NULLABLE` | Health and atmospheric impact description |
| `cpcb_standard_24h` | `DOUBLE PRECISION` | `NULLABLE` | Official CPCB NAAQS 24-hour limit |
| `cpcb_standard_annual`| `DOUBLE PRECISION` | `NULLABLE` | Official CPCB NAAQS annual limit |
| `standard_unit` | `VARCHAR(50)` | `NOT NULL` | Unit of the standard limit |

---

## 3. Table: `air_quality_observations`
Stores individual physical pollutant concentration observations with provenance and quality flags.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY` | Internal synthetic primary key |
| `station_id` | `INTEGER` | `REFERENCES stations(id)` | Foreign key to monitoring station |
| `pollutant_id`| `VARCHAR(50)` | `REFERENCES pollutants(id)`| Foreign key to pollutant catalog |
| `observation_timestamp`| `TIMESTAMPTZ` | `NOT NULL` | Observation timestamp in UTC |
| `value` | `DOUBLE PRECISION` | `NOT NULL` | Measured physical concentration |
| `unit` | `VARCHAR(50)` | `NOT NULL` | Measured concentration unit |
| `data_quality_status` | `VARCHAR(50)` | `DEFAULT 'VALID'` | Validation status (`VALID`, `ANOMALY`) |
| `source_dataset`| `VARCHAR(255)` | `NOT NULL` | Provenance source identifier |
| `record_fingerprint` | `VARCHAR(64)` | `UNIQUE, NOT NULL` | SHA-256 deterministic deduplication hash |
| `ingestion_run_id` | `VARCHAR(64)` | `REFERENCES ingestion_runs(id)` | Run ID that imported this observation |
| `ingested_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Pipeline ingestion timestamp |

**Indexes**:
- `idx_obs_station_time`: `(station_id, observation_timestamp DESC)`
- `idx_obs_pollutant_time`: `(pollutant_id, observation_timestamp)`
- `idx_obs_station_pollutant`: `(station_id, pollutant_id)`
- `idx_obs_time`: `(observation_timestamp)`
- `idx_obs_fingerprint`: `(record_fingerprint)`

---

## 4. Table: `aqi_observations`
Stores reported Air Quality Index (AQI) values and categories published by official authorities. Maintained separately from physical pollutant concentrations.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY` | Internal synthetic primary key |
| `station_id` | `INTEGER` | `REFERENCES stations(id)` | Foreign key to monitoring station |
| `observation_timestamp`| `TIMESTAMPTZ` | `NOT NULL` | Observation timestamp |
| `aqi_value` | `INTEGER` | `NOT NULL` | Computed index value (0 to 500+) |
| `aqi_category` | `VARCHAR(50)` | `NOT NULL` | CPCB Bucket (`Good`, `Satisfactory`, `Moderate`, `Poor`, `Very Poor`, `Severe`) |
| `prominent_pollutant` | `VARCHAR(50)` | `NULLABLE` | Dominant driving pollutant |
| `source_dataset`| `VARCHAR(255)` | `NOT NULL` | Provenance source identifier |
| `record_fingerprint` | `VARCHAR(64)` | `UNIQUE, NOT NULL` | SHA-256 deterministic deduplication hash |
| `ingestion_run_id` | `VARCHAR(64)` | `REFERENCES ingestion_runs(id)` | Run ID that imported this record |
| `ingested_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Ingestion timestamp |

**Indexes**:
- `idx_aqi_station_time`: `(station_id, observation_timestamp DESC)`
- `idx_aqi_category`: `(aqi_category)`

---

## 5. Table: `ingestion_runs`
Audit and operational log tracking every batch ingestion execution.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | `PRIMARY KEY` | UUIDv4 Run Identifier |
| `source_identifier`| `VARCHAR(255)` | `NOT NULL` | Source dataset or API endpoint |
| `status` | `VARCHAR(50)` | `NOT NULL` | Execution status (`RUNNING`, `COMPLETED`, `FAILED`) |
| `start_time` | `TIMESTAMPTZ` | `NOT NULL` | Job start timestamp |
| `end_time` | `TIMESTAMPTZ` | `NULLABLE` | Job completion timestamp |
| `records_retrieved` | `INTEGER` | `DEFAULT 0` | Total records read from source |
| `records_inserted` | `INTEGER` | `DEFAULT 0` | New records inserted |
| `records_updated` | `INTEGER` | `DEFAULT 0` | Existing records updated (idempotent) |
| `records_rejected` | `INTEGER` | `DEFAULT 0` | Malformed or invalid rows rejected |
| `error_details` | `TEXT` | `NULLABLE` | Exception message or stack trace |
| `run_metadata` | `TEXT` | `NULLABLE` | JSON metadata (file size, checksum, parameters) |

---

## 6. Table: `environmental_standards`
Official National Ambient Air Quality Standards (NAAQS) regulatory benchmarks.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(100)` | `PRIMARY KEY` | Standard identifier (e.g. `NAAQS-PM2.5-24H`) |
| `pollutant_id` | `VARCHAR(50)` | `REFERENCES pollutants(id)`| Regulated pollutant |
| `standard_name`| `VARCHAR(255)` | `NOT NULL` | Legal title of the standard |
| `averaging_period`| `VARCHAR(50)` | `NOT NULL` | Time interval (`24 Hours`, `Annual`, `1 Hour`, `8 Hours`) |
| `threshold_value` | `DOUBLE PRECISION`| `NOT NULL` | Numerical permissible limit |
| `unit` | `VARCHAR(50)` | `NOT NULL` | Measurement unit (`µg/m³` or `mg/m³`) |
| `area_category`| `VARCHAR(100)` | `NOT NULL` | Zone (`Industrial, Residential, Rural and other Areas`) |
| `source_authority`| `VARCHAR(255)` | `NOT NULL` | Publishing regulatory body (`Central Pollution Control Board (CPCB)`) |
| `effective_date`| `VARCHAR(50)` | `NOT NULL` | Gazette notification date (`2009-11-18`) |
| `gazette_notification`| `VARCHAR(255)`| `NOT NULL` | Official Gazette Notification reference number |
