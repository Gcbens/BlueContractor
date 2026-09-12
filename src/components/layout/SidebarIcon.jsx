import React from "react";

const ICON_URLS = {
  dashboard: "/branding/icon-dashboard-dark.png",
  "new-estimate": "/branding/icon-new-estimate-dark.png",
  customers: "/branding/icon-customers-dark.png",
  settings: "/branding/icon-settings-dark.png",
};

const LIGHT_ICON_URLS = {
  dashboard: "/branding/icon-dashboard-light.png",
  "new-estimate": "/branding/icon-new-estimate-light.png",
  customers: "/branding/icon-customers-light.png",
  settings: "/branding/icon-settings-light.png",
};

// Fallback sprite (4-icon row) for icons not yet provided individually.
const SPRITE_URL = "/branding/icon-sprite.png";

const SPRITE_POS_X = {
  settings: "100%",
};

export default function SidebarIcon({ name, className = "" }) {
  if (ICON_URLS[name]) {
    return (
      <span className={`relative inline-block shrink-0 ${className}`}>
        <img
          src={ICON_URLS[name]}
          alt={name}
          className="logo-dark block object-contain w-full h-full"
          width={30}
          height={30}
        />
        <img
          src={LIGHT_ICON_URLS[name]}
          alt={name}
          className="logo-light sidebar-icon-blend absolute inset-0 w-full h-full object-contain"
          width={30}
          height={30}
        />
      </span>
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={`shrink-0 bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${SPRITE_URL})`,
        backgroundSize: "400% auto",
        backgroundPositionX: SPRITE_POS_X[name] || "0%",
        backgroundPositionY: "top",
      }}
    />
  );
}