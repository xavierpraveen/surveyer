#!/usr/bin/env node

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const DEFAULT_EXCLUDED_EMAILS = new Set(['alice.chen@acme.dev'])
const DEFAULT_SEEDED_EMAILS = [
  'alice.chen@acme.dev',
  'bob.kim@acme.dev',
  'carol.patel@acme.dev',
  'david.nguyen@acme.dev',
  'eve.rodriguez@acme.dev',
  'frank.osei@acme.dev',
  'grace.li@acme.dev',
  'henry.muller@acme.dev',
  'ruby.santos@acme.dev',
  'iris.yamamoto@acme.dev',
  'jake.solomon@acme.dev',
  'karen.brooks@acme.dev',
  'leo.torres@acme.dev',
  'maya.johnson@acme.dev',
  'noah.hassan@acme.dev',
  'olivia.park@acme.dev',
  'peter.white@acme.dev',
  'quinn.garcia@acme.dev',
]

function parseDotEnv(content) {
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
  }
  return env
}

function loadEnv() {
  const envPath = join(ROOT, '.env.local')
  return parseDotEnv(readFileSync(envPath, 'utf8'))
}

function parseArgs(argv) {
  const parsed = { surveyId: null }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--survey-id' && argv[i + 1]) {
      parsed.surveyId = argv[i + 1]
      i += 1
    }
  }
  return parsed
}

function pickOption(options, seed) {
  if (!options || options.length === 0) return null
  return options[Math.abs(seed) % options.length]
}

export function buildAnswerValue(question, options, userIndex, email) {
  const type = question.type
  const order = Number.isFinite(question.display_order) ? question.display_order : 0

  if (type === 'likert_5') return ((order + userIndex) % 5) + 1
  if (type === 'likert_10') return ((order + userIndex) % 10) + 1

  if (type === 'single_select') {
    const picked = pickOption(options, order + userIndex)
    return picked ? picked.id : ''
  }

  if (type === 'multi_select') {
    if (!options || options.length === 0) return []
    const first = pickOption(options, order + userIndex)
    const second = pickOption(options, order + userIndex + 1)
    const chosen = [first?.id, second?.id].filter(Boolean)
    return [...new Set(chosen)]
  }

  if (type === 'short_text') {
    return `Auto response by ${email.split('@')[0]}`
  }

  if (type === 'long_text') {
    return `Automated survey response from ${email}. Team collaboration and delivery are improving with clear priorities.`
  }

  return ''
}

export function mapAnswerValueToRowFields(value) {
  return {
    text_value: typeof value === 'string' ? value : null,
    numeric_value: typeof value === 'number' ? value : null,
    selected_options: Array.isArray(value) ? value : [],
  }
}

async function resolveTargetSurvey(client, preferredSurveyId) {
  if (preferredSurveyId) {
    const r = await client.query(
      `select id, title, status, anonymous_mode
       from public.surveys
       where id = $1
       limit 1`,
      [preferredSurveyId]
    )
    return r.rows[0] ?? null
  }

  const r = await client.query(
    `select id, title, status, anonymous_mode
     from public.surveys
     where status = 'open' and coalesce(archived, false) = false
     order by created_at desc
     limit 1`
  )

  return r.rows[0] ?? null
}

async function loadSurveyShape(client, surveyId) {
  const sectionsRes = await client.query(
    `select id, title, target_roles, display_order
     from public.survey_sections
     where survey_id = $1
     order by display_order asc`,
    [surveyId]
  )
  const sections = sectionsRes.rows

  if (sections.length === 0) {
    return { sections: [], questions: [], optionsByQuestionId: new Map() }
  }

  const sectionIds = sections.map((s) => s.id)

  const questionsRes = await client.query(
    `select id, survey_section_id, type, required, display_order, text
     from public.questions
     where survey_section_id = any($1::uuid[])
     order by survey_section_id asc, display_order asc`,
    [sectionIds]
  )
  const questions = questionsRes.rows

  const optionsByQuestionId = new Map()
  if (questions.length > 0) {
    const questionIds = questions.map((q) => q.id)
    const optionsRes = await client.query(
      `select id, question_id, text, display_order
       from public.question_options
       where question_id = any($1::uuid[])
       order by display_order asc`,
      [questionIds]
    )

    for (const opt of optionsRes.rows) {
      if (!optionsByQuestionId.has(opt.question_id)) {
        optionsByQuestionId.set(opt.question_id, [])
      }
      optionsByQuestionId.get(opt.question_id).push(opt)
    }
  }

  return { sections, questions, optionsByQuestionId }
}

function getApplicableSectionIds(sections, departmentName) {
  const normalizedDepartment = (departmentName || '').toLowerCase().trim()
  const slugDepartment = normalizedDepartment.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  return sections
    .filter((section) => {
      const targetRoles = Array.isArray(section.target_roles) ? section.target_roles : []
      if (targetRoles.length === 0) return true
      if (targetRoles.includes('all')) return true
      if (!normalizedDepartment) return false

      const normalizedTargets = targetRoles.map((t) => String(t).toLowerCase().trim())
      return (
        normalizedTargets.includes(normalizedDepartment) ||
        normalizedTargets.includes(slugDepartment)
      )
    })
    .map((s) => s.id)
}

