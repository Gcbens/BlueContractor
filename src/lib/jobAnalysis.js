import { invokeAI } from "@/lib/aiClient";
import { defaultRateForTrade } from "@/lib/laborRates";
import { calculateLaborCompensation } from "@/lib/estimateCalculations";

// ---------------------------------------------------------------------------
// Structured "Job Analysis" engine.
//
// Unlike the quick scan schema in scanEstimate.js (flat numbers only), this
// asks the AI to reason like an experienced estimator across dimensions,
// materials, access, risk, labor phases, etc., and to tag *how* it knows each
// important fact — observed in the photo, estimated from context, provided
// by the contractor, or unknown — so uncertainty is never silently dropped.
// ---------------------------------------------------------------------------

const SOURCE_ENUM = ["observed", "estimated", "user_provided", "unknown"];

// A scalar value the AI isn't 100% sure of: value + confidence (0-100) + how it knows.
function tracked(valueSchema, extra = {}) {
  return {
    type: "object",
    properties: {
      value: valueSchema,
      confidence: { type: "number", description: "0-100 confidence in this value" },
      source: { type: "string", enum: SOURCE_ENUM },
      ...extra,
    },
  };
}

const rangeSchema = {
  type: "object",
  properties: {
    low: { type: "number" },
    high: { type: "number" },
    unit: { type: "string" },
  },
};

const levelWithReasons = (levels) => ({
  type: "object",
  properties: {
    level: { type: "string", enum: levels },
    reasons: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
  },
});

