// src/components/events/EventsList.tsx
import type { SimpleEvent } from '../../data/events.sample'

type Props = {
  events: SimpleEvent[]
  onSelect?: (ev: SimpleEvent) => void
}

export default function EventsList({ events, onSelect }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
      {events.map((ev, i) => (
        <button
          key={ev.id}
          type="button"
          onClick={() => onSelect?.(ev)}
          className={[
            'flex w-full items-center justify-between gap-4 px-6 py-5 text-left',
            i > 0 ? 'border-t border-neutral-200' : '',
            'bg-white hover:bg-neutral-50 transition-colors duration-200',
          ].join(' ')}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#7A0019]" />
              <h3 className="font-bold text-lg text-gray-900 truncate">
                {ev.title}
              </h3>
            </div>
            <div className="text-sm text-neutral-600">
              <span className="font-medium">{ev.org}</span> • {ev.where}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm font-medium text-[#7A0019] bg-red-50 px-3 py-1 rounded-full">
              {ev.date}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
