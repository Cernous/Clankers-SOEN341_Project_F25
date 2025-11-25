// src/routes/events.$eventId.analytics.tsx
import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { EventsService } from '../client'
import { useAuth } from '../hooks/AuthContext'

export const Route = createFileRoute('/events/$eventId/analytics')({
  component: EventAnalyticsPage,
})

type AnalyticsData = {
  totalViews: number
  totalRegistrations: number
  totalTicketsSold: number
  revenue: number
  viewsOverTime: Array<{ date: string; views: number }>
  registrationsByDay: Array<{ date: string; registrations: number }>
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
        // Load event details first
        const eventData = await EventsService.readEvent({
          eventId: Number(eventId),
        })
        setEvent(eventData)

        // Check if user is the creator of this event
        const eventDataTyped = eventData as any
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

        // For now, we'll use mock analytics data since the backend doesn't have analytics endpoints yet
        // In a real implementation, you would call something like:
        // const analyticsData = await EventsService.getEventAnalytics({ eventId: Number(eventId) })

        const mockAnalytics: AnalyticsData = {
          totalViews: Math.floor(Math.random() * 500) + 50,
          totalRegistrations: Math.floor(Math.random() * 100) + 10,
          totalTicketsSold: Math.floor(Math.random() * 80) + 5,
          revenue:
            (Math.floor(Math.random() * 1000) + 100) *
            (Number(eventDataTyped.price) || 0),
          viewsOverTime: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(
              Date.now() - (6 - i) * 24 * 60 * 60 * 1000,
            ).toLocaleDateString(),
            views: Math.floor(Math.random() * 50) + 5,
          })),
          registrationsByDay: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(
              Date.now() - (6 - i) * 24 * 60 * 60 * 1000,
            ).toLocaleDateString(),
            registrations: Math.floor(Math.random() * 15) + 1,
          })),
        }

        setAnalytics(mockAnalytics)
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

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="text-2xl font-bold text-[#7A0019]">
            {analytics.totalViews}
          </div>
          <div className="text-sm text-neutral-600">Total Views</div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="text-2xl font-bold text-blue-600">
            {analytics.totalRegistrations}
          </div>
          <div className="text-sm text-neutral-600">Registrations</div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="text-2xl font-bold text-green-600">
            {analytics.totalTicketsSold}
          </div>
          <div className="text-sm text-neutral-600">Tickets Sold</div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="text-2xl font-bold text-purple-600">
            ${analytics.revenue.toFixed(2)}
          </div>
          <div className="text-sm text-neutral-600">Revenue</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Views Over Time */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">
            Views Over Time (Last 7 Days)
          </h3>
          <div className="space-y-3">
            {analytics.viewsOverTime.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">{item.date}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 bg-[#7A0019] rounded"
                    style={{
                      width: `${(item.views / Math.max(...analytics.viewsOverTime.map((v) => v.views))) * 100}px`,
                    }}
                  />
                  <span className="text-sm font-medium w-8 text-right">
                    {item.views}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registrations by Day */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">
            Registrations by Day (Last 7 Days)
          </h3>
          <div className="space-y-3">
            {analytics.registrationsByDay.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">{item.date}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 bg-blue-600 rounded"
                    style={{
                      width: `${(item.registrations / Math.max(...analytics.registrationsByDay.map((r) => r.registrations))) * 100}px`,
                    }}
                  />
                  <span className="text-sm font-medium w-8 text-right">
                    {item.registrations}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Details Summary */}
      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
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

      {/* Note about mock data */}
      <div className="mt-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
        <div className="text-sm text-yellow-800">
          <strong>Note:</strong> This analytics data is currently simulated for
          demonstration purposes. In a production environment, this would show
          real analytics data from your event tracking system.
        </div>
      </div>
    </main>
  )
}
