// src/components/events/EventPreviewModal.tsx
import { Link } from '@tanstack/react-router'
export type PreviewEvent = {
  id: string
  title: string
  date: string
  org: string
  where: string
}

type Props = {
  event: PreviewEvent | null
  isLoggedIn: boolean
  onClose: () => void
  onRegister?: (ev: PreviewEvent) => void
}

export default function EventPreviewModal({ event, isLoggedIn, onClose, onRegister }: Props) {
  if (!event) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
    >
      {/* stop click from closing */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        {/* image placeholder */}
        <div className="h-40 bg-neutral-100" />

        <div className="p-5">
          <h3 className="m-0 text-xl font-bold">{event.title}</h3>
          <p className="mt-1 text-neutral-600">
            {event.org} • {event.where}
          </p>
          <p className="mt-2 text-neutral-700">{event.date}</p>

          <div className="mt-4 flex gap-3">
            {isLoggedIn ? (
              <button
                onClick={() => onRegister?.(event)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-black hover:bg-neutral-900"
              >
                Register / Save
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-black hover:bg-neutral-900"
              >
                Log in to register
              </Link>
            )}

            <Link
              to={`/events`}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
            >
              View details
            </Link>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 p-3">
          <button
            onClick={onClose}
            className="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-semibold hover:bg-neutral-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
