import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getActionItem } from '@/lib/actions/actions'
import ActionItemForm from '@/components/admin/ActionItemForm'
import ActionUpdateTimeline from '@/components/admin/ActionUpdateTimeline'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ActionDetailPage({ params }: PageProps) {
  const { id } = await params

  // Create mode
  if (id === 'new') {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center gap-2 text-sm text-fg-muted mb-6">
          <Link href="/admin/actions" className="hover:text-fg transition-colors">
            Action Items
          </Link>
          <span className="text-fg-subtle">/</span>
          <span className="text-fg font-medium">New Action</span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-snug text-fg mb-6">New Action Item</h1>

        <ActionItemForm />
      </div>
    )
  }

  // Edit mode — fetch item
  const result = await getActionItem(id)

  if (!result.success) {
    notFound()
  }

  const { item, updates } = result.data

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-fg-muted mb-6">
        <Link href="/admin/actions" className="hover:text-fg transition-colors">
          Action Items
        </Link>
        <span className="text-fg-subtle">/</span>
        <span className="text-fg font-medium truncate max-w-xs">{item.title}</span>
      </div>

      <h1 className="text-2xl font-extrabold tracking-snug text-fg mb-6">{item.title}</h1>

      <ActionItemForm item={item} />

      <ActionUpdateTimeline actionItemId={item.id} initialUpdates={updates} />
    </div>
  )
}
