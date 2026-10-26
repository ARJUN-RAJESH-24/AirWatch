# AirWatch Test Verification & Quality Assurance Report

This document records the automated testing strategy, execution commands, and verified results for the AirWatch platform across all architectural layers.

---

## 1. Automated Test Suites & Commands

### 1.1 Data Ingestion Engine Tests
- **Location**: `ingestion/test_ingestion.py`
- **Runner**: Python `unittest`
- **Execution Command**:
  ```bash
  python ingestion/test_ingestion.py
  ```
- **Test Scenarios Covered**:
  1. `test_deterministic_fingerprint`: Verifies identical cryptographic SHA-256 hashes for equivalent observation triplets `(station, timestamp, pollutant)`.
  2. `test_idempotent_updates`: Verifies that re-importing identical or corrected government observations updates records without creating duplicates.
  3. `test_null_preservation`: Validates that missing or empty measurements in source files remain strictly `None` / `NULL` and are never silently converted to zero.
  4. `test_sensor_anomaly_rejection`: Validates flagging of impossible concentrations (e.g. negative PM values or sensor saturation).
  5. `test_invalid_unit_quarantine`: Tests validation against canonical CPCB measurement units (`µg/m³`, `mg/m³`).
- **Execution Result**:
  ```text
  Ran 5 tests in 0.002s
  OK
  ```

---

### 1.2 Backend API & Database Integration Tests
- **Location**: `backend/tests/api_tests.rs`
- **Runner**: `cargo test` (Rust Tokio async runtime)
- **Execution Command**:
  ```bash
  cd backend
  cargo test --test api_tests -j 2
  ```
- **Test Scenarios Covered**:
  1. `test_health_check`: Verifies `GET /health` returns status `200 OK` with service name and ISO-8601 timestamp.
  2. `test_readiness_check`: Verifies `GET /ready` confirms active database pool connectivity.
  3. `test_system_metadata`: Verifies `GET /api/v1/metadata` returns platform details and official data provider citations (CPCB, data.gov.in, KSPCB).
  4. `test_data_status_metrics`: Verifies `GET /api/v1/data-status` returns positive counts for stations, observations, and available pollutants.
  5. `test_stations_list_and_kerala_filter`: Verifies `GET /api/v1/stations?state=Kerala` returns all 8 official KSPCB continuous monitoring stations.
  6. `test_single_station_lookup`: Verifies lookup of station `KL008` (Plammoodu, Thiruvananthapuram) with metadata and coordinates.
  7. `test_nonexistent_station_returns_404`: Verifies that querying an invalid station code returns structured `404 Not Found`.
  8. `test_observations_pagination`: Validates pagination limit, offset, and bounding rules on `GET /api/v1/observations`.
  9. `test_pollutant_summary_analytics`: Verifies statistical calculations (mean, min, max, count) for PM2.5, PM10, NO2, SO2, CO, O3.
  10. `test_exceedance_analytics`: Verifies exceedance calculation against CPCB NAAQS 2009 24-hour permissible limits.
  11. `test_admin_trigger_unauthorized`: Verifies that unauthorized administrative requests without `X-Admin-Key` return `401 Unauthorized`.
- **Execution Result**:
  ```text
  running 11 tests
  test test_health_check ... ok
  test test_nonexistent_station_returns_404 ... ok
  test test_admin_trigger_unauthorized ... ok
  test test_observations_pagination ... ok
  test test_readiness_check ... ok
  test test_system_metadata ... ok
  test test_single_station_lookup ... ok
  test test_stations_list_and_kerala_filter ... ok
  test test_data_status_metrics ... ok
  test test_exceedance_analytics ... ok
  test test_pollutant_summary_analytics ... ok

  test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; finished in 2.40s
  ```

---

### 1.3 Frontend UI Component & State Tests
- **Location**: `frontend/src/tests/components.test.tsx`
- **Runner**: `vitest` with `jsdom` and `@testing-library/react`
- **Execution Command**:
  ```bash
  cd frontend
  npm test
  ```
- **Test Scenarios Covered**:
  1. `renders MetricCard`: Verifies rendering of title, numerical value, units, subtitles, and icons.
  2. `renders AqiBadge`: Validates official CPCB category color coding across Good, Moderate, and Severe buckets.
  3. `renders LoadingState`: Verifies loading spinner and accessibility labels.
  4. `renders EmptyState`: Verifies descriptive messages and filter reset button callbacks.
  5. `renders ErrorState`: Verifies communication failure alerts and retry action callbacks.
  6. `renders Navbar`: Verifies all 7 primary navigation routes and platform badges.
- **Execution Result**:
  ```text
  ✓ src/tests/components.test.tsx (6 tests) 86ms
  Test Files  1 passed (1)
  Tests       6 passed (6)
  Duration    1.24s
  ```

---

### 1.4 Frontend Production Bundle Validation
- **Execution Command**:
  ```bash
  cd frontend
  npm run build
  ```
- **Execution Result**:
  ```text
  ✓ 2342 modules transformed.
  dist/index.html                   1.51 kB │ gzip:   0.85 kB
  dist/assets/index-DI50IVCl.css   23.40 kB │ gzip:   4.87 kB
  dist/assets/index-B7cVc830.js   815.06 kB │ gzip: 228.09 kB
  ✓ built in 7.13s
  ```

---

## 2. Summary of Test Execution

| Test Layer | Test Suite | Framework / Tool | Tests Executed | Passed | Failed | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Ingestion** | `ingestion/test_ingestion.py` | Python `unittest` | 5 | 5 | 0 | **PASSED** |
| **Backend** | `backend/tests/api_tests.rs` | Rust `cargo test` | 11 | 11 | 0 | **PASSED** |
| **Frontend** | `frontend/src/tests/` | Vitest + Testing Library | 6 | 6 | 0 | **PASSED** |
| **Build & Typecheck** | `tsc && vite build` | TypeScript + Vite | 2342 modules | All | 0 | **PASSED** |
| **Total** | | | **22 automated tests** | **22** | **0** | **100% PASS** |

---

## 3. Known Untested Areas & Future Scope

1. **Live Government API Ingestion**: Automated testing currently mocks the HTTP response from `data.gov.in` to avoid rate-limiting during continuous integration. Testing against the live government API requires setting `DATAGOVIN_API_KEY`.
2. **Browser End-to-End Canvas WebGL Rendering**: Leaflet map interactive tile panning is validated through component rendering tests; full GPU canvas interaction was not executed in headless CI.
