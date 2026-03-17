// Phase 4 TypeScript type contracts
// Consumed by: actions/, publication/, settings/, tagging/ Server Actions + all Phase 4 UI

import type { DimensionScore, QualitativeTheme, PublicAction } from '@/lib/types/analytics'

// Action item — full admin view (not the public PublicAction from analytics.ts)
export interface ActionItem {
  id: string
  surveyId: string | null
  title: string
  problemStatement: string | null
  ownerId: string | null
  ownerName: string | null        // joined from profiles
  departmentId: string | null
  departmentName: string | null   // joined from departments
  priority: 'low' | 'medium' | 'high' | 'critical'
  targetDate: string | null       // ISO date string
  status: 'identified' | 'planned' | 'in_progress' | 'blocked' | 'completed'
  successCriteria: string | null
  isPublic: boolean
  dimensionIds: string[]          // UUID array — added in Phase 4 migration
  createdAt: string
  updatedAt: string
}

// Progress update on an action item
export interface ActionUpdate {
  id: string
  actionItemId: string
  content: string
  createdBy: string | null
  createdByName: string | null    // joined from profiles
  createdAt: string
}

// Snapshot data shape stored in publication_snapshots.snapshot_data JSONB
export interface SnapshotData {
  schemaVersion: 1
  surveyId: string
  surveyTitle: string
  publishedAt: string             // ISO timestamp
  participationRate: number       // 0-100
  totalResponses: number
  dimensionScores: DimensionScore[]
  qualitativeThemes: QualitativeTheme[]
  publicActions: PublicAction[]
}

// Row from publication_snapshots table
export interface PublicationSnapshot {
  id: string
  surveyId: string
  snapshotData: SnapshotData
  publishedBy: string | null
  createdAt: string
}

// App-wide settings from app_settings table
export interface AppSettings {
  privacyThresholdNumeric: number   // default 5
  privacyThresholdText: number      // default 10
  allowedEmailDomain: string        // e.g. "company.com"
}

// Qualitative tag attached to a response_answer
export interface QualitativeTag {
  id: string
  responseAnswerId: string
  tag: string
  createdBy: string | null
  createdAt: string
}

// Response answer row for tagging workspace (anonymized — no user name)
export interface TaggableAnswer {
  responseAnswerId: string
  questionText: string
  textValue: string
  tags: QualitativeTag[]
}

// Employee row parsed from CSV import
export interface EmployeeImportRow {
  name: string
  email: string
  department: string
  role: string
  tenureBand: string
  // validation
  isValid: boolean
  errors: string[]
}

// Result of importEmployees Server Action
export interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

// Participation row for the monitor tab
export interface ParticipationRow {
  department: string
  departmentId: string | null
  eligible: number
  responded: number
  rate: number   // 0-100 percentage
}

// Employee directory row for admin listing
export interface EmployeeDirectoryRow {
  id: string
  name: string
  email: string
  department: string | null
  role: string | null
  tenureBand: string | null
  isActive: boolean
  createdAt: string
}
