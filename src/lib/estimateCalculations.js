export function calculateLabor(data) {
  const totalHours = (data.estimated_hours || 0) + (data.travel_time || 0) + (data.setup_time || 0) + (data.cleanup_time || 0);
  return (data.num_workers || 1) * (data.hourly_rate || 0) * totalHours + (data.labor_adjustments || 0);
}

export function calculateMaterialItem(mat) {
  const baseCost = (mat.quantity || 0) * (mat.purchase_cost || 0);
  const wasteAmount = baseCost * ((mat.waste_pct || 0) / 100);
  const totalCost = baseCost + wasteAmount;
  const markup = totalCost * ((mat.markup_pct || 0) / 100);
  const sellingPrice = totalCost + markup;
  return { totalCost, sellingPrice, markup };
}

export function calculateMaterials(materials) {
  let totalCost = 0;
  let totalSelling = 0;
  let totalMarkup = 0;
  (materials || []).forEach((mat) => {
    const r = calculateMaterialItem(mat);
    totalCost += r.totalCost;
    totalSelling += r.sellingPrice;
    totalMarkup += r.markup;
  });
  return { totalCost, totalSelling, totalMarkup };
}

export function calculateEquipment(data) {
  return (data.equipment_rental || 0) + (data.fuel_cost || 0) + (data.consumables || 0) + (data.tool_wear || 0);
}

export function calculateTravelCost(data) {
  const mileageRate = 0.67;
  const siteCarry = ((data.walking_distance || 0) + (data.distance_from_truck || 0)) * mileageRate;
  const driveCost = (data.travel_miles || 0) * (data.cost_per_mile || 0);
  return siteCarry + driveCost;
}

