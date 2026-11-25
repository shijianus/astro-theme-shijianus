-- Only actual citation clicks are recorded; repeated clicks in one session are deduplicated.
CREATE TABLE IF NOT EXISTS gesture_link_visits (
  gesture_id TEXT NOT NULL,
  link_key TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (gesture_id, link_key, visitor_hash)
);
