import React, { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { getTheme, setTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setThemeState] = useState(getTheme);
  const isLight = theme === "light";

  const handleToggle = () => {
    const next = isLight ? "dark" : "light";
    setTheme(next);
    setThemeState(next);
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 w-full transition-all duration-150"
    >
      {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      {isLight ? "Default Mode" : "Light Mode"}
    </button>
  );
}