# AirWatch REST API Specification

The AirWatch REST API provides programmatic access to validated Indian air quality observations, monitoring station directories, statistical aggregations, and regulatory standards evaluation.

**Base URL**: `http://localhost:3001` (or your cloud deployment URL)  
**Protocol**: HTTP/1.1 or HTTP/2  
**Data Format**: JSON (`application/json`) / CSV (`text/csv`)

---

## 1. System Health & Metadata

### `GET /health`
Liveness health check for load balancers and container orchestrators.
- **Status**: `200 OK`
- **Response**:
  ```json
  {
    "status": "healthy",
    "service": "airwatch-backend",
    "version": "0.1.0",
    "timestamp": "2026-10-25T20:26:33.694318Z"
  }
  ```

### `GET /ready`
Readiness health check verifying database pool connectivity.
- **Status**: `200 OK`
- **Response**:
  ```json
  {
    "status": "ready",
    "database": "connected",
    "timestamp": "2026-10-25T20:26:33.700120Z"
  }
  ```

### `GET /api/v1/metadata`
Returns platform credentials, authoritative data provider citations, and regulatory reference standard information.

### `GET /api/v1/data-status`
Returns database telemetry metrics including total stations, active stations, total observations, date range, and last ingestion job status.

---

## 2. Monitoring Stations

### `GET /api/v1/stations`
List monitoring stations with optional geographic and operational filters.
- **Query Parameters**:
  - `state` (optional): Filter by State/UT name (e.g. `Kerala`)
  - `city` (optional): Filter by City (e.g. `Thiruvananthapuram`, `Kochi`)
  - `status` (optional): `Active` or `Inactive`
  - `limit` (optional, default `100`, max `500`): Results page size
  - `offset` (optional, default `0`): Pagination offset
- **Response**:
  ```json
  {
    "stations": [
      {
        "id": 8,
        "station_code": "KL008",
        "name": "Plammoodu, Thiruvananthapuram - KSPCB",
        "city": "Thiruvananthapuram",
        "state": "Kerala",
        "latitude": 8.5152,
        "longitude": 76.9469,
        "agency": "KSPCB",
        "status": "Active",
        "source_dataset": "CPCB-CAAQMS-HISTORICAL",
        "latest_aqi": 58,
        "latest_aqi_category": "Satisfactory",
        "latest_observation_date": "2020-05-01T00:00:00Z"
      }
    ],
    "count": 1,
    "limit": 100,
    "offset": 0
  }
  ```

### `GET /api/v1/stations/{id}`
Retrieve station metadata and latest observation status by internal integer ID or official station code (e.g., `KL008`).

### `GET /api/v1/stations/{id}/observations`
Retrieve historical pollutant observations recorded by a specific monitoring station.

---

## 3. Air Quality Observations

### `GET /api/v1/observations`
Query filtered air quality observations.
- **Query Parameters**:
  - `station_code` (optional): e.g. `KL008`
  - `pollutant` (optional): e.g. `PM2.5`, `PM10`, `NO2`, `SO2`, `CO`, `O3`
  - `state` (optional): e.g. `Kerala`
  - `city` (optional): e.g. `Kochi`
  - `start_date` (optional): ISO-8601 Date (`YYYY-MM-DD`)
  - `end_date` (optional): ISO-8601 Date (`YYYY-MM-DD`)
  - `limit` (optional, default `50`, max `500`)
  - `offset` (optional, default `0`)

### `GET /api/v1/observations/latest`
Retrieve the most recent observation for each active monitoring station.

---

## 4. Environmental Analytics

### `GET /api/v1/analytics/trends`
Calculates aggregated time series (mean, min, max, count) grouped by daily, monthly, or yearly intervals.
- **Query Parameters**:
  - `pollutant` (required): e.g. `PM2.5`
  - `interval` (optional, default `daily`): `daily`, `monthly`, or `yearly`
  - `station_code` (optional): e.g. `KL008`
  - `state` (optional): e.g. `Kerala`
  - `start_date` (optional): e.g. `2019-01-01`
  - `end_date` (optional): e.g. `2020-07-01`

### `GET /api/v1/analytics/station-comparison`
Side-by-side statistical comparison across multiple station codes.
- **Query Parameters**:
  - `stations` (required): Comma-separated station codes (e.g. `KL008,KL004,KL006`)
  - `pollutant` (required): e.g. `PM2.5`
  - `start_date` (optional): e.g. `2019-01-01`
  - `end_date` (optional): e.g. `2020-07-01`
- **Response**:
  ```json
  {
    "pollutant": "PM2.5",
    "unit": "µg/m³",
    "comparison": [
      {
        "station_code": "KL008",
        "station_name": "Plammoodu, Thiruvananthapuram - KSPCB",
        "city": "Thiruvananthapuram",
        "state": "Kerala",
        "avg_value": 31.42,
        "min_value": 4.12,
        "max_value": 112.50,
        "observation_count": 214,
        "completeness_pct": 89.2
      }
    ]
  }
  ```

### `GET /api/v1/analytics/exceedances`
Calculates the count and percentage of observations exceeding the official CPCB National Ambient Air Quality Standards (NAAQS) 2009 thresholds.
- **Query Parameters**:
  - `pollutant` (optional): e.g. `PM2.5`
  - `state` (optional): e.g. `Kerala`
  - `station_code` (optional): e.g. `KL008`
  - `start_date` (optional): e.g. `2019-01-01`
  - `end_date` (optional): e.g. `2020-07-01`

### `GET /api/v1/analytics/data-completeness`
Calculates the proportion of received observations against expected sampling frequency for a given station and time window.

### `GET /api/v1/analytics/pollutant-summary`
Returns comprehensive descriptive statistics (count, min, max, mean, standard deviation) for all cataloged pollutants.

---

## 5. Data Export

### `GET /api/v1/export/observations.csv`
Exports filtered observations directly as a standards-compliant CSV file with Content-Disposition headers.
- **Query Parameters**: Same filters as `GET /api/v1/observations` (capped at 5,000 records to prevent memory exhaustion).

---

## 6. Administrative Ingestion Management

### `GET /api/v1/admin/ingestion-runs`
Audit history of past data ingestion executions, records imported, and error summaries.

### `POST /api/v1/admin/ingestion-runs`
Protected endpoint to initiate an on-demand data ingestion job.
- **Headers**:
  - `X-Admin-Key`: Required administrative API key (matches `ADMIN_API_KEY`).
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "scope": "kerala",
    "max_records": 10000
  }
  ```
- **Error Codes**:
  - `401 Unauthorized`: When `X-Admin-Key` header is missing or incorrect.
