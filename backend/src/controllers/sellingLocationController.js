import { supabase } from "../config/supabase.js";

const applicationsTable = "seller_applications";
const locationsTable = "seller_selling_locations";
const REQUIRE_APPROVED = false;
const APPROVED_STATUSES = ["approved"];
const MAX_CITY_ROWS_PER_SELLER = 2000;

const normaliseText = (value) => String(value).trim().replace(/\s+/g, " ");

const validateState = (value) => {
  if (typeof value !== "string") return null;
  const state = normaliseText(value);
  return state.length >= 2 && state.length <= 60 ? state : null;
};

const validateCities = (value) => {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) return null;

  const seen = new Set();
  const cities = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    const city = normaliseText(item);
    if (city.length < 2 || city.length > 60) return null;
    const key = city.toLocaleLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      cities.push(city);
    }
  }
  return cities;
};

const findSeller = async (sellerId) => {
  const { data, error } = await supabase
    .from(applicationsTable)
    .select("id, status")
    .eq("id", sellerId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const locationData = async (sellerId) => {
  const { data, error } = await supabase
    .from(locationsTable)
    .select("state, city")
    .eq("seller_id", sellerId);
  if (error) throw error;

  const groups = new Map();
  for (const row of data) {
    const key = row.state.toLocaleLowerCase();
    const group = groups.get(key) || { state: row.state, cities: [] };
    group.cities.push(row.city);
    groups.set(key, group);
  }

  const locations = [...groups.values()]
    .map((location) => ({ ...location, cities: location.cities.sort((a, b) => a.localeCompare(b)) }))
    .sort((a, b) => a.state.localeCompare(b.state));
  return {
    locations,
    stateCount: locations.length,
    cityCount: locations.reduce((count, location) => count + location.cities.length, 0),
  };
};

const approvalError = (seller) => REQUIRE_APPROVED && !APPROVED_STATUSES.includes(seller.status);

export const getSellingLocations = async (req, res) => {
  try {
    return res.json({ success: true, data: await locationData(req.seller.id) });
  } catch (error) {
    console.error("Unable to load selling locations:", error);
    return res.status(500).json({ success: false, message: "Unable to load selling locations. Please try again." });
  }
};

export const replaceSellingLocationState = async (req, res) => {
  try {
    const seller = await findSeller(req.seller.id);
    if (!seller) return res.status(404).json({ success: false, message: "No seller profile is linked to this account." });
    if (approvalError(seller)) return res.status(403).json({ success: false, message: "Your account must be approved before you can edit selling locations." });

    const state = validateState(req.params.state);
    const cities = validateCities(req.body?.cities);
    const errors = {};
    if (!state) errors.state = "State must be between 2 and 60 characters.";
    if (!cities) errors.cities = "Provide 1 to 100 unique city names, each between 2 and 60 characters.";
    if (Object.keys(errors).length) return res.status(400).json({ success: false, message: "Please correct the highlighted fields.", errors });

    const { error } = await supabase.rpc("replace_seller_state_locations", {
      p_seller_id: seller.id,
      p_state: state,
      p_cities: cities,
    });
    if (error) {
      if (error.message?.includes("SELLING_LOCATION_CAP_EXCEEDED")) {
        return res.status(400).json({ success: false, message: "Please correct the highlighted fields.", errors: { cities: `A seller may have at most ${MAX_CITY_ROWS_PER_SELLER} city locations.` } });
      }
      throw error;
    }

    return res.json({ success: true, data: await locationData(seller.id) });
  } catch (error) {
    if (error?.code === "23505") return res.status(409).json({ success: false, message: "A duplicate selling location already exists.", errors: { cities: "Duplicate city locations are not allowed." } });
    console.error("Unable to update selling locations:", error);
    return res.status(500).json({ success: false, message: "Unable to update selling locations. Please try again." });
  }
};

export const deleteSellingLocationState = async (req, res) => {
  try {
    const seller = await findSeller(req.seller.id);
    if (!seller) return res.status(404).json({ success: false, message: "No seller profile is linked to this account." });
    if (approvalError(seller)) return res.status(403).json({ success: false, message: "Your account must be approved before you can edit selling locations." });

    const state = validateState(req.params.state);
    if (!state) return res.status(400).json({ success: false, message: "Please correct the highlighted fields.", errors: { state: "State must be between 2 and 60 characters." } });

    const { data: existing, error: fetchError } = await supabase
      .from(locationsTable)
      .select("id, state")
      .eq("seller_id", seller.id)
    if (fetchError) throw fetchError;

    const ids = existing
      .filter((location) => location.state.toLocaleLowerCase() === state.toLocaleLowerCase())
      .map((location) => location.id);
    if (ids.length) {
      const { error } = await supabase.from(locationsTable).delete().in("id", ids);
      if (error) throw error;
    }

    return res.json({ success: true, data: await locationData(seller.id) });
  } catch (error) {
    console.error("Unable to delete selling location:", error);
    return res.status(500).json({ success: false, message: "Unable to delete selling location. Please try again." });
  }
};
