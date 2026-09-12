import React from "react";
import { calculateEstimate, formatCurrency } from "@/lib/estimateCalculations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const COLORS = ["#3B82F6", "#6366F1", "#8B5CF6", "#06B6D4", "#F59E0B", "#EF4444"];

export default function ProfitEngine({ data, onChange }) {
  const calc = calculateEstimate(data);
  const set = (field, value) => onChange({ ...data, [field]: value === "" ? "" : Number(value) });

  const pieData = [
    { name: "Labor", value: calc.labor_cost },
    { name: "Materials", value: calc.material_cost },
    { name: "Equipment", value: calc.equipment_cost },
    { name: "Travel", value: calc.travel_cost },
    { name: "Hidden Costs", value: calc.hidden_costs },
    { name: "Overhead", value: calc.overhead_cost },
    { name: "Contingency", value: calc.contingency_cost },
    { name: "Taxes", value: calc.taxes },
  ].filter((d) => d.value > 0);

  const priceData = [
    { name: "Minimum", price: calc.minimum_price },
    { name: "Recommended", price: calc.recommended_price },
    { name: "Premium", price: calc.premium_price },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Profit Engine</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Live profit calculations — updated as you type
        </p>
      </div>

      {/* Additional cost inputs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Hidden Costs ($)</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.hidden_costs ?? ""}
            onChange={(e) => set("hidden_costs", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tax Rate (%)</Label>
          <Input
            type="number"
            placeholder="8"
            value={data.tax_rate ?? ""}
            onChange={(e) => set("tax_rate", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Overhead (%)</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.overhead_pct ?? ""}
            onChange={(e) => set("overhead_pct", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
          <p className="text-[11px] text-muted-foreground">Fixed business costs (insurance, vehicle, tools, admin)</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Contingency (%)</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.contingency_pct ?? ""}
            onChange={(e) => set("contingency_pct", e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
          <p className="text-[11px] text-muted-foreground">Risk buffer for unknowns</p>
        </div>
      </div>

      {/* Cost Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Labor Cost", value: calc.labor_cost, color: "text-blue-400" },
          { label: "Material Cost", value: calc.material_cost, color: "text-indigo-400" },
          { label: "Equipment Cost", value: calc.equipment_cost, color: "text-violet-400" },
          { label: "Travel Cost", value: calc.travel_cost, color: "text-cyan-400" },
          { label: "Hidden Costs", value: calc.hidden_costs, color: "text-amber-400" },
          { label: "Overhead", value: calc.overhead_cost, color: "text-emerald-400" },
          { label: "Contingency", value: calc.contingency_cost, color: "text-orange-400" },
          { label: "Taxes", value: calc.taxes, color: "text-red-400" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-secondary/30 border border-border/30 p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`text-lg font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Profit Cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4">
          <p className="text-xs text-muted-foreground">Gross Profit</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(calc.gross_profit)}</p>
        </div>
        <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4">
          <p className="text-xs text-muted-foreground">Net Profit</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(calc.net_profit)}</p>
        </div>
      </div>

      {/* Price Tiers */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-secondary/30 border border-border/30 p-4 text-center">
          <p className="text-xs text-muted-foreground">Minimum</p>
          <p className="text-xl font-bold text-amber-400">{formatCurrency(calc.minimum_price)}</p>
          <p className="text-xs text-muted-foreground mt-1">10% margin</p>
        </div>
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center ring-1 ring-primary/30">
          <p className="text-xs text-primary font-medium">Recommended</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(calc.recommended_price)}</p>
          <p className="text-xs text-muted-foreground mt-1">35% margin</p>
        </div>
        <div className="rounded-xl bg-secondary/30 border border-border/30 p-4 text-center">
          <p className="text-xs text-muted-foreground">Premium</p>
          <p className="text-xl font-bold text-violet-400">{formatCurrency(calc.premium_price)}</p>
          <p className="text-xs text-muted-foreground mt-1">60% margin</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-secondary/30 border border-border/30 p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Profit Margin</span>
          <span className="text-lg font-bold text-primary">{calc.profit_margin}%</span>
        </div>
        <div className="rounded-xl bg-secondary/30 border border-border/30 p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Hourly Profit</span>
          <span className="text-lg font-bold text-green-400">{formatCurrency(calc.hourly_profit)}/hr</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid sm:grid-cols-2 gap-4">
        {pieData.length > 0 && (
          <div className="rounded-xl bg-card border border-border/50 p-4">
            <p className="text-sm font-medium mb-3">Cost Breakdown</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => formatCurrency(val)}
                  contentStyle={{ background: "hsl(222 44% 8%)", border: "1px solid hsl(222 30% 16%)", borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-xl bg-card border border-border/50 p-4">
          <p className="text-sm font-medium mb-3">Price Comparison</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val) => formatCurrency(val)}
                contentStyle={{ background: "hsl(222 44% 8%)", border: "1px solid hsl(222 30% 16%)", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="price" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}