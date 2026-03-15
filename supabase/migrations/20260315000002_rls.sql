-- =============================================================================
-- Migration 2: Row Level Security policies + JWT role helper
-- =============================================================================
-- CRITICAL RULES enforced throughout this migration:
--   1. NEVER reference the profiles table inside a USING() predicate.
--      Doing so causes infinite recursion (profiles itself has RLS, so Postgres
--      re-enters the policy engine when evaluating the policy).
--   2. ALWAYS use auth.jwt()->'app_metadata'->>'role' (via the helper below)
--      for all role-based checks. The JWT is evaluated in memory — zero DB queries.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- HELPER FUNCTION: current_user_role()
-- Reads the app RBAC role from JWT app_metadata.
-- SECURITY DEFINER so it runs as the function owner (postgres/admin), not the
-- calling user. This prevents any privilege escalation via search_path.
-- NEVER queries the profiles table — reads the JWT claim only.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.jwt()->'app_metadata'->>'role'
$$;

-- Grant execute to authenticated so policies can call it
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- =============================================================================
-- TABLE: app_settings
-- All authenticated users can read settings (privacy thresholds, etc.)
-- Only admin and hr_admin can update settings.
-- =============================================================================
CREATE POLICY "app_settings: authenticated read"
  ON public.app_settings AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "app_settings: admin update"
  ON public.app_settings AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'hr_admin'));

-- =============================================================================
-- TABLE: departments
-- All authenticated users can read; only admin/hr_admin can mutate.
-- =============================================================================
CREATE POLICY "departments: authenticated read"
  ON public.departments AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "departments: admin write"
  ON public.departments AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'hr_admin'));

CREATE POLICY "departments: admin update"
  ON public.departments AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'hr_admin'));

CREATE POLICY "departments: admin delete"
  ON public.departments AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() IN ('admin', 'hr_admin'));

-- =============================================================================
-- TABLE: roles (job role lookup)
-- All authenticated users can read; only admin/hr_admin can mutate.
-- =============================================================================
CREATE POLICY "roles: authenticated read"
  ON public.roles AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "roles: admin write"
  ON public.roles AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'hr_admin'));

CREATE POLICY "roles: admin update"
  ON public.roles AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'hr_admin'));

CREATE POLICY "roles: admin delete"
  ON public.roles AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() IN ('admin', 'hr_admin'));

-- =============================================================================
-- TABLE: teams
-- All authenticated users can read; only admin/hr_admin can mutate.
-- =============================================================================
CREATE POLICY "teams: authenticated read"
  ON public.teams AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "teams: admin write"
  ON public.teams AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'hr_admin'));

CREATE POLICY "teams: admin update"
  ON public.teams AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'hr_admin'));

CREATE POLICY "teams: admin delete"
  ON public.teams AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() IN ('admin', 'hr_admin'));

-- =============================================================================
-- TABLE: profiles
-- NOTE: All USING() clauses use auth.uid() or current_user_role() (JWT-based).
--       The profiles table is NEVER referenced inside a USING() predicate —
--       that would cause infinite recursion.
-- =============================================================================

-- Employees see their own profile only
CREATE POLICY "profiles: employee sees own"
  ON public.profiles AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (auth.uid() = id AND current_user_role() = 'employee');

-- Managers see all profiles (team scoping is enforced at the application layer in Phase 2)
CREATE POLICY "profiles: manager sees all"
  ON public.profiles AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (current_user_role() = 'manager');

-- Leadership, admin, hr_admin, survey_analyst can see all profiles
CREATE POLICY "profiles: leadership and admin see all"
  ON public.profiles AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (current_user_role() IN ('leadership', 'admin', 'hr_admin', 'survey_analyst'));

-- Employees can update their own profile (e.g., work_type, tenure_band)
CREATE POLICY "profiles: employee updates own"
  ON public.profiles AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND current_user_role() = 'employee');

-- Admins can update any profile (for roster management)
CREATE POLICY "profiles: admin updates any"
  ON public.profiles AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'hr_admin'));

-- Only admin/hr_admin can insert profiles (employee roster import)
CREATE POLICY "profiles: admin inserts"
  ON public.profiles AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'hr_admin'));

-- =============================================================================
-- TABLE: surveys
-- Employees/managers see open surveys only.
-- Leadership/admin/survey_analyst can see all surveys.
-- =============================================================================
CREATE POLICY "surveys: employee sees open"
  ON public.surveys AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (
    status = 'open'
    AND current_user_role() IN ('employee', 'manager')
  );

CREATE POLICY "surveys: elevated roles see all"
  ON public.surveys AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (current_user_role() IN ('leadership', 'admin', 'survey_analyst', 'hr_admin'));

