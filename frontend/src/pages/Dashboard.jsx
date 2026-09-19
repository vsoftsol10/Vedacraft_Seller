import { IndianRupee, ShoppingBag, Package, Star } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import RevenueChart from "../components/dashboard/RevenueChart";
import SalesByCategoryChart from "../components/dashboard/SalesByCategoryChart";
import RecentOrdersTable from "../components/dashboard/RecentOrdersTable";
import TopProductsTable from "../components/dashboard/TopProductsTable";
import LowStockAlert from "../components/dashboard/LowStockAlert";

const lowStockItems = [
  { name: "Ceramic Mug", stock: "Only 12 left" },
  { name: "Jute Storage Basket", stock: "Only 8 left" },
  { name: "Wooden Spoon Set", stock: "Only 2 left" },
];

export default function Dashboard({ sellerName = "Priya" }) {
  return (
    <div>
      {/* Greeting lives here, not in the shared Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Good Morning, {sellerName}</h1>
        <p className="text-xl text-gray-900 mt-1">Here's what's happening with your store today</p>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-5">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={IndianRupee} label="Total Revenue" value="₹4,86,250" change="12"
          iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={ShoppingBag} label="Total Order" value="268" change="12"
          iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatCard icon={Package} label="Total Products" value="128" change="12"
          iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={Star} label="Store Rating" value="4.7" change="12"
          iconBg="bg-amber-50" iconColor="text-amber-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RevenueChart />
        <SalesByCategoryChart />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RecentOrdersTable />
        <TopProductsTable />
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LowStockAlert items={lowStockItems} />
        <LowStockAlert title="Store" items={lowStockItems} />
      </div>
    </div>
  );
}
