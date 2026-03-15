-- =============================================================================
-- Migration 4: Seed Data
-- =============================================================================
-- Provides: 5 departments, 8 job roles, 18 auth users (all 6 RBAC roles,
-- all 5 tenure bands), 12 dimensions, 1 diagnostic survey with 13 sections
-- and ~65 questions, plus 3 action items.
--
-- All UUIDs are hardcoded so downstream migrations and tests can reference them.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- DEPARTMENTS (5)
-- ---------------------------------------------------------------------------
INSERT INTO public.departments (id, name, slug) VALUES
  ('11100000-0000-0000-0000-000000000001', 'Engineering',         'engineering'),
  ('11100000-0000-0000-0000-000000000002', 'Quality Assurance',   'qa'),
  ('11100000-0000-0000-0000-000000000003', 'Sales & Business',    'sales-business'),
  ('11100000-0000-0000-0000-000000000004', 'HR & Operations',     'hr-operations'),
  ('11100000-0000-0000-0000-000000000005', 'Leadership',          'leadership');

-- ---------------------------------------------------------------------------
-- JOB ROLES — lookup table (8), separate from RBAC roles in app_metadata
-- ---------------------------------------------------------------------------
INSERT INTO public.roles (id, name, slug) VALUES
  ('22200000-0000-0000-0000-000000000001', 'Software Engineer',  'software-engineer'),
  ('22200000-0000-0000-0000-000000000002', 'QA Engineer',        'qa-engineer'),
  ('22200000-0000-0000-0000-000000000003', 'Sales Representative','sales'),
  ('22200000-0000-0000-0000-000000000004', 'HR Specialist',      'hr-specialist'),
  ('22200000-0000-0000-0000-000000000005', 'Product Manager',    'product-manager'),
  ('22200000-0000-0000-0000-000000000006', 'Architect',          'architect'),
  ('22200000-0000-0000-0000-000000000007', 'Marketing Specialist','marketing'),
  ('22200000-0000-0000-0000-000000000008', 'Executive',          'executive');

-- ---------------------------------------------------------------------------
-- AUTH USERS + PROFILES (18 users)
-- User IDs follow pattern: 33300000-0000-0000-0000-000000000XXX
-- raw_app_meta_data contains the RBAC role read by the JWT/RLS policies.
-- ---------------------------------------------------------------------------

-- ---- EMPLOYEES (8) ----

-- Alice Chen — Engineering, software-engineer, 1-2y tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000001',
  'alice.chen@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"employee"}',
  '{"full_name":"Alice Chen"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000001',
  'Alice Chen', 'alice.chen@acme.dev',
  '11100000-0000-0000-0000-000000000001',
  '22200000-0000-0000-0000-000000000001',
  '1-2y', 'hybrid'
);

-- Bob Kim — Engineering, software-engineer, 2-5y tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000002',
  'bob.kim@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"employee"}',
  '{"full_name":"Bob Kim"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000002',
  'Bob Kim', 'bob.kim@acme.dev',
  '11100000-0000-0000-0000-000000000001',
  '22200000-0000-0000-0000-000000000001',
  '2-5y', 'remote'
);

-- Carol Patel — QA, qa-engineer, 0-6m tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000003',
  'carol.patel@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"employee"}',
  '{"full_name":"Carol Patel"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000003',
  'Carol Patel', 'carol.patel@acme.dev',
  '11100000-0000-0000-0000-000000000002',
  '22200000-0000-0000-0000-000000000002',
  '0-6m', 'onsite'
);

-- David Nguyen — Sales, sales, 6-12m tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000004',
  'david.nguyen@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"employee"}',
  '{"full_name":"David Nguyen"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000004',
  'David Nguyen', 'david.nguyen@acme.dev',
  '11100000-0000-0000-0000-000000000003',
  '22200000-0000-0000-0000-000000000003',
  '6-12m', 'remote'
);

-- Eve Rodriguez — HR, hr-specialist, 5y+ tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000005',
  'eve.rodriguez@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"employee"}',
  '{"full_name":"Eve Rodriguez"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000005',
  'Eve Rodriguez', 'eve.rodriguez@acme.dev',
  '11100000-0000-0000-0000-000000000004',
  '22200000-0000-0000-0000-000000000004',
  '5y+', 'hybrid'
);

-- Frank Osei — Engineering, product-manager, 2-5y tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000006',
  'frank.osei@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"employee"}',
  '{"full_name":"Frank Osei"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000006',
  'Frank Osei', 'frank.osei@acme.dev',
  '11100000-0000-0000-0000-000000000001',
  '22200000-0000-0000-0000-000000000005',
  '2-5y', 'remote'
);

