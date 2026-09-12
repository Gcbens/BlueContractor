import React from "react";
import {
  Check,
  Briefcase,
  Ruler,
  Camera,
  Users,
  Boxes,
  Truck,
  BarChart3,
  BrainCircuit,
} from "lucide-react";
import { CustomerIcon } from "@/components/dashboard/DashboardMetricIcon";

const steps = [
  { label: "Customer", icon: CustomerIcon },
  { label: "Job Info", icon: Briefcase },
  { label: "Measurements", icon: Ruler },
  { label: "Photos", icon: Camera },
  { label: "Labor", icon: Users },
  { label: "Materials", icon: Boxes },
  { label: "Equipment", icon: Truck },
  { label: "Profit", icon: BarChart3 },
  { label: "AI Review", icon: BrainCircuit },
];

export default function StepIndicator({ currentStep }) {
  const current = steps[currentStep - 1];
  const progress = Math.round((currentStep / steps.length) * 100);
  const CurrentIcon = current?.icon;

  return (
    <div className="w-full">
      {/* Full horizontal tracker - shown on all screen sizes */}
      <div>
        <div className="relative">
          <div className="absolute left-[22px] right-[22px] top-[22px] h-px bg-border" />
          <div className="relative flex items-start justify-between gap-2 sm:gap-0 overflow-x-auto sm:overflow-x-visible">
            {steps.map((s, i) => {
              const step = i + 1;
              const done = currentStep > step;
              const active = currentStep === step;
              const Icon = s.icon;
              return (
                <div key={step} className="flex flex-col items-center gap-2 w-16 shrink-0">
                  <div
                    className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      active
                        ? "bg-primary border-primary text-white shadow-[0_0_24px_-2px_hsl(var(--primary)/0.7)]"
                        : done
                        ? "bg-primary/15 border-primary/50 text-primary"
                        : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" strokeWidth={1.75} />}
                  </div>
                  <span
                    className={`text-[11px] transition-colors ${
                      active ? "text-white font-bold" : done ? "text-primary font-medium" : "text-muted-foreground font-medium"
                    }`}
                  >
                    {s.label}
                  </span>
                  <div
                    className={`h-0.5 w-8 rounded-full transition-all duration-300 ${
                      active ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}