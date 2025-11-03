import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import Hero from '../components/Hero'
import EventsList from '../components/events/EventsList'
import EventPreviewModal from '../components/events/EventPreviewModal'
import { useAuth } from '../hooks/AuthContext'

// shared sample data (future: replace with API)
import { sampleEvents, type SimpleEvent } from '../data/events.sample'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { isLoggedIn } = useAuth()

  // take the first 3 as "upcoming"
  const upcoming: SimpleEvent[] = sampleEvents.slice(0, 3)

  const [selected, setSelected] = useState<SimpleEvent | null>(null)

  const handleRegister = (ev: { id: string; title: string }) => {
    // later: call backend to create/claim ticket, then show success
    alert(`Registered for: ${ev.title}`)
  }

  return (
    <div style={{ padding: '32px 0' }}>
      {/* HERO */}
      <Hero />

      {/* UPCOMING (top 3) */}
      <section id="events" className="mx-auto max-w-4xl px-4 pt-6 pb-20">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Upcoming Events
          </h2>
          <Link
            to="/events"
            className="text-sm font-semibold text-[#7A0019] hover:text-[#600013] transition-colors duration-200"
          >
            See all
          </Link>
        </div>
        <p className="mb-6 text-neutral-600 text-lg">
          A quick look at what's next on campus.
        </p>

        <EventsList events={upcoming} onSelect={(ev) => setSelected(ev)} />

        <EventPreviewModal
          event={selected}
          isLoggedIn={isLoggedIn}
          onRegister={handleRegister}
          onClose={() => setSelected(null)}
        />
      </section>
    </div>
  )
}
