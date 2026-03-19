import type { ReactNode } from 'react'
import TopNav from '@/components/layout/TopNav'

interface ManagerLayoutProps {
  children: ReactNode
}

export default function ManagerLayout({ children }: ManagerLayoutProps) {
  return (
    <>
      <TopNav />
      {children}
    </>
  )
}