async function loadTargetUsers(client) {
  const rows = await client.query(
    `select p.id, p.email, p.department_id, p.role_id, p.tenure_band,
            d.name as department_name,
            r.name as role_name
     from public.profiles p
     left join public.departments d on d.id = p.department_id
     left join public.roles r on r.id = p.role_id
     where p.email = any($1::text[])
       and coalesce(p.is_active, true) = true
     order by p.email asc`,
    [DEFAULT_SEEDED_EMAILS]
  )

  return rows.rows.filter((u) => !DEFAULT_EXCLUDED_EMAILS.has((u.email || '').toLowerCase()))
}

async function loadSubmittedUserIds(client, surveyId) {
  const r = await client.query(
    `select user_id from public.participation_tokens where survey_id = $1`,
    [surveyId]
  )
  return new Set(r.rows.map((row) => row.user_id))
}

async function submitForUser(client, survey, shape, user, userIndex) {
  const sectionIds = getApplicableSectionIds(shape.sections, user.department_name)
  if (sectionIds.length === 0) {
    return { status: 'skipped', reason: 'No applicable sections' }
  }

  const applicableQuestions = shape.questions.filter((q) => sectionIds.includes(q.survey_section_id))
  if (applicableQuestions.length === 0) {
    return { status: 'skipped', reason: 'No questions in applicable sections' }
  }

  await client.query('begin')

  try {
    const responseRes = await client.query(
      `insert into public.responses
       (survey_id, submitted_at, department, role, tenure_band, work_type, is_anonymous, user_id)
       values ($1, now(), $2, $3, $4, null, $5, $6)
       returning id`,
      [
        survey.id,
        user.department_name ?? null,
        user.role_name ?? null,
        user.tenure_band ?? null,
        Boolean(survey.anonymous_mode),
        survey.anonymous_mode ? null : user.id,
      ]
    )

    const responseId = responseRes.rows[0].id

    for (const question of applicableQuestions) {
      const options = shape.optionsByQuestionId.get(question.id) ?? []
      const answerValue = buildAnswerValue(question, options, userIndex, user.email)
      const fields = mapAnswerValueToRowFields(answerValue)

      await client.query(
        `insert into public.response_answers
         (response_id, question_id, text_value, numeric_value, selected_options)
         values ($1, $2, $3, $4, $5::jsonb)`,
        [responseId, question.id, fields.text_value, fields.numeric_value, JSON.stringify(fields.selected_options)]
      )
    }

    await client.query(
      `insert into public.participation_tokens
       (survey_id, user_id, submitted_at, department_id, role_id, tenure_band)
       values ($1, $2, now(), $3, $4, $5)
       on conflict (survey_id, user_id) do nothing`,
      [survey.id, user.id, user.department_id ?? null, user.role_id ?? null, user.tenure_band ?? null]
    )

    await client.query(
      `delete from public.response_drafts where survey_id = $1 and user_id = $2`,
      [survey.id, user.id]
    )

    await client.query('commit')
    return { status: 'submitted', questionCount: applicableQuestions.length }
  } catch (error) {
    await client.query('rollback')
    return { status: 'failed', reason: error instanceof Error ? error.message : String(error) }
  }
}

export async function runAutomation({ surveyId = null } = {}) {
  const env = loadEnv()
  const dbUrl = env.SUPABASE_DB_URL
  if (!dbUrl) throw new Error('Missing SUPABASE_DB_URL in .env.local')

  const client = new pg.Client({ connectionString: dbUrl })
  await client.connect()

  try {
    const survey = await resolveTargetSurvey(client, surveyId)
    if (!survey) {
      throw new Error(surveyId ? `Survey not found: ${surveyId}` : 'No open survey found')
    }

    const shape = await loadSurveyShape(client, survey.id)
    const users = await loadTargetUsers(client)
    const submittedUserIds = await loadSubmittedUserIds(client, survey.id)

    const summary = {
      surveyId: survey.id,
      surveyTitle: survey.title,
      considered: users.length,
      submitted: 0,
      skipped: 0,
      failed: 0,
      details: [],
    }

    for (let i = 0; i < users.length; i += 1) {
      const user = users[i]
      if (submittedUserIds.has(user.id)) {
        summary.skipped += 1
        summary.details.push({ email: user.email, status: 'skipped', reason: 'Already submitted' })
        continue
      }

      const result = await submitForUser(client, survey, shape, user, i + 1)
      if (result.status === 'submitted') {
        summary.submitted += 1
        summary.details.push({ email: user.email, status: 'submitted', questionCount: result.questionCount })
      } else if (result.status === 'skipped') {
        summary.skipped += 1
        summary.details.push({ email: user.email, status: 'skipped', reason: result.reason })
      } else {
        summary.failed += 1
        summary.details.push({ email: user.email, status: 'failed', reason: result.reason })
      }
    }

    return summary
  } finally {
    await client.end()
  }
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2))
    const result = await runAutomation({ surveyId: args.surveyId })

    console.log(`\nSurvey automation completed for: ${result.surveyTitle} (${result.surveyId})`)
    console.log(`Users considered: ${result.considered}`)
    console.log(`Submitted: ${result.submitted}`)
    console.log(`Skipped: ${result.skipped}`)
    console.log(`Failed: ${result.failed}`)

    for (const detail of result.details) {
      if (detail.status === 'submitted') {
        console.log(`  ✓ ${detail.email} — submitted (${detail.questionCount} questions)`)
      } else if (detail.status === 'skipped') {
        console.log(`  - ${detail.email} — skipped (${detail.reason})`)
      } else {
        console.log(`  ✗ ${detail.email} — failed (${detail.reason})`)
      }
    }

    if (result.failed > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error(`\n✗ Automation failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
