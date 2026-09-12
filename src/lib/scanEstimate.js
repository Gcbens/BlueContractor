import { invokeAI } from "@/lib/aiClient";
import { Estimate } from "@/api/entities";

export const SCAN_PROMPT = `You are an expert contractor estimator. Like a nutrition app estimates calories from a food photo, you estimate the full scope, materials, labor, and hidden costs of a job from job-site photos — so a contractor can quote a profitable price.

Analyze the photo(s) and produce a complete estimate breakdown:

1. JOB TYPE: the trade/work (e.g. Flooring, Painting, Drywall, Demolition, Moving/Hauling, Roofing, Landscaping, Plumbing, Electrical, Tile, Framing, Cleanup).
2. SCOPE: estimate square_footage, linear_feet, num_floors, has_stairs.
3. WEIGHT: estimate the total weight (in lbs) of all materials, items, and/or debris involved. This is critical — heavier loads increase difficulty, require more workers and equipment, take longer, and raise fuel and disposal costs. Use the weight to scale num_workers, estimated_hours, equipment_rental, fuel_cost, and difficulty accordingly. If the job involves hauling, moving, demolition, or debris removal, always estimate weight; for surface jobs (painting, tile, flooring) estimate material weight too.
4. MATERIALS: list every material you can identify. For each: name, realistic quantity, purchase_cost per unit in USD, markup_pct (contractor standard 30-50%), waste_pct (5-15%).
5. LABOR: num_workers needed, estimated_hours of actual work, travel_time, setup_time, cleanup_time (in hours) — factor in weight and carrying distance.
6. TRAVEL: travel_miles (estimated round-trip miles to the job site) and cost_per_mile (use 0.67 USD as the IRS standard rate unless local rates differ). Estimate travel_miles from context/clues; if unknown, assume a typical 15 miles round trip and mention it in notes.
7. EQUIPMENT: equipment_rental, fuel_cost, consumables, tool_wear in USD — heavier loads may need a truck, dolly, lift, or dumpster.
8. HIDDEN_COSTS: things not visible but likely needed — disposal fees, permits, surface prep, hazardous material handling, protection of finishes. (USD)
9. OVERHEAD (overhead_pct): a percentage of the job subtotal to cover fixed business costs — insurance, vehicle/truck payment, tools, phone, software, admin time, marketing. Typical contractor overhead is 10-25%. Pick a value based on the job size and trade.
10. CONTINGENCY (contingency_pct): a risk buffer percentage for unknowns and surprises. Use 5% for routine/visible jobs, 10-15% for moderate uncertainty, up to 20% for demolition/old structures/unknown scope. Higher difficulty or lower confidence = higher contingency.
11. property_type (residential/commercial/industrial/other) and difficulty (easy/moderate/hard/extreme).
12. confidence: high/medium/low based on photo clarity and how much you can infer.
13. notes: 2-3 sentence plain-English summary of the job, your reasoning, the estimated weight, travel miles, overhead, and contingency.
14. detected_items: short list of what you see in the photos.

Think like a contractor who wants to maximize profit without underbidding. All money values in USD. If something isn't visible, make a reasonable assumption and mention it in notes.`;

export const SCAN_SCHEMA = {
  type: "object",
  properties: {
    job_type: { type: "string" },
    job_description: { type: "string" },
    property_type: { type: "string", enum: ["residential", "commercial", "industrial", "other"] },
    difficulty: { type: "string", enum: ["easy", "moderate", "hard", "extreme"] },
    square_footage: { type: "number" },
    linear_feet: { type: "number" },
    num_floors: { type: "number" },
    has_stairs: { type: "boolean" },
    weight: { type: "number" },
    num_workers: { type: "number" },
    estimated_hours: { type: "number" },
    travel_time: { type: "number" },
    setup_time: { type: "number" },
    cleanup_time: { type: "number" },
    travel_miles: { type: "number" },
    cost_per_mile: { type: "number" },
    materials: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
          purchase_cost: { type: "number" },
          markup_pct: { type: "number" },
          waste_pct: { type: "number" },
        },
      },
    },
    equipment_rental: { type: "number" },
    fuel_cost: { type: "number" },
    consumables: { type: "number" },
    tool_wear: { type: "number" },
    hidden_costs: { type: "number" },
    overhead_pct: { type: "number" },
    contingency_pct: { type: "number" },
    detected_items: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    notes: { type: "string" },
  },
};

// Stronger model used ONLY when the fast first pass reports low confidence.
const STRONG_MODEL = "claude-sonnet-5";

function runScan(prompt, urls, model) {
  return invokeAI({
    prompt,
    file_urls: urls,
    response_json_schema: SCAN_SCHEMA,
    ...(model ? { model } : {}),
  });
}

function toResult(result) {
  const { confidence, notes, detected_items, ...estimateFields } = result;
  const ai_photo_analysis = (detected_items || []).map((item) => ({
    item,
    suggestion: "Detected from photo scan",
    category: "material",
  }));
  return {
    estimateFields,
    ai_photo_analysis,
    meta: {
      confidence: confidence || "medium",
      notes: notes || "",
      detected_items: detected_items || [],
    },
  };
}

export async function analyzeJobPhotos(urls, userPrompt) {
  let prompt = SCAN_PROMPT;
  if (userPrompt && userPrompt.trim()) {
    prompt += `\n\nADDITIONAL CONTEXT FROM THE CONTRACTOR (use this to refine your estimate — it may specify materials, quantities, weight, or scope that aren't obvious from the photos alone):\n"${userPrompt.trim()}"`;
  }
  // Fast first pass with the default model — most scans stop here for speed.
  let result = await runScan(prompt, urls);
  // Escalate to a stronger model only when the AI itself flags low confidence.
  if ((result.confidence || "medium").toLowerCase() === "low") {
    result = await runScan(prompt, urls, STRONG_MODEL);
    const escalated = toResult(result);
    escalated.meta.escalated = true;
    return escalated;
  }
  return toResult(result);
}

export async function fetchSimilarJobs(jobType) {
  if (!jobType) return [];
  try {
    return await Estimate.filter({ job_type: jobType }, "-created_date", 20);
  } catch {
    return [];
  }
}