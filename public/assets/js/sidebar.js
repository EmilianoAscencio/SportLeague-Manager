const COLLAPSE_KEY = "sl_sidebar_collapsed";

document.addEventListener("DOMContentLoaded", () => {
  const sidebar    = document.getElementById("sidebar");
  const overlay    = document.getElementById("sidebar-overlay");
  const btnOpen    = document.getElementById("btn-sidebar-open");
  const btnClose   = document.getElementById("btn-sidebar-close");
  const btnToggle  = document.getElementById("btn-sidebar-toggle");
  const toggleIcon = document.getElementById("sidebar-toggle-icon");

  if (!sidebar || !overlay) return;

  sidebar.querySelectorAll(".sidebar-link").forEach((link) => {
    const text = link.querySelector("span")?.textContent?.trim();
    if (text) link.title = text;
  });

  // Colapsar / expandir
  function applyCollapsed(collapsed, animate = true) {
    if (!animate) sidebar.style.transition = "none";

    sidebar.classList.toggle("is-collapsed", collapsed);
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");

    if (toggleIcon) {
      toggleIcon.className = collapsed
        ? "bi bi-chevron-right"
        : "bi bi-chevron-left";
    }
    if (btnToggle) {
      btnToggle.title = collapsed ? "Expandir menú" : "Contraer menú";
      btnToggle.setAttribute("aria-label", btnToggle.title);
    }

    if (!animate) {
      requestAnimationFrame(() => {
        sidebar.style.transition = "";
      });
    }
  }

  // Inicializar desde localStorage
  const savedCollapsed = localStorage.getItem(COLLAPSE_KEY) === "1";
  applyCollapsed(savedCollapsed, false);

  btnToggle?.addEventListener("click", () => {
    applyCollapsed(!sidebar.classList.contains("is-collapsed"));
  });

  // Abrir / cerrar en móvil
  function openSidebar() {
    sidebar.classList.add("is-open");
    overlay.classList.add("is-visible");
    document.body.style.overflow = "hidden";
    btnOpen?.setAttribute("aria-expanded", "true");
  }

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    overlay.classList.remove("is-visible");
    document.body.style.overflow = "";
    btnOpen?.setAttribute("aria-expanded", "false");
  }

  btnOpen?.addEventListener("click", openSidebar);
  btnClose?.addEventListener("click", closeSidebar);
  overlay.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("is-open")) closeSidebar();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 992) {
      sidebar.classList.remove("is-open");
      overlay.classList.remove("is-visible");
      document.body.style.overflow = "";
    }
  });
});
