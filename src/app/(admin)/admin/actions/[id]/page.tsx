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
      <div className="p-6 max-w-2xl">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/admin/actions" className="hover:text-gray-700 transition-colors">
            Action Items
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">New Action</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">New Action Item</h1>

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
    <div className="p-6 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/actions" className="hover:text-gray-700 transition-colors">
          Action Items
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{item.title}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{item.title}</h1>

      <ActionItemForm item={item} />

      <ActionUpdateTimeline actionItemId={item.id} initialUpdates={updates} />
    </div>
  )
}
