// src/components/events/EventPreviewModal.tsx
import { Link } from '@tanstack/react-router'
import { useAuth } from '../../hooks/AuthContext'
import { useUserData } from '../../hooks/UserDataContext'
import { CalendarService } from '../../client'
import type { SimpleEvent } from '../../data/events.sample'

type Props = {
  event: SimpleEvent | null
  isLoggedIn: boolean
  onClose: () => void
  // onRegister no longer required; use claimTicket() from context
  onRegister?: (ev: SimpleEvent) => void
}

export default function EventPreviewModal({
  event,
  isLoggedIn,
  onClose,
}: Props) {
  const { user } = useAuth()
  const { isSaved, toggleSave, claimTicket } = useUserData()

  if (!event) return null

  const saved = isSaved(event.id)

  const handleSave = async () => {
    if (!isLoggedIn) return

    const numericId = Number(event.id)
    if (!Number.isFinite(numericId)) {
      console.error('Invalid event id for calendar toggle:', event.id)
      alert('Could not update your calendar for this event (invalid ID).')
      return
    }

    try {
      if (saved) {
        // UNSAVE: remove from backend calendar
        await CalendarService.deleteEventCalendar({ eventId: numericId })
      } else {
        // SAVE: add to backend calendar
        await CalendarService.saveEventCalendar({ eventId: numericId })
      }

      // Keep local state (UserDataContext) in sync with backend
      toggleSave(event)
    } catch (e) {
      console.error('calendar toggle failed', e)
      alert('Could not update your calendar. Please try again.')
    }
  }

  const handleClaim = () => {
    if (!isLoggedIn || !user) return
    const owner = user.username || user.email || 'me'
    const t = claimTicket(event, owner, 'free')
    alert(
      `Ticket issued!\n\nTicket ID: ${t.id}\nEvent: ${t.title}\nOwner: ${t.owner}`,
    )
  }

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
        {/* image placeholder with subtle improvement */}
        <div className="h-40 bg-gradient-to-r from-neutral-100 to-neutral-200" />

        <div className="p-5">
          <h3 className="m-0 text-xl font-bold">{event.title}</h3>
          <p className="mt-1 text-neutral-600">
            {event.org} • {event.where}
          </p>
          <p className="mt-2 text-neutral-700">{event.date}</p>

          <div className="mt-4 flex flex-wrap gap-3">
            {/* Save / Unsave */}
            <button
              onClick={handleSave}
              disabled={!isLoggedIn}
              className={[
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200',
                isLoggedIn
                  ? 'hover:bg-neutral-100 hover:shadow-md cursor-pointer active:bg-neutral-200'
                  : 'cursor-not-allowed',
                isLoggedIn
                  ? saved
                    ? 'bg-red-50 text-[#7A0019] border border-red-200'
                    : 'border border-neutral-300 text-black'
                  : 'bg-neutral-300 text-black',
              ].join(' ')}
              title={isLoggedIn ? '' : 'Log in to save'}
            >
              {saved ? 'Unsave' : 'Save to Calendar'}
            </button>

            {/* Claim ticket */}
            <button
              onClick={handleClaim}
              disabled={!isLoggedIn}
              className={[
                'rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors duration-200',
                'hover:bg-primary hover:text-white hover:shadow-lg cursor-pointer active:bg-primaryActive',
                isLoggedIn
                  ? 'bg-[#7A0019]'
                  : 'bg-neutral-400 cursor-not-allowed',
              ].join(' ')}
              title={isLoggedIn ? '' : 'Log in to claim tickets'}
            >
              Claim Free Ticket
            </button>

            {/* View details */}
            <Link
              to="/events/$eventId"
              params={{ eventId: event.id }}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 transition-colors duration-200"
              onClick={onClose}
            >
              View details
            </Link>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 p-3">
          <button
            onClick={onClose}
            className="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-semibold hover:bg-neutral-50 transition-colors duration-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
