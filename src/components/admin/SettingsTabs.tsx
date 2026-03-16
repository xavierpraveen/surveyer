'use client'

import { useState } from 'react'
import type { AppSettings, ParticipationRow } from '@/lib/types/phase4'
import EmployeeImportTab from './EmployeeImportTab'
import PrivacySettingsTab from './PrivacySettingsTab'
import ParticipationMonitorTab from './ParticipationMonitorTab'
import CyclesTab from './CyclesTab'

interface SurveyItem {
  id: string
  title: string
  status: string
  archived: boolean
  createdAt: string
}

interface SettingsTabsProps {
  initialSettings: AppSettings
  initialSurveys: SurveyItem[]
  initialParticipation: ParticipationRow[]
}

type TabId = 'employees' | 'privacy' | 'participation' | 'cycles'

const TABS: { id: TabId; label: string }[] = [
  { id: 'employees', label: 'Employees' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'participation', label: 'Participation' },
  { id: 'cycles', label: 'Cycles' },
]

export default function SettingsTabs({
  initialSettings,
  initialSurveys,
  initialParticipation,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('employees')

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm">
      {/* Tab bar */}
      <div className="border-b border-border flex gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-6 py-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none',
              activeTab === tab.id
                ? 'border-b-2 border-brand text-brand font-semibold'
                : 'text-fg-muted font-medium hover:text-fg',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'employees' && <EmployeeImportTab />}
        {activeTab === 'privacy' && (
          <PrivacySettingsTab initialSettings={initialSettings} />
        )}
        {activeTab === 'participation' && (
          <ParticipationMonitorTab initialData={initialParticipation} />
        )}
        {activeTab === 'cycles' && (
          <CyclesTab initialSurveys={initialSurveys} />
        )}
      </div>
    </div>
  )
}
