import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from 'react'
import TopNav from '@/components/layout/TopNav'

interface LeadershipLayoutProps {
  children: ReactNode
}

export default function LeadershipLayout({ children }: LeadershipLayoutProps) {
  return (
    <NuqsAdapter>
      <TopNav />
      {children}
    </NuqsAdapter>
  )
}
