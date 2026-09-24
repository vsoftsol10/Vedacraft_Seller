import { fetchBusinessTips } from "../../api/insightapi";
import useInsightQuery from "./useInsightQuery";

function TipRow({ title, description, image }) {
  return (
    <div className="flex items-start gap-3">
      <img
        src={image || "/images/placeholder-product.jpg"}
        alt={title}
        className="h-10 w-10 shrink-0 rounded-md object-cover"
      />
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function TipRowSkeleton() {
  return (
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-md bg-gray-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function BusinessTips() {
  const { data, isLoading, isError } = useInsightQuery(fetchBusinessTips, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-gray-900">Business Tips</h2>
      <div className="space-y-4">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <TipRowSkeleton key={i} />)}
        {isError && (
          <p className="text-sm text-red-500">Couldn't load business tips.</p>
        )}
        {!isLoading &&
          !isError &&
          (data ?? []).map((tip, index) => <TipRow key={`${tip.title}-${index}`} {...tip} />)}
      </div>
    </div>
  );
}
