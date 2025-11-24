import * as React from 'react'
import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router' // add useLocation
import EventsList from '../components/events/EventsList'
import FilterBar from '../components/events/FilterBar'
import EventPreviewModal from '../components/events/EventPreviewModal'
import { useAuth } from '../hooks/AuthContext'
import { useUserData } from '../hooks/UserDataContext'
import { EventsService, UsersService } from '../client'
import type { SimpleEvent } from '../data/events.sample' // keep the type for UI

export const Route = createFileRoute('/events')({
  component: EventsPage,
})

function EventsPage() {
  const location = useLocation()
  const isDetail =
    location.pathname.startsWith('/events/') && location.pathname !== '/events'

  const { isLoggedIn, user } = useAuth()
  const { claimTicket } = useUserData()

  const [all, setAll] = React.useState<Array<SimpleEvent>>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [selected, setSelected] = React.useState<SimpleEvent | null>(null)
  // Event that has a free ticket award (10% chance on Feeling Lucky)
  const [freeTicketEvent, setFreeTicketEvent] =
    React.useState<SimpleEvent | null>(null)
  // Track daily limit for "Feeling Lucky"
  const [luckyCountToday, setLuckyCountToday] = React.useState(0)
  const LUCKY_LIMIT = 5

  // filters
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState('') // exact match, '' = any
  const [date, setDate] = React.useState('') // YYYY-MM-DD, '' = any

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
        const list = await EventsService.listEvents() // GET /clank/events/list

        const mapped: Array<SimpleEvent> = await Promise.all(
          list.map(async (e: any) => {
            let orgName = 'Organizer'

            try {
              if (e.organizer_id != null) {
                const user = (await UsersService.getUser({
                  userId: e.organizer_id,
                })) as any
                orgName = user.username || user.email || 'Organizer'
              }
            } catch {
              // ignore, keep default orgName
            }

            return {
              id: String(e.id),
              title: e.name,
              date: toMonthDay(e.start_time),
              dateISO: toDateOnly(e.start_time),
              org: orgName,
              where: e.location ?? 'TBD',
              category: toCategory(e.tags),
            }
          }),
        )

        setAll(mapped)
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load events')
      } finally {
        setLoading(false)
      }
    })()

    return () => {}
  }, [])

  // Build a per-user storage key (fallback to 'guest' when not logged in)
  const getLuckyKey = React.useCallback(() => {
    const uid = user?.id ?? user?.username ?? user?.email ?? 'guest'
    return `events-feeling-lucky:${uid}`
  }, [user])

  // Load/reset today's count whenever the user changes (per-user daily limit)
  React.useEffect(() => {
    try {
      const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD (local)
      const key = getLuckyKey()
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw) as { date: string; count: number } | null
        if (parsed && parsed.date === today) {
          setLuckyCountToday(parsed.count)
        } else {
          localStorage.setItem(key, JSON.stringify({ date: today, count: 0 }))
          setLuckyCountToday(0)
        }
      } else {
        localStorage.setItem(key, JSON.stringify({ date: today, count: 0 }))
        setLuckyCountToday(0)
      }
    } catch {
      setLuckyCountToday(0)
    }
  }, [getLuckyKey])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((e) => {
      if (q && !e.title.toLowerCase().includes(q)) return false
      if (category && e.category !== category) return false
      if (date && e.dateISO !== date) return false
      return true
    })
  }, [all, query, category, date])

  const handleLucky = () => {
    // Enforce 5-presses-per-day limit (local, per device)
    if (luckyCountToday >= LUCKY_LIMIT) {
      alert(
        `You've reached your daily limit of ${LUCKY_LIMIT} tries. Please try again tomorrow.`,
      )
      return
    }
    if (!filtered.length) return
    const i = Math.floor(Math.random() * filtered.length)
    setSelected(filtered[i])

    // 10% chance to grant a free ticket (only if one not already pending)
    if (!freeTicketEvent && Math.random() < 0.1) {
      setFreeTicketEvent(filtered[i])
    }

    // Increment and persist today's count (per-user)
    try {
      const today = new Date().toLocaleDateString('en-CA')
      const next = luckyCountToday + 1
      setLuckyCountToday(next)
      const key = getLuckyKey()
      localStorage.setItem(key, JSON.stringify({ date: today, count: next }))
    } catch {
      // ignore localStorage errors
    }
  }

  // handleRegister no longer used; ticket claims handled via UserDataContext.claimTicket

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">All Events</h1>
        <p className="mt-1 text-neutral-600">
          Browse and filter events. Click an event to preview.
        </p>
      </header>

      {freeTicketEvent && (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-4">
          <p className="font-semibold text-green-700">
            🎉 You've unlocked a free ticket for: {freeTicketEvent.title}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (!isLoggedIn || !user) {
                  alert('Please log in to claim your free ticket.')
                  return
                }
                const owner = user.username || user.email || 'me'
                const t = claimTicket(freeTicketEvent, owner, 'free')
                alert(
                  `Ticket issued!\n\nTicket ID: ${t.id}\nEvent: ${t.title}\nOwner: ${t.owner}`,
                )
                setFreeTicketEvent(null)
              }}
              className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
            >
              Claim Free Ticket
            </button>
            <button
              onClick={() => setFreeTicketEvent(null)}
              className="rounded border border-green-600 px-3 py-1 text-sm text-green-700 hover:bg-green-600 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Only show filters/list when not in a child route */}
      {!isDetail && (
        <>
          <FilterBar
            query={query}
            category={category}
            date={date}
            onQueryChange={setQuery}
            onCategoryChange={setCategory}
            onDateChange={setDate}
            onFeelingLucky={handleLucky}
          />

          {loading && <p>Loading events…</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && (
            <>
              <EventsList
                events={filtered}
                onSelect={(ev) => setSelected(ev)}
              />
              <EventPreviewModal
                event={selected}
                isLoggedIn={isLoggedIn}
                onClose={() => setSelected(null)}
              />
            </>
          )}
        </>
      )}

      {/* Child (/events/$eventId) renders here */}
      <Outlet />
    </main>
  )
}
