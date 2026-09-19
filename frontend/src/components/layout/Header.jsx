import { Search, Bell } from "lucide-react";

export default function Header({ sellerName = "Priya", avatarUrl }) {
  return (
    <header className="bg-white px-9 py-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center gap-5 ml-6">
          <button className="text-gray-500 hover:text-gray-700">
            <Bell size={20} />
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 shrink-0">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={sellerName}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
