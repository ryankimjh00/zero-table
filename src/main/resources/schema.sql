PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS records (
  dataset TEXT NOT NULL,
  record_key TEXT NOT NULL,
  quarter TEXT,
  district_code TEXT,
  industry_code TEXT,
  region_code TEXT,
  scope TEXT NOT NULL,
  payload TEXT NOT NULL CHECK(json_valid(payload)),
  collected_at TEXT NOT NULL,
  PRIMARY KEY(dataset, record_key)
);
CREATE INDEX IF NOT EXISTS records_filter ON records(dataset, quarter, district_code, industry_code);
CREATE INDEX IF NOT EXISTS records_region ON records(dataset, region_code);
CREATE INDEX IF NOT EXISTS records_collected ON records(dataset, collected_at);
CREATE INDEX IF NOT EXISTS records_filter_collected ON records(dataset, quarter, district_code, industry_code, collected_at);
CREATE INDEX IF NOT EXISTS records_filter_order ON records(dataset, quarter, district_code, industry_code, record_key);
CREATE INDEX IF NOT EXISTS records_assessment_peers ON records(dataset, quarter, industry_code, district_code);
CREATE TABLE IF NOT EXISTS collection_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset TEXT NOT NULL,
  parameters TEXT NOT NULL,
  status TEXT NOT NULL,
  pages INTEGER NOT NULL DEFAULT 0,
  processed INTEGER NOT NULL DEFAULT 0,
  upstream_total INTEGER,
  next_page INTEGER,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  error_code TEXT
);
