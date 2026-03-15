import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from 'react'

interface LeadershipLayoutProps {
  children: ReactNode
}

export default function LeadershipLayout({ children }: LeadershipLayoutProps) {
  return <NuqsAdapter>{children}</NuqsAdapter>
}
