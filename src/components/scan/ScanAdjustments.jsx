import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal } from "lucide-react";

function Field({ label, value, onChange, type = "number", step, prefix }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          type={type}
          value={value}
          step={step}
          onChange={(e) =>
            onChange(type === "number" ? Number(e.target.value) : e.target.value)
          }
          className={`h-9 bg-input/50 ${prefix ? "pl-6" : ""}`}
        />
      </div>
    </div>
  );
}

export default function ScanAdjustments({ data, setData }) {
  const set = (key) => (val) => setData((d) => ({ ...d, [key]: val }));

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Adjust the Estimate</h3>
        <span className="text-xs text-muted-foreground ml-1">
          Correct anything the AI got wrong, price updates live
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Customer Name</Label>
          <Input
            value={data.customer_name}
            onChange={(e) => set("customer_name")(e.target.value)}
            placeholder="Quick Scan"
            className="h-9 bg-input/50"
          />
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Job Type</Label>
          <Input
            value={data.job_type}
            onChange={(e) => set("job_type")(e.target.value)}
            className="h-9 bg-input/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Difficulty</Label>
          <select
            value={data.difficulty}
            onChange={(e) => set("difficulty")(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-input/50 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
            <option value="extreme">Extreme</option>
          </select>
        </div>

        <Field label="Sq Footage" value={data.square_footage} onChange={set("square_footage")} />
        <Field label="Workers" value={data.num_workers} onChange={set("num_workers")} />
        <Field label="Hourly Rate" value={data.hourly_rate} onChange={set("hourly_rate")} prefix="$" />

        <Field label="Work Hours" value={data.estimated_hours} onChange={set("estimated_hours")} step="0.5" />
        <Field label="Hidden Costs" value={data.hidden_costs} onChange={set("hidden_costs")} prefix="$" />
        <Field label="Tax Rate %" value={data.tax_rate} onChange={set("tax_rate")} />
      </div>
    </div>
  );
}