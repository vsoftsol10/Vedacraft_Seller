import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export default function OrdersToolbar({ query, onQueryChange, onFilterClick, onSortClick }) {
  return (
    <div className="orders-toolbar">
      <div className="orders-toolbar__search">
        <Search size={16} className="orders-toolbar__search-icon" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search"
          className="orders-toolbar__search-input"
        />
      </div>
      <button onClick={onFilterClick} className="orders-toolbar__btn">
        <SlidersHorizontal size={16} />
        Filter
      </button>
      <button onClick={onSortClick} className="orders-toolbar__btn">
        <ArrowUpDown size={16} />
        Sort by
      </button>
    </div>
  );
}