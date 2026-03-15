-- =============================================================================
-- Migration 6: compute_derived_metrics RPC
-- =============================================================================
-- Admin-triggered stored procedure that populates derived_metrics for a
-- given survey. Called via supabaseAdmin.rpc('compute_derived_metrics', { p_survey_id }).
--
-- Design:
--   - Idempotent: deletes all existing rows for the survey before inserting.
--   - Computes aggregates for four segment types: overall, department, role,
--     tenure_band.
--   - Only likert_5 and likert_10 questions contribute to scores. Other types
--     (short_text, long_text, single_select, multi_select) are excluded.
--   - Uses numeric_value (NUMERIC column) directly — no cast required.
--   - Weight-adjusted avg_score via question_dimension_map.weight.
--   - Favorable/neutral/unfavorable thresholds differ by scale:
--       likert_5:  favorable >= 4, neutral = 3, unfavorable <= 2
--       likert_10: favorable >= 7, neutral 5–6, unfavorable <= 4
--   - SECURITY DEFINER — runs as owner (postgres/admin), not caller.
--   - GRANT EXECUTE to service_role ONLY — not to authenticated.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.compute_derived_metrics(p_survey_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_inserted INT;
BEGIN
  -- -------------------------------------------------------------------------
  -- Idempotent: clear previous run for this survey
  -- -------------------------------------------------------------------------
  DELETE FROM public.derived_metrics
  WHERE survey_id = p_survey_id;

  -- -------------------------------------------------------------------------
  -- Short-circuit: return 0 if survey has no responses
  -- -------------------------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM public.responses WHERE survey_id = p_survey_id LIMIT 1
  ) THEN
    RETURN 0;
  END IF;

  -- -------------------------------------------------------------------------
  -- Segment: OVERALL
  -- All responses for the survey, aggregated per dimension.
  -- -------------------------------------------------------------------------
  INSERT INTO public.derived_metrics (
    survey_id, dimension_id, segment_type, segment_value,
    avg_score, favorable_pct, neutral_pct, unfavorable_pct,
    respondent_count, computed_at
  )
  SELECT
    p_survey_id,
    qdm.dimension_id,
    'overall',
    NULL,
    ROUND(
      SUM(ra.numeric_value * qdm.weight) / NULLIF(SUM(qdm.weight), 0),
      2
    ) AS avg_score,
    ROUND(
      100.0 * COUNT(*) FILTER (
        WHERE (q.type = 'likert_5'  AND ra.numeric_value >= 4)
           OR (q.type = 'likert_10' AND ra.numeric_value >= 7)
      ) / NULLIF(COUNT(*), 0),
      1
    ) AS favorable_pct,
    ROUND(
      100.0 * COUNT(*) FILTER (
        WHERE (q.type = 'likert_5'  AND ra.numeric_value = 3)
           OR (q.type = 'likert_10' AND ra.numeric_value BETWEEN 5 AND 6)
      ) / NULLIF(COUNT(*), 0),
      1
    ) AS neutral_pct,
    ROUND(
      100.0 * COUNT(*) FILTER (
        WHERE (q.type = 'likert_5'  AND ra.numeric_value <= 2)
           OR (q.type = 'likert_10' AND ra.numeric_value <= 4)
      ) / NULLIF(COUNT(*), 0),
      1
    ) AS unfavorable_pct,
    COUNT(DISTINCT ra.response_id) AS respondent_count,
    NOW()
  FROM public.responses r
  JOIN public.response_answers ra  ON ra.response_id = r.id
  JOIN public.questions q          ON q.id = ra.question_id
  JOIN public.question_dimension_map qdm ON qdm.question_id = q.id
  WHERE r.survey_id = p_survey_id
    AND q.type IN ('likert_5', 'likert_10')
    AND ra.numeric_value IS NOT NULL
  GROUP BY qdm.dimension_id;

  -- -------------------------------------------------------------------------
  -- Segment: DEPARTMENT
  -- One row per dimension per unique responses.department value.
  -- -------------------------------------------------------------------------
  INSERT INTO public.derived_metrics (
    survey_id, dimension_id, segment_type, segment_value,
    avg_score, favorable_pct, neutral_pct, unfavorable_pct,
    respondent_count, computed_at
  )
  SELECT
    p_survey_id,
    qdm.dimension_id,
    'department',
    r.department,
    ROUND(
      SUM(ra.numeric_value * qdm.weight) / NULLIF(SUM(qdm.weight), 0),
      2
    ) AS avg_score,
    ROUND(
      100.0 * COUNT(*) FILTER (
        WHERE (q.type = 'likert_5'  AND ra.numeric_value >= 4)
           OR (q.type = 'likert_10' AND ra.numeric_value >= 7)
      ) / NULLIF(COUNT(*), 0),
      1
    ) AS favorable_pct,
    ROUND(
      100.0 * COUNT(*) FILTER (
        WHERE (q.type = 'likert_5'  AND ra.numeric_value = 3)
           OR (q.type = 'likert_10' AND ra.numeric_value BETWEEN 5 AND 6)
      ) / NULLIF(COUNT(*), 0),
      1
    ) AS neutral_pct,
    ROUND(
      100.0 * COUNT(*) FILTER (
        WHERE (q.type = 'likert_5'  AND ra.numeric_value <= 2)
           OR (q.type = 'likert_10' AND ra.numeric_value <= 4)
      ) / NULLIF(COUNT(*), 0),
      1
    ) AS unfavorable_pct,
    COUNT(DISTINCT ra.response_id) AS respondent_count,
    NOW()
  FROM public.responses r
  JOIN public.response_answers ra  ON ra.response_id = r.id
  JOIN public.questions q          ON q.id = ra.question_id
  JOIN public.question_dimension_map qdm ON qdm.question_id = q.id
  WHERE r.survey_id = p_survey_id
    AND q.type IN ('likert_5', 'likert_10')
    AND ra.numeric_value IS NOT NULL
    AND r.department IS NOT NULL
  GROUP BY qdm.dimension_id, r.department;

  -- -------------------------------------------------------------------------
  -- Segment: ROLE
  -- One row per dimension per unique responses.role value.
  -- -------------------------------------------------------------------------
  INSERT INTO public.derived_metrics (
    survey_id, dimension_id, segment_type, segment_value,
    avg_score, favorable_pct, neutral_pct, unfavorable_pct,
    respondent_count, computed_at
  )
  SELECT
    p_survey_id,
    qdm.dimension_id,
    'role',
    r.role,
    ROUND(
      SUM(ra.numeric_value * qdm.weight) / NULLIF(SUM(qdm.weight), 0),
      2
    ) AS avg_score,
    ROUND(
      100.0 * COUNT(*) FILTER (
        WHERE (q.type = 'likert_5'  AND ra.numeric_value >= 4)
           OR (q.type = 'likert_10' AND ra.numeric_value >= 7)
      ) / NULLIF(COUNT(*), 0),
      1
    ) AS favorable_pct,
    ROUND(
      100.0 * COUNT(*) FILTER (
        WHERE (q.type = 'likert_5'  AND ra.numeric_value = 3)
           OR (q.type = 'likert_10' AND ra.numeric_value BETWEEN 5 AND 6)
      ) / NULLIF(COUNT(*), 0),
      1
    ) AS neutral_pct,
    ROUND(
      100.0 * COUNT(*) FILTER (
        WHERE (q.type = 'likert_5'  AND ra.numeric_value <= 2)
           OR (q.type = 'likert_10' AND ra.numeric_value <= 4)
      ) / NULLIF(COUNT(*), 0),
      1
    ) AS unfavorable_pct,
    COUNT(DISTINCT ra.response_id) AS respondent_count,
    NOW()
  FROM public.responses r
  JOIN public.response_answers ra  ON ra.response_id = r.id
  JOIN public.questions q          ON q.id = ra.question_id
  JOIN public.question_dimension_map qdm ON qdm.question_id = q.id
  WHERE r.survey_id = p_survey_id
    AND q.type IN ('likert_5', 'likert_10')
    AND ra.numeric_value IS NOT NULL
    AND r.role IS NOT NULL
  GROUP BY qdm.dimension_id, r.role;

  -- -------------------------------------------------------------------------
  -- Segment: TENURE_BAND
  -- One row per dimension per unique responses.tenure_band value.
  -- -------------------------------------------------------------------------
  INSERT INTO public.derived_metrics (
    survey_id, dimension_id, segment_type, segment_value,
    avg_score, favorable_pct, neutral_pct, unfavorable_pct,
    respondent_count, computed_at
  )
  SELECT
    p_survey_id,
    qdm.dimension_id,
    'tenure_band',
    r.tenure_band,
    ROUND(
      SUM(ra.numeric_value * qdm.weight) / NULLIF(SUM(qdm.weight), 0),
      2
    ) AS avg_score,
    ROUND(
      100.0 * COUNT(*) FILTER (
        WHERE (q.type = 'likert_5'  AND ra.numeric_value >= 4)
           OR (q.type = 'likert_10' AND ra.numeric_value >= 7)
      ) / NULLIF(COUNT(*), 0),
      1
    ) AS favorable_pct,
    ROUND(
      100.0 * COUNT(*) FILTER (
        WHERE (q.type = 'likert_5'  AND ra.numeric_value = 3)
           OR (q.type = 'likert_10' AND ra.numeric_value BETWEEN 5 AND 6)
      ) / NULLIF(COUNT(*), 0),
      1
    ) AS neutral_pct,
    ROUND(
      100.0 * COUNT(*) FILTER (
        WHERE (q.type = 'likert_5'  AND ra.numeric_value <= 2)
           OR (q.type = 'likert_10' AND ra.numeric_value <= 4)
      ) / NULLIF(COUNT(*), 0),
      1
    ) AS unfavorable_pct,
    COUNT(DISTINCT ra.response_id) AS respondent_count,
    NOW()
  FROM public.responses r
  JOIN public.response_answers ra  ON ra.response_id = r.id
  JOIN public.questions q          ON q.id = ra.question_id
  JOIN public.question_dimension_map qdm ON qdm.question_id = q.id
  WHERE r.survey_id = p_survey_id
    AND q.type IN ('likert_5', 'likert_10')
    AND ra.numeric_value IS NOT NULL
    AND r.tenure_band IS NOT NULL
  GROUP BY qdm.dimension_id, r.tenure_band;

  -- -------------------------------------------------------------------------
  -- Return total rows inserted across all segments
  -- -------------------------------------------------------------------------
  GET DIAGNOSTICS v_rows_inserted = ROW_COUNT;

  -- ROW_COUNT only captures the last INSERT, so we count the actual rows.
  SELECT COUNT(*) INTO v_rows_inserted
  FROM public.derived_metrics
  WHERE survey_id = p_survey_id;

  RETURN v_rows_inserted;
END;
$$;

-- -----------------------------------------------------------------------------
-- Permissions: GRANT EXECUTE to service_role ONLY.
-- NOT granted to authenticated — this is an admin-only privileged operation
-- invoked via supabaseAdmin (service role key) from a Server Action.
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.compute_derived_metrics(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.compute_derived_metrics(UUID) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.compute_derived_metrics(UUID) TO service_role;
