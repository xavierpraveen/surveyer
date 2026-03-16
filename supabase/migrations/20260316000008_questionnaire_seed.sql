-- =============================================================================
-- Migration 8: PDF Questionnaire Seed
-- =============================================================================
-- Adds questions from the external PDF questionnaire to the existing
-- Organizational Health Diagnostic survey (55500000-0000-0000-0000-000000000001).
--
-- Strategy:
--   • Common Questions       → new section 13 (target_roles: all)
--   • Engineering Team       → new section 14 (target_roles: Engineering)
--   • QA Team                → new section 15 (target_roles: Quality Assurance)
--   • UI/UX Team             → new section 16 (target_roles: Engineering — no separate dept)
--   • Project Managers       → new section 17 (target_roles: Leadership)
--   • Sales / Business Team  → new section 18 (target_roles: Sales & Business)
--   • Architects / Tech Lead → new section 19 (target_roles: Leadership,Engineering)
--   • HR / Operations        → new section 20 (target_roles: HR & Operations)
--   • Marketing              → new section 21 (target_roles: {} — all, no marketing dept)
--
-- Section IDs: 66600000-0000-0000-0000-000000000013 … 021
-- Question IDs: 77700000-0000-0000-0000-000000001NNN (block starting at 1000)
--   Block 1000-1005 : Common
--   Block 1010-1015 : Engineering
--   Block 1020-1024 : QA
--   Block 1030-1033 : UI/UX
--   Block 1040-1043 : Project Managers
--   Block 1050-1053 : Sales / Business
--   Block 1060-1063 : Architects / Tech Lead
--   Block 1070-1073 : HR / Operations
--   Block 1080-1082 : Marketing
--
-- Type mapping:
--   (1–5)  rating  → likert_5
--   (1–10) rating  → likert_10
--   open text      → short_text
--
-- Idempotent: wrapped in DO $$ … $$ blocks; uses ON CONFLICT DO NOTHING for
-- INSERT statements so the migration is safe to re-run.
-- =============================================================================

DO $$
BEGIN

-- ---------------------------------------------------------------------------
-- SECTION 13: Company-Wide Questions  (all employees)
-- ---------------------------------------------------------------------------
INSERT INTO public.survey_sections
  (id, survey_id, title, description, display_order, target_roles)
VALUES
  ('66600000-0000-0000-0000-000000000013',
   '55500000-0000-0000-0000-000000000001',
   'Company-Wide Questions',
   'Questions for all employees covering company direction, daily challenges, and overall satisfaction.',
   13, '{}')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SECTION 14: Engineering Team
-- ---------------------------------------------------------------------------
INSERT INTO public.survey_sections
  (id, survey_id, title, description, display_order, target_roles)
VALUES
  ('66600000-0000-0000-0000-000000000014',
   '55500000-0000-0000-0000-000000000001',
   'Engineering Team',
   'Questions specific to software engineers covering requirements, deep work, code reviews, and productivity blockers.',
   14, '{"Engineering"}')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SECTION 15: QA Team
-- ---------------------------------------------------------------------------
INSERT INTO public.survey_sections
  (id, survey_id, title, description, display_order, target_roles)
VALUES
  ('66600000-0000-0000-0000-000000000015',
   '55500000-0000-0000-0000-000000000001',
   'QA Team',
   'Questions specific to QA engineers covering requirement clarity, architecture impact on quality, and early involvement.',
   15, '{"Quality Assurance"}')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SECTION 16: UI/UX Team
-- ---------------------------------------------------------------------------
INSERT INTO public.survey_sections
  (id, survey_id, title, description, display_order, target_roles)
VALUES
  ('66600000-0000-0000-0000-000000000016',
   '55500000-0000-0000-0000-000000000001',
   'UI/UX Team',
   'Questions specific to designers covering requirement communication, exploration time, and design-engineering collaboration.',
   16, '{"Engineering"}')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SECTION 17: Project Managers
-- ---------------------------------------------------------------------------
INSERT INTO public.survey_sections
  (id, survey_id, title, description, display_order, target_roles)
