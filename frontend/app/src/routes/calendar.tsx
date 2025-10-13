// src/routes/calendar.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useUserData } from '../hooks/UserDataContext'
import { sampleEvents } from '../data/events.sample'

export const Route = createFileRoute('/calendar')({
  component: CalendarPage,
})

function CalendarPage() {
  const { saved, toggleSave } = useUserData()

  // Map saved IDs to full event objects 
  const items = saved
    .map((id) => sampleEvents.find((e) => e.id === id) ?? null)
    .filter(Boolean)

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-3xl font-extrabold">My Saved Events</h1>
      <p className="mb-6 text-neutral-600">
        Events you’ve saved to your personal calendar.
      </p>

      {saved.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-neutral-600">
          You haven’t saved any events yet. Browse events and click <em>Save</em>.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {items.map((ev, i) => (
            <div
              key={ev!.id}
              className={[
                'flex items-center justify-between gap-4 px-4 py-4',
                i > 0 ? 'border-t border-neutral-200' : '',
              ].join(' ')}
            >
              <div className="min-w-0">
                <div className="truncate font-semibold">{ev!.title}</div>
                <div className="mt-1 text-sm text-neutral-600">
                  {ev!.org} • {ev!.where}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="shrink-0 text-sm text-neutral-600">{ev!.date}</span>
                <button
                  type="button"
                  onClick={() => toggleSave(ev!)}
                  className="shrink-0 rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-semibold hover:bg-neutral-50"
                >
                  Unsave
                </button>
              </div>
            </div>
          ))}

          {/* Show unknown IDs (in case an event was removed from sample list) */}
          {items.length < saved.length && (
            <div className="border-t border-neutral-200 px-4 py-3 text-sm text-neutral-500">
              Some saved events aren’t available anymore.
            </div>
          )}
        </div>
      )}
    </main>
  )
}
