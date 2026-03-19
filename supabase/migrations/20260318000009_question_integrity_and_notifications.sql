-- Phase 5 hardening:
-- 1) Prevent duplicate question text inside a survey
-- 2) Faster, atomic submission path via RPC
-- 3) In-app reminder notifications

-- ---------------------------------------------------------------------------
-- Helper: normalize question text for uniqueness checks
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_question_text(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(trim(coalesce(p_text, '')), '\s+', ' ', 'g'));
$$;

-- ---------------------------------------------------------------------------
-- Trigger: enforce no repeated question text within the same survey
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_unique_question_text_within_survey()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_survey_id UUID;
  v_normalized TEXT;
BEGIN
  v_normalized := public.normalize_question_text(NEW.text);
  IF v_normalized = '' THEN
    RETURN NEW;
  END IF;

  SELECT survey_id
  INTO v_survey_id
  FROM public.survey_sections
  WHERE id = NEW.survey_section_id;

  IF v_survey_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.questions q
    JOIN public.survey_sections s ON s.id = q.survey_section_id
    WHERE s.survey_id = v_survey_id
      AND q.id <> NEW.id
      AND public.normalize_question_text(q.text) = v_normalized
  ) THEN
    RAISE EXCEPTION 'Duplicate question text is not allowed within the same survey';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_questions_unique_text_per_survey ON public.questions;
CREATE TRIGGER trg_questions_unique_text_per_survey
  BEFORE INSERT OR UPDATE OF text, survey_section_id
  ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_unique_question_text_within_survey();

-- ---------------------------------------------------------------------------
-- In-app notifications table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_id UUID NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_created
  ON public.in_app_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_survey
  ON public.in_app_notifications (survey_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_unread
  ON public.in_app_notifications (user_id, is_read);

ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "in_app_notifications: own read" ON public.in_app_notifications;
CREATE POLICY "in_app_notifications: own read"
  ON public.in_app_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "in_app_notifications: own update" ON public.in_app_notifications;
CREATE POLICY "in_app_notifications: own update"
  ON public.in_app_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "in_app_notifications: admin insert" ON public.in_app_notifications;
CREATE POLICY "in_app_notifications: admin insert"
  ON public.in_app_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------------
-- Atomic submission RPC for faster + consistent writes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_survey_response_atomic(
  p_survey_id UUID,
  p_user_id UUID,
  p_is_anonymous BOOLEAN,
  p_department TEXT,
  p_role TEXT,
  p_tenure_band TEXT,
  p_work_type TEXT,
  p_answers JSONB,
  p_token_department_id UUID DEFAULT NULL,
  p_token_role_id UUID DEFAULT NULL,
  p_submitted_at TIMESTAMPTZ DEFAULT now()
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_response_id UUID;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.participation_tokens
    WHERE survey_id = p_survey_id
      AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'already_submitted';
  END IF;

  INSERT INTO public.responses (
    survey_id,
    user_id,
    is_anonymous,
    submitted_at,
    department,
    role,
    tenure_band,
    work_type
  )
  VALUES (
    p_survey_id,
    CASE WHEN p_is_anonymous THEN NULL ELSE p_user_id END,
    p_is_anonymous,
    p_submitted_at,
    p_department,
    p_role,
    p_tenure_band,
    p_work_type
  )
  RETURNING id INTO v_response_id;

  INSERT INTO public.response_answers (
    response_id,
    question_id,
    text_value,
    numeric_value,
    selected_options
  )
  SELECT
    v_response_id,
    kv.key::UUID,
    CASE WHEN jsonb_typeof(kv.value) = 'string' THEN kv.value #>> '{}' ELSE NULL END,
    CASE WHEN jsonb_typeof(kv.value) = 'number' THEN (kv.value #>> '{}')::NUMERIC ELSE NULL END,
    CASE WHEN jsonb_typeof(kv.value) = 'array' THEN kv.value ELSE '[]'::jsonb END
  FROM jsonb_each(coalesce(p_answers, '{}'::jsonb)) kv;

  INSERT INTO public.participation_tokens (
    survey_id,
    user_id,
    submitted_at,
    department_id,
    role_id,
    tenure_band
  )
  VALUES (
    p_survey_id,
    p_user_id,
    p_submitted_at,
    p_token_department_id,
    p_token_role_id,
    p_tenure_band::tenure_band_enum
  )
  ON CONFLICT (survey_id, user_id) DO NOTHING;

  DELETE FROM public.response_drafts
  WHERE survey_id = p_survey_id
    AND user_id = p_user_id;

  RETURN v_response_id;
END;
$$;