export const JOB_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    jobType: { type: "string" },
    jobSummary: { type: "string", description: "2-4 sentence plain-English summary of the job and your reasoning" },
    primaryTrade: { type: "string" },
    tradesRequired: { type: "array", items: { type: "string" } },
    skillLevel: {
      type: "string",
      enum: ["entry_level", "intermediate", "experienced", "specialist", "licensed_professional", "master"],
    },

    measurements: {
      type: "object",
      properties: {
        length: tracked({ type: "number" }),
        width: tracked({ type: "number" }),
        height: tracked({ type: "number" }),
        depth: tracked({ type: "number" }),
        area: tracked({ type: "number" }),
        squareFootage: tracked({ type: "number" }),
        volume: tracked({ type: "number" }),
        numObjects: tracked({ type: "number" }),
        numRooms: tracked({ type: "number" }),
        numWalls: tracked({ type: "number" }),
        numSections: tracked({ type: "number" }),
        approximateDistances: { type: "string" },
        quantityOfWork: { type: "string" },
        referenceObjectUsed: { type: "string", description: "Any known-size reference object or user measurement used to calibrate scale, if any" },
        perspectiveNotes: { type: "string", description: "How depth/perspective in the photo(s) was used, e.g. yard extends beyond foreground" },
      },
    },

    materials: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          category: { type: "string" },
          confidence: { type: "number" },
          source: { type: "string", enum: SOURCE_ENUM },
        },
        required: ["name"],
      },
    },

    estimatedWeight: {
      type: "object",
      properties: {
        low: { type: "number" },
        high: { type: "number" },
        unit: { type: "string", default: "lb" },
        confidence: { type: "number" },
        notes: { type: "string" },
      },
    },

    workingHeight: levelWithReasons(["ground_level", "under_6ft", "6_to_10ft", "10_to_20ft", "20ft_plus", "roof_level", "multiple_stories"]),
    accessDifficulty: levelWithReasons(["easy", "moderate", "difficult", "very_difficult"]),
    physicalDemand: levelWithReasons(["low", "moderate", "high", "very_high"]),
    complexity: levelWithReasons(["simple", "moderate", "complex", "highly_complex"]),
    existingCondition: levelWithReasons([
      "new_construction", "good_condition", "normal_wear", "minor_damage",
      "moderate_damage", "severe_damage", "old_construction", "previous_poor_repairs",
    ]),
    risk: levelWithReasons(["low", "moderate", "high", "very_high"]),
    precision: { type: "string", enum: ["low", "standard", "high", "very_high"] },
    finishQuality: { type: "string", enum: ["basic", "standard", "premium", "custom"] },

    crewSize: {
      type: "object",
      properties: {
        recommended: { type: "number" },
        reason: { type: "string" },
      },
    },

    laborBreakdown: {
      type: "object",
      description: "Hours of actual crew work per phase (not total across workers)",
      properties: {
        preparation: { type: "number" },
        demolition: { type: "number" },
        removal: { type: "number" },
        installation: { type: "number" },
        repair: { type: "number" },
        finishing: { type: "number" },
        testing: { type: "number" },
        cleanup: { type: "number" },
        loading: { type: "number" },
        other: { type: "number" },
        otherDescription: { type: "string" },
      },
    },
    totalLaborHours: { type: "number", description: "Sum of laborBreakdown phases, hours of work (not multiplied by crew size)" },
    estimatedDuration: { type: "number", description: "Elapsed job duration in hours/days assuming the recommended crew works in parallel" },

    demolition: {
      type: "object",
      properties: {
        required: { type: "boolean" },
        tasks: { type: "array", items: { type: "string" } },
        debrisWeight: rangeSchema,
        debrisVolume: { type: "string" },
      },
    },
    preparation: { type: "array", items: { type: "string" } },
    cleanup: { type: "array", items: { type: "string" } },

    tools: { type: "array", items: { type: "string" }, description: "Normal tools a contractor already owns" },
    equipment: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          likelyRental: { type: "boolean" },
        },
      },
      description: "Larger equipment; flag which items likely need to be rented",
    },

    groundConditions: { type: "array", items: { type: "string" } },
    weather: {
      type: "object",
      properties: {
        relevant: { type: "boolean" },
        notes: { type: "string", description: "Only fill in if weather materially affects productivity for this job" },
      },
    },

    possibleRequirements: {
      type: "array",
      items: { type: "string" },
      description: "Advisory-only notes like permits/licensing/inspection/HOA. Never state these are definitely required",
    },

    jobComponents: {
      type: "array",
      description: "Fill only if the project contains multiple distinct tasks (e.g. fence replacement + gate + debris removal)",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          trade: { type: "string" },
          laborHours: { type: "number" },
          crewSize: { type: "number" },
          notes: { type: "string" },
        },
      },
    },

    keyQuantities: {
      type: "array",
      description: "The specific measurements that actually matter for THIS job type only (e.g. a fence job: linear feet, height, number of posts, number of gates; a painting job: wall area, number of rooms, doors, trim). Do not force-fill generic dimensions that don't apply.",
      items: {
        type: "object",
        properties: {
          label: { type: "string", description: "e.g. \"Fence length\", \"Number of posts\", \"Wall area\"" },
          value: { type: "number" },
          unit: { type: "string", description: "e.g. \"linear ft\", \"sq ft\", \"cu yd\", \"posts\", \"doors\", \"rooms\", \"lb\"" },
          confidence: { type: "number" },
          source: { type: "string", enum: SOURCE_ENUM },
        },
        required: ["label", "value", "unit"],
      },
    },

    assumptions: { type: "array", items: { type: "string" } },
    missingInformation: {
      type: "array",
      items: { type: "string" },
      description: "Lower-priority gaps that don't materially change pricing and aren't worth a direct question (context/color only)",
    },
    followUpQuestions: {
      type: "array",
      description: "At most 4 SPECIFIC questions, ONLY for gaps that could materially change the price (e.g. a fence being 100ft vs 200ft). Do not ask about minor cosmetic details or anything you can already reasonably estimate. Rank the most price-impactful question first.",
      items: {
        type: "object",
        properties: {
          field: { type: "string", description: "Dot-path into this schema that the answer should update, e.g. \"keyQuantities.0.value\" or \"measurements.length.value\"" },
          question: { type: "string", description: "A specific, direct question a contractor could answer in one line, e.g. \"About how long is the fence, in feet?\"" },
          impact: { type: "string", enum: ["high", "medium", "low"], description: "How much this could change the price if wrong" },
          inputType: { type: "string", enum: ["number", "text"] },
          unit: { type: "string", description: "Unit label to show next to a number input, if applicable" },
        },
        required: ["field", "question", "impact", "inputType"],
      },
    },
    recommendedPhotos: { type: "array", items: { type: "string" }, description: "Specific additional photos that would improve the estimate" },
    overallConfidence: { type: "number", description: "0-100 holistic confidence in this analysis" },
  },
  required: ["jobType", "jobSummary", "primaryTrade", "crewSize", "laborBreakdown", "totalLaborHours", "overallConfidence"],
};

