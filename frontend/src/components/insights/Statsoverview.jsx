import { ShoppingBag, IndianRupee, Package, Star } from "lucide-react";
import { fetchInsightStats } from "../../api/insightapi";
import useInsightQuery from "./useInsightQuery";

const STAT_CONFIG = [
  {
    key: "totalOrders",
    label: "Total Orders",
    icon: ShoppingBag,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
  },
  {
    key: "completed",
    label: "Completed",
    icon: IndianRupee,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    key: "pending",
    label: "Pending",
    icon: Package,
    iconBg: "bg-green-100",
    iconColor: "text-green-700",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    icon: Star,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-500",
  },
];

function StatCard({ label, value, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:gap-3 sm:p-5 lg:min-w-[auto]">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${iconBg}`}>
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 lg:min-w-[auto]">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900 sm:text-xl">{value}</p>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="h-[76px] animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
  );
}

export default function StatsOverview() {
  const { data, isLoading, isError } = useInsightQuery(fetchInsightStats, []);

  if (isError) {
    return (
      <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-500">
        Couldn't load order stats. Try refreshing.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {STAT_CONFIG.map((stat) =>
        isLoading ? (
          <StatCardSkeleton key={stat.key} />
        ) : (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={data[stat.key] ?? 0}
            icon={stat.icon}
            iconBg={stat.iconBg}
            iconColor={stat.iconColor}
          />
        )
      )}
    </div>
  );
}
