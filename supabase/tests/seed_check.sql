-- =============================================================================
-- SEED CHECK
-- =============================================================================
-- Verifies seed data is complete and correct.
-- Expected: seeded_users=18, profiles=18, dimensions=12, surveys=1,
--           sections=13, questions>=60, action_items=3
-- =============================================================================

-- Summary counts
SELECT
  (SELECT count(*) FROM auth.users WHERE raw_app_meta_data->>'role' IS NOT NULL) AS seeded_users,
  (SELECT count(*) FROM public.profiles)                                          AS profile_count,
  (SELECT count(*) FROM public.dimensions)                                        AS dimension_count,
  (SELECT count(*) FROM public.surveys)                                           AS survey_count,
  (SELECT count(*) FROM public.survey_sections)                                   AS section_count,
  (SELECT count(*) FROM public.questions)                                         AS question_count,
  (SELECT count(*) FROM public.action_items)                                      AS action_item_count;
-- Expected:
--   seeded_users   = 18
--   profile_count  = 18
--   dimension_count = 12
--   survey_count   = 1
--   section_count  = 13
--   question_count >= 60
--   action_item_count = 3

-- Verify all 6 RBAC roles are seeded
SELECT
  raw_app_meta_data->>'role' AS rbac_role,
  count(*)                   AS user_count
FROM auth.users
WHERE raw_app_meta_data->>'role' IS NOT NULL
GROUP BY 1
ORDER BY 1;
-- Expected: 6 rows — employee, manager, leadership, admin, hr_admin, survey_analyst
-- Expected counts: employee=9, manager=3, leadership=2, admin=2, hr_admin=1, survey_analyst=1

-- Verify all 5 tenure bands are covered
SELECT
  tenure_band,
  count(*) AS user_count
FROM public.profiles
WHERE tenure_band IS NOT NULL
GROUP BY 1
ORDER BY 1;
-- Expected: all 5 bands (0-6m, 6-12m, 1-2y, 2-5y, 5y+) each with >= 2 users

-- Verify privacy threshold defaults
SELECT key, value
FROM public.app_settings
WHERE key IN ('privacy_threshold_numeric', 'privacy_threshold_text', 'allowed_email_domain')
ORDER BY key;
-- Expected: 3 rows with values 5, 10, and "acme.dev"

-- Verify action items have correct statuses and visibility
SELECT title, status, is_public, priority
FROM public.action_items
ORDER BY created_at;
-- Expected:
--   "Improve onboarding documentation" — completed, is_public=true, medium
--   "Reduce CI/CD pipeline time" — in_progress, is_public=true, high
--   "Establish architecture review process" — identified, is_public=false, high

-- Verify survey is draft and anonymous
SELECT title, status, anonymous_mode
FROM public.surveys;
-- Expected: 1 row, status='draft', anonymous_mode=true

-- Verify question-dimension mappings cover all 12 dimensions
SELECT
  d.name AS dimension_name,
  count(qdm.question_id) AS mapped_questions
FROM public.dimensions d
LEFT JOIN public.question_dimension_map qdm ON qdm.dimension_id = d.id
GROUP BY d.id, d.name
ORDER BY d.name;
-- Expected: all 12 dimensions with >= 3 mapped questions each