export const JOB_ANALYSIS_PROMPT = `You are a highly experienced contractor and professional estimator. You do not simply glance at a photo and guess a price. You analyze the physical job the way a seasoned estimator would walk a site: what has to happen, how hard it will be, how long it will take, and what could go wrong.

Photo-first estimating is the whole point of this product: the contractor should only have to upload photos and write one sentence. Your job is to do as much of the analysis as you reasonably can automatically, and only ask the contractor something when you genuinely cannot determine it and it would materially change the price. Never ask a question just because a schema field is empty.

Work through this internally in three stages before answering:
1. VISUAL UNDERSTANDING: what do you actually observe in the photo(s)? Materials, objects, structures, damage, approximate dimensions, quantity, height, depth, terrain, accessibility, existing construction, possible demolition, visible obstacles, jobsite conditions.
2. JOB UNDERSTANDING: convert those visual findings plus the contractor's description into actual work requirements: job type, individual work components, required trade(s) and skill level, preparation, demolition, installation or repair tasks, crew requirements, tools, equipment, physical difficulty, complexity, safety considerations, cleanup, and labor hours.
3. Do NOT invent a final dollar price yourself. You only produce the structured analysis; a separate pricing engine turns your structured output into money. Never include a price in jobSummary or any text field.

Rules you must follow:
- Never fabricate certainty. For every measurement, material, or condition you report, decide whether you OBSERVED it directly in a photo, ESTIMATED it from visual context, it was USER_PROVIDED (given in the contractor's description), or it is UNKNOWN. Tag it accordingly.
- Never claim an exact measurement when there is no reliable visual scale. Use ranges and mark them as estimates. If a known reference object (door, brick, tape measure, vehicle, person, standard building component) is visible, use it to calibrate scale and say so in referenceObjectUsed. User-supplied measurements always take priority over your own visual estimate and should immediately raise your confidence.
- Use perspective and depth cues. Do not assume everything in a photo is the same distance from the camera (e.g. a backyard may extend well past what's visible in the foreground).
- If multiple photos are provided, treat them as different views of the same project unless there's clear evidence otherwise. Use overlapping structures, materials, and landmarks to tell whether photos show the same area. Do not double-count the same object, wall, fence, or debris pile just because it appears in more than one photo; use the extra angles to improve measurement confidence, object identification, depth understanding, accessibility analysis, and quantity estimation instead.
- keyQuantities: pick only the measurements that actually matter for this specific job type, not a generic checklist. A fence job needs linear feet, height, posts, gates. A painting job needs wall area, rooms, doors, trim, and prep. A concrete job needs length, width, depth, and volume. A debris removal job needs volume, material type, and weight. A flooring job needs floor area, room shape, and removal requirements. Use whatever unit is actually useful (linear feet, square feet, cubic yards, item counts, weight, etc.).
- followUpQuestions is the most important discipline in this analysis: only include a question when the missing information could materially change the price, and there is no reasonable way to estimate it from what's visible. A fence being roughly 100ft vs 200ft is worth asking about; a minor cosmetic detail is not. Rank by price impact (most impactful first). Return at most 4. If you can reasonably estimate something, estimate it (mark it as ESTIMATED with appropriate confidence) instead of asking. Word each question so a contractor could answer it in one line (a number or a short phrase), and point the "field" property at the exact schema path your submitted analysis already has for that value, so the answer can directly overwrite it.
- Do not diagnose asbestos, mold, structural failure, or other serious hazards from a photo. Instead flag them for manual inspection using cautious language (e.g. "Possible moisture damage detected. Manual inspection recommended.").
- Do not claim a permit or license is definitely required. Use advisory language only (e.g. "This type of work may require a permit or licensed professional. Verify local requirements.").
- If the project clearly contains multiple distinct tasks (e.g. fence replacement, gate install, debris removal), break it into jobComponents.
- missingInformation is for lower-priority gaps that add color but don't change the price enough to interrupt the contractor with a question. recommendedPhotos is for specific additional photos that would help (e.g. "Take a photo showing the entire left side of the fence"), separate from followUpQuestions which asks for typed answers.
- laborBreakdown hours are hours of actual work per phase, not multiplied by crew size. totalLaborHours is their sum. estimatedDuration is the elapsed time assuming the recommended crew size works in parallel (e.g. 2 workers x 8 hours = 16 labor hours, but an 8 hour job duration).
- Size labor hours to match how the trade actually prices real-world work, not a generous round number. Routine, well-known recurring maintenance services (mowing a lawn, trimming hedges, blowing leaves off a driveway, a single-room touch-up paint) are genuinely fast for a professional crew, typically well under an hour of total labor for an average residential property; do not pad them into a multi-hour, multi-phase project. Reserve larger hour totals for work that is actually large in scope (a full yard renovation, a whole-house paint job, a multi-day build). When in doubt, size hours the way an experienced crew that does this specific job every day actually would, not the way a first-time DIYer would.
- When no contractor description is given and a photo could reasonably be read as either a routine/inexpensive service or a bigger one, default jobType to the routine, common-sense interpretation (e.g. a plain lawn photo defaults to mowing, not aeration/overseeding/renovation) rather than the most involved, most expensive one you can justify. Minor imperfections alone (some thin patches, slightly uneven color, a bit of thatch) are not enough to upgrade the job into a bigger service; note them under assumptions or missingInformation as an optional upsell instead, or ask about it in followUpQuestions if it's genuinely ambiguous which service the contractor wants. Only default to the bigger/more involved interpretation when the photo shows clear, dominant evidence of it (e.g. mostly bare dirt or dead turf, not a green lawn with a few rough patches).
- overallConfidence should honestly reflect photo clarity and how much had to be inferred. If confidence is low, say so plainly rather than presenting a falsely precise analysis.
- Write every text field (jobSummary, reasons, notes, assumptions, missingInformation, recommendedPhotos, questions) in plain, natural sentences, the way a contractor would actually talk. Use periods and commas, not em dashes.

Respond only via the submit_result tool, matching its schema exactly.`;

