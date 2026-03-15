-- Phase 2 seed: survey activation + dimension mappings
-- Idempotent: ON CONFLICT DO NOTHING on all inserts
-- Run after: 20260315000004_seed.sql
-- =============================================================================
-- This migration:
--   1. Opens the diagnostic survey (status = 'open', sets opens_at / closes_at)
--   2. Adds 3 role-specific sections for engineering / QA / architects
--   3. Inserts questions for those new sections
--   4. Adds cross-cutting secondary dimension mappings for 8 existing questions
--   5. Inserts dimension mappings for all new questions
--   6. Verifies that question_dimension_map has >= 60 rows
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ACTIVATE THE SURVEY
-- ---------------------------------------------------------------------------
UPDATE public.surveys
SET
  status     = 'open',
  opens_at   = NOW() - INTERVAL '1 day',
  closes_at  = NOW() + INTERVAL '30 days'
WHERE id = '55500000-0000-0000-0000-000000000001';

-- ---------------------------------------------------------------------------
-- 2. ROLE-SPECIFIC SECTIONS
--    Section 14: Deep Technical Practices  (engineering, qa, architects)
--    Section 15: Code Review & Collaboration (engineering, architects)
--    Section 16: QA Depth & Test Strategy    (qa)
-- ---------------------------------------------------------------------------
INSERT INTO public.survey_sections (id, survey_id, title, description, display_order, target_roles)
VALUES
  ('66600000-0000-0000-0000-000000000014',
   '55500000-0000-0000-0000-000000000001',
   'Deep Technical Practices',
   'Technical debt management, deployment confidence, and architectural alignment for engineers and architects',
   14,
   ARRAY['engineering','qa','architects']),

  ('66600000-0000-0000-0000-000000000015',
   '55500000-0000-0000-0000-000000000001',
   'Code Review & Collaboration',
   'Code review process, knowledge sharing across the engineering organisation, and pair/mob programming culture',
   15,
   ARRAY['engineering','architects']),

  ('66600000-0000-0000-0000-000000000016',
   '55500000-0000-0000-0000-000000000001',
   'QA Depth & Test Strategy',
   'Test strategy ownership, automation investment, and QA collaboration with developers',
   16,
   ARRAY['qa'])
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. QUESTIONS — Section 14: Deep Technical Practices (5 questions)
--    Q IDs: 77700000-...000130 through 000134
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000130',
   '66600000-0000-0000-0000-000000000014',
   'likert_5',
   'I am confident deploying to production without fear of unexpected regressions.',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 1),

  ('77700000-0000-0000-0000-000000000131',
   '66600000-0000-0000-0000-000000000014',
   'likert_5',
   'Technical debt in my area of the codebase is at a manageable level.',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 2),

  ('77700000-0000-0000-0000-000000000132',
   '66600000-0000-0000-0000-000000000014',
   'likert_5',
   'The architectural guidelines in place help me make good local design decisions.',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 3),

  ('77700000-0000-0000-0000-000000000133',
   '66600000-0000-0000-0000-000000000014',
   'likert_5',
   'Observability tooling (logging, tracing, alerting) gives me enough insight into production behaviour.',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 4),

  ('77700000-0000-0000-0000-000000000134',
   '66600000-0000-0000-0000-000000000014',
   'short_text',
   'What is the single biggest technical practice you wish the team would change or adopt?',
   NULL,
   FALSE, 5)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. QUESTIONS — Section 15: Code Review & Collaboration (4 questions)