VALUES
  ('66600000-0000-0000-0000-000000000017',
   '55500000-0000-0000-0000-000000000001',
   'Project Managers',
   'Questions specific to project managers covering presales estimates, documentation, and delivery issues.',
   17, '{"Leadership"}')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SECTION 18: Sales / Business Team
-- ---------------------------------------------------------------------------
INSERT INTO public.survey_sections
  (id, survey_id, title, description, display_order, target_roles)
VALUES
  ('66600000-0000-0000-0000-000000000018',
   '55500000-0000-0000-0000-000000000001',
   'Sales / Business Team',
   'Questions specific to the sales and business team covering technical support, presales challenges, and scope changes.',
   18, '{"Sales & Business"}')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SECTION 19: Architects / Technical Leadership
-- ---------------------------------------------------------------------------
INSERT INTO public.survey_sections
  (id, survey_id, title, description, display_order, target_roles)
VALUES
  ('66600000-0000-0000-0000-000000000019',
   '55500000-0000-0000-0000-000000000001',
   'Architects & Technical Leadership',
   'Questions specific to architects and technical leaders covering architecture consistency, technical risks, and debt.',
   19, '{"Leadership","Engineering"}')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SECTION 20: HR / Operations
-- ---------------------------------------------------------------------------
INSERT INTO public.survey_sections
  (id, survey_id, title, description, display_order, target_roles)
VALUES
  ('66600000-0000-0000-0000-000000000020',
   '55500000-0000-0000-0000-000000000001',
   'HR / Operations',
   'Questions specific to HR and operations covering employee morale, common concerns, and culture improvements.',
   20, '{"HR & Operations"}')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SECTION 21: Marketing
-- ---------------------------------------------------------------------------
INSERT INTO public.survey_sections
  (id, survey_id, title, description, display_order, target_roles)
VALUES
  ('66600000-0000-0000-0000-000000000021',
   '55500000-0000-0000-0000-000000000001',
   'Marketing',
   'Questions specific to the marketing team covering internal communication of product capabilities and collaboration with product.',
   21, '{}')
ON CONFLICT (id) DO NOTHING;

END $$;

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 13: Company-Wide Questions (6 questions)
-- Q IDs: 77700000-0000-0000-0000-000000001000 … 1005
-- ---------------------------------------------------------------------------
INSERT INTO public.questions
  (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000001000',
   '66600000-0000-0000-0000-000000000013',
   'likert_5',
   'How clearly do you understand the company''s goals and direction?',
   '1 = Not at all clear, 5 = Very clear',
   TRUE, 1),

  ('77700000-0000-0000-0000-000000001001',
   '66600000-0000-0000-0000-000000000013',
   'likert_5',
   'Do you feel your work contributes meaningfully to company outcomes?',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 2),

  ('77700000-0000-0000-0000-000000001002',
   '66600000-0000-0000-0000-000000000013',
   'short_text',
   'What is the biggest challenge you face in your daily work?',
   NULL,
   FALSE, 3),

  ('77700000-0000-0000-0000-000000001003',
   '66600000-0000-0000-0000-000000000013',
   'short_text',
   'What is one improvement that would make your work easier?',
   NULL,
   FALSE, 4),

  ('77700000-0000-0000-0000-000000001004',
   '66600000-0000-0000-0000-000000000013',
   'likert_10',
   'How satisfied are you working at the company?',
   '1 = Very dissatisfied, 10 = Very satisfied',
   TRUE, 5),

  ('77700000-0000-0000-0000-000000001005',
   '66600000-0000-0000-0000-000000000013',
   'likert_10',
   'Would you recommend this company as a workplace?',
   '1 = Definitely not, 10 = Definitely yes',
   TRUE, 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight)
