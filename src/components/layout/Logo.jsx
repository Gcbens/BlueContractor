import React from "react";
import { Link } from "react-router-dom";
const logo = "/branding/logo-dark.png";
const lightLogo = "/branding/logo-light.png";

export default function Logo({ size = "md" }) {
  const height = size === "sm" ? 46 : 72;
  // Dark asset has a narrower aspect ratio; scale up so both modes render the same width.
  const darkHeight = Math.round(height * 1.11);

  return (
    <Link to="/" className="flex items-center group shrink-0">
      <img
        src={logo}
        alt="BlueContractor: Plan. Price. Profit."
        height={darkHeight}
        style={{ height: darkHeight, width: "auto" }}
        className="logo-seamless logo-dark block object-contain"
      />
      <img
        src={lightLogo}
        alt="BlueContractor: Plan. Price. Profit."
        height={height}
        style={{ height, width: "auto" }}
        className="logo-light block object-contain"
      />
    </Link>
  );
}