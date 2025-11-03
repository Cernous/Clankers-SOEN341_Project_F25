import { Link } from '@tanstack/react-router'
import type { SimpleEvent } from "../../data/events.sample"

type Props = {
  events: SimpleEvent[]
  onSelect?: (ev: SimpleEvent) => void
}

export default function EventsList({ events, onSelect }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      {events.map((ev, i) => (
        <div
          key={ev.id}
          className={[
            "flex w-full items-center justify-between gap-4 px-4 py-4",
            i > 0 ? "border-t border-neutral-200" : "",
            "bg-white hover:bg-neutral-50",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => onSelect?.(ev)}
            className="flex-1 text-left"
          >
            <div className="min-w-0">
              <div className="truncate font-semibold">{ev.title}</div>
              <div className="mt-1 text-sm text-neutral-600">
                {ev.org} • {ev.where}
              </div>
            </div>
          </button>


          <Link
            to="/events/$eventId"
            params={{ eventId: String(ev.id) }}
            className="rounded-full bg-[#7A0019] px-3 py-1 text-sm text-white hover:bg-[#a30025]">
            View details
          </Link>

          <div className="shrink-0 text-sm text-neutral-600">{ev.date}</div>
        </div>
      ))}
    </div>
  )
}
