const products = [
  { name: "Ceramic Mug", sold: 82, revenue: "68,240" },
  { name: "Jute Storage Basket", sold: 82, revenue: "53,120" },
  { name: "Wooden Spoon Set", sold: 48, revenue: "32,760" },
];

export default function TopProductsTable() {
  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Top Performing Products</h3>
      <table className="w-full text-sm">
        <thead>
            <tr className="text-left text-gray-900 border-b border-gray-200">
            <th className="pb-2 font-medium">Product</th>
            <th className="pb-2 font-medium">Sold</th>
            <th className="pb-2 font-medium">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.name} className="border-b border-gray-50 last:border-0">
              <td className="py-3 text-gray-700">{p.name}</td>
              <td className="py-3 text-gray-700">{p.sold}</td>
              <td className="py-3 text-gray-700">₹{p.revenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
