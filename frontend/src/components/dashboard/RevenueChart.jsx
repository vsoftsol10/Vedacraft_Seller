// import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
// export default function RevenueChart({ data })
//  { return <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
//     <div className="mb-1 flex items-center justify-between">
//         <h3 className="font-semibold text-gray-900">Revenue Overview</h3>
//         <span className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-400">This Year</span>
//         </div><p className="mb-4 text-xs text-gray-700">Gross sales over the last 12 months</p>
//         <ResponsiveContainer width="100%" height={220}>
//             <BarChart data={data}><CartesianGrid vertical={false} stroke="#d9dee7" />
//             <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5f6368" }} axisLine={{ stroke: "#9ca3af" }} tickLine={false} />
//             <YAxis tick={{ fontSize: 12, fill: "#5f6368" }} axisLine={false} tickLine={false} />
//             <Tooltip formatter={(value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value)} cursor={{ fill: "#f9fafb" }} /><Bar dataKey="value" name="Revenue" fill="#8573f6" radius={[5, 5, 0, 0]} barSize={16} /></BarChart>
//             </ResponsiveContainer></section>; }

import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown } from "lucide-react";

const START_YEAR = 2026;

function getAvailableYears() {
  const currentYear = new Date().getFullYear();
  const lastYear = Math.max(START_YEAR, currentYear);
  const years = [];
  for (let year = lastYear; year >= START_YEAR; year -= 1) years.push(year);
  return years;
}

export default function RevenueChart({ data, year, onYearChange }) {
  const years = getAvailableYears();
  const [internalYear, setInternalYear] = useState(year ?? years[0]);
  const selectedYear = year ?? internalYear;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectYear = (nextYear) => {
    setInternalYear(nextYear);
    onYearChange?.(nextYear);
    setOpen(false);
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Revenue Overview</h3>
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-500 hover:bg-gray-50"
          >
            {selectedYear}
            <ChevronDown size={14} />
          </button>
          {open && (
            <div className="absolute right-0 z-10 mt-1 w-28 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {years.map((yearOption) => (
                <button
                  key={yearOption}
                  type="button"
                  onClick={() => handleSelectYear(yearOption)}
                  className={`block w-full px-3 py-1.5 text-left text-sm ${
                    yearOption === selectedYear ? "bg-[#d1fae5] text-[#059669]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {yearOption}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="mb-4 text-xs text-gray-700">Gross sales over the last 12 months</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="#d9dee7" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5f6368" }} axisLine={{ stroke: "#9ca3af" }} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#5f6368" }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value)} cursor={{ fill: "#f9fafb" }} />
          <Bar dataKey="value" name="Revenue" fill="#8573f6" radius={[5, 5, 0, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}