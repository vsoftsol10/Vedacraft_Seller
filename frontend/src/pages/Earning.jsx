import { useEffect, useState } from "react";
import { Eye, Package, ShoppingBag } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import { getEarnings } from "../api/earningsapi";

const STAT_CARD = "flex items-center gap-3 rounded-xl border border-[#eee] bg-white p-4";
const STAT_ICON = "flex h-9 w-9 items-center justify-center rounded-lg";
const STAT_LABEL = "text-[13px] text-[#666]";
const STAT_VALUE = "text-[20px] font-bold";

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2,
}).format(Number(value) || 0);

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
  : "—";

export default function Earning() {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState({ thisMonth: null, allTime: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEarnings = async () => {
    setLoading(true);
    setError("");
    try {
      const [thisMonthResponse, allTimeResponse] = await Promise.all([getEarnings("thisMonth"), getEarnings("allTime")]);
      setEarnings({
        thisMonth: thisMonthResponse.data ?? thisMonthResponse,
        allTime: allTimeResponse.data ?? allTimeResponse,
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load earnings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadEarnings, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading) return <p className="m-0 rounded-lg bg-white p-4 text-[#4b5563]">Loading earnings…</p>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
    <p className="m-0">{error}</p>
    <button type="button" onClick={loadEarnings} className="mt-3 cursor-pointer rounded border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700">Retry</button>
  </div>;

  const thisMonth = earnings.thisMonth;
  const allTime = earnings.allTime;
  const recentOrders = thisMonth?.recentOrders ?? [];
  const trend = thisMonth?.trend ?? [];
  return <div>
    <h1 className="mb-1 text-[28px] font-bold">Earnings</h1>
    <p className="mb-5 text-[14px] text-[#777]">Track the value and volume of your seller orders this month.</p>

    <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className={STAT_CARD}><div className={STAT_ICON} style={{ background: "#d9f2df" }}><Package size={18} /></div><div><p className={STAT_LABEL}>This Month&apos;s Order Value</p><p className={STAT_VALUE}>{money(thisMonth?.orderValue)}</p></div></div>
      <div className={STAT_CARD}><div className={STAT_ICON} style={{ background: "#dbeafe" }}><Package size={18} /></div><div><p className={STAT_LABEL}>Total Order Value</p><p className={STAT_VALUE}>{money(allTime?.orderValue)}</p></div></div>
      <div className={STAT_CARD}><div className={STAT_ICON} style={{ background: "#fdeacb" }}><ShoppingBag size={18} /></div><div><p className={STAT_LABEL}>Order Count</p><p className={STAT_VALUE}>{Number(thisMonth?.orderCount) || 0}</p></div></div>
      <div className={STAT_CARD}><div className={STAT_ICON} style={{ background: "#ede9fe" }}><ShoppingBag size={18} /></div><div><p className={STAT_LABEL}>Total Orders</p><p className={STAT_VALUE}>{Number(allTime?.orderCount) || 0}</p></div></div>
    </div>

    <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-xl border border-[#eee] bg-white p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="m-0 text-[16px] font-semibold">Order Value Trend</h2><span className="rounded-md border border-[#e5e5e5] px-3 py-1.5 text-[13px] text-[#666]">Last 12 months</span></div>
        {trend.some(({ value }) => Number(value) > 0) ? <ResponsiveContainer width="100%" height={240}><BarChart data={trend}><CartesianGrid vertical={false} stroke="#f0f0f0" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#999" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#999" }} /><Bar dataKey="value" fill="#6bcf7f" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="m-0 flex h-[240px] items-center justify-center text-sm text-[#6b7280]">No seller order value in the last 12 months.</p>}
      </div>
      <div className="flex min-h-[180px] flex-col justify-center rounded-xl border border-[#eee] bg-white p-5"><h2 className="m-0 text-[16px] font-semibold">More earnings details</h2><p className="mb-0 mt-2 text-sm leading-6 text-[#666]">Commission and payout tracking are coming soon.</p></div>
    </div>

    <div className="rounded-xl border border-[#eee] bg-white p-5">
      <h2 className="mb-4 mt-0 text-[16px] font-semibold">Recent Orders</h2>
      {recentOrders.length === 0 ? <p className="m-0 py-6 text-center text-sm text-[#6b7280]">No seller orders yet.</p> : <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-[14px]"><thead><tr className="text-[13px] text-[#555]"><th className="border-b border-[#eee] pb-3 pr-4">Order ID</th><th className="border-b border-[#eee] pb-3 pr-4">Product</th><th className="border-b border-[#eee] pb-3 pr-4">Order Date</th><th className="border-b border-[#eee] pb-3 pr-4">Order Value</th><th className="border-b border-[#eee] pb-3 pr-4">Status</th><th className="border-b border-[#eee] pb-3 text-right">Action</th></tr></thead><tbody>{recentOrders.map((order) => <tr key={order.rawId ?? order.id}><td className="border-b border-[#f5f5f5] py-3 pr-4">{order.id}</td><td className="border-b border-[#f5f5f5] py-3 pr-4">{order.productNames}</td><td className="border-b border-[#f5f5f5] py-3 pr-4">{formatDate(order.date)}</td><td className="border-b border-[#f5f5f5] py-3 pr-4">{money(order.value)}</td><td className="border-b border-[#f5f5f5] py-3 pr-4"><span className="rounded-md bg-[#f3f4f6] px-2.5 py-1 text-[12px] font-medium text-[#374151]">{order.status}</span></td><td className="border-b border-[#f5f5f5] py-3 text-right"><button type="button" onClick={() => navigate("/orders", { state: { selectedOrderId: order.rawId } })} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#d1d5db] bg-white px-2.5 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]" aria-label={`View order ${order.id}`}><Eye size={14} /> View</button></td></tr>)}</tbody></table></div>}
    </div>
  </div>;
}