VALUES
  ('77700000-0000-0000-0000-000000001000', '44400000-0000-0000-0000-000000000001', 1.0),  -- Org Clarity
  ('77700000-0000-0000-0000-000000001001', '44400000-0000-0000-0000-000000000001', 0.8),  -- Org Clarity
  ('77700000-0000-0000-0000-000000001004', '44400000-0000-0000-0000-000000000012', 1.0),  -- Overall Satisfaction
  ('77700000-0000-0000-0000-000000001005', '44400000-0000-0000-0000-000000000012', 1.0)   -- Overall Satisfaction
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 14: Engineering Team (6 questions)
-- Q IDs: 77700000-0000-0000-0000-000000001010 … 1015
-- ---------------------------------------------------------------------------
INSERT INTO public.questions
  (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000001010',
   '66600000-0000-0000-0000-000000000014',
   'likert_5',
   'Are project requirements clear before development starts?',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 1),

  ('77700000-0000-0000-0000-000000001011',
   '66600000-0000-0000-0000-000000000014',
   'likert_5',
   'How often do architecture decisions change mid-project?',
   '1 = Very rarely, 5 = Very frequently',
   TRUE, 2),

  ('77700000-0000-0000-0000-000000001012',
   '66600000-0000-0000-0000-000000000014',
   'likert_5',
   'Do you have enough time for deep work without interruptions?',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 3),

  ('77700000-0000-0000-0000-000000001013',
   '66600000-0000-0000-0000-000000000014',
   'short_text',
   'What technical problems occur repeatedly across projects?',
   NULL,
   FALSE, 4),

  ('77700000-0000-0000-0000-000000001014',
   '66600000-0000-0000-0000-000000000014',
   'likert_5',
   'Do code reviews help improve quality?',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 5),

  ('77700000-0000-0000-0000-000000001015',
   '66600000-0000-0000-0000-000000000014',
   'short_text',
   'What slows down engineering productivity the most?',
   NULL,
   FALSE, 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight)
VALUES
  ('77700000-0000-0000-0000-000000001010', '44400000-0000-0000-0000-000000000002', 1.0),  -- Sales-to-Eng Handover
  ('77700000-0000-0000-0000-000000001011', '44400000-0000-0000-0000-000000000003', 1.0),  -- Arch & Tech Governance
  ('77700000-0000-0000-0000-000000001012', '44400000-0000-0000-0000-000000000004', 1.0),  -- Eng Productivity
  ('77700000-0000-0000-0000-000000001014', '44400000-0000-0000-0000-000000000007', 1.0)   -- Quality & Testing
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 15: QA Team (5 questions)
-- Q IDs: 77700000-0000-0000-0000-000000001020 … 1024
-- ---------------------------------------------------------------------------
INSERT INTO public.questions
  (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000001020',
   '66600000-0000-0000-0000-000000000015',
   'likert_5',
   'Are requirements clear enough to design test cases?',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 1),

  ('77700000-0000-0000-0000-000000001021',
   '66600000-0000-0000-0000-000000000015',
   'likert_5',
   'How often do you discover issues caused by unclear architecture?',
   '1 = Very rarely, 5 = Very frequently',
   TRUE, 2),

  ('77700000-0000-0000-0000-000000001022',
   '66600000-0000-0000-0000-000000000015',
   'likert_5',
   'Is QA involved early enough in the development lifecycle?',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 3),

  ('77700000-0000-0000-0000-000000001023',
   '66600000-0000-0000-0000-000000000015',
   'short_text',
   'What are the most common quality issues across projects?',
   NULL,
   FALSE, 4),

  ('77700000-0000-0000-0000-000000001024',
   '66600000-0000-0000-0000-000000000015',
   'short_text',
   'What improvements would increase product quality?',
   NULL,
   FALSE, 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight)
