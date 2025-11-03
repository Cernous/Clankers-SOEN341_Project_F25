// src/routes/admin.tsx
import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../hooks/AuthContext'
import { EventsService } from '../client'

export const Route = createFileRoute('/admin')({
  component: AdminDashboard,
})

type AdminEvent = {
  id: number | string
  name: string
  location?: string | null
  start_time: string
  end_time?: string
  organizer_id?: number | string | null
  count_attendees?: number | null
  tickets_left?: number | null
  price?: number | null
  tags?: string | null
}

type EventDetail = Partial<{
  id: number | string
  name: string
  location: string | null
  start_time: string
  end_time: string
  organizer_id: number | string | null
  count_attendees: number | null
  tickets_left: number | null
  price: number | null
  tags: string | null
}>

function AdminDashboard() {
  const { isLoggedIn, user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [events, setEvents] = React.useState<AdminEvent[]>([])
  const [avgAgeEventId, setAvgAgeEventId] = React.useState<string>('') // dropdown
  const [avgAgeValue, setAvgAgeValue] = React.useState<string>('—')
  const [avgAgeLoading, setAvgAgeLoading] = React.useState(false)

  React.useEffect(() => {
    if (!isLoggedIn || user?.role !== 'admin') {
      navigate({ to: '/' })
    }
  }, [isLoggedIn, user, navigate])

 React.useEffect(() => {
  let mounted = true;
  (async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) get the simple list (IDs come from here)
      const base = await EventsService.listEvents();
      const baseList = Array.isArray(base) ? (base as any[]) : [];

      // 2) read live detail for each id to grab fresh count_attendees
      const enriched = await Promise.all(
        baseList.map(async (e) => {
          const id = Number(e.id ?? e.event_id);
          try {
            const detail = (await EventsService.readEvent({ eventId: id })) as Partial<{
              id: number | string;
              name: string;
              location: string | null;
              start_time: string;
              end_time: string;
              organizer_id: number | string | null;
              count_attendees: number | null;
              tickets_left: number | null;
              price: number | null;
              tags: string | null;
            }>;

            return {
              id,
              name: detail?.name ?? e.name ?? 'Untitled',
              location: detail?.location ?? e.location ?? null,
              start_time: detail?.start_time ?? e.start_time,
              end_time: detail?.end_time ?? e.end_time,
              organizer_id: detail?.organizer_id ?? e.organizer_id ?? null,
              count_attendees: Number(detail?.count_attendees ?? 0),
              tickets_left: Number(detail?.tickets_left ?? 0),
              price: detail?.price ?? e.price ?? null,
              tags: detail?.tags ?? e.tags ?? null,
            } as AdminEvent;
          } catch {
            // fallback if detail fails
            return {
              id,
              name: e.name ?? 'Untitled',
              location: e.location ?? null,
              start_time: e.start_time,
              end_time: e.end_time,
              organizer_id: e.organizer_id ?? null,
              count_attendees: Number(e.count_attendees ?? 0),
              tickets_left: Number(e.tickets_left ?? 0),
              price: e.price ?? null,
              tags: e.tags ?? null,
            } as AdminEvent;
          }
        })
      );

      if (mounted) setEvents(enriched);
    } catch (err: any) {
      if (mounted) setError(err?.message ?? 'Failed to load admin data');
    } finally {
      if (mounted) setLoading(false);
    }
  })();

  return () => {
    mounted = false;
  };
}, []);

  if (!isLoggedIn || user?.role !== 'admin') {
    return <div className="mx-auto max-w-4xl px-4 py-10">Checking permissions…</div>
  }

  // derived stats
  const totalEvents = events.length
  const totalIssued = events.reduce(
    (sum, e) => sum + (Number(e.count_attendees ?? 0) || 0),
    0
  )
  const activeOrganizers = new Set(
    events.map((e) => String(e.organizer_id ?? '')).filter(Boolean)
  ).size

  async function fetchAverageAge() {
    if (!avgAgeEventId) return
    setAvgAgeLoading(true)
    setAvgAgeValue('—')
    try {
      const numId = Number(avgAgeEventId)
      const res = await EventsService.toolsGetEventAverageAge({ eventId: numId })
      const val =
        typeof res === 'number'
          ? res
          : typeof (res as any)?.average_age === 'number'
          ? (res as any).average_age
          : null
      setAvgAgeValue(val != null ? `${val.toFixed(1)} yrs` : 'N/A')
    } catch {
      setAvgAgeValue('Error')
    } finally {
      setAvgAgeLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-neutral-600">Platform-wide overview & moderation.</p>
      </header>

      {loading && <div className="rounded-xl border bg-white p-5">Loading…</div>}
      {error && <div className="rounded-xl border bg-white p-5 text-red-600">{error}</div>}

      {!loading && !error && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="Total Events" value={String(totalEvents)} />
            <Card title="Tickets Issued" value={String(totalIssued)} />
            <Card title="Active Organizers" value={String(activeOrganizers)} />
          </div>

          {/* Analytics */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Analytics</h2>
            <div className="rounded-xl border bg-white p-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="text-sm">
                <span className="block text-neutral-600 mb-1">Event</span>
                <select
                  value={avgAgeEventId}
                  onChange={(e) => setAvgAgeEventId(e.target.value)}
                  className="min-w-[280px] rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400"
                >
                  <option value="">— Select an event —</option>
                  {events.map((e) => (
                    <option key={String(e.id)} value={String(e.id)}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={fetchAverageAge}
                disabled={!avgAgeEventId || avgAgeLoading}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900 disabled:opacity-60"
              >
                {avgAgeLoading ? 'Computing…' : 'Get Average Age'}
              </button>
              <div className="text-sm text-neutral-700 sm:ml-4">
                Average age: <span className="font-semibold">{avgAgeValue}</span>
              </div>
            </div>
          </section>

          {/* Recent Events Table */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Recent Events</h2>
            <div className="overflow-hidden rounded-xl border bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Organizer</th>
                    <th className="px-4 py-2 text-left">Starts</th>
                    <th className="px-4 py-2 text-left">Location</th>
                    <th className="px-4 py-2 text-left">Tickets Issued</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 8).map((e, i) => (
                    <tr key={String(e.id)} className={i > 0 ? 'border-t' : ''}>
                      <td className="px-4 py-2">{e.name}</td>
                      <td className="px-4 py-2">{String(e.organizer_id ?? '—')}</td>
                      <td className="px-4 py-2">
                        {new Date(e.start_time).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">{e.location ?? '—'}</td>
                      <td className="px-4 py-2">{Number(e.count_attendees ?? 0)}</td>
                    </tr>
                  ))}
                  {!events.length && (
                    <tr>
                      <td className="px-4 py-4 text-neutral-500" colSpan={5}>
                        No events found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Moderation stub */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Moderation Queue</h2>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm text-neutral-600">No pending items. (stub)</p>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

function Card({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm text-neutral-500">{title}</div>
      <div className="text-3xl font-extrabold">{value}</div>
      {hint ? <div className="text-xs text-neutral-400 mt-1">{hint}</div> : null}
    </div>
  )
}

export default Route
