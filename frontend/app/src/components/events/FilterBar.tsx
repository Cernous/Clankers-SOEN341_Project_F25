// src/components/events/FilterBar.tsx
type Props = {
  query?: string
  category?: string
  date?: string
  onQueryChange?: (q: string) => void
  onCategoryChange?: (c: string) => void
  onDateChange?: (d: string) => void
  onFeelingLucky?: () => void
}

export default function FilterBar({
  query = "",
  category = "",
  date = "",
  onQueryChange,
  onCategoryChange,
  onDateChange,
  onFeelingLucky,
}: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <input
        type="text"
        placeholder="Search by keyword…"
        value={query}
        onChange={(e) => onQueryChange?.(e.target.value)}
        className="min-w-[220px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400"
      />

      <select
        value={category}
        onChange={(e) => onCategoryChange?.(e.target.value)}
        className="min-w-[160px] rounded-xl border border-neutral-300 px-3 py-2"
      >
        <option value="">All categories</option>
        <option>Workshop</option>
        <option>Music</option>
        <option>Sports</option>
        <option>Film</option>
        <option>Arts</option>
        <option>Other</option>
      </select>

      <input
        type="date"
        value={date}
        onChange={(e) => onDateChange?.(e.target.value)}
        className="rounded-xl border border-neutral-300 px-3 py-2"
      />

      <button
        type="button"
        onClick={onFeelingLucky}
        className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
      >
        Feeling Lucky
      </button>
    </div>
  )
}
