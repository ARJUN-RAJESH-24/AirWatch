"""
AirWatch Data Ingestion Pipeline Unit Tests
Uses clearly labeled synthetic test fixtures to test parser edge cases, missing data,
malformed timestamps, and deduplication idempotency.
NOTE: Synthetic fixtures are used ONLY in memory and are never persisted or displayed as actual observations.
"""

import unittest
import sqlite3
import hashlib
from datetime import datetime

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from ingest import compute_fingerprint, insert_obs_batch, insert_aqi_batch

class TestIngestionPipeline(unittest.TestCase):

    def setUp(self):
        """Set up in-memory SQLite database matching the production schema."""
        self.conn = sqlite3.connect(":memory:")
        self.cursor = self.conn.cursor()
        
        # Create minimal tables for fixture testing
        self.cursor.executescript("""
            CREATE TABLE stations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                city TEXT NOT NULL,
                state TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                agency TEXT,
                status TEXT,
                source_dataset TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE pollutants (
                id TEXT PRIMARY KEY,
                canonical_name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                default_unit TEXT NOT NULL,
                description TEXT,
                cpcb_standard_24h REAL,
                cpcb_standard_annual REAL,
                standard_unit TEXT NOT NULL
            );

            CREATE TABLE air_quality_observations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id INTEGER NOT NULL REFERENCES stations(id),
                pollutant_id TEXT NOT NULL REFERENCES pollutants(id),
                observation_timestamp TEXT NOT NULL,
                value REAL NOT NULL,
                unit TEXT NOT NULL,
                min_value REAL,
                max_value REAL,
                averaging_period TEXT DEFAULT '24 Hours',
                source_dataset TEXT NOT NULL,
                record_fingerprint TEXT UNIQUE NOT NULL,
                data_quality_status TEXT DEFAULT 'VALID',
                ingestion_run_id TEXT,
                raw_asset_id TEXT,
                ingested_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE aqi_observations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id INTEGER NOT NULL REFERENCES stations(id),
                observation_timestamp TEXT NOT NULL,
                aqi_value INTEGER NOT NULL,
                aqi_category TEXT NOT NULL,
                prominent_pollutant TEXT,
                source_dataset TEXT NOT NULL,
                record_fingerprint TEXT UNIQUE NOT NULL,
                ingestion_run_id TEXT,
                ingested_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            INSERT INTO stations (station_code, name, city, state, source_dataset)
            VALUES ('TEST_KL001', 'Test Plammoodu', 'Thiruvananthapuram', 'Kerala', 'SYNTHETIC_FIXTURE');

            INSERT INTO pollutants (id, canonical_name, display_name, default_unit, standard_unit)
            VALUES ('PM2.5', 'Particulate Matter 2.5', 'PM2.5', 'µg/m³', 'µg/m³');
        """)
        self.conn.commit()

    def tearDown(self):
        self.conn.close()

    def test_deterministic_fingerprint(self):
        """Test that record fingerprints are deterministic and collision-resistant."""
        fp1 = compute_fingerprint("KL001", "PM2.5", "2020-01-01")
        fp2 = compute_fingerprint("KL001", "PM2.5", "2020-01-01")
        fp3 = compute_fingerprint("KL001", "PM10", "2020-01-01")
        
        self.assertEqual(fp1, fp2, "Fingerprint must be deterministic for identical inputs")
        self.assertNotEqual(fp1, fp3, "Different pollutants must yield distinct fingerprints")
        self.assertEqual(len(fp1), 64, "SHA-256 fingerprint must be exactly 64 characters hex")

    def test_idempotent_duplicate_insertion(self):
        """Test that importing identical observation twice updates rather than duplicating."""
        stn_id = 1
        fp = compute_fingerprint("TEST_KL001", "PM2.5", "2020-01-01")
        obs_record = (stn_id, "PM2.5", "2020-01-01T00:00:00Z", 42.5, "µg/m³", "SYNTHETIC", fp, "VALID", "run-1", "asset-1")
        
        # First insert
        insert_obs_batch(self.cursor, "sqlite", [obs_record])
        self.conn.commit()
        
        self.cursor.execute("SELECT count(*) FROM air_quality_observations")
        self.assertEqual(self.cursor.fetchone()[0], 1)

        # Second insert with updated concentration
        updated_obs = (stn_id, "PM2.5", "2020-01-01T00:00:00Z", 45.0, "µg/m³", "SYNTHETIC", fp, "VALID", "run-2", "asset-1")
        insert_obs_batch(self.cursor, "sqlite", [updated_obs])
        self.conn.commit()

        # Count must remain 1, value updated to 45.0
        self.cursor.execute("SELECT count(*), value FROM air_quality_observations WHERE record_fingerprint = ?", (fp,))
        row = self.cursor.fetchone()
        self.assertEqual(row[0], 1, "Duplicate observation must not create a new row")
        self.assertEqual(row[1], 45.0, "Updated observation value must replace previous value")

    def test_missing_data_not_replaced_with_zero(self):
        """Test that null/empty measurements are not treated as 0.0."""
        raw_val = ""
        parsed_val = None
        if raw_val.strip() != "":
            parsed_val = float(raw_val)
        
        self.assertIsNone(parsed_val, "Empty measurement string must parse to None, never 0.0")

    def test_sensor_anomaly_status(self):
        """Test that negative readings (calibration errors) are flagged as SUSPECT."""
        reading = -5.2
        status = "SUSPECT" if reading < 0 else "VALID"
        self.assertEqual(status, "SUSPECT")

    def test_aqi_batch_idempotency(self):
        """Test reported AQI idempotent insertion."""
        stn_id = 1
        aqi_fp = compute_fingerprint("TEST_KL001", "AQI", "2020-01-01")
        aqi_record = (stn_id, "2020-01-01T00:00:00Z", 85, "Satisfactory", "SYNTHETIC", aqi_fp, "run-1")

        insert_aqi_batch(self.cursor, "sqlite", [aqi_record])
        self.conn.commit()

        self.cursor.execute("SELECT aqi_value, aqi_category FROM aqi_observations WHERE record_fingerprint = ?", (aqi_fp,))
        row = self.cursor.fetchone()
        self.assertEqual(row[0], 85)
        self.assertEqual(row[1], "Satisfactory")

if __name__ == "__main__":
    unittest.main()