CREATE POLICY "surveys: creators write"
  ON public.surveys AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'survey_analyst', 'leadership'));

CREATE POLICY "surveys: creators update"
  ON public.surveys AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst', 'leadership'));

CREATE POLICY "surveys: admin delete"
  ON public.surveys AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() = 'admin');

-- =============================================================================
-- TABLE: survey_sections
-- All authenticated users can read; admin/survey_analyst can mutate.
-- =============================================================================
CREATE POLICY "survey_sections: authenticated read"
  ON public.survey_sections AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "survey_sections: analyst write"
  ON public.survey_sections AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "survey_sections: analyst update"
  ON public.survey_sections AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "survey_sections: analyst delete"
  ON public.survey_sections AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

-- =============================================================================
-- TABLE: questions
-- All authenticated users can read; admin/survey_analyst can mutate.
-- =============================================================================
CREATE POLICY "questions: authenticated read"
  ON public.questions AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "questions: analyst write"
  ON public.questions AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "questions: analyst update"
  ON public.questions AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "questions: analyst delete"
  ON public.questions AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

-- =============================================================================
-- TABLE: question_options
-- All authenticated users can read; admin/survey_analyst can mutate.
-- =============================================================================
CREATE POLICY "question_options: authenticated read"
  ON public.question_options AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "question_options: analyst write"
  ON public.question_options AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "question_options: analyst update"
  ON public.question_options AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "question_options: analyst delete"
  ON public.question_options AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

-- =============================================================================
-- TABLE: dimensions
-- All authenticated users can read; admin/survey_analyst can mutate.
-- =============================================================================
CREATE POLICY "dimensions: authenticated read"
  ON public.dimensions AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "dimensions: analyst write"
  ON public.dimensions AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "dimensions: analyst update"
  ON public.dimensions AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "dimensions: analyst delete"
  ON public.dimensions AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

-- =============================================================================
-- TABLE: question_dimension_map
-- All authenticated users can read; admin/survey_analyst can mutate.
-- =============================================================================
CREATE POLICY "qdm: authenticated read"
  ON public.question_dimension_map AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "qdm: analyst write"
  ON public.question_dimension_map AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "qdm: analyst update"
  ON public.question_dimension_map AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "qdm: analyst delete"
  ON public.question_dimension_map AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

-- =============================================================================
-- TABLE: survey_audiences
-- All authenticated users can read; admin/survey_analyst can mutate.
-- =============================================================================
CREATE POLICY "survey_audiences: authenticated read"
  ON public.survey_audiences AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "survey_audiences: analyst write"
  ON public.survey_audiences AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "survey_audiences: analyst update"
  ON public.survey_audiences AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "survey_audiences: analyst delete"
  ON public.survey_audiences AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

-- =============================================================================
-- TABLE: participation_tokens
-- PRIVACY: No policy enables a join from participation_tokens to responses —
-- they share only survey_id which is insufficient to identify a specific response.
--
-- Employees insert their own token on submission and can see their own token
-- (to confirm they have already responded). Managers and elevated roles can
-- see tokens by survey (for participation rate dashboards) but they do NOT
-- have access to individual response content via this table.
-- =============================================================================
CREATE POLICY "participation_tokens: employee inserts own"
  ON public.participation_tokens AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "participation_tokens: employee sees own"
  ON public.participation_tokens AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Managers and elevated roles see tokens by survey (participation rates only)
CREATE POLICY "participation_tokens: managers see survey tokens"
  ON public.participation_tokens AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (current_user_role() IN ('manager', 'leadership', 'admin', 'hr_admin', 'survey_analyst'));

-- =============================================================================
-- TABLE: responses
-- PRIVACY: employees and managers cannot SELECT from responses directly.
-- Anonymity is preserved by routing all analytics through SECURITY DEFINER
-- views (migration 3) that enforce privacy thresholds. Only elevated analytical
-- roles have direct table access — and even they should prefer the views.
--
-- Any authenticated user can INSERT a response (the act of submitting).
-- =============================================================================
CREATE POLICY "responses: authenticated insert"
  ON public.responses AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only elevated analytical roles can SELECT from responses directly.
-- Employees and managers are excluded — they use SECURITY DEFINER aggregate views.
CREATE POLICY "responses: analytics roles select"
  ON public.responses AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (current_user_role() IN ('leadership', 'admin', 'survey_analyst'));

-- =============================================================================
-- TABLE: response_answers
-- Same privacy model as responses.
-- =============================================================================
CREATE POLICY "response_answers: authenticated insert"
  ON public.response_answers AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "response_answers: analytics roles select"
  ON public.response_answers AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (current_user_role() IN ('leadership', 'admin', 'survey_analyst'));

