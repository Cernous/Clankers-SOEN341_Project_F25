import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { EventsService } from '../client'
import { useAuth } from '../hooks/AuthContext'

export const Route = createFileRoute('/event-creation')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  // Simple auth gate: only organizers/admins can create
  const role = user?.role
  const canCreate = isLoggedIn && (role === 'creator' || role === 'admin')

  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [start, setStart] = React.useState('') // datetime-local
  const [end, setEnd] = React.useState('')     // datetime-local (optional)
  const [location, setLocation] = React.useState('')
  const [ticketType, setTicketType] = React.useState<'free' | 'paid' | ''>('')
  const [price, setPrice] = React.useState<number>(0)
  const [tags, setTags] = React.useState('') // comma-separated
  const [visibility, setVisibility] = React.useState<'public' | 'private'>('public')

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  // If not allowed, show a friendly message
  if (!canCreate) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-2">Event Creation</h1>
        <p className="text-neutral-700">
          You need to be logged in as an <strong>Organizer</strong> or <strong>Admin</strong> to create events.
        </p>
      </main>
    )
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // basic validation
    if (!title.trim()) return setError('Title is required')
    if (!description.trim()) return setError('Description is required')
    if (!start) return setError('Start time is required')
    if (!location.trim()) return setError('Location is required')
    if (!ticketType) return setError('Please choose Free or Paid')
    if (ticketType === 'paid' && (isNaN(price) || price <= 0)) {
      return setError('Please enter a valid price greater than 0')
    }

    const startISO = new Date(start).toISOString()
    const endISO = end
      ? new Date(end).toISOString()
      : new Date(new Date(start).getTime() + 2 * 60 * 60 * 1000).toISOString() // +2h default

    setSubmitting(true)
    try {
      await EventsService.createEvent({
        requestBody: {
          name: title,
          description,
          price: ticketType === 'paid' ? Number(price) : 0,
          location,
          start_time: startISO,
          end_time: endISO,
          tags: tags.trim() || undefined,     // backend accepts optional
          pictures: undefined,                // not in form yet
          visibility,                         // required by backend
          // organizer_id is set server-side for organizers; admins can specify but we’ll let backend handle
        },
      })

      setSuccess('Event created successfully!')
      // optionally navigate somewhere (e.g. events list) after a small delay:
      setTimeout(() => navigate({ to: '/events' }), 800)
    } catch (err: any) {
      // show server message if available
      setError(err?.message || 'Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">Event Creation</h1>
        <p className="mt-1 text-neutral-600">Create your event</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5">
        {error && <div className="rounded-md bg-red-50 text-red-700 px-3 py-2">{error}</div>}
        {success && <div className="rounded-md bg-green-50 text-green-700 px-3 py-2">{success}</div>}

        <div>
          <label htmlFor="title" className="text-neutral-600 block font-bold">Title</label>
          <input
            id="title"
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-[500px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400"
          />
        </div>

        <div>
          <label htmlFor="description" className="text-neutral-600 block font-bold">Description</label>
          <textarea
            id="description"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-w-[500px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-neutral-600 block font-bold">Start Time</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-xl border border-neutral-300 px-3 py-2"
              aria-label="Start Date/Time"
            />
          </div>
          <div>
            <label className="text-neutral-600 block font-bold">End Time (optional)</label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-xl border border-neutral-300 px-3 py-2"
              aria-label="End Date/Time"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="text-neutral-600 block font-bold">Location</label>
          <input
            id="location"
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="min-w-[500px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-neutral-600 block font-bold">Ticket Type</label>
            <select
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value as 'free' | 'paid' | '')}
              className="min-w-[200px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400"
            >
              <option value="">--Please choose an option--</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {ticketType === 'paid' && (
            <div>
              <label className="text-neutral-600 block font-bold">Price</label>
              <input
                type="number"
                step="0.01"
                min={0}
                placeholder="e.g. 10.00"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="min-w-[200px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400"
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-neutral-600 block font-bold">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
              className="min-w-[200px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div>
            <label className="text-neutral-600 block font-bold">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. tech, workshop, robotics"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="min-w-[200px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </main>
  )
}
