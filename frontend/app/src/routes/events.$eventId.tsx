// src/routes/events.$eventId.tsx
import * as React from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { EventsService } from '../client'
import { useAuth } from '../hooks/AuthContext'

export const Route = createFileRoute('/events/$eventId')({
  component: EventDetailPage,
})

type ReviewItem = {
  id?: number | string
  desc?: string
  star?: number
  date_created?: string
  user_id?: string
  event_id?: number
}

function EventDetailPage() {
  const { eventId } = Route.useParams()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()

  const [data, setData] = React.useState<any | null>(null)
  const [err, setErr] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  // --- reviews state ---
  const [reviews, setReviews] = React.useState<ReviewItem[]>([])
  const [reviewsLoading, setReviewsLoading] = React.useState(true)
  const [reviewErr, setReviewErr] = React.useState<string | null>(null)

  // --- new review form ---
  const [reviewText, setReviewText] = React.useState('')
  const [reviewStar, setReviewStar] = React.useState<number>(5)
  const [submitting, setSubmitting] = React.useState(false)

  // --- delete state ---
  const [deleting, setDeleting] = React.useState(false)
  const [deleteErr, setDeleteErr] = React.useState<string | null>(null)

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
    return () => {
      mounted = false
    }
  }, [eventId])

  // fetch reviews for this event
  const loadReviews = React.useCallback(async () => {
    setReviewsLoading(true)
    setReviewErr(null)
    try {
      const res = await EventsService.getEventReviews({ eventId: Number(eventId) })
      const list: ReviewItem[] = Array.isArray(res) ? (res as any) : ((res as any)?.reviews ?? [])
      setReviews(list ?? [])
    } catch (e: any) {
      setReviewErr(e?.message ?? 'Failed to load reviews')
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }, [eventId])

  React.useEffect(() => {
    loadReviews()
  }, [loadReviews])

  if (loading) return <main className="p-6">Loading…</main>
  if (err) return <main className="p-6 text-red-600">{err}</main>
  if (!data) return <main className="p-6">Not found.</main>

  const fmtDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '—')
  const fmtPrice = (price?: number) =>
    price && Number(price) > 0 ? `$${Number(price).toFixed(2)}` : 'Free'
  const unitPrice = Number(data.price || 0)

  // ---- admin-only check ----
  const isAdmin =
    isLoggedIn &&
    (user?.role === 'admin')

  // ---- delete handler (admin only) ----
async function handleDelete() {
  if (!isAdmin) return
  if (!window.confirm('Delete this event? This cannot be undone.')) return
  setDeleting(true)
  setDeleteErr(null)

  try {
    await EventsService.deleteEvent({
      eventId: Number(eventId),
      requestBody: {
        name: data.name ?? '',
        description: data.description ?? '',
        price: Number(data.price ?? 0),
        location: data.location ?? '',
        start_time: data.start_time ?? new Date().toISOString(),
        end_time: data.end_time ?? new Date().toISOString(),
        tags: data.tags ?? '',
        pictures: data.pictures ?? '',
        visibility: data.visibility ?? 'public',
        state: data.state ?? 'active',
      },
    } as any)

    navigate({ to: '/events' })
  } catch (e: any) {
    console.error('Delete error', e?.status, e?.body || e)
    const maybeDetail =
      e?.body && typeof e.body === 'object' && e.body.detail
        ? JSON.stringify(e.body.detail)
        : e?.message
    setDeleteErr(maybeDetail ?? 'Failed to delete event')
  } finally {
    setDeleting(false)
  }
}



  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoggedIn || !user?.id) {
      setReviewErr('You must be signed in to post a review.')
      return
    }
    if (!reviewText.trim()) {
      setReviewErr('Please write a comment.')
      return
    }
    setSubmitting(true)
    setReviewErr(null)
    try {
      await EventsService.addReview({
        requestBody: {
          desc: reviewText.trim(),
          star: Math.max(1, Math.min(5, Number(reviewStar))),
          date_created: new Date().toISOString(),
          user_id: String(user.username ?? user.id),
          event_id: Number(eventId),
        },
      })
      setReviewText('')
      setReviewStar(5)
      await loadReviews()
    } catch (e: any) {
      setReviewErr(e?.message ?? 'Failed to post review')
    } finally {
      setSubmitting(false)
    }
  }

  const maskUser = (uid?: string) => {
    if (!uid) return 'Anonymous'
    return uid.length > 10 || uid.includes('-') ? `${uid.slice(0, 6)}…` : uid
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <a
          href="/events"
          className="inline-flex items-center text-sm font-semibold text-neutral-600 hover:text-neutral-900"
        >
          ← Back to all events
        </a>

        {/* Admin-only delete button */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            {deleteErr && <span className="text-sm text-red-600">{deleteErr}</span>}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              title="Delete this event"
            >
              {deleting ? 'Deleting…' : 'Delete Event'}
            </button>
          </div>
        )}
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

            <Link
              to="/purchase"
              search={{
                eventId: String(data.id ?? eventId),
                title: String(data.name),
                price: unitPrice,
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

      {/* Reviews */}
      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Comments</h3>
          <button
            onClick={loadReviews}
            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-neutral-50"
            title="Refresh comments"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 space-y-5">
          {reviewsLoading && <div className="text-sm text-neutral-600">Loading…</div>}
          {reviewErr && <div className="text-sm text-red-600">{reviewErr}</div>}
          {!reviewsLoading && !reviews.length && !reviewErr && (
            <div className="text-sm text-neutral-600">No comments yet.</div>
          )}
          {reviews.map((r, idx) => (
            <div key={String(r.id ?? idx)} className="flex gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-200" />
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-semibold">{maskUser(r.user_id)}</span>{' '}
                  <span className="text-neutral-500">· {fmtDateTime(r.date_created)}</span>{' '}
                  {typeof r.star === 'number' && (
                    <span className="ml-1 text-yellow-600">
                      {'★'.repeat(Math.max(1, Math.min(5, r.star)))}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-neutral-800">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submitReview} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder={isLoggedIn ? 'Write a comment…' : 'Sign in to write a comment'}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            disabled={!isLoggedIn || submitting}
            className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400 disabled:bg-neutral-100"
          />
          <select
            value={reviewStar}
            onChange={(e) => setReviewStar(Number(e.target.value))}
            disabled={!isLoggedIn || submitting}
            className="rounded-xl border border-neutral-300 px-2 py-2 text-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
          >
            {[5,4,3,2,1].map(s => <option key={s} value={s}>{s}★</option>)}
          </select>
          <button
            type="submit"
            disabled={!isLoggedIn || submitting}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900 disabled:opacity-60"
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </form>
      </section>
    </main>
  )
}
