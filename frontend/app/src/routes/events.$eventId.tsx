// src/routes/events.$eventId.tsx
import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'  // <-- add Link
import { EventsService } from '../client'

export const Route = createFileRoute('/events/$eventId')({
  component: EventDetailPage,
})

function EventDetailPage() {
  const { eventId } = Route.useParams()
  const [data, setData] = React.useState<any | null>(null)
  const [err, setErr] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await EventsService.readEvent({ eventId: Number(eventId) })
        if (mounted) setData(res)
      } catch (e: any) {
        if (mounted) setErr(e?.message ?? 'Failed to load event')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [eventId])

  if (loading) return <main className="p-6">Loading…</main>
  if (err) return <main className="p-6 text-red-600">{err}</main>
  if (!data) return <main className="p-6">Not found.</main>

  const fmtDateTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleString() : '—'
  const fmtPrice = (price?: number) =>
    price && Number(price) > 0 ? `$${Number(price).toFixed(2)}` : 'Free'

  const unitPrice = Number(data.price || 0)

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <a
          href="/events"
          className="inline-flex items-center text-sm font-semibold text-neutral-600 hover:text-neutral-900"
        >
          ← Back to all events
        </a>
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
        {/* LEFT */}
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div
            className="h-60 w-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1529336953121-ad3c0f3f1f59?q=80&w=1600&auto=format&fit=crop')",
            }}
          />
          <div className="p-6">
            <h1 className="text-3xl font-extrabold tracking-tight">{data.name}</h1>
            {!!data.description && (
              <p className="mt-3 text-neutral-700 leading-relaxed">{data.description}</p>
            )}
            {data.tags && (
              <div className="mt-4 flex flex-wrap gap-2">
                {String(data.tags)
                  .split(',')
                  .map((t: string) => t.trim())
                  .filter(Boolean)
                  .map((t: string) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700"
                    >
                      #{t}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Event info</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li><span className="font-medium">Starts:</span> {fmtDateTime(data.start_time)}</li>
              <li><span className="font-medium">Ends:</span> {fmtDateTime(data.end_time)}</li>
              <li><span className="font-medium">Location:</span> {data.location ?? 'TBD'}</li>
              <li><span className="font-medium">Price:</span> {fmtPrice(unitPrice)}</li>
            </ul>

            {/* Redirect to /purchase with search params */}
            <Link
              to="/purchase"
              search={{
                eventId: String(data.id ?? eventId),
                title: String(data.name),              // ← use 'title' to match purchase.tsx
                price: unitPrice,   // 0 means free; customize in purchase screen later
                qty: 1,
              }}
              className="mt-5 block w-full rounded-xl bg-[#7A0019] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#a30025]"
            >
              Get Ticket
            </Link>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-sm text-neutral-700">
              Tip: Add this event to your calendar so you don’t miss it.
            </p>
          </div>
        </aside>
      </div>

      {/* Comments (visuals only) */}
      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-semibold">Comments</h3>
        <div className="mt-4 space-y-5">
          <div className="flex gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-200" />
            <div className="flex-1">
              <div className="text-sm">
                <span className="font-semibold">Alex</span>{' '}
                <span className="text-neutral-500">· 2h ago</span>
              </div>
              <p className="mt-1 text-sm text-neutral-800">
                Super excited for this! Will there be a Q&amp;A at the end?
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-200" />
            <div className="flex-1">
              <div className="text-sm">
                <span className="font-semibold">Jamie</span>{' '}
                <span className="text-neutral-500">· 1d ago</span>
              </div>
              <p className="mt-1 text-sm text-neutral-800">
                Last year’s expo was fantastic—looking forward to this one!
              </p>
            </div>
          </div>
        </div>

        <form className="mt-6 flex gap-3">
          <input
            type="text"
            placeholder="Write a comment…"
            className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400"
          />
          <button
            type="button"
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900"
          >
            Post
          </button>
        </form>
      </section>
    </main>
  )
}
