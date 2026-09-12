export function calculateLabor(data) {
  const totalHours = (data.estimated_hours || 0) + (data.travel_time || 0) + (data.setup_time || 0) + (data.cleanup_time || 0);
  return (data.num_workers || 1) * (data.hourly_rate || 0) * totalHours;
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