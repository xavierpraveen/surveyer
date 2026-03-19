#!/usr/bin/env node
/**
 * auto-complete-survey.mjs
 *
 * Dynamically finds all active users who have NOT yet submitted the current
 * open survey and auto-submits realistic answers for each of them.
 *
 * Usage:
 *   node scripts/auto-complete-survey.mjs
 *   node scripts/auto-complete-survey.mjs --survey-id <uuid>
 *   node scripts/auto-complete-survey.mjs --exclude alice@acme.dev,bob@acme.dev
 *   node scripts/auto-complete-survey.mjs --dry-run
 *
 * Options:
 *   --survey-id <uuid>   Target a specific survey (default: latest open survey)
 *   --exclude <emails>   Comma-separated list of emails to skip
 *   --dry-run            Print who would be submitted without writing anything
 */

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─── Env loader ───────────────────────────────────────────────────────────────

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

// ─── CLI arg parser ───────────────────────────────────────────────────────────

function parseArgs(argv) {
  const parsed = { surveyId: null, excludeEmails: new Set(), dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--survey-id' && argv[i + 1]) {
      parsed.surveyId = argv[i + 1]
      i++
    } else if (arg === '--exclude' && argv[i + 1]) {
      for (const e of argv[i + 1].split(',')) {
        parsed.excludeEmails.add(e.trim().toLowerCase())
      }
      i++
    } else if (arg === '--dry-run') {
      parsed.dryRun = true
    }
  }
  return parsed
}

// ─── Survey resolution ────────────────────────────────────────────────────────

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

// ─── Survey shape loader ──────────────────────────────────────────────────────

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

// ─── Dynamic user loader ──────────────────────────────────────────────────────

/**
 * Returns ALL users: those with a profiles row (is_active = true) AND
 * any auth.users accounts that have no profile yet (treated as active).
 * Fully dynamic — no hardcoded email lists.
 */
async function loadAllActiveUsers(client) {
  const r = await client.query(
    `select
       au.id,
       au.email,
       p.department_id,
       p.role_id,
       p.tenure_band,
       d.name  as department_name,
       ro.name as role_name
     from auth.users au
     left join public.profiles p  on p.id = au.id
     left join public.departments d  on d.id = p.department_id
     left join public.roles ro on ro.id = p.role_id
     where coalesce(p.is_active, true) = true   -- profiles without a row count as active
       and au.email is not null
     order by au.email asc`
  )
  return r.rows
}

/**
 * Returns user IDs that have already submitted (participation_token exists).
 */
async function loadSubmittedUserIds(client, surveyId) {
  const r = await client.query(
    `select user_id from public.participation_tokens where survey_id = $1`,
    [surveyId]
  )
  return new Set(r.rows.map((row) => row.user_id))
}

// ─── Answer generation ────────────────────────────────────────────────────────

function pickOption(options, seed) {
  if (!options || options.length === 0) return null
  return options[Math.abs(seed) % options.length]
}

function buildAnswerValue(question, options, userIndex, email) {
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
    return [...new Set([first?.id, second?.id].filter(Boolean))]
  }

  if (type === 'short_text') {
    return `Auto response from ${email.split('@')[0]}`
  }

  if (type === 'long_text') {
    return `Automated response from ${email}. Team collaboration and delivery continue to improve with clear priorities and open communication.`
  }

  return ''
}

function mapAnswerValueToRowFields(value) {
  return {
    text_value: typeof value === 'string' ? value : null,
    numeric_value: typeof value === 'number' ? value : null,
    selected_options: Array.isArray(value) ? value : [],
  }
}

// ─── Section filtering ────────────────────────────────────────────────────────

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

// ─── Per-user submission ──────────────────────────────────────────────────────

