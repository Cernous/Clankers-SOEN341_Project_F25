import { Link } from '@tanstack/react-router'
import type { SimpleEvent } from '../../data/events.sample'

type Props = {
  events: Array<SimpleEvent>
  onSelect?: (ev: SimpleEvent) => void
}

export default function EventsList({ events, onSelect }: Props) {
  return (
    <div className="grid gap-4 md:gap-6">
      {events.map((ev) => (
        <div
          key={ev.id}
          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-red-200 transition-all duration-300 transform hover:-translate-y-1"
        >
          {/* Gradient accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-[#7A0019]" />

          <div className="flex items-start justify-between gap-4">
            <button
              type="button"
              onClick={() => onSelect?.(ev)}
              className="min-w-0 flex-1 text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-[#7A0019]" />
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#7A0019] transition-colors duration-200">
                  {ev.title}
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span className="font-medium">{ev.org}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{ev.where}</span>
                </div>
              </div>
            </button>

            <div className="shrink-0 text-right space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-[#7A0019]">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {ev.date}
              </div>

              <Link
                to="/events/$eventId"
                params={{ eventId: String(ev.id) }}
                className="block rounded-full bg-[#7A0019] px-4 py-2 text-sm text-white hover:bg-[#600013] transition-colors duration-200 text-center"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
