import React from "react";
import { HardHat } from "lucide-react";
import { formatCurrency } from "@/lib/estimateCalculations";

// Worker pay, shown separately from the customer-facing price tiers
// elsewhere on the page. Never equate this with the total project price.
export default function LaborCompensationCard({ comp }) {
  if (!comp) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <HardHat className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Labor Compensation</h3>
        <span className="text-xs text-muted-foreground ml-auto">What the crew is paid, not the customer price</span>
      </div>

      <div className="flex items-center justify-between text-sm py-1.5 border-b border-border/30">
        <span className="text-muted-foreground">Base labor</span>
        <span className="font-medium">{formatCurrency(comp.baseLabor)}</span>
      </div>

      {comp.adjustments.map((adj, i) => (
        <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30">
          <span className="text-muted-foreground">{adj.label} adjustment</span>
          <span className="font-medium">+{formatCurrency(adj.amount)}</span>
        </div>
      ))}

      <div className="flex items-center justify-between pt-3">
        <span className="text-sm font-semibold">Recommended labor compensation</span>
        <span className="text-lg font-bold text-primary">{formatCurrency(comp.recommendedComp)}</span>
      </div>
      <p className="text-xs text-muted-foreground text-right mt-0.5">
        {formatCurrency(comp.compRangeLow)} to {formatCurrency(comp.compRangeHigh)} range
      </p>
    </div>
  );
}
