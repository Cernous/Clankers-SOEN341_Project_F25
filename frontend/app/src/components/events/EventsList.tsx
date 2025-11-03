// src/components/events/EventsList.tsx
import type { SimpleEvent } from "../../data/events.sample"

type Props = {
  events: SimpleEvent[]
  onSelect?: (ev: SimpleEvent) => void
}

export default function EventsList({ events, onSelect }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      {events.map((ev, i) => (
        <button
          key={ev.id}
          type="button"
          onClick={() => onSelect?.(ev)}
          className={[
            "flex w-full items-center justify-between gap-4 px-4 py-4 text-left",
            i > 0 ? "border-t border-neutral-200" : "",
            "bg-white hover:bg-neutral-50",
          ].join(" ")}
        >
          <div className="min-w-0">
            <div className="truncate font-semibold">{ev.title}</div>
            <div className="mt-1 text-sm text-neutral-600">
              {ev.org} • {ev.where}
            </div>
          </div>
          <div className="shrink-0 text-sm text-neutral-600">{ev.date}</div>
        </button>
      ))}
    </div>
  )
}
