import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { month: "Jan", value: 115 }, { month: "Feb", value: 200 },
  { month: "Mar", value: 148 }, { month: "Apr", value: 78 },
  { month: "May", value: 108 }, { month: "Jun", value: 128 },
  { month: "Jul", value: 142 }, { month: "Aug", value: 163 },
  { month: "Sep", value: 100 }, { month: "Oct", value: 82 },
  { month: "Nov", value: 108 }, { month: "Dec", value: 62 },
];

export default function RevenueChart() {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-900">Revenue Overview</h3>
        <button className="text-sm text-gray-400 border border-gray-200 rounded-md px-2 py-1">
          This Month
        </button>
      </div>
      <p className="text-xs text-gray-700 mb-4">Gross sales over the last 12 months</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="#d9dee7" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5f6368" }} axisLine={{ stroke: "#9ca3af" }} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#5f6368" }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#f9fafb" }} />
          <Bar dataKey="value" fill="#8573f6" radius={[5, 5, 0, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
