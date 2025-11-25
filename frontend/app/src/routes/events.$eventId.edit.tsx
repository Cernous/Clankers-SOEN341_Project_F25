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

  const [eventData, setEventData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    location: '',
    price: '',
    start_time: '',
    end_time: '',
    tags: '',
    visibility: 'public',
  })

  // Load event data
  React.useEffect(() => {
    const loadEvent = async () => {
      try {
        const data = await EventsService.readEvent({ eventId: Number(eventId) })
        const eventDataTyped = data as any
        setEventData(eventDataTyped)

        // Pre-populate form
        setFormData({
          name: eventDataTyped.name || '',
          description: eventDataTyped.description || '',
          location: eventDataTyped.location || '',
          price: String(eventDataTyped.price || ''),
          start_time: eventDataTyped.start_time
            ? new Date(eventDataTyped.start_time).toISOString().slice(0, 16)
            : '',
          end_time: eventDataTyped.end_time
            ? new Date(eventDataTyped.end_time).toISOString().slice(0, 16)
            : '',
          tags: eventDataTyped.tags || '',
          visibility: eventDataTyped.visibility || 'public',
        })
      } catch (e: any) {
        setError('Failed to load event data')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [eventId])

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      await EventsService.updateEvent({
        eventId: Number(eventId),
        requestBody: {
          name: formData.name,
          description: formData.description,
          location: formData.location,
          price: Number(formData.price) || 0,
          start_time: formData.start_time,
          end_time: formData.end_time,
          tags: formData.tags,
          visibility: formData.visibility,
          state: 'active',
        },
      })

      // Navigate back to event page
      navigate({ to: '/events/$eventId', params: { eventId } })
    } catch (e: any) {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate({ to: '/events/$eventId', params: { eventId } })
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-center">Loading event data...</div>
      </main>
    )
  }

  if (
    !isLoggedIn ||
    user?.role !== 'creator' ||
    eventData?.organizer_id !== user.id
  ) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-center text-red-600">
          You don't have permission to edit this event.
        </div>
      </main>
    )
  }

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

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="space-y-6">
          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Event Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-[#7A0019] focus:outline-none"
              placeholder="Enter event name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-[#7A0019] focus:outline-none"
              placeholder="Enter event description"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-[#7A0019] focus:outline-none"
              placeholder="Enter event location"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Price ($)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-[#7A0019] focus:outline-none"
              placeholder="0.00"
            />
          </div>

          {/* Date and Time */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-[#7A0019] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-[#7A0019] focus:outline-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-[#7A0019] focus:outline-none"
              placeholder="music, concert, entertainment"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Visibility
            </label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-[#7A0019] focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#7A0019] px-4 py-2 text-sm font-medium text-white hover:bg-[#5A0013] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </main>
  )
}
