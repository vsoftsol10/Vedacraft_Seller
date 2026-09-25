// import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

// export default function OrdersToolbar({ query, onQueryChange, onFilterClick, onSortClick }) {
//   return (
//     <div className="flex flex-wrap items-center gap-3">
//       <div className="relative min-w-60 flex-1">
//         <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral" />
//         <input
//           value={query}
//           onChange={(e) => onQueryChange(e.target.value)}
//           placeholder="Search"
//           className="w-full rounded-lg border border-[#e5e7eb] bg-surface py-2.5 pl-9 pr-4 text-sm text-[#374151] outline-0 focus:border-emerald-400"
//         />
//       </div>
//       <button onClick={onFilterClick} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e5e7eb] bg-surface px-4 py-2.5 text-sm text-slate hover:bg-[#f9fafb]">
//         <SlidersHorizontal size={16} />
//         Filter
//       </button>
//       <button onClick={onSortClick} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e5e7eb] bg-surface px-4 py-2.5 text-sm text-slate hover:bg-[#f9fafb]">
//         <ArrowUpDown size={16} />
//         Sort by
//       </button>
//     </div>
//   );
// }

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, Check } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "placed", label: "Placed" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Returned" },
];

function Dropdown({ label, icon: Icon, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = value && value !== "all" && value !== "none";
  const activeLabel = options.find((option) => option.value === value)?.label;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "border-[#a7f3d0] bg-[#d1fae5] text-[#059669]"
            : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
        }`}
      >
        <Icon size={16} />
        {isActive ? activeLabel : label}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[#374151] hover:bg-[#f9fafb]"
            >
              {option.label}
              {option.value === value && <Check size={14} className="text-[#059669]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersToolbar({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  sortOptions,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search"
          className="w-full rounded-lg border border-[#e5e7eb] bg-white py-2.5 pl-9 pr-4 text-sm text-[#111827] outline-none focus:border-[#9ca3af]"
        />
      </div>
      <Dropdown
        label="Filter"
        icon={SlidersHorizontal}
        options={STATUS_OPTIONS}
        value={statusFilter}
        onChange={onStatusFilterChange}
      />
      <Dropdown
        label="Sort by"
        icon={ArrowUpDown}
        options={sortOptions}
        value={sortBy}
        onChange={onSortByChange}
      />
    </div>
  );
}