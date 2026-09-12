import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function StepMeasurements({ data, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value });
  const setNum = (field, value) => set(field, value === "" ? "" : Number(value));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Measurements</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Enter job dimensions and logistics
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Square Footage</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.square_footage ?? ""}
            onChange={(e) => setNum("square_footage", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Linear Feet</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.linear_feet ?? ""}
            onChange={(e) => setNum("linear_feet", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Number of Floors</Label>
          <Input
            type="number"
            placeholder="1"
            value={data.num_floors ?? ""}
            onChange={(e) => setNum("num_floors", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Walking Distance (ft)</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.walking_distance ?? ""}
            onChange={(e) => setNum("walking_distance", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Distance from Truck (ft)</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.distance_from_truck ?? ""}
            onChange={(e) => setNum("distance_from_truck", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Travel Miles (round trip)</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.travel_miles ?? ""}
            onChange={(e) => setNum("travel_miles", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Cost per Mile ($)</Label>
          <Input
            type="number"
            placeholder="0.67"
            value={data.cost_per_mile ?? ""}
            onChange={(e) => setNum("cost_per_mile", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Weight (lbs)</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.weight ?? ""}
            onChange={(e) => setNum("weight", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs text-muted-foreground">Dimensions</Label>
          <Input
            placeholder='e.g. 12x10x8'
            value={data.dimensions || ""}
            onChange={(e) => set("dimensions", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="col-span-2 flex items-center gap-3 pt-1">
          <Switch
            checked={data.has_stairs || false}
            onCheckedChange={(v) => set("has_stairs", v)}
          />
          <Label className="text-sm">Has Stairs</Label>
        </div>
      </div>
    </div>
  );
}