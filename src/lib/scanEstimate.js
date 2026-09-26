import { Estimate } from "@/api/entities";
import { runJobAnalysis, flattenForPricing, computeOverallConfidence, buildLaborCompensation } from "@/lib/jobAnalysis";

// Thin wrapper kept for backward compatibility with ScanEstimate.jsx and
// NewEstimate.jsx: both call analyzeJobPhotos() and expect
// { estimateFields, ai_photo_analysis, meta }. Internally this now runs the
// full structured Job Analysis engine (src/lib/jobAnalysis.js) instead of
// the old flat single-pass schema, and additionally returns the rich
// `job_analysis` + `labor_compensation` objects for the new Job Analysis UI.
export async function analyzeJobPhotos(urls, userPrompt) {
  const analysis = await runJobAnalysis(urls, userPrompt);
  const estimateFields = flattenForPricing(analysis);
  const confidence = computeOverallConfidence(analysis);
  const laborCompensation = buildLaborCompensation(analysis, estimateFields.hourly_rate);

  const ai_photo_analysis = (analysis.materials || []).map((mat) => ({
    item: mat.name,
    suggestion: `Detected material (${mat.source || "estimated"}, ${mat.confidence ?? "?"}% confidence)`,
    category: "material",
  }));

  return {
    estimateFields,
    ai_photo_analysis,
    job_analysis: analysis,
    labor_compensation: laborCompensation,
    analysis_confidence: confidence,
    meta: {
      confidence: confidence >= 70 ? "high" : confidence >= 45 ? "medium" : "low",
      notes: analysis.jobSummary || "",
      detected_items: (analysis.materials || []).map((mat) => mat.name),
      escalated: !!analysis._escalated,
    },
  };
}

export async function fetchSimilarJobs(jobType) {
  if (!jobType) return [];
  try {
    return await Estimate.filter({ job_type: jobType }, "-created_date", 20);
  } catch {
    return [];
  }
}
