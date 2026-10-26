# AirWatch Dataset Validation Report
**Generated:** 2026-10-25 15:52:33 UTC  
**Ingestion Run ID:** `d22e8697-6a7d-44b9-ad5b-ba4199ea60c6`  
**Authoritative Source:** Central Pollution Control Board (CPCB), Ministry of Environment, Forest and Climate Change, Government of India  
**Program:** Continuous Ambient Air Quality Monitoring System (CAAQMS) / National Ambient Air Quality Standards (NAAQS)  

---

## 1. Executive Summary

This validation report certifies that genuine, un-fabricated environmental observations published by official Indian government agencies have been retrieved, validated, normalized, and ingested into the AirWatch platform database.

* **Total Records Parsed from Official Source:** 108,035
* **Total Validated Pollutant Observations Ingested:** 437,226
* **Total Reported AQI Index Observations Ingested:** 66,771
* **Rejected Rows (Missing Timestamps / Malformed):** 0
* **Overall Dataset Date Range:** `2015-01-01` to `2020-07-01`
* **Active Monitoring Stations Ingested:** 230
* **Kerala Stations Prioritized:** 8 stations (All available official KSPCB stations)
* **Kerala Observations Ingested:** 1,576

---

## 2. Ingested Monitoring Stations by State

| State / UT | Station Count | Representative Cities |
| :--- | :--- | :--- |
| **Delhi** | 38 | Primary Regional Monitoring Stations |
| **Haryana** | 29 | Primary Regional Monitoring Stations |
| **Uttar Pradesh** | 26 | Primary Regional Monitoring Stations |
| **Maharashtra** | 22 | Primary Regional Monitoring Stations |
| **Karnataka** | 20 | Primary Regional Monitoring Stations |
| **Madhya Pradesh** | 16 | Primary Regional Monitoring Stations |
| **West Bengal** | 14 | Primary Regional Monitoring Stations |
| **Bihar** | 10 | Primary Regional Monitoring Stations |
| **Rajasthan** | 10 | Primary Regional Monitoring Stations |
| **Kerala** | 8 | Primary Regional Monitoring Stations |
| **Punjab** | 8 | Primary Regional Monitoring Stations |
| **Gujarat** | 6 | Primary Regional Monitoring Stations |
| **Telangana** | 6 | Primary Regional Monitoring Stations |
| **Andhra Pradesh** | 5 | Primary Regional Monitoring Stations |
| **Tamil Nadu** | 5 | Primary Regional Monitoring Stations |
| **Odisha** | 2 | Primary Regional Monitoring Stations |
| **Assam** | 1 | Primary Regional Monitoring Stations |
| **Chandigarh** | 1 | Primary Regional Monitoring Stations |
| **Jharkhand** | 1 | Primary Regional Monitoring Stations |
| **Meghalaya** | 1 | Primary Regional Monitoring Stations |
| **Mizoram** | 1 | Primary Regional Monitoring Stations |

---

## 3. Pollutant Coverage and Descriptive Summary

Every measurement preserves its authoritative measurement unit as specified under CPCB NAAQS 2009. Missing values in original government reports are preserved strictly as nulls and are **never** replaced with zero.

| Pollutant | Valid Observation Count | Mean Concentration | Min Concentration | Max Concentration | Standard Unit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CO** | 73,505 | 1.31 | 0.0 | 49.96 | mg/m³ |
| **NO2** | 70,363 | 36.64 | 0.01 | 397.77 | µg/m³ |
| **PM2.5** | 65,932 | 80.04 | 0.02 | 1000.0 | µg/m³ |
| **SO2** | 62,622 | 11.18 | 0.01 | 195.65 | µg/m³ |
| **O3** | 62,373 | 39.05 | 0.02 | 963.0 | µg/m³ |
| **PM10** | 53,512 | 165.67 | 0.08 | 976.77 | µg/m³ |
| **NH3** | 48,919 | 30.72 | 0.01 | 418.9 | µg/m³ |

---

## 4. Data Provenance & Integrity Safeguards

1. **Deterministic Fingerprinting:** Every observation is keyed by a SHA-256 hash `SHA256(StationId + ':' + Pollutant + ':' + Date)`. Re-running ingestion is completely idempotent.
2. **Missing Data Policy:** No artificial interpolation, machine learning imputation, or synthetic substitution is performed.
3. **Sensor Anomaly Flagging:** Negative concentrations or invalid sensor telemetry are flagged as `SUSPECT`.
4. **Separation of AQI and Concentrations:** Reported Air Quality Index values are stored in `aqi_observations`, distinct from physical concentration measurements in `air_quality_observations`.
5. **Raw Asset Checksums:** The source CSV is cryptographically archived with SHA-256 and stored in `data/raw/` with sidecar provenance metadata.

---

*Certified by AirWatch Automated Ingestion Engine*
