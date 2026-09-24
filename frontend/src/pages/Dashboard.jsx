import { useEffect, useState } from "react";
import { IndianRupee, ShoppingBag, Package, Star } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import RevenueChart from "../components/dashboard/RevenueChart";
import SalesByCategoryChart from "../components/dashboard/SalesByCategoryChart";
import RecentOrdersTable from "../components/dashboard/RecentOrdersTable";
import TopProductsTable from "../components/dashboard/TopProductsTable";
import LowStockAlert from "../components/dashboard/LowStockAlert";
import { fetchDashboard } from "../api/dashboardapi";
import { fetchProfile } from "../api/profileapi";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [sellerName, setSellerName] = useState("Seller");

  useEffect(() => {
    let active = true;
    fetchDashboard().then((data) => { if (active) setDashboard(data); }).catch(() => { if (active) setError("Unable to load dashboard data."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetchProfile().then((profile) => {
      const name = profile?.fullName?.trim();
      if (active && name) setSellerName(name);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const stats = dashboard?.stats;
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Good Morning, {sellerName}</h1>
        <p className="mt-1 text-xl text-gray-900">Here&apos;s what&apos;s happening with your store today</p>
      </div>
      <h2 className="mb-5 text-2xl font-bold text-gray-900">Dashboard</h2>
      {error && <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Total Revenue" value={stats ? money(stats.totalRevenue) : "—"} change={stats?.revenueChange} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats?.totalOrders ?? "—"} change={stats?.ordersChange} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatCard icon={Package} label="Total Products" value={stats?.totalProducts ?? "—"} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={Star} label="Store Rating" value={stats?.storeRating ?? "—"} iconBg="bg-amber-50" iconColor="text-amber-500" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart data={dashboard?.revenueTrend ?? []} />
        <SalesByCategoryChart data={dashboard?.categorySales ?? []} />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentOrdersTable orders={dashboard?.recentOrders ?? []} />
        <TopProductsTable products={dashboard?.topProducts ?? []} />
      </div>
      <LowStockAlert items={dashboard?.lowStock ?? []} />
    </div>
  );
}
