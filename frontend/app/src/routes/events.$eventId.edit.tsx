import * as React from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { EventsService } from '../client'
import { useAuth } from '../hooks/AuthContext'

export const Route = createFileRoute('/events/$eventId/edit')({
  component: EditEventPage,
})

function EditEventPage() {
  const { eventId } = Route.useParams()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()

  const [data, setData] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Load event data
  React.useEffect(() => {
    // TODO: Implement event loading and editing functionality
  }, [eventId])

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Link
          to="/events/$eventId"
          params={{ eventId }}
          className="inline-flex items-center text-sm font-semibold text-neutral-600 hover:text-neutral-900"
        >
          ← Back to event
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-neutral-900">Edit Event</h1>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <p className="text-neutral-600">
          Event editing functionality is under development.
        </p>
      </div>
    </main>
  )
}
