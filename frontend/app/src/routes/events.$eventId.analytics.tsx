// src/routes/events.$eventId.analytics.tsx
import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { EventsService, ToolsService } from '../client' // ⬅️ add the tools service here
import { useAuth } from '../hooks/AuthContext'

export const Route = createFileRoute('/events/$eventId/analytics')({
  component: EventAnalyticsPage,
})

type AnalyticsData = {
  attendeesCount: number
  averageAge?: number | null // keep for later, show N/A for now
}

function EventAnalyticsPage() {
  const { eventId } = Route.useParams()
  const { isLoggedIn, user } = useAuth()

  const [event, setEvent] = React.useState<any | null>(null)
  const [analytics, setAnalytics] = React.useState<AnalyticsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        // 1) Load event details
        const eventData = await EventsService.readEvent({
          eventId: Number(eventId),
        })
        setEvent(eventData)

        const eventDataTyped = eventData as any

        // 2) Ensure user is allowed to see analytics
        if (
          !isLoggedIn ||
          user?.role !== 'creator' ||
          eventDataTyped?.organizer_id !== user.id
        ) {
          setError(
            'You do not have permission to view analytics for this event.',
          )
          return
        }

        // 3) Call real attendees export endpoint (CSV)
        //    Return example:
        //    "FIRST NAME, LAST NAME, EMAIL ADDRESS, TICKET\nBob,Martinez,bob@example.com,ORD-NIH8QW-1"
        const csv = await ToolsService.getAttendeesList({
          eventId: Number(eventId),
        })

        let attendeesCount = 0

        if (typeof csv === 'string' && csv.trim().length > 0) {
          const lines = csv.trim().split('\n')
          // First line = header; remaining non-empty lines = attendees
          const dataLines = lines.slice(1).filter((line) => line.trim() !== '')
          attendeesCount = dataLines.length
        }

        const analyticsData: AnalyticsData = {
          attendeesCount,
          averageAge: null, // we don't have age data yet
        }

        setAnalytics(analyticsData)
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [eventId, isLoggedIn, user])

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center">Loading analytics...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <Link
            to="/events/$eventId"
            params={{ eventId }}
            className="inline-flex items-center text-sm font-semibold text-neutral-600 hover:text-neutral-900"
          >
            ← Back to event
          </Link>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      </main>
    )
  }

  if (!event || !analytics) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center">No data available.</div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to="/events/$eventId"
            params={{ eventId }}
            className="inline-flex items-center text-sm font-semibold text-neutral-600 hover:text-neutral-900"
          >
            ← Back to event
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">
            Analytics for "{event.name}"
          </h1>
        </div>
      </div>

      {/* Key metrics – REAL data only */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            Attendees
          </div>
          <div className="mt-2 text-3xl font-bold text-[#7A0019]">
            {analytics.attendeesCount}
          </div>
          <div className="mt-1 text-sm text-neutral-600">
            Total rows in your attendees export.
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            Average Age
          </div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">
            {analytics.averageAge != null
              ? `${analytics.averageAge.toFixed(1)} yrs`
              : 'N/A'}
          </div>
          <div className="mt-1 text-sm text-neutral-600">
            Age data not available yet.
          </div>
        </div>
      </div>

      {/* Event Details Summary */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-semibold mb-4">Event Summary</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="text-sm font-medium text-neutral-600">
              Event Date:
            </span>
            <div className="text-sm text-neutral-900">
              {new Date(event.start_time).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-600">
              Location:
            </span>
            <div className="text-sm text-neutral-900">
              {event.location || 'TBD'}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-600">Price:</span>
            <div className="text-sm text-neutral-900">
              {Number(event.price) > 0
                ? `$${Number(event.price).toFixed(2)}`
                : 'Free'}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-600">
              Status:
            </span>
            <div className="text-sm text-neutral-900 capitalize">
              {event.state || 'Active'}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default EventAnalyticsPage
