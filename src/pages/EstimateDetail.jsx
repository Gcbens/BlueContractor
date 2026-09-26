import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Estimate } from "@/api/entities";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Sparkles, FileText,
} from "lucide-react";
import { formatCurrency } from "@/lib/estimateCalculations";

const statusColors = {
  draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  completed: "bg-green-500/10 text-green-400 border-green-500/30",
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  declined: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function EstimateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Estimate.get(id)
      .then(setEstimate)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground">Estimate not found</p>
        <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const e = estimate;
  const costItems = [
    { label: "Labor", value: e.labor_cost },
    { label: "Materials", value: e.material_cost },
    { label: "Equipment", value: e.equipment_cost },
    { label: "Travel", value: e.travel_cost },
    { label: "Hidden Costs", value: e.hidden_costs },
    { label: "Taxes", value: e.taxes },
  ];

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{e.customer_name}</h1>
            <p className="text-xs text-muted-foreground">{e.job_type}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusColors[e.status] || statusColors.draft}`}>
          {e.status}
        </span>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-5">
        <h2 className="text-base font-semibold">Estimate Summary</h2>

        <div className="space-y-2">
          {costItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border/30 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Profit</span>
            <span className="text-lg font-bold text-green-400">{formatCurrency(e.net_profit)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Profit Margin</span>
            <span className="text-lg font-bold text-primary">{e.profit_margin}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="min-w-0 rounded-lg bg-secondary/30 p-3 text-center">
            <p className="text-[10px] text-muted-foreground leading-tight">Minimum</p>
            <p className="text-base font-bold text-amber-400 truncate">{formatCurrency(e.minimum_price)}</p>
          </div>
          <div className="min-w-0 rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
            <p className="text-[10px] text-primary font-medium leading-tight">Recommended</p>
            <p className="text-base font-bold text-primary truncate">{formatCurrency(e.recommended_price)}</p>
          </div>
          <div className="min-w-0 rounded-lg bg-secondary/30 p-3 text-center">
            <p className="text-[10px] text-muted-foreground leading-tight">Premium</p>
            <p className="text-base font-bold text-violet-400 truncate">{formatCurrency(e.premium_price)}</p>
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      {(e.ai_suggestions || []).length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold">AI Suggestions</h2>
          </div>
          {e.ai_suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <p className="text-sm text-foreground/80">{s.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Job Analysis (read-only summary — edit from the estimate flow) */}
      {e.job_analysis && Object.keys(e.job_analysis).length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-semibold">Job Analysis</h2>
            <div className="flex items-center gap-2">
              {e.analysis_confidence != null && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-primary/10 text-primary border-primary/30">
                  {Math.round(e.analysis_confidence)}% confidence
                </span>
              )}
              {e.job_analysis.risk?.level && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-secondary/50 capitalize">
                  {e.job_analysis.risk.level.replace(/_/g, " ")} risk
                </span>
              )}
            </div>
          </div>
          {e.job_analysis.jobSummary && <p className="text-sm text-foreground/80">{e.job_analysis.jobSummary}</p>}
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-muted-foreground">Trade</span>
              <span>{e.job_analysis.primaryTrade || "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-muted-foreground">Crew size</span>
              <span>{e.job_analysis.crewSize?.recommended || "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-muted-foreground">Total labor hours</span>
              <span>{e.job_analysis.totalLaborHours ?? "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-muted-foreground">Complexity</span>
              <span className="capitalize">{(e.job_analysis.complexity?.level || "—").replace(/_/g, " ")}</span>
            </div>
          </div>
          {(e.job_analysis.missingInformation || []).length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-1">Missing information</p>
              <ul className="text-sm text-foreground/80 space-y-1">
                {e.job_analysis.missingInformation.map((m, i) => <li key={i}>• {m}</li>)}
              </ul>
            </div>
          )}
          {e.labor_compensation?.recommendedComp != null && (
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <span className="text-sm font-medium">Recommended labor compensation</span>
              <span className="text-base font-bold text-primary">{formatCurrency(e.labor_compensation.recommendedComp)}</span>
            </div>
          )}
        </div>
      )}

      {/* Job Details */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-3">
        <h2 className="text-base font-semibold">Job Details</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-border/20">
            <span className="text-muted-foreground">Property Type</span>
            <span className="capitalize">{e.property_type}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/20">
            <span className="text-muted-foreground">Difficulty</span>
            <span className="capitalize">{e.difficulty}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/20">
            <span className="text-muted-foreground">Sq Footage</span>
            <span>{e.square_footage || 0}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/20">
            <span className="text-muted-foreground">Workers</span>
            <span>{e.num_workers}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/20">
            <span className="text-muted-foreground">Hours</span>
            <span>{e.estimated_hours}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/20">
            <span className="text-muted-foreground">Stairs</span>
            <span>{e.has_stairs ? "Yes" : "No"}</span>
          </div>
        </div>
        {e.job_description && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-foreground/80">{e.job_description}</p>
          </div>
        )}
      </div>
    </div>
  );
}