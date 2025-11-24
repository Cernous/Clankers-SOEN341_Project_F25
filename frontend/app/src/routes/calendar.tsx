// src/routes/calendar.tsx
import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { CalendarService } from '../client'
import { useUserData } from '../hooks/UserDataContext'
import type { SimpleEvent } from '../data/events.sample'

export const Route = createFileRoute('/calendar')({
  component: CalendarPage,
})

function CalendarPage() {
  const { toggleSave } = useUserData()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [items, setItems] = React.useState<Array<SimpleEvent>>([])

  React.useEffect(() => {
    const toMonthDay = (iso: string) => {
      const d = new Date(iso)
      return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`
    }
    const toDateOnly = (iso: string) => iso.slice(0, 10)
    const toCategory = (tags?: string | null): SimpleEvent['category'] => {
      const t = (tags ?? '').toLowerCase()
      if (t.includes('workshop')) return 'Workshop'
      if (t.includes('music')) return 'Music'
      if (t.includes('sport')) return 'Sports'
      if (t.includes('film') || t.includes('movie')) return 'Film'
      if (t.includes('art')) return 'Arts'
      return 'Other'
    }

    ;(async () => {
      try {
        // Get events from the user's calendar backend
        const res = await CalendarService.getUserCalendar()

        const list = Array.isArray(res) ? res : ((res as any).events ?? [])

        const mapped: Array<SimpleEvent> = list.map((e: any) => ({
          id: String(e.id),
          title: e.name,
          date: toMonthDay(e.start_time),
          dateISO: toDateOnly(e.start_time),
          org: 'Organizer',
          where: e.location ?? 'TBD',
          category: toCategory(e.tags),
        }))

        setItems(mapped)
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load your events')
      } finally {
        setLoading(false)
      }
    })()

    return () => {}
  }, [])
  async function handleRemove(ev: SimpleEvent) {
    try {
      const numericId = Number(ev.id)
      if (!Number.isFinite(numericId)) {
        alert('Invalid event id')
        return
      }

      //  delete from backend calendar
      await CalendarService.deleteEventCalendar({ eventId: numericId })

      // update this page's local list
      setItems((prev) => prev.filter((item) => item.id !== ev.id))

      // update global saved state so header + modals stay in sync
      toggleSave(ev)
    } catch (e) {
      console.error('deleteEventCalendar failed', e)
      alert('Could not remove this event from your calendar. Please try again.')
    }
  }
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-3xl font-extrabold">My Calendar</h1>
      <p className="mb-6 text-neutral-600">Events added to your calendar.</p>

      {loading && (
        <div className="rounded-xl border bg-white p-6">Loading…</div>
      )}
      {error && (
        <div className="rounded-xl border bg-white p-6 text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-neutral-600">
              You haven’t saved any events yet. Browse events and click{' '}
              <em>Save</em>.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              {items.map((ev, i) => (
                <div
                  key={ev.id}
                  className={[
                    'flex items-center justify-between gap-4 px-4 py-4',
                    i > 0 ? 'border-t border-neutral-200' : '',
                  ].join(' ')}
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{ev.title}</div>
                    <div className="mt-1 text-sm text-neutral-600">
                      {ev.org} • {ev.where}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="shrink-0 text-sm text-neutral-600">
                      {ev.date}
                    </span>

                    <Link
                      to="/events/$eventId"
                      params={{ eventId: String(ev.id) }}
                      className="shrink-0 rounded-full bg-[#7A0019] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#a30025]"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemove(ev)}
                      className="shrink-0 rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-semibold hover:bg-neutral-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}
