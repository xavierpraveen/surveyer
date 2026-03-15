import { describe, test } from 'vitest'

describe('createActionItem', () => {
  test.todo('returns success with valid input including dimensionIds array')
  test.todo('returns error when role is employee (forbidden)')
  test.todo('returns error when title is empty string')
  test.todo('hr_admin role is allowed to create action items')
})

describe('updateActionItem', () => {
  test.todo('returns success when updating status to valid enum value')
  test.todo('returns error when action item id does not exist')
  test.todo('isPublic toggle updates the is_public column')
})

describe('deleteActionItem', () => {
  test.todo('returns success for valid id with elevated role')
  test.todo('returns error when role is employee')
})

describe('postActionUpdate', () => {
  test.todo('inserts action_updates row with content and created_by')
  test.todo('returns error when content is empty')
})

describe('getActionItems', () => {
  test.todo('returns all action items for admin role')
  test.todo('filters by status when statusFilter provided')
})

describe('getActionItem', () => {
  test.todo('returns action item with updates timeline')
  test.todo('returns null when id does not exist')
})