-- Grace Li — QA, qa-engineer, 1-2y tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000007',
  'grace.li@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"employee"}',
  '{"full_name":"Grace Li"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000007',
  'Grace Li', 'grace.li@acme.dev',
  '11100000-0000-0000-0000-000000000002',
  '22200000-0000-0000-0000-000000000002',
  '1-2y', 'hybrid'
);

-- Henry Muller — Sales, marketing, 0-6m tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000008',
  'henry.muller@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"employee"}',
  '{"full_name":"Henry Muller"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000008',
  'Henry Muller', 'henry.muller@acme.dev',
  '11100000-0000-0000-0000-000000000003',
  '22200000-0000-0000-0000-000000000007',
  '0-6m', 'onsite'
);

-- ---- MANAGERS (3) ----

-- Iris Yamamoto — Engineering manager, 5y+ tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000009',
  'iris.yamamoto@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"manager"}',
  '{"full_name":"Iris Yamamoto"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000009',
  'Iris Yamamoto', 'iris.yamamoto@acme.dev',
  '11100000-0000-0000-0000-000000000001',
  '22200000-0000-0000-0000-000000000006',
  '5y+', 'hybrid'
);

-- Jake Solomon — QA/Sales manager, 2-5y tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000010',
  'jake.solomon@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"manager"}',
  '{"full_name":"Jake Solomon"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000010',
  'Jake Solomon', 'jake.solomon@acme.dev',
  '11100000-0000-0000-0000-000000000003',
  '22200000-0000-0000-0000-000000000005',
  '2-5y', 'onsite'
);

-- Karen Brooks — HR manager, 6-12m tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000011',
  'karen.brooks@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"manager"}',
  '{"full_name":"Karen Brooks"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000011',
  'Karen Brooks', 'karen.brooks@acme.dev',
  '11100000-0000-0000-0000-000000000004',
  '22200000-0000-0000-0000-000000000004',
  '6-12m', 'hybrid'
);

-- ---- LEADERSHIP (2) ----

-- Leo Torres — CEO/CTO, Leadership dept, 5y+ tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000012',
  'leo.torres@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"leadership"}',
  '{"full_name":"Leo Torres"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000012',
  'Leo Torres', 'leo.torres@acme.dev',
  '11100000-0000-0000-0000-000000000005',
  '22200000-0000-0000-0000-000000000008',
  '5y+', 'onsite'
);

-- Maya Johnson — VP Operations, Leadership dept, 5y+ tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000013',
  'maya.johnson@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"leadership"}',
  '{"full_name":"Maya Johnson"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000013',
  'Maya Johnson', 'maya.johnson@acme.dev',
  '11100000-0000-0000-0000-000000000005',
  '22200000-0000-0000-0000-000000000008',
  '5y+', 'hybrid'
);

-- ---- ADMINS (2) ----

-- Noah Hassan — System admin, HR dept, 1-2y tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000014',
  'noah.hassan@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"admin"}',
  '{"full_name":"Noah Hassan"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000014',
  'Noah Hassan', 'noah.hassan@acme.dev',
  '11100000-0000-0000-0000-000000000004',
  '22200000-0000-0000-0000-000000000004',
  '1-2y', 'remote'
);

-- Olivia Park — Platform admin, Engineering dept, 2-5y tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000015',
  'olivia.park@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"admin"}',
  '{"full_name":"Olivia Park"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000015',
  'Olivia Park', 'olivia.park@acme.dev',
  '11100000-0000-0000-0000-000000000001',
  '22200000-0000-0000-0000-000000000001',
  '2-5y', 'hybrid'
);

-- ---- HR_ADMIN (1) ----

-- Peter White — HR admin, HR dept, 6-12m tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000016',
  'peter.white@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"hr_admin"}',
  '{"full_name":"Peter White"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000016',
  'Peter White', 'peter.white@acme.dev',
  '11100000-0000-0000-0000-000000000004',
  '22200000-0000-0000-0000-000000000004',
  '6-12m', 'onsite'
);

-- ---- SURVEY_ANALYST (1) ----

-- Quinn Garcia — Survey analyst, Engineering dept, 1-2y tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000017',
  'quinn.garcia@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"survey_analyst"}',
  '{"full_name":"Quinn Garcia"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000017',
  'Quinn Garcia', 'quinn.garcia@acme.dev',
  '11100000-0000-0000-0000-000000000001',
  '22200000-0000-0000-0000-000000000005',
  '1-2y', 'remote'
);

