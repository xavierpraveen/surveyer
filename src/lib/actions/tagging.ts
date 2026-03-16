'use server'
import 'server-only'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizeRole } from '@/lib/constants/roles'
import type { QualitativeTag, TaggableAnswer } from '@/lib/types/phase4'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

// ─── Role guard helper ─────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  return { user, authError }
}

// ─── getTaggableAnswers ────────────────────────────────────────────────────────

/**
 * Returns all open-text response_answers for a survey (anonymized — no user identity).
 * Includes existing qualitative_tags for each answer.
 */
export async function getTaggableAnswers(
  surveyId: string
): Promise<{ success: true; data: TaggableAnswer[] } | { success: false; error: string }> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  // 1. Fetch all response IDs for this survey
  const { data: responsesData, error: responsesError } = await db
    .from('responses')
    .select('id')
    .eq('survey_id', surveyId)

  if (responsesError) return { success: false, error: responsesError.message }

  const responseIds: string[] = ((responsesData as Array<{ id: string }>) ?? []).map((r) => r.id)
  if (responseIds.length === 0) return { success: true, data: [] }

  // 2. Fetch response_answers for text question types only
  const { data: answersData, error: answersError } = await db
    .from('response_answers')
    .select('id, text_value, questions(question_text, question_type)')
    .in('response_id', responseIds)

  if (answersError) return { success: false, error: answersError.message }

  const allAnswers = (
    (answersData as Array<{
      id: string
      text_value: string | null
      questions: { question_text: string; question_type: string } | null
    }>) ?? []
  ).filter(
    (a) =>
      a.questions?.question_type === 'short_text' ||
      a.questions?.question_type === 'long_text'
  )

  const answerIds = allAnswers.map((a) => a.id)
  if (answerIds.length === 0) return { success: true, data: [] }

  // 3. Fetch existing tags for these answers
  const { data: tagsData, error: tagsError } = await db
    .from('qualitative_tags')
    .select('id, response_answer_id, tag, created_by, created_at')
    .in('response_answer_id', answerIds)

  if (tagsError) return { success: false, error: tagsError.message }

  const allTags = (
    (tagsData as Array<{
      id: string
      response_answer_id: string
      tag: string
      created_by: string | null
      created_at: string
    }>) ?? []
  )

  // 4. Group tags by response_answer_id
  const tagsByAnswerId = new Map<string, QualitativeTag[]>()
  for (const t of allTags) {
    if (!tagsByAnswerId.has(t.response_answer_id)) {
      tagsByAnswerId.set(t.response_answer_id, [])
    }
    tagsByAnswerId.get(t.response_answer_id)!.push({
      id: t.id,
      responseAnswerId: t.response_answer_id,
      tag: t.tag,
      createdBy: t.created_by,
      createdAt: t.created_at,
    })
  }

  // 5. Assemble TaggableAnswer[]
  const result: TaggableAnswer[] = allAnswers
    .filter((a) => a.text_value !== null && a.text_value !== '')
    .map((a) => ({
      responseAnswerId: a.id,
      questionText: a.questions?.question_text ?? '',
      textValue: a.text_value ?? '',
      tags: tagsByAnswerId.get(a.id) ?? [],
    }))

  return { success: true, data: result }
}

// ─── upsertTag ─────────────────────────────────────────────────────────────────

const upsertTagSchema = z.object({
  tag: z.string().min(1, 'Tag is required').max(100).transform((s) => s.trim()),
})

export async function upsertTag(
  responseAnswerId: string,
  tag: string
): Promise<{ success: true; data: QualitativeTag } | { success: false; error: string }> {
  const parsed = upsertTagSchema.safeParse({ tag })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  const { data, error } = await db
    .from('qualitative_tags')
    .insert({
      response_answer_id: responseAnswerId,
      tag: parsed.data.tag,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  const row = data as Record<string, unknown>
  return {
    success: true,
    data: {
      id: row.id as string,
      responseAnswerId: row.response_answer_id as string,
      tag: row.tag as string,
      createdBy: (row.created_by as string | null) ?? null,
      createdAt: row.created_at as string,
    },
  }
}

// ─── deleteTag ─────────────────────────────────────────────────────────────────

export async function deleteTag(
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  const { error } = await db.from('qualitative_tags').delete().eq('id', tagId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── generateThemes ────────────────────────────────────────────────────────────

/**
 * Clusters tags by frequency and writes qualitative_themes rows.
 * Idempotent — deletes existing themes before inserting.
 * Tags with count >= 2 become themes; max 10 themes returned.
 */
export async function generateThemes(
  surveyId: string
): Promise<{ success: true; data: { themesCreated: number } } | { success: false; error: string }> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  // 1. Fetch all tags for this survey's response_answers (nested IN query)
  const { data: tagsData, error: tagsError } = await db
    .from('qualitative_tags')
    .select('tag, response_answer_id')
    .in(
      'response_answer_id',
      db
        .from('response_answers')
        .select('id')
        .in('response_id', db.from('responses').select('id').eq('survey_id', surveyId))
    )

  if (tagsError) return { success: false, error: tagsError.message }

  const allTags = (
    (tagsData as Array<{ tag: string; response_answer_id: string }>) ?? []
  )

  // 2. Count tag frequencies
  const tagFreq = new Map<string, number>()
  for (const t of allTags) {
    tagFreq.set(t.tag, (tagFreq.get(t.tag) ?? 0) + 1)
  }

  // 3. Filter to tags with count >= 2, sort descending, cap at 10
  const themes = Array.from(tagFreq.entries())
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag]) => ({
      survey_id: surveyId,
      theme: tag,
      tag_cluster: [tag],
      is_positive: false,
    }))

  // 4. DELETE existing themes for this survey (idempotent)
  const { error: deleteError } = await db
    .from('qualitative_themes')
    .delete()
    .eq('survey_id', surveyId)

  if (deleteError) return { success: false, error: deleteError.message }

  // 5. INSERT new themes (if any)
  if (themes.length > 0) {
    const { error: insertError } = await db.from('qualitative_themes').insert(themes)
    if (insertError) return { success: false, error: insertError.message }
  }

  return { success: true, data: { themesCreated: themes.length } }
}

// ─── updateTheme ──────────────────────────────────────────────────────────────

export async function updateTheme(
  themeId: string,
  input: { theme?: string; isPositive?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: Record<string, any> = {}
  if (input.theme !== undefined) patch.theme = input.theme
  if (input.isPositive !== undefined) patch.is_positive = input.isPositive

  const { error } = await db.from('qualitative_themes').update(patch).eq('id', themeId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
