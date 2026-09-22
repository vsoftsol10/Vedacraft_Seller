import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export default function OrdersToolbar({ query, onQueryChange, onFilterClick, onSortClick }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-60 flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search"
          className="w-full rounded-lg border border-[#e5e7eb] bg-surface py-2.5 pl-9 pr-4 text-sm text-[#374151] outline-0 focus:border-emerald-400"
        />
      </div>
      <button onClick={onFilterClick} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e5e7eb] bg-surface px-4 py-2.5 text-sm text-slate hover:bg-[#f9fafb]">
        <SlidersHorizontal size={16} />
        Filter
      </button>
      <button onClick={onSortClick} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e5e7eb] bg-surface px-4 py-2.5 text-sm text-slate hover:bg-[#f9fafb]">
        <ArrowUpDown size={16} />
        Sort by
      </button>
    </div>
  );
}