-- ---- 18th user: extra employee for broader coverage ----
-- Ruby Santos — Sales, sales, 5y+ tenure
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  '33300000-0000-0000-0000-000000000018',
  'ruby.santos@acme.dev',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"employee"}',
  '{"full_name":"Ruby Santos"}',
  NOW(), NOW(), 'authenticated', 'authenticated'
);
INSERT INTO public.profiles (id, full_name, email, department_id, role_id, tenure_band, work_type)
VALUES (
  '33300000-0000-0000-0000-000000000018',
  'Ruby Santos', 'ruby.santos@acme.dev',
  '11100000-0000-0000-0000-000000000003',
  '22200000-0000-0000-0000-000000000003',
  '5y+', 'onsite'
);

-- ---------------------------------------------------------------------------
-- DIMENSIONS (12)
-- ---------------------------------------------------------------------------
INSERT INTO public.dimensions (id, name, slug, description) VALUES
  ('44400000-0000-0000-0000-000000000001',
   'Organizational Clarity',
   'org-clarity',
   'Clarity of company direction, goals, and priorities'),

  ('44400000-0000-0000-0000-000000000002',
   'Sales-to-Engineering Handover',
   'sales-eng-handover',
   'Quality of requirements and handoff from business to engineering'),

  ('44400000-0000-0000-0000-000000000003',
   'Architecture & Technical Governance',
   'arch-governance',
   'Code quality, architectural decisions, tech debt management'),

  ('44400000-0000-0000-0000-000000000004',
   'Engineering Productivity',
   'eng-productivity',
   'Developer tooling, CI/CD, blockers, and delivery velocity'),

  ('44400000-0000-0000-0000-000000000005',
   'Team Structure & Work Allocation',
   'team-structure',
   'Team size, workload balance, and collaboration effectiveness'),

  ('44400000-0000-0000-0000-000000000006',
   'Delivery & Project Management',
   'delivery-pm',
   'Project planning, estimation accuracy, and delivery predictability'),

  ('44400000-0000-0000-0000-000000000007',
   'Quality & Testing',
   'quality-testing',
   'Test coverage, QA processes, and defect rates'),

  ('44400000-0000-0000-0000-000000000008',
   'Career Growth',
   'career-growth',
   'Learning opportunities, promotion paths, and skill development'),

  ('44400000-0000-0000-0000-000000000009',
   'Leadership & Management',
   'leadership-mgmt',
   'Manager effectiveness, feedback quality, and psychological safety'),

  ('44400000-0000-0000-0000-000000000010',
   'Culture & Work Environment',
   'culture-env',
   'Team morale, inclusion, work-life balance, remote/hybrid experience'),

  ('44400000-0000-0000-0000-000000000011',
   'Innovation & Learning',
   'innovation-learning',
   'Experimentation culture, knowledge sharing, and continuous improvement'),

  ('44400000-0000-0000-0000-000000000012',
   'Overall Satisfaction',
   'overall-satisfaction',
   'Overall employee satisfaction and likelihood to recommend');

-- ---------------------------------------------------------------------------
-- DIAGNOSTIC SURVEY
-- ---------------------------------------------------------------------------
INSERT INTO public.surveys (id, title, description, status, anonymous_mode, created_by)
VALUES (
  '55500000-0000-0000-0000-000000000001',
  'Organizational Health Diagnostic Q1 2026',
  'Quarterly organizational health survey covering all 12 dimensions',
  'draft',
  TRUE,
  '33300000-0000-0000-0000-000000000014'  -- noah.hassan (admin)
);

