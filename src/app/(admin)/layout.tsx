import TopNav from '@/components/layout/TopNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      <main className="min-h-screen bg-bg">{children}</main>
    </>
  )
}
