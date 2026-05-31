const THEME_KEY = "sl_theme";

function isDark() {
  const saved = localStorage.getItem(THEME_KEY);
  return saved ? saved === "dark" : true;
}

function applyTheme(dark) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  syncIcon(dark);
}

function syncIcon(dark) {
  const icon = document.getElementById("theme-icon");
  if (!icon) return;
  icon.className = dark ? "bi bi-moon-fill" : "bi bi-sun-fill";
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-theme");
  if (!btn) return;

  syncIcon(isDark());

  btn.addEventListener("click", () => {
    const currentDark =
      document.documentElement.getAttribute("data-theme") !== "light";
    applyTheme(!currentDark);
  });
});