-- ---------------------------------------------------------------------------
-- SURVEY SECTIONS (13)
-- Section 0: About You
-- Sections 1-12: one per dimension
-- ---------------------------------------------------------------------------
INSERT INTO public.survey_sections (id, survey_id, title, description, display_order, target_roles)
VALUES
  -- Section 0: About You (all roles)
  ('66600000-0000-0000-0000-000000000000',
   '55500000-0000-0000-0000-000000000001',
   'About You', 'Help us understand your context (answers are used only for segmentation)', 0, '{}'),

  -- Section 1: Organizational Clarity
  ('66600000-0000-0000-0000-000000000001',
   '55500000-0000-0000-0000-000000000001',
   'Organizational Clarity', 'Clarity of company direction, goals, and priorities', 1, '{}'),

  -- Section 2: Sales-to-Engineering Handover
  ('66600000-0000-0000-0000-000000000002',
   '55500000-0000-0000-0000-000000000001',
   'Sales-to-Engineering Handover', 'Quality of requirements and handoff from business to engineering', 2, '{}'),

  -- Section 3: Architecture & Technical Governance
  ('66600000-0000-0000-0000-000000000003',
   '55500000-0000-0000-0000-000000000001',
   'Architecture & Technical Governance', 'Code quality, architectural decisions, tech debt management', 3, '{"employee","manager"}'),

  -- Section 4: Engineering Productivity
  ('66600000-0000-0000-0000-000000000004',
   '55500000-0000-0000-0000-000000000001',
   'Engineering Productivity', 'Developer tooling, CI/CD, blockers, and delivery velocity', 4, '{"employee","manager"}'),

  -- Section 5: Team Structure & Work Allocation
  ('66600000-0000-0000-0000-000000000005',
   '55500000-0000-0000-0000-000000000001',
   'Team Structure & Work Allocation', 'Team size, workload balance, and collaboration effectiveness', 5, '{}'),

  -- Section 6: Delivery & Project Management
  ('66600000-0000-0000-0000-000000000006',
   '55500000-0000-0000-0000-000000000001',
   'Delivery & Project Management', 'Project planning, estimation accuracy, and delivery predictability', 6, '{}'),

  -- Section 7: Quality & Testing
  ('66600000-0000-0000-0000-000000000007',
   '55500000-0000-0000-0000-000000000001',
   'Quality & Testing', 'Test coverage, QA processes, and defect rates', 7, '{}'),

  -- Section 8: Career Growth
  ('66600000-0000-0000-0000-000000000008',
   '55500000-0000-0000-0000-000000000001',
   'Career Growth', 'Learning opportunities, promotion paths, and skill development', 8, '{}'),

  -- Section 9: Leadership & Management
  ('66600000-0000-0000-0000-000000000009',
   '55500000-0000-0000-0000-000000000001',
   'Leadership & Management', 'Manager effectiveness, feedback quality, and psychological safety', 9, '{}'),

  -- Section 10: Culture & Work Environment
  ('66600000-0000-0000-0000-000000000010',
   '55500000-0000-0000-0000-000000000001',
   'Culture & Work Environment', 'Team morale, inclusion, work-life balance, remote/hybrid experience', 10, '{}'),

  -- Section 11: Innovation & Learning
  ('66600000-0000-0000-0000-000000000011',
   '55500000-0000-0000-0000-000000000001',
   'Innovation & Learning', 'Experimentation culture, knowledge sharing, and continuous improvement', 11, '{}'),

  -- Section 12: Overall Satisfaction
  ('66600000-0000-0000-0000-000000000012',
   '55500000-0000-0000-0000-000000000001',
   'Overall Satisfaction', 'Overall employee satisfaction and likelihood to recommend', 12, '{}');

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 0: About You (2 questions)
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000001',
   '66600000-0000-0000-0000-000000000000',
   'single_select',
   'What is your primary work arrangement?',
   TRUE, 1),

  ('77700000-0000-0000-0000-000000000002',
   '66600000-0000-0000-0000-000000000000',
   'single_select',
   'Which department are you primarily based in?',
   TRUE, 2);

