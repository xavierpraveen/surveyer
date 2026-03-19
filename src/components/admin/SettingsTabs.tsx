'use client'

import { useState } from 'react'
import type { AppSettings, EmployeeDirectoryRow, ParticipationRow, ReminderPanelData } from '@/lib/types/phase4'
import EmployeeImportTab from './EmployeeImportTab'
import EmployeeDirectoryTab from './EmployeeDirectoryTab'
import PrivacySettingsTab from './PrivacySettingsTab'
import ParticipationMonitorTab from './ParticipationMonitorTab'
import CyclesTab from './CyclesTab'
import ReminderTab from './ReminderTab'

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
  initialEmployees: EmployeeDirectoryRow[]
  initialReminderData: ReminderPanelData | null
}

type TabId = 'employees' | 'directory' | 'privacy' | 'participation' | 'reminders' | 'cycles'

const TABS: { id: TabId; label: string }[] = [
  { id: 'employees', label: 'Employees' },
  { id: 'directory', label: 'Employee Directory' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'participation', label: 'Participation' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'cycles', label: 'Cycles' },
]

export default function SettingsTabs({
  initialSettings,
  initialSurveys,
  initialParticipation,
  initialEmployees,
  initialReminderData,
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
        {activeTab === 'directory' && (
          <EmployeeDirectoryTab rows={initialEmployees} />
        )}
        {activeTab === 'privacy' && (
          <PrivacySettingsTab initialSettings={initialSettings} />
        )}
        {activeTab === 'participation' && (
          <ParticipationMonitorTab initialData={initialParticipation} />
        )}
        {activeTab === 'reminders' && (
          <ReminderTab initialData={initialReminderData} />
        )}
        {activeTab === 'cycles' && (
          <CyclesTab initialSurveys={initialSurveys} />
        )}
      </div>
    </div>
  )
}
