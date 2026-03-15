-- =============================================================================
-- ANONYMITY AUDIT
-- =============================================================================
-- Verifies it is structurally impossible to join participation_tokens to
-- responses by user identity. The only shared column is survey_id which
-- cannot alone identify a specific user's response.
-- =============================================================================

-- Step 1: Confirm no FK constraint links participation_tokens to responses
-- Expected: 0 rows (no cross-table FK between these two tables)
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name  AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (
    (tc.table_name = 'responses' AND ccu.table_name = 'participation_tokens') OR
    (tc.table_name = 'participation_tokens' AND ccu.table_name = 'responses')
  );
-- Expected: 0 rows

-- Step 2: Confirm responses.user_id is nullable (anonymous mode support)
-- Expected: 1 row with is_nullable = 'YES'
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'responses'
  AND column_name = 'user_id';
-- Expected: 1 row with is_nullable = 'YES', data_type = 'uuid'

-- Step 3: Confirm participation_tokens has NO column referencing response content
-- Expected: no column named response_id or similar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'participation_tokens'
ORDER BY ordinal_position;
-- Expected: id, survey_id, user_id, submitted_at, department_id, role_id, tenure_band, created_at
-- No response_id, no response_content, no link to responses table whatsoever

-- Step 4: Verify the shared column (survey_id) is insufficient to identify a response
-- This explains WHY the decoupling works: survey_id links to many responses, many tokens.
-- Without a user_id on responses (in anonymous mode), there is no way to correlate them.
SELECT
  'participation_tokens' AS "table",
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'participation_tokens'
  AND column_name IN (SELECT column_name
                       FROM information_schema.columns
                       WHERE table_schema = 'public'
                         AND table_name = 'responses')
ORDER BY 1, 2;
-- Expected: only 'survey_id' appears — confirming this is the only shared column
