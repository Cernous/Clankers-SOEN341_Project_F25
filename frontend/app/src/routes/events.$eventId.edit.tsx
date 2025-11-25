import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/events/$eventId/edit')({
  component: EditEventPage,
})

function EditEventPage() {
  const { eventId } = Route.useParams()

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
