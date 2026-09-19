export default function LowStockAlert({ title = "Low Stock Alert", items }) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.name} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{item.name}</span>
            <span className="text-gray-900">{item.stock}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