export function calculateEstimate(data) {
  const laborCost = calculateLabor(data);
  const matResult = calculateMaterials(data.materials);
  const equipmentCost = calculateEquipment(data);
  const travelCost = calculateTravelCost(data);
  const hiddenCosts = data.hidden_costs || 0;

  // Overhead covers fixed business costs (insurance, vehicle, tools, admin) spread across jobs.
  // Contingency is a risk buffer for unknowns. Both are applied to the job subtotal.
  const jobSubtotal = laborCost + matResult.totalCost + equipmentCost + travelCost + hiddenCosts;
  const overheadCost = jobSubtotal * ((data.overhead_pct || 0) / 100);
  const contingencyCost = jobSubtotal * ((data.contingency_pct || 0) / 100);

  const totalCosts = jobSubtotal + overheadCost + contingencyCost;
  const totalSellingBase = laborCost + matResult.totalSelling + equipmentCost + travelCost + hiddenCosts + overheadCost + contingencyCost;
  const taxAmount = totalSellingBase * ((data.tax_rate || 0) / 100);

  const minimumPrice = totalCosts * 1.1;
  const recommendedPrice = totalCosts * 1.35;
  const premiumPrice = totalCosts * 1.6;

  const grossProfit = recommendedPrice - totalCosts;
  const netProfit = grossProfit - taxAmount;
  const profitMargin = recommendedPrice > 0 ? (grossProfit / recommendedPrice) * 100 : 0;

  const totalHours = ((data.estimated_hours || 0) + (data.travel_time || 0) + (data.setup_time || 0) + (data.cleanup_time || 0)) * (data.num_workers || 1);
  const hourlyProfit = totalHours > 0 ? netProfit / totalHours : 0;

  return {
    labor_cost: Math.round(laborCost * 100) / 100,
    material_cost: Math.round(matResult.totalCost * 100) / 100,
    material_selling_price: Math.round(matResult.totalSelling * 100) / 100,
    equipment_cost: Math.round(equipmentCost * 100) / 100,
    travel_cost: Math.round(travelCost * 100) / 100,
    hidden_costs: hiddenCosts,
    overhead_cost: Math.round(overheadCost * 100) / 100,
    contingency_cost: Math.round(contingencyCost * 100) / 100,
    taxes: Math.round(taxAmount * 100) / 100,
    gross_profit: Math.round(grossProfit * 100) / 100,
    net_profit: Math.round(netProfit * 100) / 100,
    minimum_price: Math.round(minimumPrice * 100) / 100,
    recommended_price: Math.round(recommendedPrice * 100) / 100,
    premium_price: Math.round(premiumPrice * 100) / 100,
    profit_margin: Math.round(profitMargin * 10) / 10,
    hourly_profit: Math.round(hourlyProfit * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Labor Compensation — what the crew is paid, kept separate from the
// customer-facing price above. Base pay is hours x crew x rate; adjustments
// are capped/normalized percentages (not naive multiplier stacking) so a
// few hard factors can't produce an unrealistic number.
// ---------------------------------------------------------------------------

const COMPENSATION_FACTOR_PCT = {
  complexity: { simple: 0, moderate: 5, complex: 10, highly_complex: 18 },
  physicalDemand: { low: 0, moderate: 5, high: 10, very_high: 18 },
  workingHeight: {
    ground_level: 0, under_6ft: 0, "6_to_10ft": 5, "10_to_20ft": 10,
    "20ft_plus": 15, roof_level: 15, multiple_stories: 20,
  },
  accessDifficulty: { easy: 0, moderate: 5, difficult: 10, very_difficult: 15 },
  risk: { low: 0, moderate: 5, high: 10, very_high: 15 },
  skillLevel: {
    entry_level: 0, intermediate: 3, experienced: 6,
    specialist: 12, licensed_professional: 15, master: 20,
  },
  urgency: {
    flexible: 0, normal: 0, priority: 10, same_day: 20,
    emergency: 35, night_work: 15, weekend_work: 10,
  },
};

const FACTOR_LABELS = {
  complexity: "Complexity",
  physicalDemand: "Physical demand",
  workingHeight: "Working height",
  accessDifficulty: "Access difficulty",
  risk: "Risk",
  skillLevel: "Required skill level",
  urgency: "Urgency",
};

// Total adjustments are capped at this fraction of base labor so stacking
// several hard factors can't produce an unrealistic multiple of base pay.
const MAX_ADJUSTMENT_PCT = 0.6;

export function calculateLaborCompensation({
  totalLaborHours = 0,
  crewSize = 1,
  hourlyRate = 0,
  complexity,
  physicalDemand,
  workingHeight,
  accessDifficulty,
  risk,
  skillLevel,
  urgency,
} = {}) {
  const baseLabor = totalLaborHours * crewSize * hourlyRate;

  const factors = { complexity, physicalDemand, workingHeight, accessDifficulty, risk, skillLevel, urgency };
  const rawPct = [];
  for (const [key, level] of Object.entries(factors)) {
    const pct = level != null ? COMPENSATION_FACTOR_PCT[key]?.[level] : undefined;
    if (pct) rawPct.push({ key, pct });
  }

  const rawTotalPct = rawPct.reduce((sum, f) => sum + f.pct, 0);
  const scale = rawTotalPct > MAX_ADJUSTMENT_PCT * 100 ? (MAX_ADJUSTMENT_PCT * 100) / rawTotalPct : 1;

  const adjustments = rawPct.map(({ key, pct }) => {
    const scaledPct = pct * scale;
    return {
      label: FACTOR_LABELS[key],
      pct: Math.round(scaledPct * 10) / 10,
      amount: Math.round(baseLabor * (scaledPct / 100) * 100) / 100,
      reason: `${FACTOR_LABELS[key]}: ${String(factors[key]).replace(/_/g, " ")}`,
    };
  });

  const totalAdjustment = adjustments.reduce((sum, a) => sum + a.amount, 0);
  const recommendedComp = Math.round((baseLabor + totalAdjustment) * 100) / 100;

  return {
    baseLabor: Math.round(baseLabor * 100) / 100,
    adjustments,
    totalAdjustment: Math.round(totalAdjustment * 100) / 100,
    recommendedComp,
    compRangeLow: Math.round(recommendedComp * 0.9 * 100) / 100,
    compRangeHigh: Math.round(recommendedComp * 1.15 * 100) / 100,
  };
}

// Widen or narrow a price range based on overall AI confidence (0-100).
// High confidence -> tight range; low/very-low confidence -> wide range,
// so the estimate never looks more certain than the underlying analysis is.
export function calculateConfidenceRange(amount, confidenceScore = 50) {
  let spread;
  if (confidenceScore >= 80) spread = 0.05;
  else if (confidenceScore >= 60) spread = 0.1;
  else if (confidenceScore >= 40) spread = 0.2;
  else spread = 0.35;

  return {
    low: Math.round(amount * (1 - spread) * 100) / 100,
    high: Math.round(amount * (1 + spread) * 100) / 100,
    spreadPct: spread * 100,
  };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatCurrencyExact(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
}