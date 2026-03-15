-- =============================================================================
-- SCHEMA CHECK
-- =============================================================================
-- Verifies all 24 expected tables exist in the public schema.
-- Expected: 24 rows in the count query.
-- =============================================================================

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
-- Expected: 24 rows including:
--   action_items, action_updates, app_settings, audit_logs,
--   derived_metrics, departments, dimensions, participation_tokens,
--   profiles, publication_snapshots, qualitative_tags, qualitative_themes,
--   question_dimension_map, question_options, questions,
--   response_answers, response_drafts, response_metadata, responses,
--   roles, survey_audiences, survey_sections, surveys, teams

-- Table count
SELECT count(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
-- Expected: 24

-- Verify each expected table exists (returns 1 if present, missing tables = 0)
SELECT
  t.expected_table,
  CASE WHEN i.table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status
FROM (VALUES
  ('action_items'),
  ('action_updates'),
  ('app_settings'),
  ('audit_logs'),
  ('derived_metrics'),
  ('departments'),
  ('dimensions'),
  ('participation_tokens'),
  ('profiles'),
  ('publication_snapshots'),
  ('qualitative_tags'),
  ('qualitative_themes'),
  ('question_dimension_map'),
  ('question_options'),
  ('questions'),
  ('response_answers'),
  ('response_drafts'),
  ('response_metadata'),
  ('responses'),
  ('roles'),
  ('survey_audiences'),
  ('survey_sections'),
  ('surveys'),
  ('teams')
) AS t(expected_table)
LEFT JOIN information_schema.tables i
  ON i.table_schema = 'public'
  AND i.table_name = t.expected_table
  AND i.table_type = 'BASE TABLE'
ORDER BY t.expected_table;
-- Expected: 24 rows, all with status = 'EXISTS'
