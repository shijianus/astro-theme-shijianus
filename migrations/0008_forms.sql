CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  data TEXT NOT NULL,
  ip TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions (form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions (created_at DESC);
