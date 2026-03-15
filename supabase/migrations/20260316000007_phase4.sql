-- Phase 4 schema migration: archived flag, dimension links, publication snapshot uniqueness
-- Applied: 2026-03-16

-- 1. Add archived column to surveys table (ADMIN-08: survey archival)
ALTER TABLE public.surveys
  ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_surveys_archived ON public.surveys (archived);

-- 2. Add dimension_ids array column to action_items (ACTIONS-01: link actions to dimensions)
ALTER TABLE public.action_items
  ADD COLUMN dimension_ids UUID[] NOT NULL DEFAULT '{}';

CREATE INDEX idx_action_items_dimension_ids ON public.action_items USING GIN (dimension_ids);

-- 3. Add UNIQUE constraint to publication_snapshots (PUBLISH-04: one immutable snapshot per survey)
ALTER TABLE public.publication_snapshots
  ADD CONSTRAINT uq_publication_snapshots_survey_id UNIQUE (survey_id);
