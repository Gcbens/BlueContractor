import React from "react";
import { formatCurrency } from "@/lib/estimateCalculations";
import { TrendingUp, TrendingDown, Minus, History } from "lucide-react";

export default function SimilarJobsPanel({ similarJobs, recommendedPrice }) {
  const priced = similarJobs.filter((j) => (j.recommended_price || 0) > 0);
  const count = priced.length;

  if (count === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-5">
        <div className="flex items-center gap-2 mb-1">
          <History className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Similar Jobs</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          No similar jobs yet. This estimate is based on the AI breakdown and our
          profit engine. As you complete more jobs, pricing will adjust based on
          your history.
        </p>
      </div>
    );
  }

  const avg = priced.reduce((s, j) => s + j.recommended_price, 0) / count;
  const min = Math.min(...priced.map((j) => j.recommended_price));
  const max = Math.max(...priced.map((j) => j.recommended_price));
  const diff = recommendedPrice - avg;
  const pct = avg > 0 ? (diff / avg) * 100 : 0;
  const above = diff > 1;
  const below = diff < -1;

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Similar Jobs</h3>
        </div>
        <span className="text-xs text-muted-foreground">{count} past {count === 1 ? "job" : "jobs"}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Avg Price</p>
          <p className="text-sm font-semibold">{formatCurrency(avg)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Low</p>
          <p className="text-sm font-semibold">{formatCurrency(min)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">High</p>
          <p className="text-sm font-semibold">{formatCurrency(max)}</p>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
          above
            ? "bg-emerald-500/10 text-emerald-400"
            : below
            ? "bg-amber-500/10 text-amber-400"
            : "bg-secondary/40 text-muted-foreground"
        }`}
      >
        {above ? (
          <TrendingUp className="w-4 h-4 shrink-0" />
        ) : below ? (
          <TrendingDown className="w-4 h-4 shrink-0" />
        ) : (
          <Minus className="w-4 h-4 shrink-0" />
        )}
        <span>
          {above
            ? `${formatCurrency(Math.abs(diff))} above your average (${pct.toFixed(0)}%)`
            : below
            ? `${formatCurrency(Math.abs(diff))} below your average (${Math.abs(pct).toFixed(0)}%)`
            : "Right in line with your average"}
        </span>
      </div>
    </div>
  );
}