async function submitForUser(client, survey, shape, user, userIndex) {
  const sectionIds = getApplicableSectionIds(shape.sections, user.department_name)
  if (sectionIds.length === 0) {
    return { status: 'skipped', reason: 'No applicable sections' }
  }

  const applicableQuestions = shape.questions.filter((q) =>
    sectionIds.includes(q.survey_section_id)
  )
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
        [
          responseId,
          question.id,
          fields.text_value,
          fields.numeric_value,
          JSON.stringify(fields.selected_options),
        ]
      )
    }

    await client.query(
      `insert into public.participation_tokens
       (survey_id, user_id, submitted_at, department_id, role_id, tenure_band)
       values ($1, $2, now(), $3, $4, $5)
       on conflict (survey_id, user_id) do nothing`,
      [survey.id, user.id, user.department_id ?? null, user.role_id ?? null, user.tenure_band ?? null]
    )

    // Clear any in-progress draft
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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const env = loadEnv()
  const dbUrl = env.SUPABASE_DB_URL
  if (!dbUrl) throw new Error('Missing SUPABASE_DB_URL in .env.local')

  const client = new pg.Client({ connectionString: dbUrl })
  await client.connect()

  try {
    // 1. Resolve target survey
    const survey = await resolveTargetSurvey(client, args.surveyId)
    if (!survey) {
      console.error(
        args.surveyId
          ? `✗ Survey not found: ${args.surveyId}`
          : '✗ No open survey found. Open a survey first or pass --survey-id.'
      )
      process.exit(1)
    }

    console.log(`\nSurvey: "${survey.title}" (${survey.id})`)
    console.log(`Status: ${survey.status}`)

    // 2. Load survey structure
    const shape = await loadSurveyShape(client, survey.id)
    console.log(`Sections: ${shape.sections.length} | Questions: ${shape.questions.length}`)

    if (shape.questions.length === 0) {
      console.error('✗ Survey has no questions. Nothing to submit.')
      process.exit(1)
    }

    // 3. Load all active users from DB (fully dynamic)
    const allUsers = await loadAllActiveUsers(client)
    const submittedUserIds = await loadSubmittedUserIds(client, survey.id)

    // 4. Filter: skip already-submitted and explicitly excluded emails
    const pendingUsers = allUsers.filter((u) => {
      if (submittedUserIds.has(u.id)) return false
      if (args.excludeEmails.has((u.email || '').toLowerCase())) return false
      return true
    })

    const alreadyDone = allUsers.length - pendingUsers.length - args.excludeEmails.size
    console.log(`\nTotal active users:   ${allUsers.length}`)
    console.log(`Already submitted:    ${submittedUserIds.size}`)
    console.log(`Excluded by flag:     ${args.excludeEmails.size}`)
    console.log(`Pending (will run):   ${pendingUsers.length}`)

    if (pendingUsers.length === 0) {
      console.log('\n✓ All users have already submitted. Nothing to do.')
      return
    }

    if (args.dryRun) {
      console.log('\n[DRY RUN] Would submit for:')
      for (const u of pendingUsers) {
        console.log(`  - ${u.email} (dept: ${u.department_name ?? 'none'})`)
      }
      console.log('\nRe-run without --dry-run to apply.')
      return
    }

    // 5. Submit for each pending user
    console.log('\nSubmitting...')
    const results = { submitted: 0, skipped: 0, failed: 0 }

    for (let i = 0; i < pendingUsers.length; i++) {
      const user = pendingUsers[i]
      const result = await submitForUser(client, survey, shape, user, i + 1)

      if (result.status === 'submitted') {
        results.submitted++
        console.log(`  ✓ ${user.email} — submitted (${result.questionCount} answers)`)
      } else if (result.status === 'skipped') {
        results.skipped++
        console.log(`  - ${user.email} — skipped (${result.reason})`)
      } else {
        results.failed++
        console.log(`  ✗ ${user.email} — failed (${result.reason})`)
      }
    }

    // 6. Summary
    console.log(`\nDone.`)
    console.log(`  Submitted: ${results.submitted}`)
    console.log(`  Skipped:   ${results.skipped}`)
    console.log(`  Failed:    ${results.failed}`)

    if (results.failed > 0) process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(`\n✗ Fatal error: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