INSERT INTO public.question_options (question_id, text, value, display_order) VALUES
  ('77700000-0000-0000-0000-000000000001', 'Fully remote',  'remote',  1),
  ('77700000-0000-0000-0000-000000000001', 'Hybrid',        'hybrid',  2),
  ('77700000-0000-0000-0000-000000000001', 'On-site',       'onsite',  3),
  ('77700000-0000-0000-0000-000000000002', 'Engineering',   'engineering', 1),
  ('77700000-0000-0000-0000-000000000002', 'QA',            'qa',          2),
  ('77700000-0000-0000-0000-000000000002', 'Sales',         'sales',       3),
  ('77700000-0000-0000-0000-000000000002', 'HR / Operations','hr',          4),
  ('77700000-0000-0000-0000-000000000002', 'Leadership',    'leadership',  5);

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 1: Organizational Clarity (4 questions)
-- Q IDs: 77700000-...010 through 013
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000010',
   '66600000-0000-0000-0000-000000000001',
   'likert_5', 'I understand the company''s strategic priorities for this year.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 1),

  ('77700000-0000-0000-0000-000000000011',
   '66600000-0000-0000-0000-000000000001',
   'likert_5', 'Leadership communicates direction changes clearly and in a timely manner.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 2),

  ('77700000-0000-0000-0000-000000000012',
   '66600000-0000-0000-0000-000000000001',
   'likert_5', 'I know how my day-to-day work connects to the company''s goals.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 3),

  ('77700000-0000-0000-0000-000000000013',
   '66600000-0000-0000-0000-000000000001',
   'short_text', 'What could improve organizational clarity at ACME?',
   NULL, FALSE, 4),

  ('77700000-0000-0000-0000-000000000014',
   '66600000-0000-0000-0000-000000000001',
   'likert_5', 'Goals and OKRs are reviewed and adjusted at a cadence that keeps them relevant.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 5);

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000010', '44400000-0000-0000-0000-000000000001', 1.0),
  ('77700000-0000-0000-0000-000000000011', '44400000-0000-0000-0000-000000000001', 1.0),
  ('77700000-0000-0000-0000-000000000012', '44400000-0000-0000-0000-000000000001', 1.0),
  ('77700000-0000-0000-0000-000000000014', '44400000-0000-0000-0000-000000000001', 1.0);

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 2: Sales-to-Engineering Handover (4 questions)
-- Q IDs: 77700000-...020 through 023
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000020',
   '66600000-0000-0000-0000-000000000002',
   'likert_5', 'Requirements from sales/business are clear when they reach engineering.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 1),

  ('77700000-0000-0000-0000-000000000021',
   '66600000-0000-0000-0000-000000000002',
   'likert_5', 'We rarely build the wrong thing because of misunderstood requirements.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 2),

  ('77700000-0000-0000-0000-000000000022',
   '66600000-0000-0000-0000-000000000002',
   'likert_5', 'Business and engineering collaborate effectively on scoping.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 3),

  ('77700000-0000-0000-0000-000000000023',
   '66600000-0000-0000-0000-000000000002',
   'short_text', 'What would improve the handover process between sales and engineering?',
   NULL, FALSE, 4),

  ('77700000-0000-0000-0000-000000000024',
   '66600000-0000-0000-0000-000000000002',
   'likert_5', 'Customer feedback is effectively incorporated into product requirements.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 5);

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000020', '44400000-0000-0000-0000-000000000002', 1.0),
  ('77700000-0000-0000-0000-000000000021', '44400000-0000-0000-0000-000000000002', 1.0),
  ('77700000-0000-0000-0000-000000000022', '44400000-0000-0000-0000-000000000002', 1.0),
  ('77700000-0000-0000-0000-000000000024', '44400000-0000-0000-0000-000000000002', 1.0);

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 3: Architecture & Technical Governance (4 questions)
-- Q IDs: 77700000-...030 through 033
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000030',
   '66600000-0000-0000-0000-000000000003',
   'likert_5', 'Our codebase has a clear architectural vision that the team understands.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 1),

  ('77700000-0000-0000-0000-000000000031',
   '66600000-0000-0000-0000-000000000003',
   'likert_5', 'Technical debt is actively managed and not impeding new feature delivery.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 2),

  ('77700000-0000-0000-0000-000000000032',
   '66600000-0000-0000-0000-000000000003',
   'likert_5', 'Architecture decisions are made with appropriate input and documented well.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 3),

  ('77700000-0000-0000-0000-000000000033',
   '66600000-0000-0000-0000-000000000003',
   'short_text', 'What could improve our technical governance process?',
   NULL, FALSE, 4),

  ('77700000-0000-0000-0000-000000000034',
   '66600000-0000-0000-0000-000000000003',
   'likert_5', 'Our approach to managing legacy code and refactoring is effective.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 5);

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000030', '44400000-0000-0000-0000-000000000003', 1.0),
  ('77700000-0000-0000-0000-000000000031', '44400000-0000-0000-0000-000000000003', 1.0),
  ('77700000-0000-0000-0000-000000000032', '44400000-0000-0000-0000-000000000003', 1.0),
  ('77700000-0000-0000-0000-000000000034', '44400000-0000-0000-0000-000000000003', 1.0);

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 4: Engineering Productivity (5 questions)
-- Q IDs: 77700000-...040 through 044
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000040',
   '66600000-0000-0000-0000-000000000004',
   'likert_5', 'My development environment and tooling help me work efficiently.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 1),

  ('77700000-0000-0000-0000-000000000041',
   '66600000-0000-0000-0000-000000000004',
   'likert_5', 'Our CI/CD pipeline is fast and reliable.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 2),

  ('77700000-0000-0000-0000-000000000042',
   '66600000-0000-0000-0000-000000000004',
   'likert_5', 'I rarely spend time blocked waiting for other teams, decisions, or dependencies.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 3),

  ('77700000-0000-0000-0000-000000000043',
   '66600000-0000-0000-0000-000000000004',
   'short_text', 'What is the biggest productivity blocker you face regularly?',
   NULL, FALSE, 4),

  ('77700000-0000-0000-0000-000000000044',
   '66600000-0000-0000-0000-000000000004',
   'likert_5', 'Deployments to production are smooth and low-risk.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 5);

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000040', '44400000-0000-0000-0000-000000000004', 1.0),
  ('77700000-0000-0000-0000-000000000041', '44400000-0000-0000-0000-000000000004', 1.0),
  ('77700000-0000-0000-0000-000000000042', '44400000-0000-0000-0000-000000000004', 1.0),
  ('77700000-0000-0000-0000-000000000044', '44400000-0000-0000-0000-000000000004', 1.0);

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 5: Team Structure & Work Allocation (4 questions)
-- Q IDs: 77700000-...050 through 053
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000050',
   '66600000-0000-0000-0000-000000000005',
   'likert_5', 'My team is appropriately sized to handle its responsibilities.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 1),

  ('77700000-0000-0000-0000-000000000051',
   '66600000-0000-0000-0000-000000000005',
   'likert_5', 'Work is distributed fairly and balanced across my team.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 2),

  ('77700000-0000-0000-0000-000000000052',
   '66600000-0000-0000-0000-000000000005',
   'likert_5', 'My team collaborates effectively across disciplines and time zones.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 3),

  ('77700000-0000-0000-0000-000000000053',
   '66600000-0000-0000-0000-000000000005',
   'short_text', 'What changes would most improve how your team works together?',
   NULL, FALSE, 4),

  ('77700000-0000-0000-0000-000000000054',
   '66600000-0000-0000-0000-000000000005',
   'likert_5', 'Cross-functional collaboration between engineering, QA, and product is effective.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 5);

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000050', '44400000-0000-0000-0000-000000000005', 1.0),
  ('77700000-0000-0000-0000-000000000051', '44400000-0000-0000-0000-000000000005', 1.0),
  ('77700000-0000-0000-0000-000000000052', '44400000-0000-0000-0000-000000000005', 1.0),
  ('77700000-0000-0000-0000-000000000054', '44400000-0000-0000-0000-000000000005', 1.0);

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 6: Delivery & Project Management (4 questions)
-- Q IDs: 77700000-...060 through 063
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000060',
   '66600000-0000-0000-0000-000000000006',
   'likert_5', 'Projects are scoped and planned in a way that sets the team up for success.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 1),

  ('77700000-0000-0000-0000-000000000061',
   '66600000-0000-0000-0000-000000000006',
   'likert_5', 'Our estimates are generally accurate and commitments are kept.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 2),

  ('77700000-0000-0000-0000-000000000062',
   '66600000-0000-0000-0000-000000000006',
   'likert_5', 'Scope changes are handled in a structured way that respects the team''s capacity.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 3),

  ('77700000-0000-0000-0000-000000000063',
   '66600000-0000-0000-0000-000000000006',
   'short_text', 'What would make project delivery more predictable?',
   NULL, FALSE, 4),

  ('77700000-0000-0000-0000-000000000064',
   '66600000-0000-0000-0000-000000000006',
   'likert_5', 'Retrospectives and post-mortems lead to visible process improvements.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 5);

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000060', '44400000-0000-0000-0000-000000000006', 1.0),
  ('77700000-0000-0000-0000-000000000061', '44400000-0000-0000-0000-000000000006', 1.0),
  ('77700000-0000-0000-0000-000000000062', '44400000-0000-0000-0000-000000000006', 1.0),
  ('77700000-0000-0000-0000-000000000064', '44400000-0000-0000-0000-000000000006', 1.0);

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 7: Quality & Testing (4 questions)
-- Q IDs: 77700000-...070 through 073
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000070',
   '66600000-0000-0000-0000-000000000007',
   'likert_5', 'Our test coverage gives me confidence when shipping changes.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 1),

  ('77700000-0000-0000-0000-000000000071',
   '66600000-0000-0000-0000-000000000007',
   'likert_5', 'The QA process catches defects before they reach production.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 2),

  ('77700000-0000-0000-0000-000000000072',
   '66600000-0000-0000-0000-000000000007',
   'likert_5', 'Quality is treated as everyone''s responsibility, not just QA''s.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 3),

  ('77700000-0000-0000-0000-000000000073',
   '66600000-0000-0000-0000-000000000007',
   'short_text', 'What would improve our quality and testing practices?',
   NULL, FALSE, 4),

  ('77700000-0000-0000-0000-000000000074',
   '66600000-0000-0000-0000-000000000007',
   'likert_5', 'Performance and security testing are a standard part of our delivery process.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 5);

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000070', '44400000-0000-0000-0000-000000000007', 1.0),
  ('77700000-0000-0000-0000-000000000071', '44400000-0000-0000-0000-000000000007', 1.0),
  ('77700000-0000-0000-0000-000000000072', '44400000-0000-0000-0000-000000000007', 1.0),
  ('77700000-0000-0000-0000-000000000074', '44400000-0000-0000-0000-000000000007', 1.0);

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 8: Career Growth (4 questions)
-- Q IDs: 77700000-...080 through 083
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000080',
   '66600000-0000-0000-0000-000000000008',
   'likert_5', 'I have clear growth opportunities and a development path at ACME.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 1),

  ('77700000-0000-0000-0000-000000000081',
   '66600000-0000-0000-0000-000000000008',
   'likert_5', 'I receive regular, meaningful feedback that helps me improve.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 2),

  ('77700000-0000-0000-0000-000000000082',
   '66600000-0000-0000-0000-000000000008',
   'likert_5', 'ACME invests in my professional skills and learning.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 3),

  ('77700000-0000-0000-0000-000000000083',
   '66600000-0000-0000-0000-000000000008',
   'short_text', 'What career development support would make the most difference for you?',
   NULL, FALSE, 4);

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000080', '44400000-0000-0000-0000-000000000008', 1.0),
  ('77700000-0000-0000-0000-000000000081', '44400000-0000-0000-0000-000000000008', 1.0),
  ('77700000-0000-0000-0000-000000000082', '44400000-0000-0000-0000-000000000008', 1.0);

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 9: Leadership & Management (5 questions)
-- Q IDs: 77700000-...090 through 094
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000090',
   '66600000-0000-0000-0000-000000000009',
   'likert_5', 'My manager provides clear direction and removes obstacles for me.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 1),

  ('77700000-0000-0000-0000-000000000091',
   '66600000-0000-0000-0000-000000000009',
   'likert_5', 'I feel safe raising concerns or disagreeing with my manager.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 2),

  ('77700000-0000-0000-0000-000000000092',
   '66600000-0000-0000-0000-000000000009',
   'likert_5', 'Senior leadership demonstrates the values they ask of everyone else.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 3),

  ('77700000-0000-0000-0000-000000000093',
   '66600000-0000-0000-0000-000000000009',
   'short_text', 'What could leadership do differently to better support the team?',
   NULL, FALSE, 4),

  ('77700000-0000-0000-0000-000000000094',
   '66600000-0000-0000-0000-000000000009',
   'likert_5', 'Decision-making at ACME is transparent — we understand why decisions are made.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 5);

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000090', '44400000-0000-0000-0000-000000000009', 1.0),
  ('77700000-0000-0000-0000-000000000091', '44400000-0000-0000-0000-000000000009', 1.0),
  ('77700000-0000-0000-0000-000000000092', '44400000-0000-0000-0000-000000000009', 1.0),
  ('77700000-0000-0000-0000-000000000094', '44400000-0000-0000-0000-000000000009', 1.0);

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 10: Culture & Work Environment (5 questions)
-- Q IDs: 77700000-...100 through 104
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000100',
   '66600000-0000-0000-0000-000000000010',
   'likert_5', 'Team morale at ACME is high right now.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 1),

  ('77700000-0000-0000-0000-000000000101',
   '66600000-0000-0000-0000-000000000010',
   'likert_5', 'I feel included and respected regardless of my background.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 2),

  ('77700000-0000-0000-0000-000000000102',
   '66600000-0000-0000-0000-000000000010',
   'likert_5', 'My work schedule and workload allow for a sustainable work-life balance.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 3),

  ('77700000-0000-0000-0000-000000000103',
   '66600000-0000-0000-0000-000000000010',
   'short_text', 'What one thing would most improve the culture or work environment at ACME?',
   NULL, FALSE, 4),

  ('77700000-0000-0000-0000-000000000104',
   '66600000-0000-0000-0000-000000000010',
   'likert_5', 'Our remote and hybrid working arrangements are well supported.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 5);

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000100', '44400000-0000-0000-0000-000000000010', 1.0),
  ('77700000-0000-0000-0000-000000000101', '44400000-0000-0000-0000-000000000010', 1.0),
  ('77700000-0000-0000-0000-000000000102', '44400000-0000-0000-0000-000000000010', 1.0),
  ('77700000-0000-0000-0000-000000000104', '44400000-0000-0000-0000-000000000010', 1.0);

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 11: Innovation & Learning (4 questions)
-- Q IDs: 77700000-...110 through 113
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000110',
   '66600000-0000-0000-0000-000000000011',
   'likert_5', 'ACME encourages experimentation and learning from failure.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 1),

  ('77700000-0000-0000-0000-000000000111',
   '66600000-0000-0000-0000-000000000011',
   'likert_5', 'Knowledge and insights are shared effectively across the organisation.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 2),

  ('77700000-0000-0000-0000-000000000112',
   '66600000-0000-0000-0000-000000000011',
   'likert_5', 'We regularly reflect on how to improve the way we work.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 3),

  ('77700000-0000-0000-0000-000000000113',
   '66600000-0000-0000-0000-000000000011',
   'short_text', 'What would help ACME become a more innovative and learning-focused organisation?',
   NULL, FALSE, 4);

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000110', '44400000-0000-0000-0000-000000000011', 1.0),
  ('77700000-0000-0000-0000-000000000111', '44400000-0000-0000-0000-000000000011', 1.0),
  ('77700000-0000-0000-0000-000000000112', '44400000-0000-0000-0000-000000000011', 1.0);

-- ---------------------------------------------------------------------------
-- QUESTIONS — Section 12: Overall Satisfaction (5 questions)
-- Q IDs: 77700000-...120 through 124
-- ---------------------------------------------------------------------------
INSERT INTO public.questions (id, survey_section_id, type, text, description, required, display_order)
VALUES
  ('77700000-0000-0000-0000-000000000120',
   '66600000-0000-0000-0000-000000000012',
   'likert_5', 'Overall, I am satisfied with working at ACME.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 1),

  ('77700000-0000-0000-0000-000000000121',
   '66600000-0000-0000-0000-000000000012',
   'likert_5', 'I would recommend ACME as a great place to work.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 2),

  ('77700000-0000-0000-0000-000000000122',
   '66600000-0000-0000-0000-000000000012',
   'likert_5', 'I see myself still working at ACME in 12 months.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 3),

  ('77700000-0000-0000-0000-000000000123',
   '66600000-0000-0000-0000-000000000012',
   'short_text', 'Is there anything else you would like leadership to know?',
   NULL, FALSE, 4),

  ('77700000-0000-0000-0000-000000000124',
   '66600000-0000-0000-0000-000000000012',
   'likert_5', 'ACME acts on employee feedback and makes visible improvements.',
   '1 = Strongly disagree, 5 = Strongly agree', TRUE, 5);

INSERT INTO public.question_dimension_map (question_id, dimension_id, weight) VALUES
  ('77700000-0000-0000-0000-000000000120', '44400000-0000-0000-0000-000000000012', 1.0),
  ('77700000-0000-0000-0000-000000000121', '44400000-0000-0000-0000-000000000012', 1.0),
  ('77700000-0000-0000-0000-000000000122', '44400000-0000-0000-0000-000000000012', 1.0),
  ('77700000-0000-0000-0000-000000000124', '44400000-0000-0000-0000-000000000012', 1.0);

-- ---------------------------------------------------------------------------
-- ACTION ITEMS (3)
-- ---------------------------------------------------------------------------
INSERT INTO public.action_items (id, survey_id, title, problem_statement, owner_id, department_id, priority, status, success_criteria, is_public)
VALUES
  -- 1. Improve onboarding documentation — completed, public
  ('88800000-0000-0000-0000-000000000001',
   NULL,
   'Improve onboarding documentation',
   'New hires consistently report that onboarding documentation is outdated, scattered across multiple tools, and does not cover day-to-day engineering workflows.',
   '33300000-0000-0000-0000-000000000014',  -- noah.hassan (admin)
   '11100000-0000-0000-0000-000000000004',  -- HR & Operations
   'medium', 'completed',
   'All onboarding docs consolidated in one place; new hire satisfaction score on onboarding > 4.0/5 in post-onboarding survey.',
   TRUE),

  -- 2. Reduce CI/CD pipeline time — in_progress, public, linked to survey
  ('88800000-0000-0000-0000-000000000002',
   '55500000-0000-0000-0000-000000000001',
   'Reduce CI/CD pipeline time',
   'Average CI/CD run time exceeds 18 minutes, slowing developer feedback loops and increasing context-switching. Identified as a top productivity blocker in Engineering Productivity dimension.',
   '33300000-0000-0000-0000-000000000009',  -- iris.yamamoto (manager)
   '11100000-0000-0000-0000-000000000001',  -- Engineering
   'high', 'in_progress',
   'Average CI/CD pipeline time reduced to under 8 minutes. Flaky test rate below 2%. Measured over 30 consecutive working days.',
   TRUE),

  -- 3. Establish architecture review process — identified, private
  ('88800000-0000-0000-0000-000000000003',
   '55500000-0000-0000-0000-000000000001',
   'Establish architecture review process',
   'Architectural decisions are currently made ad-hoc without a lightweight RFC or review process, leading to inconsistent patterns and undocumented decisions.',
   '33300000-0000-0000-0000-000000000012',  -- leo.torres (leadership)
   '11100000-0000-0000-0000-000000000001',  -- Engineering
   'high', 'identified',
   'Architecture RFC template adopted and used for at least 5 new decisions within the next quarter. Template stored in team wiki.',
   FALSE);
