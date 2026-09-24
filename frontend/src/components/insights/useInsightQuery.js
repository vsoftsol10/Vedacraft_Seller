import { useEffect, useState } from "react";

export default function useInsightQuery(queryFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let active = true;
    queryFn()
      .then((result) => {
        if (!active) return;
        setData(result);
        setIsError(false);
      })
      .catch(() => { if (active) setIsError(true); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  // Callers provide the dependency list for their request parameters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, isLoading, isError };
}
