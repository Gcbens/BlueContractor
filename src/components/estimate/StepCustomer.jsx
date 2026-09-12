import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin } from "lucide-react";
import { CustomerIcon } from "@/components/dashboard/DashboardMetricIcon";

function Field({ icon: Icon, label, required, ...inputProps }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
        <Input
          {...inputProps}
          className="h-11 pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground/70"
        />
      </div>
    </div>
  );
}

export default function StepCustomer({ data, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
          <CustomerIcon className="w-5 h-5" strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Customer Information</h2>
          <p className="text-sm text-muted-foreground">Who is this estimate for?</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          icon={CustomerIcon}
          label="Customer Name"
          required
          placeholder="John Smith"
          value={data.customer_name || ""}
          onChange={(e) => set("customer_name", e.target.value)}
        />
        <Field
          icon={Phone}
          label="Phone Number"
          placeholder="(555) 123-4567"
          value={data.phone || ""}
          onChange={(e) => set("phone", e.target.value)}
        />
        <Field
          icon={Mail}
          label="Email"
          type="email"
          placeholder="john@email.com"
          value={data.email || ""}
          onChange={(e) => set("email", e.target.value)}
        />
        <Field
          icon={MapPin}
          label="Job Address"
          placeholder="123 Main St, City, ST"
          value={data.address || ""}
          onChange={(e) => set("address", e.target.value)}
        />
      </div>
    </div>
  );
}