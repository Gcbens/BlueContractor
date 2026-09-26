import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/estimateCalculations";
import SimilarJobsPanel from "@/components/scan/SimilarJobsPanel";
import ScanBreakdown from "@/components/scan/ScanBreakdown";
import ScanAdjustments from "@/components/scan/ScanAdjustments";
import JobAnalysisPanel from "@/components/estimate/job-analysis/JobAnalysisPanel";

const confidenceStyles = {
  high: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  low: "bg-red-500/10 text-red-400 border-red-500/30",
};

function PriceTier({ label, value, highlighted }) {
  return (
    <div
      className={`min-w-0 rounded-lg p-3 text-center ${
        highlighted ? "bg-primary/10 border border-primary/30" : "bg-secondary/40"
      }`}
    >
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      <p className={`text-lg font-bold truncate ${highlighted ? "text-primary" : ""}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export default function ScanResults({
  data,
  setData,
  calc,
  aiMeta,
  similarJobs,
  onSave,
  saving,
  onRescan,
  onAddPhotos,
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{data.job_type || "Scan Estimate"}</h2>
            <p className="text-xs text-muted-foreground capitalize">
              {data.property_type} · {data.difficulty} difficulty
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {aiMeta.confidence && (
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${
                confidenceStyles[aiMeta.confidence] || confidenceStyles.medium
              }`}
            >
              {aiMeta.confidence} confidence
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onRescan} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Rescan
          </Button>
        </div>
      </div>

      {/* Price hero */}
      <div className="rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 to-card/50 p-5">
        <p className="text-sm text-muted-foreground mb-1">Recommended Price</p>
        <p className="text-4xl font-bold text-primary mb-4">
          {formatCurrency(calc.recommended_price)}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <PriceTier label="Minimum" value={calc.minimum_price} />
          <PriceTier label="Recommended" value={calc.recommended_price} highlighted />
          <PriceTier label="Premium" value={calc.premium_price} />
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <span className="text-muted-foreground">
            Net Profit:{" "}
            <span className="font-semibold text-emerald-400">
              {formatCurrency(calc.net_profit)}
            </span>
          </span>
          <span className="text-muted-foreground">
            Margin:{" "}
            <span className="font-semibold text-foreground">
              {calc.profit_margin}%
            </span>
          </span>
          <span className="text-muted-foreground">
            Hourly:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(calc.hourly_profit)}
            </span>
          </span>
        </div>
      </div>

      <ScanBreakdown data={data} aiMeta={aiMeta} />

      <JobAnalysisPanel data={data} onChange={setData} onAddPhotos={onAddPhotos} />

      <SimilarJobsPanel
        jobType={data.job_type}
        similarJobs={similarJobs}
        recommendedPrice={calc.recommended_price}
      />

      <ScanAdjustments data={data} setData={setData} />

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={onSave}
          disabled={saving}
          className="gap-1.5 h-11 px-6 bg-primary hover:bg-primary/90"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Estimate
        </Button>
      </div>
    </div>
  );
}