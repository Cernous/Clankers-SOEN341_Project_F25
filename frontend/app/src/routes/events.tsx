import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import EventsList from "../components/events/EventsList";
import FilterBar from "../components/events/FilterBar";
import EventPreviewModal from "../components/events/EventPreviewModal";
import { useAuth } from "../hooks/AuthContext";
import { sampleEvents } from "../data/events.sample";

export const Route = createFileRoute("/events")({
  component: EventsPage,
});

function EventsPage() {
  const { isLoggedIn } = useAuth();
  const [selected, setSelected] = useState<{
    id: string; title: string; date: string; org: string; where: string;
  } | null>(null);

  const [query, setQuery] = useState("");

  const handleLucky = () => {
    const i = Math.floor(Math.random() * sampleEvents.length);
    setSelected(sampleEvents[i]);
  };

  const handleRegister = (ev: { id: string; title: string }) => {
    alert(`Registered for: ${ev.title}`);
  };

  // case-insensitive search over title/org/where
  const q = query.trim().toLowerCase();
  const filtered = q
  ? sampleEvents.filter((e) =>
      e.title.toLowerCase().includes(q)
    )
  : sampleEvents;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">All Events</h1>
        <p className="mt-1 text-neutral-600">
          Browse and filter events. Click an event to preview.
        </p>
      </header>

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        onFeelingLucky={handleLucky}
      />

      <EventsList events={filtered} onSelect={(ev) => setSelected(ev)} />

      <EventPreviewModal
        event={selected}
        isLoggedIn={isLoggedIn}
        onRegister={handleRegister}
        onClose={() => setSelected(null)}
      />
    </main>
  );
}