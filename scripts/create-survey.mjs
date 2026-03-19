#!/usr/bin/env node
/**
 * create-survey.mjs
 *
 * Creates a survey in the database from a JSON definition file.
 * Prints the created survey ID when done.
 *
 * Usage:
 *   node scripts/create-survey.mjs --file scripts/surveys/q2-engagement.json
 *   node scripts/create-survey.mjs --file scripts/surveys/q2-engagement.json --open
 *
 * Options:
 *   --file <path>   Path to survey JSON definition (required)
 *   --open          Immediately set survey status to 'open' after creation
 *   --dry-run       Validate JSON without writing to DB
 *
 * JSON format: see scripts/surveys/q2-engagement.json for a full example.
 */

import { readFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─── Env ─────────────────────────────────────────────────────────────────────

function loadEnv() {
  const content = readFileSync(join(ROOT, '.env.local'), 'utf8')
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

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const parsed = { file: null, open: false, dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--file' && argv[i + 1]) { parsed.file = argv[++i] }
    else if (argv[i] === '--open') { parsed.open = true }
    else if (argv[i] === '--dry-run') { parsed.dryRun = true }
  }
  return parsed
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_QUESTION_TYPES = [
  'likert_5', 'likert_10', 'single_select', 'multi_select', 'short_text', 'long_text',
]

function validateDefinition(def) {
  const errors = []
  if (!def.title?.trim()) errors.push('Survey must have a title.')
  if (!Array.isArray(def.sections) || def.sections.length === 0) {
    errors.push('Survey must have at least one section.')
  }
  for (let si = 0; si < (def.sections ?? []).length; si++) {
    const s = def.sections[si]
    if (!s.title?.trim()) errors.push(`Section ${si + 1}: missing title.`)
    if (!Array.isArray(s.questions) || s.questions.length === 0) {
      errors.push(`Section "${s.title ?? si + 1}": must have at least one question.`)
    }
    for (let qi = 0; qi < (s.questions ?? []).length; qi++) {
      const q = s.questions[qi]
      if (!q.text?.trim()) errors.push(`Section "${s.title}" Q${qi + 1}: missing text.`)
      if (!VALID_QUESTION_TYPES.includes(q.type)) {
        errors.push(`Section "${s.title}" Q${qi + 1}: invalid type "${q.type}". Valid: ${VALID_QUESTION_TYPES.join(', ')}.`)
      }
      if ((q.type === 'single_select' || q.type === 'multi_select') && (!q.options || q.options.length < 2)) {
        errors.push(`Section "${s.title}" Q${qi + 1}: ${q.type} needs at least 2 options.`)
      }
    }
  }
  return errors
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function createSurvey(client, def, status) {
  const r = await client.query(
    `insert into public.surveys
       (title, description, status, anonymous_mode, opens_at, closes_at)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [
      def.title.trim(),
      def.description?.trim() ?? null,
      status,
      def.anonymous_mode ?? false,
      def.opens_at ?? null,
      def.closes_at ?? null,
    ]
  )
  return r.rows[0].id
}

async function createSection(client, surveyId, section, displayOrder) {
  const r = await client.query(
    `insert into public.survey_sections
       (survey_id, title, description, target_roles, display_order)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [
      surveyId,
      section.title.trim(),
      section.description?.trim() ?? null,
      section.target_roles ?? ['all'],
      displayOrder,
    ]
  )
  return r.rows[0].id
}

async function createQuestion(client, sectionId, question, displayOrder) {
  const r = await client.query(
    `insert into public.questions
       (survey_section_id, text, type, required, display_order)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [sectionId, question.text.trim(), question.type, question.required ?? true, displayOrder]
  )
  return r.rows[0].id
}

async function createOptions(client, questionId, options) {
  for (let i = 0; i < options.length; i++) {
    const opt = typeof options[i] === 'string' ? options[i] : options[i].text
    await client.query(
      `insert into public.question_options (question_id, text, value, display_order)
       values ($1, $2, $3, $4)`,
      [questionId, opt, opt, i]
    )
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.file) {
    console.error('✗ --file <path> is required.')
    process.exit(1)
  }

  const filePath = resolve(args.file)
  let def
  try {
    def = JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (e) {
    console.error(`✗ Could not read/parse JSON: ${e.message}`)
    process.exit(1)
  }

  const errors = validateDefinition(def)
  if (errors.length > 0) {
    console.error('✗ Validation errors:')
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }

  console.log(`\nSurvey definition: "${def.title}"`)
  console.log(`  Sections: ${def.sections.length}`)
  console.log(`  Questions: ${def.sections.reduce((n, s) => n + s.questions.length, 0)}`)

  if (args.dryRun) {
    console.log('\n[DRY RUN] Validation passed. No changes written.')
    return
  }

  const env = loadEnv()
  if (!env.SUPABASE_DB_URL) {
    console.error('✗ Missing SUPABASE_DB_URL in .env.local')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString: env.SUPABASE_DB_URL })
  await client.connect()

  try {
    await client.query('begin')

    const status = args.open ? 'open' : (def.status ?? 'draft')
    const surveyId = await createSurvey(client, def, status)
    console.log(`\nCreated survey: ${surveyId} (status: ${status})`)

    let totalQuestions = 0
    for (let si = 0; si < def.sections.length; si++) {
      const section = def.sections[si]
      const sectionId = await createSection(client, surveyId, section, si)
      console.log(`  Section ${si + 1}: "${section.title}" (${section.questions.length} questions)`)

      for (let qi = 0; qi < section.questions.length; qi++) {
        const question = section.questions[qi]
        const questionId = await createQuestion(client, sectionId, question, qi)
        if (question.options?.length) {
          await createOptions(client, questionId, question.options)
        }
        totalQuestions++
      }
    }

    await client.query('commit')

    console.log(`\n✓ Survey created successfully.`)
    console.log(`  ID:        ${surveyId}`)
    console.log(`  Status:    ${status}`)
    console.log(`  Sections:  ${def.sections.length}`)
    console.log(`  Questions: ${totalQuestions}`)
    console.log(`\nTo auto-complete for all users:`)
    console.log(`  node scripts/auto-complete-survey.mjs --survey-id ${surveyId}`)
  } catch (err) {
    await client.query('rollback')
    console.error(`✗ Error: ${err.message}`)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(`✗ Fatal: ${err.message}`)
  process.exit(1)
})
