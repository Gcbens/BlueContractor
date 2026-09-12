import React from "react";
import { calculateMaterialItem, formatCurrency } from "@/lib/estimateCalculations";
import { Ruler, Boxes, HardHat, Eye } from "lucide-react";

function Section({ icon, title, children }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ScanBreakdown({ data, aiMeta }) {
  const materials = data.materials || [];
  const detected = aiMeta.detected_items || [];

  return (
    <div className="space-y-4">
      {aiMeta.notes && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Eye className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-primary">AI Summary</h3>
          </div>
          <p className="text-sm text-foreground/90">{aiMeta.notes}</p>
        </div>
      )}

      {detected.length > 0 && (
        <Section icon={<Eye className="w-4 h-4 text-muted-foreground" />} title="Detected in Photo">
          <div className="flex flex-wrap gap-2">
            {detected.map((item, i) => (
              <span
                key={i}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary/50 text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </Section>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Section icon={<Ruler className="w-4 h-4 text-muted-foreground" />} title="Measurements">
          <dl className="grid grid-cols-2 gap-y-2 gap-x-3 text-sm">
            <dt className="text-muted-foreground">Sq Ft</dt>
            <dd className="text-right font-medium">{(data.square_footage || 0).toLocaleString()}</dd>
            <dt className="text-muted-foreground">Linear Ft</dt>
            <dd className="text-right font-medium">{(data.linear_feet || 0).toLocaleString()}</dd>
            <dt className="text-muted-foreground">Floors</dt>
            <dd className="text-right font-medium">{data.num_floors || 1}</dd>
            <dt className="text-muted-foreground">Stairs</dt>
            <dd className="text-right font-medium">{data.has_stairs ? "Yes" : "No"}</dd>
            <dt className="text-muted-foreground">Weight (lbs)</dt>
            <dd className="text-right font-medium">{(data.weight || 0).toLocaleString()}</dd>
          </dl>
        </Section>

        <Section icon={<HardHat className="w-4 h-4 text-muted-foreground" />} title="Labor">
          <dl className="grid grid-cols-2 gap-y-2 gap-x-3 text-sm">
            <dt className="text-muted-foreground">Workers</dt>
            <dd className="text-right font-medium">{data.num_workers || 1}</dd>
            <dt className="text-muted-foreground">Work Hours</dt>
            <dd className="text-right font-medium">{data.estimated_hours || 0}</dd>
            <dt className="text-muted-foreground">Hourly Rate</dt>
            <dd className="text-right font-medium">{formatCurrency(data.hourly_rate)}</dd>
            <dt className="text-muted-foreground">Travel + Setup</dt>
            <dd className="text-right font-medium">
              {(data.travel_time || 0) + (data.setup_time || 0) + (data.cleanup_time || 0)} hrs
            </dd>
            <dt className="text-muted-foreground">Difficulty</dt>
            <dd className="text-right font-medium capitalize">{data.difficulty}</dd>
          </dl>
        </Section>
      </div>

      {materials.length > 0 && (
        <Section icon={<Boxes className="w-4 h-4 text-muted-foreground" />} title="Materials">
          <div className="space-y-2">
            {materials.map((m, i) => {
              const r = calculateMaterialItem(m);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.name || "Material"}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.quantity || 0} × {formatCurrency(m.purchase_cost || 0)}
                    </p>
                  </div>
                  <span className="font-semibold shrink-0 ml-3">
                    {formatCurrency(r.sellingPrice)}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}