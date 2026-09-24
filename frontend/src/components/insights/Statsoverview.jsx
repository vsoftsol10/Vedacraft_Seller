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
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