VALUES
  ('77700000-0000-0000-0000-000000001020', '44400000-0000-0000-0000-000000000002', 0.8),  -- Sales-to-Eng Handover
  ('77700000-0000-0000-0000-000000001021', '44400000-0000-0000-0000-000000000003', 1.0),  -- Arch & Tech Governance
  ('77700000-0000-0000-0000-000000001022', '44400000-0000-0000-0000-000000000007', 1.0)   -- Quality & Testing
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 16: UI/UX Team (4 questions)
-- Q IDs: 77700000-0000-0000-0000-000000001030 … 1033
-- ---------------------------------------------------------------------------
INSERT INTO public.questions
  (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000001030',
   '66600000-0000-0000-0000-000000000016',
   'likert_5',
   'Are design requirements clearly communicated?',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 1),

  ('77700000-0000-0000-0000-000000001031',
   '66600000-0000-0000-0000-000000000016',
   'likert_5',
   'Do designers have enough time to explore solutions before development?',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 2),

  ('77700000-0000-0000-0000-000000001032',
   '66600000-0000-0000-0000-000000000016',
   'likert_5',
   'How well do design and engineering collaborate?',
   '1 = Very poorly, 5 = Excellently',
   TRUE, 3),

  ('77700000-0000-0000-0000-000000001033',
   '66600000-0000-0000-0000-000000000016',
   'short_text',
   'What improvements would enhance the design process?',
   NULL,
   FALSE, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight)
VALUES
  ('77700000-0000-0000-0000-000000001030', '44400000-0000-0000-0000-000000000002', 0.8),  -- Sales-to-Eng Handover
  ('77700000-0000-0000-0000-000000001031', '44400000-0000-0000-0000-000000000004', 0.8),  -- Eng Productivity
  ('77700000-0000-0000-0000-000000001032', '44400000-0000-0000-0000-000000000005', 1.0)   -- Team Structure & Work Allocation
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 17: Project Managers (4 questions)
-- Q IDs: 77700000-0000-0000-0000-000000001040 … 1043
-- ---------------------------------------------------------------------------
INSERT INTO public.questions
  (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000001040',
   '66600000-0000-0000-0000-000000000017',
   'likert_5',
   'How accurate are the estimates provided during presales?',
   '1 = Very inaccurate, 5 = Very accurate',
   TRUE, 1),

  ('77700000-0000-0000-0000-000000001041',
   '66600000-0000-0000-0000-000000000017',
   'likert_5',
   'Do you receive sufficient technical documentation before projects begin?',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 2),

  ('77700000-0000-0000-0000-000000001042',
   '66600000-0000-0000-0000-000000000017',
   'short_text',
   'What issues occur most often during project delivery?',
   NULL,
   FALSE, 3),

  ('77700000-0000-0000-0000-000000001043',
   '66600000-0000-0000-0000-000000000017',
   'short_text',
   'How can project execution be improved?',
   NULL,
   FALSE, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight)
VALUES
  ('77700000-0000-0000-0000-000000001040', '44400000-0000-0000-0000-000000000006', 1.0),  -- Delivery & PM
  ('77700000-0000-0000-0000-000000001041', '44400000-0000-0000-0000-000000000002', 0.8)   -- Sales-to-Eng Handover
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 18: Sales / Business Team (4 questions)
-- Q IDs: 77700000-0000-0000-0000-000000001050 … 1053
-- ---------------------------------------------------------------------------
INSERT INTO public.questions
  (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000001050',
   '66600000-0000-0000-0000-000000000018',
   'likert_5',
   'Do you have sufficient technical support during presales?',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 1),

  ('77700000-0000-0000-0000-000000001051',
   '66600000-0000-0000-0000-000000000018',
   'short_text',
   'What technical challenges occur during proposal creation?',
   NULL,
   FALSE, 2),

  ('77700000-0000-0000-0000-000000001052',
   '66600000-0000-0000-0000-000000000018',
   'likert_5',
   'How often do project scopes change after contracts are signed?',
   '1 = Very rarely, 5 = Very frequently',
   TRUE, 3),

  ('77700000-0000-0000-0000-000000001053',
   '66600000-0000-0000-0000-000000000018',
   'short_text',
   'What would improve the presales technical process?',
   NULL,
   FALSE, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight)
