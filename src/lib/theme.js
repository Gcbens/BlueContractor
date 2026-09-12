const THEME_KEY = "bluecontractor-theme";

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle("light", theme === "light");
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}