-- =============================================================================
-- TABLE: response_drafts
-- Employees CRUD only their own drafts. Admins can read all drafts (support).
-- =============================================================================
CREATE POLICY "response_drafts: employee crud own"
  ON public.response_drafts AS PERMISSIVE FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "response_drafts: admin select all"
  ON public.response_drafts AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (current_user_role() IN ('admin', 'hr_admin'));

-- =============================================================================
-- TABLE: response_metadata
-- Inserted at submission time; readable by analytical roles.
-- =============================================================================
CREATE POLICY "response_metadata: authenticated insert"
  ON public.response_metadata AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "response_metadata: analytics roles select"
  ON public.response_metadata AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (current_user_role() IN ('leadership', 'admin', 'survey_analyst'));

-- =============================================================================
-- TABLE: derived_metrics
-- Pre-aggregated — safe for all authenticated users to read.
-- Admin/survey_analyst compute and write these.
-- =============================================================================
CREATE POLICY "derived_metrics: authenticated read"
  ON public.derived_metrics AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "derived_metrics: analyst write"
  ON public.derived_metrics AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "derived_metrics: analyst update"
  ON public.derived_metrics AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

-- =============================================================================
-- TABLE: qualitative_tags
-- Analyst-assigned tags on response answers.
-- =============================================================================
CREATE POLICY "qualitative_tags: analyst insert"
  ON public.qualitative_tags AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "qualitative_tags: analyst and leadership read"
  ON public.qualitative_tags AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst', 'leadership'));

CREATE POLICY "qualitative_tags: analyst update"
  ON public.qualitative_tags AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

CREATE POLICY "qualitative_tags: analyst delete"
  ON public.qualitative_tags AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst'));

-- =============================================================================
-- TABLE: qualitative_themes
-- Synthesized themes — all authenticated users can read published themes.
-- Only analyst/leadership/admin can write.
-- =============================================================================
CREATE POLICY "qualitative_themes: authenticated read"
  ON public.qualitative_themes AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "qualitative_themes: analyst write"
  ON public.qualitative_themes AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'survey_analyst', 'leadership'));

CREATE POLICY "qualitative_themes: analyst update"
  ON public.qualitative_themes AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst', 'leadership'));

CREATE POLICY "qualitative_themes: analyst delete"
  ON public.qualitative_themes AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() IN ('admin', 'survey_analyst', 'leadership'));

-- =============================================================================
-- TABLE: action_items
-- Public items (is_public=TRUE) are visible to all authenticated users.
-- Elevated roles see all items.
-- Only leadership and admin can create/update action items.
-- =============================================================================
CREATE POLICY "action_items: public items visible to all"
  ON public.action_items AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (is_public = TRUE);

CREATE POLICY "action_items: elevated roles see all"
  ON public.action_items AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (current_user_role() IN ('leadership', 'admin', 'hr_admin', 'survey_analyst', 'manager'));

CREATE POLICY "action_items: leadership writes"
  ON public.action_items AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('leadership', 'admin'));

CREATE POLICY "action_items: leadership updates"
  ON public.action_items AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('leadership', 'admin'));

CREATE POLICY "action_items: admin deletes"
  ON public.action_items AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() = 'admin');

-- =============================================================================
-- TABLE: action_updates
-- All authenticated users can read updates (public-facing progress).
-- Users can post updates to items they own; admin/leadership can moderate.
-- =============================================================================
CREATE POLICY "action_updates: authenticated read"
  ON public.action_updates AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "action_updates: owners post"
  ON public.action_updates AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "action_updates: admin moderates update"
  ON public.action_updates AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (current_user_role() IN ('admin', 'leadership'));

CREATE POLICY "action_updates: admin moderates delete"
  ON public.action_updates AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (current_user_role() IN ('admin', 'leadership'));

-- =============================================================================
-- TABLE: publication_snapshots
-- Immutable — SELECT and INSERT only.
-- No UPDATE policy exists. The trigger in migration 1 blocks UPDATE at DB level.
-- =============================================================================
CREATE POLICY "publication_snapshots: authenticated read"
  ON public.publication_snapshots AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "publication_snapshots: creators insert"
  ON public.publication_snapshots AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('leadership', 'admin', 'survey_analyst'));

-- NOTE: No UPDATE policy — immutability is enforced by both:
-- (1) absence of UPDATE policy here, and
-- (2) the prevent_snapshot_mutation() trigger in migration 1.

-- =============================================================================
-- TABLE: audit_logs
-- Any authenticated action can insert an audit log.
-- Only admin/hr_admin can read audit logs (compliance).
-- =============================================================================
CREATE POLICY "audit_logs: authenticated insert"
  ON public.audit_logs AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "audit_logs: admin read"
  ON public.audit_logs AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (current_user_role() IN ('admin', 'hr_admin'));