--    Q IDs: 77700000-...000140 through 000143
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000140',
   '66600000-0000-0000-0000-000000000015',
   'likert_5',
   'Code reviews in my team are constructive and help improve code quality.',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 1),

  ('77700000-0000-0000-0000-000000000141',
   '66600000-0000-0000-0000-000000000015',
   'likert_5',
   'Reviews are completed quickly enough that they do not become a delivery bottleneck.',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 2),

  ('77700000-0000-0000-0000-000000000142',
   '66600000-0000-0000-0000-000000000015',
   'likert_5',
   'Knowledge is shared proactively across the engineering team (docs, pairing, internal talks).',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 3),

  ('77700000-0000-0000-0000-000000000143',
   '66600000-0000-0000-0000-000000000015',
   'short_text',
   'How could we improve the code review or knowledge-sharing process?',
   NULL,
   FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. QUESTIONS — Section 16: QA Depth & Test Strategy (4 questions)
--    Q IDs: 77700000-...000150 through 000153
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000150',
   '66600000-0000-0000-0000-000000000016',
   'likert_5',
   'Our test automation investment is sufficient to support the pace of development.',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 1),

  ('77700000-0000-0000-0000-000000000151',
   '66600000-0000-0000-0000-000000000016',
   'likert_5',
   'QA is involved early enough in the development cycle to catch design-level issues.',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 2),

  ('77700000-0000-0000-0000-000000000152',
   '66600000-0000-0000-0000-000000000016',
   'likert_5',
   'The team has a clear, shared understanding of what quality means for each feature we ship.',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 3),

  ('77700000-0000-0000-0000-000000000153',
   '66600000-0000-0000-0000-000000000016',
   'short_text',
   'What would most improve our approach to testing and quality assurance?',
   NULL,
   FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. DIMENSION MAPPINGS — new questions in role-specific sections
-- ---------------------------------------------------------------------------

-- Section 14: Deep Technical Practices
--   Q130 → Engineering Productivity (deployment confidence)
--   Q131 → Architecture & Technical Governance (tech debt) + Engineering Productivity
--   Q132 → Architecture & Technical Governance
--   Q133 → Engineering Productivity
INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000130', '44400000-0000-0000-0000-000000000004', 1.0),  -- Eng Productivity
  ('77700000-0000-0000-0000-000000000131', '44400000-0000-0000-0000-000000000003', 1.0),  -- Arch Governance
  ('77700000-0000-0000-0000-000000000131', '44400000-0000-0000-0000-000000000004', 0.7),  -- Eng Productivity (secondary)
  ('77700000-0000-0000-0000-000000000132', '44400000-0000-0000-0000-000000000003', 1.0),  -- Arch Governance
  ('77700000-0000-0000-0000-000000000133', '44400000-0000-0000-0000-000000000004', 1.0)   -- Eng Productivity
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- Section 15: Code Review & Collaboration
--   Q140 → Quality & Testing (review quality) + Architecture & Technical Governance
--   Q141 → Engineering Productivity (review speed)
--   Q142 → Innovation & Learning (knowledge sharing) + Team Structure
INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000140', '44400000-0000-0000-0000-000000000007', 1.0),  -- Quality & Testing
  ('77700000-0000-0000-0000-000000000140', '44400000-0000-0000-0000-000000000003', 0.7),  -- Arch Governance (secondary)
  ('77700000-0000-0000-0000-000000000141', '44400000-0000-0000-0000-000000000004', 1.0),  -- Eng Productivity
  ('77700000-0000-0000-0000-000000000142', '44400000-0000-0000-0000-000000000011', 1.0),  -- Innovation & Learning
  ('77700000-0000-0000-0000-000000000142', '44400000-0000-0000-0000-000000000005', 0.7)   -- Team Structure (secondary)
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- Section 16: QA Depth & Test Strategy
--   Q150 → Quality & Testing + Engineering Productivity
--   Q151 → Quality & Testing + Sales-to-Engineering Handover
--   Q152 → Quality & Testing
INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000150', '44400000-0000-0000-0000-000000000007', 1.0),  -- Quality & Testing
  ('77700000-0000-0000-0000-000000000150', '44400000-0000-0000-0000-000000000004', 0.7),  -- Eng Productivity (secondary)
  ('77700000-0000-0000-0000-000000000151', '44400000-0000-0000-0000-000000000007', 1.0),  -- Quality & Testing
  ('77700000-0000-0000-0000-000000000151', '44400000-0000-0000-0000-000000000002', 0.7),  -- Sales-Eng Handover (secondary)
  ('77700000-0000-0000-0000-000000000152', '44400000-0000-0000-0000-000000000007', 1.0)   -- Quality & Testing
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. CROSS-CUTTING SECONDARY DIMENSION MAPPINGS — existing Phase 1 questions
--    8 questions that meaningfully span two dimensions.
--    Primary mapping already in Phase 1 seed; these add the secondary dimension.
-- ---------------------------------------------------------------------------

-- Q081 (regular feedback helps me improve) → also touches Leadership & Management
INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000081', '44400000-0000-0000-0000-000000000009', 0.7)  -- Leadership & Mgmt
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- Q082 (ACME invests in professional skills) → also touches Innovation & Learning
INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000082', '44400000-0000-0000-0000-000000000011', 0.7)  -- Innovation & Learning
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- Q092 (senior leadership demonstrates values) → also touches Culture & Work Environment
INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000092', '44400000-0000-0000-0000-000000000010', 0.7)  -- Culture & Work Env
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- Q094 (decision-making is transparent) → also touches Organizational Clarity
INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000094', '44400000-0000-0000-0000-000000000001', 0.7)  -- Org Clarity
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- Q110 (ACME encourages experimentation) → also touches Culture & Work Environment
INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000110', '44400000-0000-0000-0000-000000000010', 0.7)  -- Culture & Work Env
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- Q112 (we reflect on how to improve) → also touches Delivery & Project Management
INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000112', '44400000-0000-0000-0000-000000000006', 0.7)  -- Delivery & PM
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- Q054 (cross-functional collaboration effective) → also touches Delivery & Project Management
INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000054', '44400000-0000-0000-0000-000000000006', 0.7)  -- Delivery & PM
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- Q022 (business and engineering collaborate on scoping) → also touches Org Clarity
INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000022', '44400000-0000-0000-0000-000000000001', 0.7)  -- Org Clarity
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. ASSERTION — ensure at least 60 dimension mappings exist
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  mapped_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mapped_count FROM public.question_dimension_map;
  IF mapped_count < 60 THEN
    RAISE EXCEPTION 'Expected at least 60 question_dimension_map rows, got %', mapped_count;
  END IF;
END $$;
