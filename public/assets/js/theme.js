/**
 * theme.js — Gestión del tema claro / oscuro
 * Se incluye como <script type="module"> en cada página.
 * El <script> inline en el <head> ya aplica el tema guardado antes del primer render
 * para evitar el destello (FOUC). Este módulo solo sincroniza el ícono del botón
 * y registra el handler del toggle.
 */

const THEME_KEY = "sl_theme";

function isDark() {
  const saved = localStorage.getItem(THEME_KEY);
  // Si no hay preferencia guardada, el default es oscuro
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
  // Oscuro → mostrar luna | Claro → mostrar sol
  icon.className = dark ? "bi bi-moon-fill" : "bi bi-sun-fill";
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-theme");
  if (!btn) return;

  // Sincronizar ícono con el tema actual
  syncIcon(isDark());

  btn.addEventListener("click", () => {
    const currentDark =
      document.documentElement.getAttribute("data-theme") !== "light";
    applyTheme(!currentDark);
  });
});