function buildPrompt(jobDescription, userProvided) {
  let prompt = JOB_ANALYSIS_PROMPT;
  if (jobDescription && jobDescription.trim()) {
    prompt += `\n\nCONTRACTOR'S DESCRIPTION OF THE JOB (treat any specifics here as user_provided, authoritative over your own visual estimate):\n"${jobDescription.trim()}"`;
  }
  if (userProvided && Object.keys(userProvided).length > 0) {
    prompt += `\n\nUSER-CONFIRMED VALUES (these override anything you would otherwise estimate from the photos, do not contradict them):\n${JSON.stringify(userProvided)}`;
  }
  return prompt;
}

const STRONG_MODEL = "claude-sonnet-5";

export async function runJobAnalysis(photoUrls, jobDescription, userProvided) {
  const prompt = buildPrompt(jobDescription, userProvided);
  let analysis = await invokeAI({
    prompt,
    file_urls: photoUrls,
    response_json_schema: JOB_ANALYSIS_SCHEMA,
  });

  let escalated = false;
  if ((analysis.overallConfidence ?? 100) < 40) {
    analysis = await invokeAI({
      prompt,
      file_urls: photoUrls,
      response_json_schema: JOB_ANALYSIS_SCHEMA,
      model: STRONG_MODEL,
    });
    escalated = true;
  }

  return { ...analysis, _escalated: escalated };
}

