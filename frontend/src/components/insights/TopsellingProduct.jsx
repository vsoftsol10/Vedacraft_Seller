import { fetchTopSellingProducts } from "../../api/insightapi";
import useInsightQuery from "./useInsightQuery";

function ProductRow({ name, orders, image }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src={image || "/images/placeholder-product.jpg"}
          alt={name}
          className="h-10 w-10 shrink-0 rounded-md object-cover"
        />
        <p className="text-sm font-medium text-gray-900">{name}</p>
      </div>
      <p className="text-sm font-medium text-gray-900">{orders} orders</p>
    </div>
  );
}

function ProductRowSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-md bg-gray-100" />
        <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="h-3 w-14 animate-pulse rounded bg-gray-100" />
    </div>
  );
}

export default function TopSellingProducts() {
  const { data, isLoading, isError } = useInsightQuery(() => fetchTopSellingProducts(3), []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-gray-900">Top Selling Products</h2>
      <div className="space-y-4">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <ProductRowSkeleton key={i} />)}
        {isError && (
          <p className="text-sm text-red-500">Couldn't load top products.</p>
        )}
        {!isLoading &&
          !isError &&
          (data ?? []).map((product, index) => <ProductRow key={`${product.name}-${index}`} {...product} />)}
      </div>
    </div>
  );
}
