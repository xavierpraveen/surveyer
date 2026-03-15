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
    <div className="bg-white rounded-lg shadow-sm">
      {/* Tab bar */}
      <div className="border-b border-gray-200 flex gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-6 py-3 text-sm transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700',
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
