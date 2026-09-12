const CabType = require("../models/CabType");
const { CAB_TYPES: STATIC_CAB_TYPES } = require("../data/cabTypes");

// Cab types change rarely, so a short in-process cache takes real load off
// Mongo on paths every visitor/booking hits. Swap for Redis once you're
// running more than one Node instance, so invalidation (see below) reaches
// every instance instead of just the one that handled the admin edit.
let cache = { data: null, expiresAt: 0 };
const TTL_MS = 60_000;

async function getCabTypes() {
  if (cache.data && cache.expiresAt > Date.now()) return cache.data;

  try {
    // secondaryPreferred: read-only, staleness-tolerant — fine on a replica.
    const cabTypes = await CabType.find().read("secondaryPreferred").lean();
    if (cabTypes.length > 0) {
      cache = { data: cabTypes, expiresAt: Date.now() + TTL_MS };
      return cabTypes;
    }
  } catch (err) {
    // fall through to static data below
  }

  // Mongo unreachable or genuinely empty (e.g. seed hasn't run yet) — the
  // static list keeps the site/app functional with the original defaults
  // rather than failing outright. Not cached, so it retries Mongo next call.
  return STATIC_CAB_TYPES;
}

function getCabTypeById(cabTypes, id) {
  return cabTypes.find((c) => c.id === id);
}

/** Called after an admin edit so the new rate is live immediately, not
 * after the cache would otherwise expire. */
function invalidateCabTypeCache() {
  cache = { data: null, expiresAt: 0 };
}

module.exports = { getCabTypes, getCabTypeById, invalidateCabTypeCache };
