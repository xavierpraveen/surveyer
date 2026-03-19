type SurveyAudienceRow = {
  survey_id: string
  target_role_id: string | null
}

export function getTargetRoleIdsForSurvey(
  rows: SurveyAudienceRow[],
  surveyId: string
): string[] {
  return rows
    .filter((row) => row.survey_id === surveyId && typeof row.target_role_id === 'string' && row.target_role_id.length > 0)
    .map((row) => row.target_role_id as string)
}

export function isSurveyVisibleToRole(
  targetRoleIds: string[],
  userRoleId: string | null
): boolean {
  if (targetRoleIds.length === 0) return true
  if (!userRoleId) return false
  return targetRoleIds.includes(userRoleId)
}
