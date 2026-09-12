import React, { useState, useEffect } from "react";
import { Customer } from "@/api/entities";
import { Phone, Mail, MapPin } from "lucide-react";
import { CustomerIcon } from "@/components/dashboard/DashboardMetricIcon";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Customer.list("-created_date", 50)
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <CustomerIcon className="w-7 h-7" strokeWidth={3} />
          Customers
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customers from your estimates
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 p-12 text-center">
          <p className="text-muted-foreground">No customers yet - create your first estimate</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {customers.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-3 estimate-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                  {(c.name || "?")[0].toUpperCase()}
                </div>
                <p className="text-base font-semibold">{c.name}</p>
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{c.email}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{c.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}