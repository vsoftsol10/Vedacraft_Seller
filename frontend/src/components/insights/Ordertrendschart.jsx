
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { fetchOrderTrends } from "../../api/insightapi";
import useInsightQuery from "./useInsightQuery";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear, currentYear - 1];

export default function OrderTrendsChart() {
  const [year, setYear] = useState(currentYear);

  const { data, isLoading, isError } = useInsightQuery(() => fetchOrderTrends(year), [year]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Order Trends</h2>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-500 focus:outline-none"
        >
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="h-80 w-full">
        {isLoading && (
          <div className="h-full w-full animate-pulse rounded-lg bg-gray-50" />
        )}
        {isError && (
          <p className="text-sm text-red-500">Couldn't load order trends.</p>
        )}
        {!isLoading && !isError && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid vertical={false} stroke="#eee" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
             <YAxis
  allowDecimals={false}
  tickCount={6}
  axisLine={false}
  tickLine={false}
  tick={{ fill: "#9ca3af", fontSize: 12 }}
/>
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#22c55e"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
