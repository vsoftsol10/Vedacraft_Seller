import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "Home Decor", value: 40, color: "#4f3edc" },
  { name: "Kitchen & Dining", value: 30, color: "#ff7a08" },
  { name: "Lifestyle", value: 20, color: "#51a622" },
  { name: "Accessories", value: 10, color: "#ffb34d" },
];

export default function SalesByCategoryChart() {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-900">Sales by Category</h3>
        <button className="text-sm text-gray-400 border border-gray-200 rounded-md px-2 py-1">This Month</button>
      </div>
      <p className="text-xs text-gray-700 mb-4">Revenue distribution</p>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
        <ResponsiveContainer width={190} height={190}>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={32} outerRadius={82} startAngle={90} endAngle={450}>
              {data.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="none" />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <ul className="w-full space-y-3 sm:w-52">
          {data.map((entry) => (
            <li key={entry.name} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-900">{entry.name}</span>
              <span className="text-gray-900 font-medium ml-auto">{entry.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
