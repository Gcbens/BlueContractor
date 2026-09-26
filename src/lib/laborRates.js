// Configurable default hourly labor rates by trade. These are starting
// points, not fixed prices — the contractor can always override the
// resulting hourly_rate field on an estimate. Matched loosely (substring)
// against the AI-identified trade/job type so we don't need an exact enum.
export const DEFAULT_LABOR_RATES = {
  general_labor: 40,
  handyman: 45,
  carpentry: 55,
  painting: 45,
  flooring: 50,
  roofing: 60,
  plumbing: 75,
  electrical: 80,
  hvac: 75,
  masonry: 55,
  welding: 65,
  landscaping: 40,
  concrete: 55,
  demolition: 45,
  heavy_equipment: 70,
  specialized_technical: 90,
};

const KEYWORD_MAP = [
  [/plumb/i, "plumbing"],
  [/electric/i, "electrical"],
  [/hvac|heating|cooling|air ?condition/i, "hvac"],
  [/roof/i, "roofing"],
  [/mason|brick|stone/i, "masonry"],
  [/weld/i, "welding"],
  [/landscap|yard|lawn|fence|fencing/i, "landscaping"],
  [/concrete|paving|driveway/i, "concrete"],
  [/demo/i, "demolition"],
  [/excavat|skid steer|heavy equipment/i, "heavy_equipment"],
  [/paint/i, "painting"],
  [/floor|tile/i, "flooring"],
  [/carpen|framing|deck/i, "carpentry"],
  [/handyman/i, "handyman"],
];

export function defaultRateForTrade(trade) {
  if (!trade) return DEFAULT_LABOR_RATES.general_labor;
  const match = KEYWORD_MAP.find(([pattern]) => pattern.test(trade));
  return match ? DEFAULT_LABOR_RATES[match[1]] : DEFAULT_LABOR_RATES.general_labor;
}