// Merge a freshly-run analysis with any field the contractor has already
// manually corrected. Overrides always win — re-running analysis must never
// silently discard a contractor's edit. Feedback (AI-vs-confirmed) history
// carries forward the same way, it's not something a re-scan should reset.
export function mergeWithOverrides(analysis, overrides, feedback) {
  const merged = JSON.parse(JSON.stringify(analysis));
  if (overrides && Object.keys(overrides).length > 0) {
    for (const [path, override] of Object.entries(overrides)) {
      setPath(merged, path, override.value);
    }
    merged.overrides = overrides;
  }
  if (feedback && Object.keys(feedback).length > 0) {
    merged.feedback = feedback;
  }
  return merged;
}

export function setPath(obj, path, value) {
  const parts = path.split(".");
  let node = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (node[parts[i]] == null || typeof node[parts[i]] !== "object") node[parts[i]] = {};
    node = node[parts[i]];
  }
  node[parts[parts.length - 1]] = value;
}

export function getPath(obj, path) {
  const parts = path.split(".");
  let node = obj;
  for (const part of parts) {
    if (node == null) return undefined;
    node = node[part];
  }
  return node;
}

function getConfidenceForPath(analysis, path) {
  const confPath = path.endsWith(".value")
    ? path.slice(0, -".value".length) + ".confidence"
    : path + ".confidence";
  const conf = getPath(analysis, confPath);
  return typeof conf === "number" ? conf : analysis.overallConfidence;
}

// Apply one contractor correction to the analysis: sets the value, records
// the override (so a re-scan never silently discards it), and preserves an
// AI-estimate-vs-contractor-confirmed feedback record for later evaluation
// of estimation accuracy. Editing the same field twice keeps the ORIGINAL
// AI value/confidence in the feedback record, only the confirmed value moves.
export function applyOverride(analysis, path, value) {
  const cloned = JSON.parse(JSON.stringify(analysis || {}));
  const priorFeedback = cloned.feedback?.[path];
  const aiValue = priorFeedback ? priorFeedback.aiValue : getPath(cloned, path);
  const aiConfidence = priorFeedback ? priorFeedback.aiConfidence : getConfidenceForPath(cloned, path);

  setPath(cloned, path, value);
  cloned.overrides = { ...(cloned.overrides || {}), [path]: { value, source: "user", editedAt: new Date().toISOString() } };

  const diff = typeof aiValue === "number" && typeof value === "number"
    ? Math.round((value - aiValue) * 100) / 100
    : null;
  cloned.feedback = {
    ...(cloned.feedback || {}),
    [path]: { aiValue, aiConfidence, correctedValue: value, finalValue: value, diff, editedAt: new Date().toISOString() },
  };

  return cloned;
}

// Answer one field (a panel edit or a follow-up question) and recompute
// everything downstream (pricing flatten fields, labor compensation,
// overall confidence) in one place, so every call site stays in sync.
export function updateAnalysisField(data, path, value) {
  const analysis = data.job_analysis || {};
  const cloned = applyOverride(analysis, path, value);
  const flattened = flattenForPricing(cloned);
  const hourlyRate = data.hourly_rate || flattened.hourly_rate;
  const laborComp = buildLaborCompensation(cloned, hourlyRate);
  const confidence = computeOverallConfidence(cloned);
  return {
    job_analysis: cloned,
    labor_compensation: laborComp,
    analysis_confidence: confidence,
    num_workers: flattened.num_workers,
    estimated_hours: flattened.estimated_hours,
    labor_adjustments: laborComp.totalAdjustment,
  };
}

function val(field, fallback) {
  if (field == null) return fallback;
  if (typeof field === "object" && "value" in field) return field.value ?? fallback;
  return field;
}

// Weighted average of every confidence figure found in the analysis.
export function computeOverallConfidence(analysis) {
  if (!analysis) return 0;
  const weighted = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (typeof node.confidence === "number") weighted.push({ score: node.confidence, weight: 1 });
    for (const v of Object.values(node)) {
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === "object") visit(v);
    }
  };
  visit(analysis);
  // The model's own holistic read counts for more than any single field.
  if (typeof analysis.overallConfidence === "number") weighted.push({ score: analysis.overallConfidence, weight: 3 });
  if (weighted.length === 0) return 50;
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  const average = weighted.reduce((sum, w) => sum + w.score * w.weight, 0) / totalWeight;
  return Math.round(Math.min(100, Math.max(0, average)));
}

