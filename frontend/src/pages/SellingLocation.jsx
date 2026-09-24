import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import { deleteSellingLocationState, fetchSellingLocations, parseSellingLocationApiError, replaceSellingLocationState } from "../api/sellinglocationapi";
import INDIA_STATES_AND_CITIES from "../data/indiaStatesAndCities";

const STATE_CITIES = INDIA_STATES_AND_CITIES;
const STATES = Object.keys(STATE_CITIES);

const matches = (text, query) => text.toLowerCase().includes(query.trim().toLowerCase());

export default function SellingLocation() {
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [activeState, setActiveState] = useState("");
  const [selectedCities, setSelectedCities] = useState([]);
  const [stateQuery, setStateQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");

  const closeModal = () => setModalOpen(false);

  const applyLocations = useCallback((data) => setLocations(data?.locations ?? []), []);
  const loadLocations = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    setBanner(null);
    try {
      applyLocations(await fetchSellingLocations());
    } catch (error) {
      setLoadFailed(true);
      setBanner({ type: "error", text: parseSellingLocationApiError(error).message });
    } finally {
      setLoading(false);
    }
  }, [applyLocations]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSellingLocations();
        if (!cancelled) applyLocations(data);
      } catch (error) {
        if (!cancelled) {
          setLoadFailed(true);
          setBanner({ type: "error", text: parseSellingLocationApiError(error).message });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applyLocations]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const onKey = (event) => event.key === "Escape" && setModalOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const openModal = () => {
    setStep(1);
    setActiveState("");
    setSelectedCities([]);
    setStateQuery("");
    setCityQuery("");
    setModalOpen(true);
  };

  const pickState = (name) => {
    const existing = locations.find((item) => item.state === name);
    setActiveState(name);
    setSelectedCities(existing ? existing.cities : []);
    setCityQuery("");
    setStep(2);
  };

  const toggleCity = (city) =>
    setSelectedCities((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]));

  const saveModal = async () => {
    if (!activeState || !selectedCities.length) return;
    const ordered = STATE_CITIES[activeState].filter((city) => selectedCities.includes(city));
    setSaving(true);
    setBanner(null);
    try {
      applyLocations(await replaceSellingLocationState(activeState, ordered));
      closeModal();
      setBanner({ type: "success", text: "Selling locations saved." });
    } catch (error) {
      const { message, fieldErrors } = parseSellingLocationApiError(error);
      setBanner({ type: "error", text: message });
      if (fieldErrors.cities) setBanner({ type: "error", text: fieldErrors.cities });
    } finally {
      setSaving(false);
    }
  };

  const removeState = async (name) => {
    setSaving(true);
    setBanner(null);
    try {
      applyLocations(await deleteSellingLocationState(name));
      setBanner({ type: "success", text: "Selling location removed." });
    } catch (error) {
      setBanner({ type: "error", text: parseSellingLocationApiError(error).message });
    } finally {
      setSaving(false);
    }
  };

  const visibleLocations = useMemo(() => {
    if (!query.trim()) return locations;
    return locations
      .map((item) => {
        if (matches(item.state, query)) return item;
        const cities = item.cities.filter((city) => matches(city, query));
        return cities.length ? { ...item, cities } : null;
      })
      .filter(Boolean);
  }, [locations, query]);

  const totalCities = locations.reduce((sum, item) => sum + item.cities.length, 0);
  const visibleStates = STATES.filter((name) => matches(name, stateQuery));
  const visibleCities = activeState ? STATE_CITIES[activeState].filter((city) => matches(city, cityQuery)) : [];

  return (
    <div className="flex max-w-[1100px] flex-col gap-5 pb-8 pt-2">
      <header>
        <h1 className="m-0 text-[32px] font-bold text-gray-900">Selling Location</h1>
        <p className="mb-0 mt-1.5 text-[15px] text-gray-800">Choose the states and cities where you want to sell your products.</p>
      </header>

      {banner && <p className={`m-0 rounded-md px-3 py-2 text-sm ${banner.type === "success" ? "border border-green-200 bg-green-50 text-green-800" : "border border-red-200 bg-red-50 text-red-700"}`} role={banner.type === "error" ? "alert" : "status"}>{banner.text}</p>}

      {loading ? <p className="m-0 text-sm text-gray-500">Loading selling locations…</p> : loadFailed ? <button type="button" onClick={loadLocations} className="w-fit rounded border border-gray-900 bg-white px-4 py-2 text-sm font-semibold">Retry</button> : <>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex h-[50px] w-full items-center gap-2 rounded border border-gray-200 bg-white px-3 sm:max-w-[740px]">
          <Search size={18} className="shrink-0 text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="w-full border-0 bg-transparent text-lg text-gray-900 placeholder:text-gray-500 focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={openModal}
          disabled={saving}
          className="flex h-[50px] cursor-pointer items-center justify-center gap-2 rounded border border-amber-300 bg-amber-200 px-6 text-sm font-semibold text-gray-900 hover:bg-amber-300 sm:w-[180px]"
        >
          <Plus size={16} /> Add location
        </button>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white px-3 pb-4 pt-3">
        <div className="flex items-center justify-between border-b border-gray-300 pb-3">
          <h2 className="m-0 text-[15px] font-bold text-gray-900">Select locations</h2>
          <span className="text-xs text-gray-500">
            {locations.length} {locations.length === 1 ? "state" : "states"} {totalCities} {totalCities === 1 ? "city" : "cities"}
          </span>
        </div>

        {visibleLocations.length === 0 ? (
          <p className="m-0 py-10 text-center text-sm text-gray-500">
            {locations.length === 0 ? "No selling locations yet. Click “Add location” to start." : "No locations match your search."}
          </p>
        ) : (
          visibleLocations.map((item) => (
            <div key={item.state} className="border-b border-gray-100 py-4 last:border-b-0">
              <div className="flex items-start justify-between">
                <span className="text-[15px] text-gray-900">{item.state}</span>
                <button
                  type="button"
                  onClick={() => removeState(item.state)}
                  disabled={saving}
                  className="cursor-pointer border-0 bg-transparent p-0 text-xs text-gray-900 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              <ul className="m-0 mt-2 list-none p-0">
                {item.cities.map((city) => (
                  <li key={city} className="relative ml-2.5 border-l border-gray-900 py-2.5 pl-4 text-sm text-gray-900">
                    <span className="absolute -left-[5px] top-3 h-2.5 w-2.5 rounded-full border-2 border-amber-400 bg-white" />
                    {city}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      </>}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => event.target === event.currentTarget && closeModal()}
        >
          <div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-[440px] max-w-full flex-col rounded-xl border border-gray-300 bg-white">
            <div className="flex items-start justify-between border-b border-gray-300 px-2.5 pb-2 pt-3">
              <div className="flex items-start gap-2">
                {step === 2 && (
                  <button type="button" onClick={() => setStep(1)} aria-label="Back" className="mt-0.5 cursor-pointer border-0 bg-transparent p-0 text-gray-900">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div>
                  <h3 className="m-0 text-lg font-semibold text-gray-900">
                    {step === 1 ? "Select State" : `Select City${activeState ? ` · ${activeState}` : ""}`}
                  </h3>
                  <p className="m-0 text-sm text-gray-900">Step {step} of 2</p>
                </div>
              </div>
              <button type="button" onClick={closeModal} aria-label="Close" className="cursor-pointer border-0 bg-transparent p-1 text-gray-900">
                <X size={16} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-3 pt-3">
              <label className="flex h-10 items-center gap-2 rounded border-2 border-green-500 bg-white px-2.5">
                <Search size={14} className="shrink-0 text-gray-500" />
                <input
                  autoFocus
                  value={step === 1 ? stateQuery : cityQuery}
                  onChange={(event) => (step === 1 ? setStateQuery(event.target.value) : setCityQuery(event.target.value))}
                  placeholder={step === 1 ? "Search State" : "Search City"}
                  className="w-full border-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
              </label>

              <div className="mt-3 min-h-[200px] flex-1 overflow-y-auto">
                {step === 1 ? (
                  visibleStates.length ? (
                    <ul className="m-0 list-none p-0">
                      {visibleStates.map((name) => (
                        <li key={name}>
                          <button
                            type="button"
                            onClick={() => pickState(name)}
                            className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-0 py-[5px] text-left text-[15px] text-gray-900 hover:bg-amber-50"
                          >
                            {name}
                            <ChevronRight size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="m-0 py-6 text-center text-sm text-gray-500">No states found.</p>
                  )
                ) : visibleCities.length ? (
                  <ul className="m-0 list-none p-0">
                    {visibleCities.map((city) => (
                      <li key={city}>
                        <label className="flex cursor-pointer items-center gap-2 py-1.5 text-[15px] text-gray-900">
                          <input
                            type="checkbox"
                            checked={selectedCities.includes(city)}
                            onChange={() => toggleCity(city)}
                            className="h-4 w-4 accent-green-700"
                          />
                          {city}
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 py-6 text-center text-sm text-gray-500">No cities found.</p>
                )}
              </div>

              {step === 2 && (
                <div className="mt-3 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="h-10 w-[150px] cursor-pointer rounded border border-gray-900 bg-white text-base text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveModal}
                    disabled={!selectedCities.length || saving}
                    className="h-10 w-[150px] cursor-pointer rounded border border-green-700 bg-green-700 text-base text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
