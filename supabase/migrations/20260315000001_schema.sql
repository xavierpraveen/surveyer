-- =============================================================================
-- Migration 1: Core Schema — All 24 tables, enums, indexes
-- =============================================================================
-- Privacy design is enforced at the schema level in this migration.
-- Key invariant: participation_tokens (WHO responded) and responses (WHAT was
-- responded) share only survey_id, which alone cannot identify a specific
-- response. This is intentional and documented throughout.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE survey_status_enum AS ENUM (
  'draft',
  'scheduled',
  'open',
  'closed'
);

CREATE TYPE question_type_enum AS ENUM (
  'likert_5',
  'likert_10',
  'single_select',
  'multi_select',
  'short_text',
  'long_text'
);

CREATE TYPE action_priority_enum AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE action_status_enum AS ENUM (
  'identified',
  'planned',
  'in_progress',
  'blocked',
  'completed'
);

CREATE TYPE tenure_band_enum AS ENUM (
  '0-6m',
  '6-12m',
  '1-2y',
  '2-5y',
  '5y+'
);

-- ---------------------------------------------------------------------------
-- TABLE 1: app_settings
-- Configurable application-level settings including privacy thresholds.
-- ---------------------------------------------------------------------------
CREATE TABLE public.app_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Default privacy thresholds and domain configuration
INSERT INTO public.app_settings (key, value, updated_at) VALUES
  ('privacy_threshold_numeric', '5',           NOW()),
  ('privacy_threshold_text',    '10',          NOW()),
  ('allowed_email_domain',      '"acme.dev"',  NOW());

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 2: departments
-- Organizational departments; supports a parent_id for sub-departments.
-- ---------------------------------------------------------------------------
CREATE TABLE public.departments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  parent_id  UUID        NULL REFERENCES public.departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_departments_parent_id ON public.departments (parent_id);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 3: roles
-- Job-role lookup table (software-engineer, qa-engineer, etc.)
-- This is SEPARATE from the RBAC roles stored in auth.users app_metadata.
-- ---------------------------------------------------------------------------
CREATE TABLE public.roles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 4: teams
-- Teams belong to a department. manager_id FK added after profiles is created.
-- ---------------------------------------------------------------------------
CREATE TABLE public.teams (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  department_id UUID        NOT NULL REFERENCES public.departments(id),
  manager_id    UUID        NULL,  -- FK to profiles added below via ALTER TABLE
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_department_id ON public.teams (department_id);
CREATE INDEX idx_teams_manager_id    ON public.teams (manager_id);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 5: profiles
-- One profile per auth.users row. Cascades on auth user deletion.
-- department_id, role_id, team_id are nullable for users not yet fully set up.
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id            UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT          NOT NULL,
  email         TEXT          NOT NULL UNIQUE,
  department_id UUID          NULL REFERENCES public.departments(id),
  role_id       UUID          NULL REFERENCES public.roles(id),
  team_id       UUID          NULL REFERENCES public.teams(id),
  tenure_band   tenure_band_enum NULL,
  work_type     TEXT          NULL,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX idx_profiles_department_id ON public.profiles (department_id);
CREATE INDEX idx_profiles_role_id       ON public.profiles (role_id);
CREATE INDEX idx_profiles_team_id       ON public.profiles (team_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add manager_id FK from teams to profiles now that profiles exists
ALTER TABLE public.teams
  ADD CONSTRAINT fk_teams_manager
  FOREIGN KEY (manager_id) REFERENCES public.profiles(id);

-- ---------------------------------------------------------------------------
-- TABLE 6: surveys
-- The top-level survey record. anonymous_mode controls response privacy.
-- ---------------------------------------------------------------------------
CREATE TABLE public.surveys (
  id            UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT                NOT NULL,
  description   TEXT                NULL,
  status        survey_status_enum  NOT NULL DEFAULT 'draft',
  anonymous_mode BOOLEAN            NOT NULL DEFAULT TRUE,
  opens_at      TIMESTAMPTZ         NULL,
  closes_at     TIMESTAMPTZ         NULL,
  version       INT                 NOT NULL DEFAULT 1,
  created_by    UUID                NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ         DEFAULT NOW()
);

CREATE INDEX idx_surveys_status        ON public.surveys (status);
CREATE INDEX idx_surveys_anonymous_mode ON public.surveys (anonymous_mode);
CREATE INDEX idx_surveys_created_by    ON public.surveys (created_by);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 7: survey_sections
-- Sections within a survey; target_roles limits visibility of a section.
-- ---------------------------------------------------------------------------
CREATE TABLE public.survey_sections (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id     UUID        NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT        NULL,
  display_order INT         NOT NULL DEFAULT 0,
  target_roles  TEXT[]      NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_survey_sections_survey_id ON public.survey_sections (survey_id);

ALTER TABLE public.survey_sections ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 8: questions
-- Questions belong to a section. conditional_config enables skip logic.
-- ---------------------------------------------------------------------------
CREATE TABLE public.questions (
  id                 UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_section_id  UUID               NOT NULL REFERENCES public.survey_sections(id) ON DELETE CASCADE,
  type               question_type_enum NOT NULL,
  text               TEXT               NOT NULL,
  description        TEXT               NULL,
  required           BOOLEAN            NOT NULL DEFAULT FALSE,
  display_order      INT                NOT NULL DEFAULT 0,
  conditional_config JSONB              NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ        DEFAULT NOW()
);

CREATE INDEX idx_questions_survey_section_id ON public.questions (survey_section_id);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 9: question_options
-- Answer options for single_select and multi_select questions.
-- ---------------------------------------------------------------------------
CREATE TABLE public.question_options (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID        NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  text          TEXT        NOT NULL,
  value         TEXT        NOT NULL,
  display_order INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_question_options_question_id ON public.question_options (question_id);

ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 10: dimensions
-- The 12 organizational health dimensions that questions map to.
-- ---------------------------------------------------------------------------
CREATE TABLE public.dimensions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  slug        TEXT        NOT NULL UNIQUE,
  description TEXT        NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dimensions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 11: question_dimension_map
-- Many-to-many: questions map to dimensions with a weight for scoring.
-- ---------------------------------------------------------------------------
CREATE TABLE public.question_dimension_map (
  question_id  UUID        NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  dimension_id UUID        NOT NULL REFERENCES public.dimensions(id) ON DELETE CASCADE,
  weight       NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  PRIMARY KEY (question_id, dimension_id)
);

CREATE INDEX idx_qdm_dimension_id ON public.question_dimension_map (dimension_id);

ALTER TABLE public.question_dimension_map ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 12: survey_audiences
-- Defines which departments/roles a survey targets.
-- NULL department_id + NULL role_id = company-wide survey.
-- ---------------------------------------------------------------------------
CREATE TABLE public.survey_audiences (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id            UUID        NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  target_department_id UUID        NULL REFERENCES public.departments(id),
  target_role_id       UUID        NULL REFERENCES public.roles(id),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_survey_audiences_survey_id ON public.survey_audiences (survey_id);

ALTER TABLE public.survey_audiences ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 13: participation_tokens
-- Tracks WHO submitted a response.
--
-- PRIVACY DESIGN: participation_tokens tracks WHO submitted a response.
-- It is intentionally NOT linked to the responses table via any FK or shared
-- unique key. The only shared column is survey_id, which alone cannot identify
-- a specific response. This structural separation means it is impossible to
-- reconstruct "which response belongs to which user" even with direct database
-- access — the join key does not exist.
-- ---------------------------------------------------------------------------
CREATE TABLE public.participation_tokens (
  id           UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id    UUID             NOT NULL REFERENCES public.surveys(id),
  user_id      UUID             NOT NULL REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  department_id UUID            NULL REFERENCES public.departments(id),
  role_id      UUID             NULL REFERENCES public.roles(id),
  tenure_band  tenure_band_enum NULL,
  created_at   TIMESTAMPTZ      DEFAULT NOW(),
  UNIQUE (survey_id, user_id)
);

CREATE INDEX idx_participation_tokens_survey_id ON public.participation_tokens (survey_id);
CREATE INDEX idx_participation_tokens_user_id   ON public.participation_tokens (user_id);

ALTER TABLE public.participation_tokens ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 14: responses
-- Stores WHAT was responded — no direct link to participant identity.
--
-- PRIVACY DESIGN: In anonymous surveys, user_id IS NULL.
-- There is NO foreign key to participation_tokens.
-- The only link to survey context is survey_id, which is insufficient to
-- identify which specific user produced which response — that information
-- simply does not exist anywhere in the database schema. Anonymity is
-- enforced at the schema level, not the application layer.
-- ---------------------------------------------------------------------------
CREATE TABLE public.responses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id    UUID        NOT NULL REFERENCES public.surveys(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  department   TEXT        NULL,
  role         TEXT        NULL,
  tenure_band  TEXT        NULL,
  work_type    TEXT        NULL,
  is_anonymous BOOLEAN     NOT NULL DEFAULT TRUE,
  -- user_id is NULL for anonymous surveys; populated only for non-anonymous
  -- follow-up surveys where explicit attribution is consent-based.
  user_id      UUID        NULL REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_responses_survey_id    ON public.responses (survey_id);
-- Partial index on user_id — only indexed when present (non-anonymous surveys)
CREATE INDEX idx_responses_user_id      ON public.responses (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_responses_submitted_at ON public.responses (submitted_at);

ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 15: response_answers
-- Individual answer values for each question in a response.
-- ---------------------------------------------------------------------------
CREATE TABLE public.response_answers (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id      UUID         NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
  question_id      UUID         NOT NULL REFERENCES public.questions(id),
  numeric_value    NUMERIC(5,2) NULL,
  text_value       TEXT         NULL,
  selected_options JSONB        NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_response_answers_response_id  ON public.response_answers (response_id);
CREATE INDEX idx_response_answers_question_id  ON public.response_answers (question_id);

ALTER TABLE public.response_answers ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 16: response_drafts
-- Autosave scratchpad for in-progress survey submissions.
--
-- PRIVACY DESIGN: response_drafts is the ONLY place user_id and draft answers
-- coexist. On final submission: (1) anonymous responses are inserted WITHOUT
-- user_id, (2) a participation_token is created, (3) this draft row is DELETED.
-- The draft is a working scratchpad, never a permanent record.
-- ---------------------------------------------------------------------------
CREATE TABLE public.response_drafts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id        UUID        NOT NULL REFERENCES public.surveys(id),
  user_id          UUID        NOT NULL REFERENCES auth.users(id),
  section_progress JSONB       NOT NULL DEFAULT '{}',
  answers_draft    JSONB       NOT NULL DEFAULT '{}',
  last_saved_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (survey_id, user_id)
);

CREATE INDEX idx_response_drafts_survey_id ON public.response_drafts (survey_id);
CREATE INDEX idx_response_drafts_user_id   ON public.response_drafts (user_id);

ALTER TABLE public.response_drafts ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 17: response_metadata
-- Point-in-time snapshot of respondent segmentation at submission time.
-- Uses JSONB to avoid live FK to profiles — profile data can change after
-- the survey closes but the snapshot records what was true at submission.
-- ---------------------------------------------------------------------------
CREATE TABLE public.response_metadata (
  response_id           UUID  PRIMARY KEY REFERENCES public.responses(id) ON DELETE CASCADE,
  segmentation_snapshot JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE public.response_metadata ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 18: derived_metrics
-- Pre-computed aggregates refreshed when a survey is closed.
-- Segment_type examples: 'overall', 'department', 'tenure_band', 'work_type'
-- ---------------------------------------------------------------------------
CREATE TABLE public.derived_metrics (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id        UUID         NOT NULL REFERENCES public.surveys(id),
  dimension_id     UUID         NULL REFERENCES public.dimensions(id),
  segment_type     TEXT         NULL,
  segment_value    TEXT         NULL,
  avg_score        NUMERIC(5,2) NULL,
  favorable_pct    NUMERIC(5,2) NULL,
  neutral_pct      NUMERIC(5,2) NULL,
  unfavorable_pct  NUMERIC(5,2) NULL,
  respondent_count INT          NOT NULL DEFAULT 0,
  computed_at      TIMESTAMPTZ  DEFAULT NOW(),
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_derived_metrics_survey_id    ON public.derived_metrics (survey_id);
CREATE INDEX idx_derived_metrics_dimension_id ON public.derived_metrics (dimension_id);

ALTER TABLE public.derived_metrics ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 19: qualitative_tags
-- Admin/analyst-assigned tags on individual text answers.
-- ---------------------------------------------------------------------------
CREATE TABLE public.qualitative_tags (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  response_answer_id UUID       NOT NULL REFERENCES public.response_answers(id) ON DELETE CASCADE,
  tag               TEXT        NOT NULL,
  created_by        UUID        NULL REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qualitative_tags_response_answer_id ON public.qualitative_tags (response_answer_id);

ALTER TABLE public.qualitative_tags ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 20: qualitative_themes
-- Analyst-synthesized themes grouping related qualitative tags.
-- ---------------------------------------------------------------------------
CREATE TABLE public.qualitative_themes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id   UUID        NOT NULL REFERENCES public.surveys(id),
  theme       TEXT        NOT NULL,
  tag_cluster TEXT[]      NOT NULL DEFAULT '{}',
  summary     TEXT        NULL,
  is_positive BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qualitative_themes_survey_id ON public.qualitative_themes (survey_id);

ALTER TABLE public.qualitative_themes ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 21: action_items
-- Improvement actions linked to survey findings. is_public controls
-- employee visibility — the transparency mechanism.
-- ---------------------------------------------------------------------------
CREATE TABLE public.action_items (
  id                UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id         UUID                 NULL REFERENCES public.surveys(id),
  title             TEXT                 NOT NULL,
  problem_statement TEXT                 NULL,
  owner_id          UUID                 NULL REFERENCES auth.users(id),
  department_id     UUID                 NULL REFERENCES public.departments(id),
  priority          action_priority_enum NOT NULL DEFAULT 'medium',
  target_date       DATE                 NULL,
  status            action_status_enum   NOT NULL DEFAULT 'identified',
  success_criteria  TEXT                 NULL,
  is_public         BOOLEAN              NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ          DEFAULT NOW()
);

CREATE INDEX idx_action_items_is_public    ON public.action_items (is_public);
CREATE INDEX idx_action_items_status       ON public.action_items (status);
CREATE INDEX idx_action_items_survey_id    ON public.action_items (survey_id);
CREATE INDEX idx_action_items_department_id ON public.action_items (department_id);

ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 22: action_updates
-- Progress updates posted to action items. Visible to all authenticated users.
-- ---------------------------------------------------------------------------
CREATE TABLE public.action_updates (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  action_item_id UUID        NOT NULL REFERENCES public.action_items(id) ON DELETE CASCADE,
  content        TEXT        NOT NULL,
  created_by     UUID        NULL REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_action_updates_action_item_id ON public.action_updates (action_item_id);

ALTER TABLE public.action_updates ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 23: publication_snapshots
-- Immutable JSONB blobs capturing survey results at publication time.
--
-- IMMUTABILITY: No UPDATE or DELETE is ever allowed on this table.
-- RLS enforces INSERT + SELECT only. Application code must never send UPDATE.
-- The trigger below enforces this at the DB level as belt-and-suspenders.
-- ---------------------------------------------------------------------------
CREATE TABLE public.publication_snapshots (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id     UUID        NOT NULL REFERENCES public.surveys(id),
  snapshot_data JSONB       NOT NULL DEFAULT '{}',
  published_by  UUID        NULL REFERENCES auth.users(id),
  published_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_publication_snapshots_survey_id ON public.publication_snapshots (survey_id);

-- Immutability trigger: prevents any UPDATE or DELETE at the database level
CREATE OR REPLACE FUNCTION prevent_snapshot_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'publication_snapshots is immutable — no updates or deletes are permitted';
END;
$$;

CREATE TRIGGER no_update_publication_snapshots
  BEFORE UPDATE OR DELETE ON public.publication_snapshots
  FOR EACH ROW EXECUTE FUNCTION prevent_snapshot_mutation();

ALTER TABLE public.publication_snapshots ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- TABLE 24: audit_logs
-- System-wide audit trail for security and compliance.
-- ---------------------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID        NULL REFERENCES auth.users(id),
  action      TEXT        NOT NULL,
  table_name  TEXT        NULL,
  record_id   UUID        NULL,
  before_data JSONB       NULL,
  after_data  JSONB       NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id    ON public.audit_logs (actor_id);
CREATE INDEX idx_audit_logs_table_name  ON public.audit_logs (table_name);
CREATE INDEX idx_audit_logs_created_at  ON public.audit_logs (created_at);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
