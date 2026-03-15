-- =============================================================================
-- RLS CHECK
-- =============================================================================
-- Every table in the public schema must have Row Level Security enabled.
-- Expected: 0 rows (no tables with rowsecurity = false).
-- =============================================================================

SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
-- Expected: 0 rows

-- Complementary: list all tables WITH RLS enabled (for verification)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Expected: all 24 tables with rowsecurity = true
