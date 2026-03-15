-- =============================================================================
-- Migration 3: Analytics Views and SECURITY DEFINER Functions
-- =============================================================================
-- All analytics access for employees and managers is routed through these
-- views and functions. Direct SELECT on responses/response_answers is blocked
-- for those roles by RLS policies in migration 2.
--
-- SECURITY DEFINER functions run as the function owner (postgres/admin), not
-- the calling user. This allows controlled access to aggregate data without
-- exposing individual response rows.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- VIEW: v_dimension_scores
-- Pre-aggregated dimension scores per survey from derived_metrics.
-- Uses security_invoker=false (SECURITY DEFINER behavior for views).
-- Reads from derived_metrics (already aggregated) rather than raw responses.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_dimension_scores
WITH (security_invoker = false)
AS
SELECT
  dm.survey_id,
  d.id          AS dimension_id,
  d.name        AS dimension_name,
  d.slug        AS dimension_slug,
  SUM(dm.respondent_count)                                      AS respondent_count,
  ROUND(AVG(dm.avg_score), 2)                                   AS avg_score,
  ROUND(AVG(dm.favorable_pct), 1)                               AS favorable_pct,
  ROUND(AVG(dm.neutral_pct), 1)                                 AS neutral_pct,
  ROUND(AVG(dm.unfavorable_pct), 1)                             AS unfavorable_pct
FROM public.derived_metrics dm
JOIN public.dimensions d ON d.id = dm.dimension_id
WHERE dm.segment_type = 'overall'
GROUP BY dm.survey_id, d.id, d.name, d.slug;

-- ---------------------------------------------------------------------------
-- VIEW: v_participation_rates
-- Participation token counts per survey, segmented by department.
-- Uses participation_tokens (who responded), NOT responses (what was responded).
-- This is intentional — we can safely show who responded without linking
-- to response content.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_participation_rates AS
SELECT
  pt.survey_id,
  COUNT(DISTINCT pt.user_id)  AS token_count,
  pt.department_id,
  d.name                      AS department_name
FROM public.participation_tokens pt
LEFT JOIN public.departments d ON d.id = pt.department_id
GROUP BY pt.survey_id, pt.department_id, d.name;

-- ---------------------------------------------------------------------------
-- VIEW: v_public_actions
-- Public-facing action items with latest metadata.
-- Filtered to is_public = TRUE — safe for all authenticated users.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- FUNCTION: get_dimension_scores_for_survey
-- Returns dimension scores for a specific survey, enforcing a minimum
-- respondent threshold to protect anonymity. Scores for segments below the
-- threshold are returned as NULL with below_threshold=TRUE — the caller
-- must handle this gracefully in the UI (Phase 3).
--
-- SECURITY DEFINER: runs as function owner, bypasses RLS on underlying tables.
-- The threshold enforcement IS the privacy protection for this function.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dimension_scores_for_survey(
  p_survey_id      UUID,
  p_min_respondents INT DEFAULT 5
)
RETURNS TABLE (
  dimension_id      UUID,
  dimension_name    TEXT,
  dimension_slug    TEXT,
  avg_score         NUMERIC,
  favorable_pct     NUMERIC,
  neutral_pct       NUMERIC,
  unfavorable_pct   NUMERIC,
  respondent_count  BIGINT,
  below_threshold   BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vds.dimension_id,
    vds.dimension_name,
    vds.dimension_slug,
    CASE WHEN vds.respondent_count >= p_min_respondents
         THEN vds.avg_score
         ELSE NULL
    END                                           AS avg_score,
    CASE WHEN vds.respondent_count >= p_min_respondents
         THEN vds.favorable_pct
         ELSE NULL
    END                                           AS favorable_pct,
    CASE WHEN vds.respondent_count >= p_min_respondents
         THEN vds.neutral_pct
         ELSE NULL
    END                                           AS neutral_pct,
    CASE WHEN vds.respondent_count >= p_min_respondents
         THEN vds.unfavorable_pct
         ELSE NULL
    END                                           AS unfavorable_pct,
    vds.respondent_count::BIGINT                  AS respondent_count,
    (vds.respondent_count < p_min_respondents)    AS below_threshold
  FROM public.v_dimension_scores vds
  WHERE vds.survey_id = p_survey_id;
END;
$$;

-- Grant authenticated users access to the analytics surface
GRANT SELECT ON public.v_dimension_scores    TO authenticated;
GRANT SELECT ON public.v_participation_rates TO authenticated;
GRANT SELECT ON public.v_public_actions      TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dimension_scores_for_survey TO authenticated;
