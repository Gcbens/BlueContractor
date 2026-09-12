import React from "react";

const gradientId = "dashboard-icon-blue";

function IconFrame({ children, compact = false }) {
  return (
    <div className={`metric-icon-frame ${compact ? "w-8 h-8 rounded-lg" : "w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-xl"} border border-blue-400/20 bg-[#07152a] flex items-center justify-center shrink-0`}>
      <svg viewBox="0 0 64 64" className={compact ? "w-6 h-6" : "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"} aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8fe8ff" />
            <stop offset="0.4" stopColor="#168dff" />
            <stop offset="1" stopColor="#0054ff" />
          </linearGradient>
        </defs>
        {children}
      </svg>
    </div>
  );
}

function RevenueIcon() {
  return (
    <IconFrame>
      <circle className="metric-icon-track" cx="32" cy="32" r="23" fill="none" stroke="#1e3555" strokeWidth="5" />
      <path d="M32 9a23 23 0 0 1 20 34" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" />
      <path d="M32 55a23 23 0 0 1-17-8" fill="none" stroke="#f5f7fb" strokeWidth="5" strokeLinecap="round" className="metric-icon-stroke" />
      <text x="32" y="42" textAnchor="middle" fill="#f5f7fb" fontSize="34" fontWeight="600" className="metric-icon-fill">$</text>
    </IconFrame>
  );
}

function ProfitIcon() {
  return (
    <IconFrame>
      <path d="M10 43 27 26l9 9 18-20" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M44 15h10v10" fill="none" stroke="#f5f7fb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="metric-icon-stroke" />
    </IconFrame>
  );
}

function MarginIcon() {
  return (
    <IconFrame>
      <circle className="metric-icon-track" cx="32" cy="32" r="23" fill="none" stroke="#1e3555" strokeWidth="5" />
      <path d="M32 9a23 23 0 0 1 20 34" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" />
      <path d="M32 55a23 23 0 0 1-17-8" fill="none" stroke="#f5f7fb" strokeWidth="5" strokeLinecap="round" className="metric-icon-stroke" />
      <text x="32" y="42" textAnchor="middle" fill="#f5f7fb" fontSize="29" fontWeight="700" className="metric-icon-fill">%</text>
    </IconFrame>
  );
}

function EstimatesIcon() {
  return (
    <IconFrame>
      <rect x="10" y="35" width="11" height="18" rx="2" fill="#f5f7fb" className="metric-icon-fill" />
      <rect x="27" y="23" width="11" height="30" rx="2" fill={`url(#${gradientId})`} />
      <rect x="44" y="11" width="11" height="42" rx="2" fill={`url(#${gradientId})`} />
    </IconFrame>
  );
}

function SuggestionsIcon() {
  return (
    <IconFrame compact>
      <path d="M20 28c0-9 5-15 12-15s12 6 12 15c0 5-2 8-5 11-2 2-3 4-3 7H28c0-3-1-5-3-7-3-3-5-6-5-11Z" fill="none" stroke="#f5f7fb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="metric-icon-stroke" />
      <path d="M28 51h8M29 56h6" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
      <path d="M32 6v-3M13 14l-2-2M51 14l2-2" fill="none" stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" />
    </IconFrame>
  );
}

export function CustomerIcon({ className = "w-5 h-5", strokeWidth = 4 }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fe8ff" />
          <stop offset="0.4" stopColor="#168dff" />
          <stop offset="1" stopColor="#0054ff" />
        </linearGradient>
      </defs>
      <circle className="metric-icon-stroke" cx="32" cy="22" r="11" fill="none" stroke="#f5f7fb" strokeWidth={strokeWidth} />
      <path d="M12 55c1-12 9-19 20-19s19 7 20 19" fill="none" stroke={`url(#${gradientId})`} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

const icons = {
  revenue: RevenueIcon,
  profit: ProfitIcon,
  margin: MarginIcon,
  estimates: EstimatesIcon,
  suggestions: SuggestionsIcon,
  customer: () => <IconFrame><CustomerIcon /></IconFrame>,
};

export default function DashboardMetricIcon({ name }) {
  const Icon = icons[name] || EstimatesIcon;
  return <Icon />;
}