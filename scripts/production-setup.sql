-- =============================================================================
-- Production Setup SQL — run once in Supabase SQL Editor
-- https://supabase.com/dashboard/project/ddvhnsibcixevtojsgei/sql/new
-- =============================================================================
-- This script is idempotent (safe to re-run). It applies all missing schema
-- changes needed for Phase 3 and Phase 4 to work correctly.
--
-- Migration history (apply in order via Supabase CLI or SQL Editor):
--   20260315000001_schema.sql              — Core schema (24 tables, enums, indexes)
--   20260315000002_rls.sql                 — Row-level security policies
--   20260315000003_functions.sql           — DB functions and triggers
--   20260315000004_seed.sql                — Seed data (users, survey, 13 sections, ~65 questions)
--   20260315000005_*.sql … 000007_*.sql    — Phase 2/3 incremental migrations
--   20260316000008_questionnaire_seed.sql  — PDF questionnaire: 9 new sections, ~37 questions
--                                            (Company-Wide, Engineering, QA, UI/UX, Project Managers,
--                                             Sales/Business, Architects/Tech Lead, HR/Ops, Marketing)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- VIEWS (re-create with correct definitions)
-- ---------------------------------------------------------------------------

-- v_participation_rates: participation per survey broken down by department
CREATE OR REPLACE VIEW public.v_participation_rates AS
SELECT
  pt.survey_id,
  COUNT(DISTINCT pt.user_id)  AS token_count,
  pt.department_id,
  d.name                      AS department_name
FROM public.participation_tokens pt
LEFT JOIN public.departments d ON d.id = pt.department_id
GROUP BY pt.survey_id, pt.department_id, d.name;

GRANT SELECT ON public.v_participation_rates TO authenticated;

-- v_public_actions: public-facing action items safe for all authenticated users
CREATE OR REPLACE VIEW public.v_public_actions AS
SELECT
  ai.id,
  ai.title,
  ai.problem_statement,
  ai.status,
  ai.priority,
  ai.target_date,
  ai.success_criteria,
  ai.department_id,
  d.name        AS department_name,
  ai.survey_id,
  ai.created_at
FROM public.action_items ai
LEFT JOIN public.departments d ON d.id = ai.department_id
WHERE ai.is_public = TRUE;

GRANT SELECT ON public.v_public_actions TO authenticated;

-- ---------------------------------------------------------------------------
-- Phase 4 columns
-- ---------------------------------------------------------------------------

-- archived flag on surveys (hides from lists after archival)
ALTER TABLE public.surveys
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_surveys_archived ON public.surveys (archived);

-- dimension_ids on action_items (links actions to survey dimensions)
ALTER TABLE public.action_items
  ADD COLUMN IF NOT EXISTS dimension_ids UUID[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_action_items_dimension_ids
  ON public.action_items USING GIN (dimension_ids);

-- Unique constraint on publication_snapshots (one immutable snapshot per survey)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_publication_snapshots_survey_id'
  ) THEN
    ALTER TABLE public.publication_snapshots
      ADD CONSTRAINT uq_publication_snapshots_survey_id UNIQUE (survey_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Fix questionnaire section target_roles to use department names
-- (migration 8 used old role names; these UPDATEs are idempotent)
-- ---------------------------------------------------------------------------
UPDATE public.survey_sections SET target_roles = '{"Engineering"}'         WHERE id = '66600000-0000-0000-0000-000000000014';
UPDATE public.survey_sections SET target_roles = '{"Quality Assurance"}'   WHERE id = '66600000-0000-0000-0000-000000000015';
UPDATE public.survey_sections SET target_roles = '{"Engineering"}'         WHERE id = '66600000-0000-0000-0000-000000000016';
UPDATE public.survey_sections SET target_roles = '{"Leadership"}'          WHERE id = '66600000-0000-0000-0000-000000000017';
UPDATE public.survey_sections SET target_roles = '{"Sales & Business"}'    WHERE id = '66600000-0000-0000-0000-000000000018';
UPDATE public.survey_sections SET target_roles = '{"Leadership","Engineering"}' WHERE id = '66600000-0000-0000-0000-000000000019';
UPDATE public.survey_sections SET target_roles = '{"HR & Operations"}'     WHERE id = '66600000-0000-0000-0000-000000000020';
UPDATE public.survey_sections SET target_roles = '{}'                      WHERE id = '66600000-0000-0000-0000-000000000021';

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
SELECT
  'surveys.archived'         AS check_item,
  EXISTS(SELECT 1 FROM information_schema.columns
         WHERE table_name='surveys' AND column_name='archived') AS ok
UNION ALL
SELECT
  'action_items.dimension_ids',
  EXISTS(SELECT 1 FROM information_schema.columns
         WHERE table_name='action_items' AND column_name='dimension_ids')
UNION ALL
SELECT
  'v_public_actions',
  EXISTS(SELECT 1 FROM information_schema.views
         WHERE table_name='v_public_actions')
UNION ALL
SELECT
  'v_participation_rates (dept)',
  EXISTS(SELECT 1 FROM information_schema.columns
         WHERE table_name='v_participation_rates' AND column_name='department_id');
