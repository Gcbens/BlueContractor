import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { calculateMaterialItem, calculateMaterials, formatCurrency } from "@/lib/estimateCalculations";

export default function StepMaterials({ data, onChange }) {
  const materials = data.materials || [];

  const updateMaterial = (index, field, value) => {
    const updated = materials.map((m, i) =>
      i === index ? { ...m, [field]: field === "name" ? value : (value === "" ? "" : Number(value)) } : m
    );
    onChange({ ...data, materials: updated });
  };

  const addMaterial = () => {
    onChange({
      ...data,
      materials: [...materials, { name: "", quantity: 1, purchase_cost: 0, markup_pct: 25, waste_pct: 5 }],
    });
  };

  const removeMaterial = (index) => {
    onChange({ ...data, materials: materials.filter((_, i) => i !== index) });
  };

  const totals = calculateMaterials(materials);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Materials</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add all materials for this job
          </p>
        </div>
        <Button onClick={addMaterial} size="sm" variant="outline" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {materials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">No materials added yet</p>
          <Button onClick={addMaterial} size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Material
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((mat, i) => {
            const calc = calculateMaterialItem(mat);
            return (
              <div key={i} className="rounded-xl bg-secondary/30 border border-border/30 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="col-span-2 sm:col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground">Material Name</Label>
                      <Input
                        placeholder="e.g. Paint, Lumber"
                        value={mat.name || ""}
                        onChange={(e) => updateMaterial(i, "name", e.target.value)}
                        className="bg-secondary/50 border-border/50 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Qty</Label>
                      <Input
                        type="number"
                        value={mat.quantity ?? ""}
                        onChange={(e) => updateMaterial(i, "quantity", e.target.value)}
                        className="bg-secondary/50 border-border/50 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Unit Cost ($)</Label>
                      <Input
                        type="number"
                        value={mat.purchase_cost ?? ""}
                        onChange={(e) => updateMaterial(i, "purchase_cost", e.target.value)}
                        className="bg-secondary/50 border-border/50 h-9 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 col-span-2 sm:col-span-1">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Markup %</Label>
                        <Input
                          type="number"
                          value={mat.markup_pct ?? ""}
                          onChange={(e) => updateMaterial(i, "markup_pct", e.target.value)}
                          className="bg-secondary/50 border-border/50 h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Waste %</Label>
                        <Input
                          type="number"
                          value={mat.waste_pct ?? ""}
                          onChange={(e) => updateMaterial(i, "waste_pct", e.target.value)}
                          className="bg-secondary/50 border-border/50 h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMaterial(i)}
                    className="text-muted-foreground hover:text-destructive shrink-0 ml-2 mt-5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t border-border/20">
                  <span>Cost: <span className="text-foreground font-medium">{formatCurrency(calc.totalCost)}</span></span>
                  <span>Selling: <span className="text-foreground font-medium">{formatCurrency(calc.sellingPrice)}</span></span>
                  <span>Markup: <span className="text-green-400 font-medium">+{formatCurrency(calc.markup)}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {materials.length > 0 && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 sm:p-4 grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div>
            <p className="text-[11px] text-muted-foreground">Total Cost</p>
            <p className="text-base sm:text-lg font-bold">{formatCurrency(totals.totalCost)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Selling Price</p>
            <p className="text-base sm:text-lg font-bold text-primary">{formatCurrency(totals.totalSelling)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Markup Profit</p>
            <p className="text-base sm:text-lg font-bold text-green-400">+{formatCurrency(totals.totalMarkup)}</p>
          </div>
        </div>
      )}
    </div>
  );
}