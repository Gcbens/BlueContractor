import React, { useState } from "react";
import { invokeAI } from "@/lib/aiClient";
import { calculateEstimate, formatCurrency } from "@/lib/estimateCalculations";
import { Button } from "@/components/ui/button";
import { Loader2, Gauge, TrendingUp, TrendingDown, AlertTriangle, Sparkles } from "lucide-react";

function buildRegion(data) {
  const parts = [data.address, data.city, data.state].filter(Boolean).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts.join(", ") : "United States national average";
}

function computeProfitScore(recommendedPrice, totalCosts, market) {
  if (!market || !market.market_typical) return null;
  const margin = recommendedPrice > 0 ? (recommendedPrice - totalCosts) / recommendedPrice : 0;
  const marginScore = Math.min(margin / 0.35, 1) * 50;

  const ratio = recommendedPrice / market.market_typical;
  let marketScore;
  if (ratio < 0.85) marketScore = 15;
  else if (ratio < 0.95) marketScore = 30;
  else if (ratio <= 1.1) marketScore = 40;
  else if (ratio <= 1.25) marketScore = 30;
  else marketScore = 18;

  let score = marginScore + marketScore;
  if (recommendedPrice < totalCosts) score = Math.min(score, 15);
  return Math.round(Math.max(0, Math.min(100, score)));
}

function scoreVerdict(score) {
  if (score >= 80) return { label: "Excellent", color: "text-green-400", ring: "stroke-green-400" };
  if (score >= 60) return { label: "Good", color: "text-emerald-400", ring: "stroke-emerald-400" };
  if (score >= 40) return { label: "Fair", color: "text-amber-400", ring: "stroke-amber-400" };
  return { label: "Risky", color: "text-red-400", ring: "stroke-red-400" };
}