function totalLaborHoursOf(analysis) {
  const lb = analysis.laborBreakdown || {};
  // A mid-edit empty string (contractor clearing the field to retype) must
  // not leak into pricing math as a literal "" — fall back to the phase sum.
  const direct = analysis.totalLaborHours;
  if (typeof direct === "number") return direct;
  return Object.entries(lb)
    .filter(([k]) => k !== "otherDescription")
    .reduce((sum, [, v]) => sum + (Number(v) || 0), 0);
}

// Build the labor compensation breakdown (base pay + capped adjustments)
// directly from the analysis, at a given hourly rate.
export function buildLaborCompensation(analysis, hourlyRate) {
  return calculateLaborCompensation({
    totalLaborHours: totalLaborHoursOf(analysis),
    crewSize: analysis.crewSize?.recommended || 1,
    hourlyRate,
    complexity: analysis.complexity?.level,
    physicalDemand: analysis.physicalDemand?.level,
    workingHeight: analysis.workingHeight?.level,
    accessDifficulty: analysis.accessDifficulty?.level,
    risk: analysis.risk?.level,
    skillLevel: analysis.skillLevel,
  });
}

// Map the rich structured analysis onto the flat fields calculateEstimate()
// already understands, so the existing pricing engine needs no rewrite.
export function flattenForPricing(analysis) {
  const m = analysis.measurements || {};
  const totalLaborHours = totalLaborHoursOf(analysis);
  const trade = analysis.primaryTrade || analysis.jobType || "";
  const hourlyRate = defaultRateForTrade(trade);
  const laborComp = buildLaborCompensation(analysis, hourlyRate);

  return {
    job_type: analysis.jobType || "",
    job_description: analysis.jobSummary || "",
    difficulty: mapComplexityToDifficulty(analysis.complexity?.level),
    square_footage: val(m.squareFootage, 0),
    linear_feet: val(m.length, 0),
    weight: analysis.estimatedWeight ? (analysis.estimatedWeight.low + analysis.estimatedWeight.high) / 2 : 0,
    num_workers: analysis.crewSize?.recommended || 1,
    hourly_rate: hourlyRate,
    estimated_hours: totalLaborHours,
    // totalLaborHours already includes preparation/cleanup phases from
    // laborBreakdown — leaving these at their form defaults would silently
    // double-count that time on top of the AI's own total.
    travel_time: 0,
    setup_time: 0,
    cleanup_time: 0,
    // labor_adjustments feeds calculateLabor() so the customer-price engine
    // automatically reflects the same height/access/risk/etc. surcharges
    // shown in the Labor Compensation breakdown, instead of a duplicate calc.
    labor_adjustments: laborComp.totalAdjustment,
    materials: (analysis.materials || []).map((mat) => ({
      name: mat.name,
      quantity: 1,
      purchase_cost: 0,
      markup_pct: 35,
      waste_pct: 10,
    })),
    hidden_costs: 0,
    overhead_pct: defaultOverheadForRisk(analysis.risk?.level),
    contingency_pct: defaultContingencyForConfidence(analysis.overallConfidence),
  };
}

function mapComplexityToDifficulty(level) {
  switch (level) {
    case "simple": return "easy";
    case "moderate": return "moderate";
    case "complex": return "hard";
    case "highly_complex": return "extreme";
    default: return "moderate";
  }
}

function defaultOverheadForRisk(riskLevel) {
  switch (riskLevel) {
    case "very_high": return 22;
    case "high": return 18;
    case "moderate": return 14;
    default: return 10;
  }
}

function defaultContingencyForConfidence(confidence) {
  if (confidence == null) return 10;
  if (confidence >= 80) return 5;
  if (confidence >= 60) return 10;
  if (confidence >= 40) return 15;
  return 20;
}
