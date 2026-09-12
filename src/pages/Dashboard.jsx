import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Estimate, Customer } from "@/api/entities";
import {
  FilePlus,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/dashboard/MetricCard";
import DashboardMetricIcon, { CustomerIcon } from "@/components/dashboard/DashboardMetricIcon";
import RecentEstimateRow from "@/components/dashboard/RecentEstimateRow";
import { formatCurrency } from "@/lib/estimateCalculations";

export default function Dashboard() {
  const [estimates, setEstimates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [est, cust] = await Promise.all([
          Estimate.list("-created_date", 50),
          Customer.list("-created_date", 10),
        ]);
        setEstimates(est);
        setCustomers(cust);
      } catch (e) { /* empty state */ }
      setLoading(false);
    }
    load();
  }, []);

  const totalRevenue = estimates.reduce((s, e) => s + (e.recommended_price || 0), 0);
  const totalProfit = estimates.reduce((s, e) => s + (e.net_profit || 0), 0);
  const avgMargin = estimates.length > 0
    ? estimates.reduce((s, e) => s + (e.profit_margin || 0), 0) / estimates.length
    : 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEstimates = estimates.filter(
    (e) => e.created_date && e.created_date.slice(0, 10) === todayStr
  );

  const recentSuggestions = estimates
    .flatMap((e) => (e.ai_suggestions || []).map((s) => ({ ...s, customer: e.customer_name })))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your profit overview at a glance
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Est. Revenue"
          value={formatCurrency(totalRevenue)}
          customIcon={<DashboardMetricIcon name="revenue" />}
          accent
        />
        <MetricCard
          label="Est. Profit"
          value={formatCurrency(totalProfit)}
          customIcon={<DashboardMetricIcon name="profit" />}
        />
        <MetricCard
          label="Avg Margin"
          value={`${avgMargin.toFixed(1)}%`}
          customIcon={<DashboardMetricIcon name="margin" />}
        />
        <MetricCard
          label="Total Estimates"
          value={estimates.length}
          customIcon={<DashboardMetricIcon name="estimates" />}
          subtitle={`${todayEstimates.length} today`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Estimates */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Estimates</h2>
            {estimates.length > 0 && (
              <Link to="/estimate/new">
                <Button size="sm" className="gap-1.5">
                  <FilePlus className="w-3.5 h-3.5" /> New Estimate
                </Button>
              </Link>
            )}
          </div>
          <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
            {estimates.length === 0 ? (
              <div className="p-10 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No estimates yet</p>
                <Link to="/estimate/new">
                  <Button size="sm" className="mt-3 gap-1.5">
                    <FilePlus className="w-3.5 h-3.5" /> Create First Estimate
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {estimates.slice(0, 8).map((e) => (
                  <RecentEstimateRow key={e.id} estimate={e} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Customers */}
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
              <CustomerIcon className="w-5 h-5" strokeWidth={3} />
              Recent Customers
            </h2>
            <div className="rounded-xl border border-border/50 bg-card/50 p-1">
              {customers.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  No customers yet
                </p>
              ) : (
                customers.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {(c.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.phone || c.email || "—"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Suggestions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DashboardMetricIcon name="suggestions" />
              <h2 className="text-base font-semibold">AI Suggestions</h2>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-1">
              {recentSuggestions.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  Suggestions appear after estimates
                </p>
              ) : (
                recentSuggestions.map((s, i) => (
                  <div
                    key={i}
                    className="px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <p className="text-sm text-foreground">{s.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.customer}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}