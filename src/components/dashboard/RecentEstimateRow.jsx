import React from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/estimateCalculations";
import { ChevronRight } from "lucide-react";

const statusColors = {
  draft: "bg-yellow-500/10 text-yellow-400",
  completed: "bg-green-500/10 text-green-400",
  sent: "bg-blue-500/10 text-blue-400",
  accepted: "bg-emerald-500/10 text-emerald-400",
  declined: "bg-red-500/10 text-red-400",
};

export default function RecentEstimateRow({ estimate }) {
  return (
    <Link
      to={`/estimate/${estimate.id}`}
      className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary/50 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {estimate.customer_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {estimate.job_type}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[estimate.status] || statusColors.draft}`}>
          {estimate.status}
        </span>
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(estimate.recommended_price)}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}