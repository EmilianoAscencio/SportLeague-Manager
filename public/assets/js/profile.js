import { logout, preventBackAccess, requireAuth, showUserInNavbar } from "./auth.js";
import { getDocuments } from "./firestore.js";
import { showAlert } from "./ui.js";
import { auth } from "./firebase.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── Init ────────────────────────────────────────────────────────────────────
preventBackAccess();

requireAuth().then(async (user) => {
  showUserInNavbar(user);
  document.getElementById("btn-logout").addEventListener("click", logout);

  renderProfile(user);
  renderSessionInfo(user);

  await Promise.all([
    loadUserRole(user.uid),
    loadUserActivity(user.uid),
  ]);

  setupEditForm(user);
});

// ── Datos personales del usuario ────────────────────────────────────────────
function renderProfile(user) {
  const name    = user.displayName || "Sin nombre";
  const email   = user.email || "—";
  const initial = (user.displayName || user.email || "?")[0].toUpperCase();

  document.getElementById("profile-avatar").textContent = initial;
  document.getElementById("profile-name").textContent   = name;
  document.getElementById("profile-email").textContent  = email;
  document.getElementById("detail-name").textContent    = name;
  document.getElementById("detail-email").textContent   = email;
  document.getElementById("detail-uid").textContent     = user.uid;
  document.getElementById("input-display-name").value   = user.displayName || "";

  // Miembro desde (fecha de creación de la cuenta)
  const since = user.metadata?.creationTime;
  if (since) {
    document.getElementById("detail-since").textContent = fmtDate(new Date(since));
  }
}

// ── Información de la sesión actual ────────────────────────────────────────
function renderSessionInfo(user) {
  // Último acceso
  const lastLogin = user.metadata?.lastSignInTime;
  document.getElementById("session-last-login").textContent = lastLogin
    ? fmtDateTime(new Date(lastLogin))
    : "—";

  // Fecha de creación de la cuenta
  const created = user.metadata?.creationTime;
  document.getElementById("session-created").textContent = created
    ? fmtDateTime(new Date(created))
    : "—";

  // Email verificado
  const verifiedEl = document.getElementById("session-verified");
  if (user.emailVerified) {
    verifiedEl.innerHTML = `<span class="badge badge-active">
      <i class="bi bi-check-circle-fill me-1"></i>Verificado
    </span>`;
  } else {
    verifiedEl.innerHTML = `<span class="badge badge-danger">
      <i class="bi bi-x-circle-fill me-1"></i>No verificado
    </span>`;
  }

  // Método / proveedor de autenticación
  const PROVIDERS = {
    "password":   "Correo y contraseña",
    "google.com": "Google",
    "github.com": "GitHub",
    "facebook.com": "Facebook",
  };
  const providerId = user.providerData?.[0]?.providerId ?? "password";
  document.getElementById("session-provider").textContent =
    PROVIDERS[providerId] ?? providerId;
}

// ── Rol del usuario ─────────────────────────────────────────────────────────
async function loadUserRole(uid) {
  const result = await getDocuments("users");
  if (!result.success) return;

  const userDoc = result.data.find((u) => u.uid === uid);
  const ROLES   = { admin: "Administrador", viewer: "Espectador" };
  const label   = ROLES[userDoc?.role] ?? "Administrador";

  document.getElementById("detail-role").textContent        = label;
  document.getElementById("profile-role-badge").textContent = label;
}

// ── Actividad propia del usuario (registros creados por él) ─────────────────
async function loadUserActivity(uid) {
  const COLS = [
    { col: "teams",       label: "Equipos",    icon: "bi-shield-fill",    color: "var(--primary)" },
    { col: "players",     label: "Jugadores",  icon: "bi-person-fill",    color: "var(--success)" },
    { col: "tournaments", label: "Torneos",    icon: "bi-trophy-fill",    color: "var(--warning)" },
    { col: "matches",     label: "Partidos",   icon: "bi-calendar3-fill", color: "var(--muted)"   },
  ];

  const results = await Promise.all(COLS.map((c) => getDocuments(c.col)));

  const container = document.getElementById("profile-activity");
  container.innerHTML = COLS.map((c, i) => {
    const raw = results[i];

    // Filtrar solo los creados por este usuario
    const mine = raw.success
      ? raw.data.filter((d) => d.createdBy === uid)
      : [];
    const count = raw.success ? mine.length : "—";

    // ¿Cuántos están activos?
    const active = raw.success
      ? mine.filter((d) => d.active !== false).length
      : null;

    const activeHint = (active !== null && active !== count)
      ? `<div style="font-size:.68rem;color:var(--muted);margin-top:2px;">${active} activos</div>`
      : "";

    return `
      <div class="col-6 col-sm-3">
        <div class="metric-card text-center" style="padding:14px 10px;">
          <i class="bi ${c.icon} mb-1 d-block" style="font-size:1.4rem;color:${c.color};opacity:.85;"></i>
          <div class="metric-value" style="font-size:1.55rem;color:${c.color};">${count}</div>
          <div class="metric-label">${c.label}</div>
          ${activeHint}
        </div>
      </div>`;
  }).join("");
}

// ── Editar nombre ───────────────────────────────────────────────────────────
function setupEditForm(user) {
  const input = document.getElementById("input-display-name");
  const btn   = document.getElementById("btn-save-name");

  document.getElementById("form-edit-name").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newName = input.value.trim();

    input.classList.remove("is-invalid");
    if (newName.length < 2) {
      input.classList.add("is-invalid");
      return;
    }

    btn.disabled    = true;
    btn.textContent = "Guardando…";

    try {
      await updateProfile(auth.currentUser, { displayName: newName });

      // Reflejar cambios en la UI
      const navUser = document.getElementById("navbar-user");
      if (navUser) navUser.textContent = newName;

      document.getElementById("profile-avatar").textContent = newName[0].toUpperCase();
      document.getElementById("profile-name").textContent   = newName;
      document.getElementById("detail-name").textContent    = newName;

      showAlert("Nombre actualizado correctamente.", "success");
    } catch (err) {
      showAlert("Error al actualizar el nombre: " + err.message, "danger");
    }

    btn.disabled  = false;
    btn.innerHTML = '<i class="bi bi-floppy me-1"></i>Guardar cambios';
  });

  input.addEventListener("input", () => input.classList.remove("is-invalid"));
}

// ── Utilidades de fecha ─────────────────────────────────────────────────────
function fmtDate(d) {
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
}

function fmtDateTime(d) {
  return d.toLocaleDateString("es-MX", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
