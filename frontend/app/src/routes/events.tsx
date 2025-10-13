import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import EventsList from "../components/events/EventsList";
import FilterBar from "../components/events/FilterBar";
import EventPreviewModal from "../components/events/EventPreviewModal";
import { useAuth } from "../hooks/AuthContext";
import { sampleEvents, type SimpleEvent } from "../data/events.sample"; //  import the type

export const Route = createFileRoute("/events")({
  component: EventsPage,
});

function EventsPage() {
  const { isLoggedIn } = useAuth();

  //  selected must be a SimpleEvent (or null)
  const [selected, setSelected] = useState<SimpleEvent | null>(null);

  // search + filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(""); // exact match, '' = any
  const [date, setDate] = useState("");         // exact match (YYYY-MM-DD), '' = any

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return sampleEvents.filter((e) => {
      // title-only search
      if (q && !e.title.toLowerCase().includes(q)) return false;

      // exact category match
      if (category && e.category !== category) return false;

      // exact date match
      if (date && e.dateISO !== date) return false;

      return true;
    });
  }, [query, category, date]);

  const handleLucky = () => {
    if (!filtered.length) return;
    const i = Math.floor(Math.random() * filtered.length);
    setSelected(filtered[i]); // filtered[i] is SimpleEvent
  };

  const handleRegister = (ev: { id: string; title: string }) => {
    alert(`Registered for: ${ev.title}`);
  };

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
        category={category}
        date={date}
        onQueryChange={setQuery}
        onCategoryChange={setCategory}
        onDateChange={setDate}
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
