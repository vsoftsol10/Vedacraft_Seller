import StatsOverview from "../components/insights/Statsoverview";
import OrderTrendsChart from "../components/insights/Ordertrendschart";
import BusinessTips from "../components/insights/BusinessTips";
import TopSellingProducts from "../components/insights/TopsellingProduct";

export default function Insights() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-[26px] font-bold text-gray-900 sm:text-3xl">Insights</h1>
        <p className="mt-1 text-sm text-gray-700">
          Manage your stock, track levels and never run out of your bestseller
        </p>
      </div>

      <StatsOverview />

      <OrderTrendsChart />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BusinessTips />
        <TopSellingProducts />
      </div>
    </div>
  );
}