export default function MarketBenchmark({ data, onChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calc = calculateEstimate(data);
  const recommendedPrice = calc.recommended_price;
  const totalCosts =
    calc.labor_cost + calc.material_cost + calc.equipment_cost + calc.travel_cost + calc.hidden_costs;

  const market = {
    market_low: data.market_low,
    market_typical: data.market_typical,
    market_high: data.market_high,
    notes: data.market_notes,
  };
  const hasMarket = Boolean(market.market_typical);
  const score = hasMarket ? computeProfitScore(recommendedPrice, totalCosts, market) : null;

  const fetchBenchmark = async () => {
    setLoading(true);
    setError("");
    try {
      const region = buildRegion(data);
      const prompt = `Research typical market pricing that contractors charge for this job:
Job type: ${data.job_type || "general contracting"}
Property type: ${data.property_type || "residential"}
Description: ${data.job_description || "Not specified"}
Scope: ${data.square_footage || 0} sq ft, ${data.linear_feet || 0} linear feet, ${data.num_floors || 1} floor(s)
Labor: ${data.estimated_hours || 0} hours, ${data.num_workers || 1} worker(s)
Region: ${region}

Return realistic USD price ranges that contractors actually charge for THIS specific job type in THIS region, accounting for local labor and material costs. Return only JSON.`;

      const res = await invokeAI({
        prompt,
        add_context_from_internet: true,
        model: "claude-sonnet-5",
        response_json_schema: {
          type: "object",
          properties: {
            market_low: { type: "number" },
            market_typical: { type: "number" },
            market_high: { type: "number" },
            notes: { type: "string" },
          },
          required: ["market_low", "market_typical", "market_high"],
        },
      });

      const computedScore = computeProfitScore(recommendedPrice, totalCosts, res);
      onChange({
        ...data,
        market_low: res.market_low,
        market_typical: res.market_typical,
        market_high: res.market_high,
        market_notes: res.notes || "",
        profit_score: computedScore,
      });
    } catch (e) {
      setError("Could not fetch market data. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const ratio = hasMarket ? recommendedPrice / market.market_typical : 0;
  const pctVsMarket = hasMarket ? Math.round((ratio - 1) * 100) : 0;

  // Range bar positions
  const rangeMin = hasMarket ? Math.min(market.market_low, recommendedPrice) * 0.85 : 0;
  const rangeMax = hasMarket ? Math.max(market.market_high, recommendedPrice) * 1.15 : 1;
  const pos = (val) => `${((val - rangeMin) / (rangeMax - rangeMin)) * 100}%`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Gauge className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Profit Score & Market Benchmark</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              See how your price compares to real market rates
            </p>
          </div>
        </div>
        <Button onClick={fetchBenchmark} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {hasMarket ? "Refresh" : "Get Market Rate"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {!hasMarket && !loading && (
        <div className="rounded-xl border border-dashed border-border/50 bg-secondary/20 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Run a market benchmark to score your estimate. We compare your recommended price against
            typical contractor pricing for <span className="text-foreground font-medium">{data.job_type || "this job type"}</span> in {buildRegion(data)}.
          </p>
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-border/50 bg-secondary/20 p-6 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Researching live market rates…</p>
        </div>
      )}

      {hasMarket && !loading && score !== null && (
        <>
          {/* Score gauge */}
          <div className="flex items-center gap-5 rounded-xl bg-card border border-border/50 p-5">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(222 30% 16%)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  className={scoreVerdict(score).ring}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 264} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${scoreVerdict(score).color}`}>{score}</span>
                <span className="text-[10px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${scoreVerdict(score).color}`}>
                {scoreVerdict(score).label} Pricing
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {score >= 80 && "You're priced competitively with healthy margins. Strong profit potential."}
                {score >= 60 && score < 80 && "Solid pricing. Small tweaks could unlock more profit."}
                {score >= 40 && score < 60 && "Pricing is okay but you may be leaving money on the table or risking the job."}
                {score < 40 && "Warning: your price may be too low to profit or too high to win the job."}
              </p>
            </div>
          </div>

          {/* Market range bar */}
          <div className="rounded-xl bg-card border border-border/50 p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Market range for {data.job_type || "this job"}</span>
              <span>{buildRegion(data)}</span>
            </div>
            <div className="relative h-3 rounded-full bg-secondary/40">
              <div
                className="absolute h-3 rounded-full bg-primary/25"
                style={{ left: pos(market.market_low), right: `calc(100% - ${pos(market.market_high)})` }}
              />
              {/* market typical marker */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-0.5 h-5 bg-muted-foreground" style={{ left: pos(market.market_typical) }} />
              {/* your price marker */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary ring-2 ring-primary/30" style={{ left: pos(recommendedPrice) }} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Low {formatCurrency(market.market_low)}</span>
              <span className="text-muted-foreground">Typical {formatCurrency(market.market_typical)}</span>
              <span className="text-muted-foreground">High {formatCurrency(market.market_high)}</span>
            </div>
          </div>

          {/* Comparison insight */}
          <div className={`rounded-xl p-4 border flex items-start gap-3 ${
            pctVsMarket < -5 ? "bg-amber-500/5 border-amber-500/20" : pctVsMarket > 10 ? "bg-orange-500/5 border-orange-500/20" : "bg-green-500/5 border-green-500/20"
          }`}>
            {pctVsMarket < -5 ? (
              <TrendingDown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : pctVsMarket > 10 ? (
              <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            ) : (
              <TrendingUp className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <p className="font-medium">
                Your price is {pctVsMarket > 0 ? "above" : "below"} market typical by {Math.abs(pctVsMarket)}%
              </p>
              <p className="text-muted-foreground mt-0.5">
                {pctVsMarket < -5 && `You may be leaving ${formatCurrency(market.market_typical - recommendedPrice)} on the table.`}
                {pctVsMarket > 10 && "Priced above market. Higher profit if won, but higher risk of losing the job."}
                {pctVsMarket >= -5 && pctVsMarket <= 10 && "Well positioned: competitive and profitable."}
              </p>
            </div>
          </div>

          {market.notes && (
            <div className="rounded-xl bg-secondary/20 border border-border/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Market Notes</p>
              <p className="text-sm text-foreground/90">{market.notes}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}