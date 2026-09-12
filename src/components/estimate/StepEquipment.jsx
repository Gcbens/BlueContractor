import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateEquipment, formatCurrency } from "@/lib/estimateCalculations";

export default function StepEquipment({ data, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value === "" ? "" : Number(value) });
  const eqCost = calculateEquipment(data);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Equipment</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Equipment, fuel, and consumables
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Equipment Rental ($)</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.equipment_rental ?? ""}
            onChange={(e) => set("equipment_rental", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Fuel ($)</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.fuel_cost ?? ""}
            onChange={(e) => set("fuel_cost", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Consumables ($)</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.consumables ?? ""}
            onChange={(e) => set("consumables", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tool Wear ($)</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.tool_wear ?? ""}
            onChange={(e) => set("tool_wear", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
      </div>

      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Total Equipment Cost</span>
        <span className="text-xl font-bold text-primary">{formatCurrency(eqCost)}</span>
      </div>
    </div>
  );
}