VALUES
  ('77700000-0000-0000-0000-000000001050', '44400000-0000-0000-0000-000000000002', 1.0),  -- Sales-to-Eng Handover
  ('77700000-0000-0000-0000-000000001052', '44400000-0000-0000-0000-000000000006', 0.8)   -- Delivery & PM
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 19: Architects & Technical Leadership (4 questions)
-- Q IDs: 77700000-0000-0000-0000-000000001060 … 1063
-- ---------------------------------------------------------------------------
INSERT INTO public.questions
  (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000001060',
   '66600000-0000-0000-0000-000000000019',
   'likert_5',
   'How consistent are architecture practices across projects?',
   '1 = Very inconsistent, 5 = Very consistent',
   TRUE, 1),

  ('77700000-0000-0000-0000-000000001061',
   '66600000-0000-0000-0000-000000000019',
   'short_text',
   'What are the biggest technical risks facing the company today?',
   NULL,
   FALSE, 2),

  ('77700000-0000-0000-0000-000000001062',
   '66600000-0000-0000-0000-000000000019',
   'short_text',
   'Where do you see the most technical debt?',
   NULL,
   FALSE, 3),

  ('77700000-0000-0000-0000-000000001063',
   '66600000-0000-0000-0000-000000000019',
   'short_text',
   'What architectural improvements should be prioritized?',
   NULL,
   FALSE, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight)
VALUES
  ('77700000-0000-0000-0000-000000001060', '44400000-0000-0000-0000-000000000003', 1.0),  -- Arch & Tech Governance
  ('77700000-0000-0000-0000-000000001061', '44400000-0000-0000-0000-000000000003', 0.8),  -- Arch & Tech Governance
  ('77700000-0000-0000-0000-000000001062', '44400000-0000-0000-0000-000000000003', 0.8)   -- Arch & Tech Governance
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 20: HR / Operations (4 questions)
-- Q IDs: 77700000-0000-0000-0000-000000001070 … 1073
-- ---------------------------------------------------------------------------
INSERT INTO public.questions
  (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000001070',
   '66600000-0000-0000-0000-000000000020',
   'likert_5',
   'How would you describe overall employee morale?',
   '1 = Very low, 5 = Very high',
   TRUE, 1),

  ('77700000-0000-0000-0000-000000001071',
   '66600000-0000-0000-0000-000000000020',
   'short_text',
   'What are the most common employee concerns?',
   NULL,
   FALSE, 2),

  ('77700000-0000-0000-0000-000000001072',
   '66600000-0000-0000-0000-000000000020',
   'short_text',
   'What policies could improve employee wellbeing?',
   NULL,
   FALSE, 3),

  ('77700000-0000-0000-0000-000000001073',
   '66600000-0000-0000-0000-000000000020',
   'short_text',
   'What improvements would strengthen company culture?',
   NULL,
   FALSE, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight)
VALUES
  ('77700000-0000-0000-0000-000000001070', '44400000-0000-0000-0000-000000000010', 1.0),  -- Culture & Work Env
  ('77700000-0000-0000-0000-000000001071', '44400000-0000-0000-0000-000000000010', 0.8),  -- Culture & Work Env
  ('77700000-0000-0000-0000-000000001072', '44400000-0000-0000-0000-000000000010', 0.8)   -- Culture & Work Env
ON CONFLICT (question_id, dimension_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 21: Marketing (3 questions)
-- Q IDs: 77700000-0000-0000-0000-000000001080 … 1082
-- ---------------------------------------------------------------------------
INSERT INTO public.questions
  (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000001080',
   '66600000-0000-0000-0000-000000000021',
   'likert_5',
   'How well do internal teams communicate product capabilities?',
   '1 = Very poorly, 5 = Excellently',
   TRUE, 1),

  ('77700000-0000-0000-0000-000000001081',
   '66600000-0000-0000-0000-000000000021',
   'likert_5',
   'Do marketing and product teams collaborate effectively?',
   '1 = Strongly disagree, 5 = Strongly agree',
   TRUE, 2),

  ('77700000-0000-0000-0000-000000001082',
   '66600000-0000-0000-0000-000000000021',
   'short_text',
   'What improvements would help marketing better represent the company''s work?',
   NULL,
   FALSE, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight)
VALUES
  ('77700000-0000-0000-0000-000000001080', '44400000-0000-0000-0000-000000000005', 0.8),  -- Team Structure
  ('77700000-0000-0000-0000-000000001081', '44400000-0000-0000-0000-000000000005', 1.0)   -- Team Structure
ON CONFLICT (question_id, dimension_id) DO NOTHING;
