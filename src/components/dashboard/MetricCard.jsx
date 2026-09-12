import React from "react";
import { motion } from "framer-motion";

export default function MetricCard({ label, value, icon: Icon, customIcon, accent = false, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-3 md:p-5 ${
        accent
          ? "bg-primary/5 border-primary/20"
          : "bg-card border-border/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="space-y-1 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={`text-lg md:text-2xl font-bold tracking-tight ${accent ? "text-primary" : "text-foreground"}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {customIcon && (
          <div className="flex-shrink-0">
            {customIcon}
          </div>
        )}
        {!customIcon && Icon && (
          <div className={`w-9 h-9 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
            accent ? "bg-primary/10" : "bg-secondary"
          }`}>
            <Icon className={`w-4 h-4 md:w-5 md:h-5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
          </div>
        )}
      </div>
    </motion.div>
  );
}