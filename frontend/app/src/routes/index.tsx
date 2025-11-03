import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";

import Hero from "../components/Hero";
import EventsList from "../components/events/EventsList";
import EventPreviewModal from "../components/events/EventPreviewModal";
import { useAuth } from "../hooks/AuthContext";

// use the typed SDK
import { EventsService } from "../client";
import type { SimpleEvent } from "../data/events.sample";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { isLoggedIn } = useAuth();

  const [events, setEvents] = React.useState<SimpleEvent[]>([]);
  const [selected, setSelected] = React.useState<SimpleEvent | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const toMonthDay = (iso: string) => {
      const d = new Date(iso);
      return `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}`;
    };
    const toDateOnly = (iso: string) => iso.slice(0, 10);

    (async () => {
      try {
        // GET /clank/events/list  (public)
        const list = await EventsService.listEvents();

        // Map backend -> SimpleEvent (id not in list payload, so synthesize)
        const mapped: SimpleEvent[] = list.map((e: any, i: number) => ({
          id: String(e.id),
          title: e.name,
          date: toMonthDay(e.start_time),
          dateISO: toDateOnly(e.start_time),
          org: "Organizer", // list payload doesn’t include organizer name
          where: e.location ?? "TBD",
          category:
            /workshop/i.test(e.tags ?? "") ? "Workshop" :
            /music/i.test(e.tags ?? "") ? "Music" :
            /sport/i.test(e.tags ?? "") ? "Sports" :
            /film|movie/i.test(e.tags ?? "") ? "Film" :
            /art/i.test(e.tags ?? "") ? "Arts" :
            "Other",
        }));

        if (mounted) setEvents(mapped);
      } catch (err: any) {
        if (mounted) setError(err?.message ?? "Failed to load events");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const upcoming = events.slice(0, 3);

  const handleRegister = (ev: { id: string; title: string }) => {
    // later: call backend add_ticket here
    alert(`Registered for: ${ev.title}`);
  };

  return (
    <div style={{ padding: "32px 0" }}>
      <Hero />

      <section id="events" className="mx-auto max-w-3xl px-4 pt-6 pb-20">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-2xl font-extrabold">Upcoming Events</h2>
          <Link to="/events" className="text-sm font-semibold hover:underline">
            See all
          </Link>
        </div>
        <p className="mb-4 text-neutral-600">
          A quick look at what’s next on campus.
        </p>

        {loading && <p>Loading events…</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            <EventsList events={upcoming} onSelect={(ev) => setSelected(ev)} />
            <EventPreviewModal
              event={selected}
              isLoggedIn={isLoggedIn}
              onRegister={handleRegister}
              onClose={() => setSelected(null)}
            />
          </>
        )}
      </section>
    </div>
  );
}
