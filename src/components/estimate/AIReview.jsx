import React, { useState } from "react";
import { invokeAI } from "@/lib/aiClient";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle, DollarSign, Users, Clock, Truck, Loader2 } from "lucide-react";
import { calculateEstimate, formatCurrency } from "@/lib/estimateCalculations";
import { motion, AnimatePresence } from "framer-motion";

const iconMap = {
  cost: DollarSign,
  labor: Users,
  time: Clock,
  travel: Truck,
  warning: AlertTriangle,
  default: Sparkles,
};

export default function AIReview({ data, onApplySuggestions }) {
  const [suggestions, setSuggestions] = useState(data.ai_suggestions || []);
  const [loading, setLoading] = useState(false);

  const runReview = async () => {
    setLoading(true);
    const calc = calculateEstimate(data);
    const prompt = `You are an expert contractor estimating advisor. Analyze this estimate and provide actionable profit-maximizing suggestions.

Estimate Details:
- Job Type: ${data.job_type || "Not specified"}
- Property Type: ${data.property_type || "residential"}
- Difficulty: ${data.difficulty || "moderate"}
- Description: ${data.job_description || "None"}
- Has Stairs: ${data.has_stairs ? "Yes" : "No"}
- Floors: ${data.num_floors || 1}
- Square Footage: ${data.square_footage || 0}
- Workers: ${data.num_workers || 0}, Hourly Rate: $${data.hourly_rate || 0}
- Estimated Hours: ${data.estimated_hours || 0}
- Travel Time: ${data.travel_time || 0}h, Setup: ${data.setup_time || 0}h, Cleanup: ${data.cleanup_time || 0}h
- Walking Distance: ${data.walking_distance || 0}ft, Distance from Truck: ${data.distance_from_truck || 0}ft
- Materials: ${(data.materials || []).map(m => `${m.name}: qty ${m.quantity}, cost $${m.purchase_cost}, markup ${m.markup_pct}%`).join("; ") || "None"}
- Equipment Rental: $${data.equipment_rental || 0}, Fuel: $${data.fuel_cost || 0}
- Hidden Costs: $${data.hidden_costs || 0}, Tax Rate: ${data.tax_rate || 0}%

Calculated:
- Labor Cost: $${calc.labor_cost}
- Material Cost: $${calc.material_cost}
- Equipment Cost: $${calc.equipment_cost}
- Recommended Price: $${calc.recommended_price}
- Profit Margin: ${calc.profit_margin}%

Provide 4-7 specific suggestions. Focus on forgotten costs, underpricing, safety, and profit optimization. Be direct and specific with dollar amounts where possible.`;

    try {
      const result = await invokeAI({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["cost", "labor", "time", "travel", "warning"] },
                  message: { type: "string" },
                  impact: { type: "string", enum: ["low", "medium", "high"] },
                  amount: { type: "number" },
                },
                required: ["type", "message", "impact"],
              },
            },
          },
        },
      });
      const newSuggestions = result.suggestions || [];
      setSuggestions(newSuggestions);
      onApplySuggestions(newSuggestions);
    } catch (e) {
      setSuggestions([{ type: "warning", message: "Unable to analyze. Please try again.", impact: "low" }]);
    }
    setLoading(false);
  };

  const impactColors = {
    high: "border-red-500/30 bg-red-500/5",
    medium: "border-amber-500/30 bg-amber-500/5",
    low: "border-blue-500/30 bg-blue-500/5",
  };

  const impactBadge = {
    high: "bg-red-500/10 text-red-400",
    medium: "bg-amber-500/10 text-amber-400",
    low: "bg-blue-500/10 text-blue-400",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Profit Review</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI analyzes your estimate for hidden costs and profit opportunities
          </p>
        </div>
        <Button
          onClick={runReview}
          disabled={loading}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Analyzing..." : "Run AI Review"}
        </Button>
      </div>

      {loading && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-8 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Analyzing your estimate for profit opportunities...</p>
        </div>
      )}

      <AnimatePresence>
        {!loading && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {suggestions.map((s, i) => {
              const Icon = iconMap[s.type] || iconMap.default;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-xl border p-4 ${impactColors[s.impact] || impactColors.low}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{s.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${impactBadge[s.impact] || impactBadge.low}`}>
                          {s.impact} impact
                        </span>
                        {s.amount > 0 && (
                          <span className="text-xs text-green-400 font-medium">
                            +{formatCurrency(s.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && suggestions.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/50 p-10 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Click "Run AI Review" to get profit-maximizing suggestions
          </p>
        </div>
      )}
    </div>
  );
}