import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateLabor, formatCurrency } from "@/lib/estimateCalculations";

export default function StepLabor({ data, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value === "" ? "" : Number(value) });
  const laborCost = calculateLabor(data);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Labor</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure your crew and time
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Number of Workers</Label>
          <Input
            type="number"
            value={data.num_workers ?? ""}
            onChange={(e) => set("num_workers", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Hourly Rate ($)</Label>
          <Input
            type="number"
            value={data.hourly_rate ?? ""}
            onChange={(e) => set("hourly_rate", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Estimated Hours</Label>
          <Input
            type="number"
            value={data.estimated_hours ?? ""}
            onChange={(e) => set("estimated_hours", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Travel Time (hrs)</Label>
          <Input
            type="number"
            step="0.5"
            value={data.travel_time ?? ""}
            onChange={(e) => set("travel_time", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Setup Time (hrs)</Label>
          <Input
            type="number"
            step="0.5"
            value={data.setup_time ?? ""}
            onChange={(e) => set("setup_time", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Cleanup Time (hrs)</Label>
          <Input
            type="number"
            step="0.5"
            value={data.cleanup_time ?? ""}
            onChange={(e) => set("cleanup_time", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
      </div>

      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Calculated Labor Cost</span>
        <span className="text-xl font-bold text-primary">{formatCurrency(laborCost)}</span>
      </div>
    </div>
  );
}