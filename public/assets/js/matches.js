import { applyAdminVisibility, logout, preventBackAccess, requireAuth, showUserInNavbar, userIsAdmin } from "./auth.js";
import { createDocument, getDocuments, updateDocument } from "./firestore.js";
import { validateRequired, validateDate, validateNonNegativeInteger } from "./validators.js";
import { showAlert, showEmptyState } from "./ui.js";

// Estado global
let allMatches     = [];
let allTournaments = [];
let allTeams       = [];
let selectedResultMatchId = null;
let editMatchId = null;
let isAdmin = false;

const modal = new bootstrap.Modal(document.getElementById("modal-match"));
const resultModal = new bootstrap.Modal(document.getElementById("modal-result"));

// Labels de estado 
const STATUS_LABELS = {
  scheduled: { label: "Programado", cls: "badge-upcoming" },
  played:    { label: "Jugado",     cls: "badge-active"   },
  cancelled: { label: "Cancelado",  cls: "badge-danger"   },
};

// Init 
preventBackAccess();
requireAuth().then(async (user) => {
  isAdmin = await userIsAdmin(user);
  applyAdminVisibility(isAdmin);
  showUserInNavbar(user);
  document.getElementById("btn-logout").addEventListener("click", logout);
  init();
});

async function init() {
  await loadAll();
  bindFilterEvents();
}

// Carga inicial (torneos + equipos + partidos en paralelo) 
async function loadAll() {
  showLoader();

  const [tRes, eqRes, mRes] = await Promise.all([
    getDocuments("tournaments"),
    getDocuments("teams"),
    getDocuments("matches"),
  ]);

  if (!tRes.success || !eqRes.success || !mRes.success) {
    showAlert("Error al cargar los datos.", "danger");
    hideLoader();
    return;
  }

  allTournaments = tRes.data;
  allTeams       = eqRes.data.filter((t) => t.active !== false);
  allMatches     = mRes.data.sort((a, b) =>
    (a.matchDate || "").localeCompare(b.matchDate || "")
  );

  populateSelects();
  renderMetrics();
  applyFilters();
}

function populateSelects() {
  const filterTournament = document.getElementById("filter-tournament");
  allTournaments.forEach((t) => {
    const opt = document.createElement("option");
    opt.value       = t.id;
    opt.textContent = t.name;
    filterTournament.appendChild(opt);
  });

  const mTournament = document.getElementById("m-tournament");
  allTournaments.forEach((t) => {
    const opt = document.createElement("option");
    opt.value       = t.id;
    opt.textContent = `${t.name} (${t.sport})`;
    mTournament.appendChild(opt);
  });

  const teamOptions = allTeams
    .map((t) => `<option value="${t.id}">${escHtml(t.name)}</option>`)
    .join("");
  document.getElementById("m-home").innerHTML +=  teamOptions;
  document.getElementById("m-away").innerHTML +=  teamOptions;

  const standingsSel = document.getElementById("standings-tournament");
  if (standingsSel) {
    standingsSel.innerHTML = '<option value="">— Selecciona un torneo —</option>';
    allTournaments.forEach((t) => {
      const opt = document.createElement("option");
      opt.value       = t.id;
      opt.textContent = t.name;
      standingsSel.appendChild(opt);
    });
  }
}

// Métricas 
function renderMetrics() {
  const row = document.getElementById("metrics-row");
  if (!row) return;

  const total     = allMatches.length;
  const scheduled = allMatches.filter((m) => m.status === "scheduled").length;
  const played    = allMatches.filter((m) => m.status === "played").length;
  const cancelled = allMatches.filter((m) => m.status === "cancelled").length;

  row.innerHTML = `
    <div class="col-6 col-md-3">
      <div class="metric-card">
        <div class="d-flex justify-content-between align-items-start">
          <div><div class="metric-value">${total}</div><div class="metric-label">Total partidos</div></div>
          <i class="bi bi-calendar3 metric-icon"></i>
        </div>
      </div>
    </div>
    <div class="col-6 col-md-3">
      <div class="metric-card mc-info">
        <div class="d-flex justify-content-between align-items-start">
          <div><div class="metric-value">${scheduled}</div><div class="metric-label">Programados</div></div>
          <i class="bi bi-clock metric-icon"></i>
        </div>
      </div>
    </div>
    <div class="col-6 col-md-3">
      <div class="metric-card mc-success">
        <div class="d-flex justify-content-between align-items-start">
          <div><div class="metric-value">${played}</div><div class="metric-label">Jugados</div></div>
          <i class="bi bi-check-circle-fill metric-icon"></i>
        </div>
      </div>
    </div>
    <div class="col-6 col-md-3">
      <div class="metric-card mc-muted">
        <div class="d-flex justify-content-between align-items-start">
          <div><div class="metric-value">${cancelled}</div><div class="metric-label">Cancelados</div></div>
          <i class="bi bi-x-circle metric-icon"></i>
        </div>
      </div>
    </div>
  `;
}

// Filtros
function bindFilterEvents() {
  document.getElementById("filter-tournament").addEventListener("change", applyFilters);
  document.getElementById("filter-status").addEventListener("change", applyFilters);
  document.getElementById("btn-clear-filters").addEventListener("click", () => {
    document.getElementById("filter-tournament").value = "";
    document.getElementById("filter-status").value     = "";
    applyFilters();
  });

  const standingsSel = document.getElementById("standings-tournament");
  if (standingsSel) {
    standingsSel.addEventListener("change", () => renderStandings(standingsSel.value));
  }
}

function applyFilters() {
  const tournamentId = document.getElementById("filter-tournament").value;
  const status       = document.getElementById("filter-status").value;

  const filtered = allMatches.filter((m) => {
    const matchTournament = !tournamentId || m.tournamentId === tournamentId;
    const matchStatus     = !status       || m.status        === status;
    return matchTournament && matchStatus;
  });

  renderTable(filtered);
}

// Render tabla 
function renderTable(matches) {
  const container = document.getElementById("table-container");

  if (matches.length === 0) {
    const message = allMatches.length === 0
      ? "No hay partidos registrados. ¡Programa el primero!"
      : "No se encontraron partidos con ese criterio.";

    container.innerHTML = "";
    showEmptyState(container, message);

    // Botón de acción en empty state cuando no hay ningún partido
    if (allMatches.length === 0) {
      const btnWrap = document.createElement("div");
      btnWrap.className = "mt-2";
      btnWrap.innerHTML = `<button class="btn btn-primary btn-sm" id="btn-empty-new">
        <i class="bi bi-plus-circle me-1"></i>Programar primer partido
      </button>`;
      container.appendChild(btnWrap);
      document.getElementById("btn-empty-new")?.addEventListener("click", () => {
        resetModal();
        modal.show();
      });
    }
    return;
  }

  // Resolver nombres desde los mapas en memoria
  const tournamentMap = {};
  const teamMap       = {};
  allTournaments.forEach((t)  => { tournamentMap[t.id] = t.name; });
  allTeams.forEach((t)        => { teamMap[t.id]       = t.name; });

  const rows = matches.map((m, i) => {
    const st       = STATUS_LABELS[m.status] ?? STATUS_LABELS.scheduled;
    const tName    = escHtml(tournamentMap[m.tournamentId] ?? "—");
    const homeName = escHtml(teamMap[m.homeTeamId] ?? "—");
    const awayName = escHtml(teamMap[m.awayTeamId] ?? "—");
    const score    = m.status === "played"
      ? `<span class="fw-bold">${m.homeScore ?? 0} – ${m.awayScore ?? 0}</span>`
      : `<span class="text-muted">vs</span>`;
    const location = escHtml(m.location || "—");
    const date     = formatDate(m.matchDate);
    const time     = m.matchTime ?? "—";

    return `<tr>
      <td class="text-muted small">${i + 1}</td>
      <td>
        <span class="badge badge-upcoming">${tName}</span>
      </td>
      <td>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <span class="fw-semibold">${homeName}</span>
          ${score}
          <span class="fw-semibold">${awayName}</span>
        </div>
      </td>
      <td class="text-nowrap">${date}</td>
      <td class="text-nowrap">${time}</td>
      <td class="text-muted small">${location}</td>
      <td><span class="badge ${st.cls}">${st.label}</span></td>
      <td>
        ${isAdmin && m.status === "scheduled"
          ? `<div class="d-flex gap-1 flex-wrap">
              <button class="btn btn-outline-primary btn-sm" data-action="edit" data-id="${m.id}" title="Editar partido">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-outline-success btn-sm" data-action="result" data-id="${m.id}" title="Registrar resultado">
                <i class="bi bi-clipboard-check"></i>
              </button>
              <button class="btn btn-outline-danger btn-sm" data-action="cancel" data-id="${m.id}" title="Cancelar partido">
                <i class="bi bi-x-circle"></i>
              </button>
            </div>`
          : `<span class="text-muted small">—</span>`}
      </td>
    </tr>`;
  }).join("");

  container.innerHTML = `
    <div class="table-wrapper">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Torneo</th>
            <th>Partido</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Sede</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  container.querySelectorAll("[data-action='result']").forEach((btn) => {
    btn.addEventListener("click", () => openResultModal(btn.dataset.id));
  });
  container.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.id));
  });
  container.querySelectorAll("[data-action='cancel']").forEach((btn) => {
    btn.addEventListener("click", () => cancelMatch(btn.dataset.id));
  });
}

// Guardar nuevo partido
document.getElementById("btn-new-match").addEventListener("click", () => {
  if (!ensureAdmin()) return;

  resetModal();
  modal.show();
});

document.getElementById("btn-save-match").addEventListener("click", async () => {
  if (!ensureAdmin()) return;

  const tournamentId = document.getElementById("m-tournament").value;
  const homeTeamId   = document.getElementById("m-home").value;
  const awayTeamId   = document.getElementById("m-away").value;
  const matchDate    = document.getElementById("m-date").value;
  const matchTime    = document.getElementById("m-time").value;
  const location     = document.getElementById("m-location").value.trim();

  // Limpiar errores previos
  clearFieldErrors(["m-tournament", "m-home", "m-away", "m-date", "m-time"]);

  let hasError = false;

  // Validaciones de campos requeridos
  const fieldChecks = [
    { id: "m-tournament", result: validateRequired(tournamentId) },
    { id: "m-home",       result: validateRequired(homeTeamId)   },
    { id: "m-away",       result: validateRequired(awayTeamId)   },
    { id: "m-date",       result: validateDate(matchDate)        },
    { id: "m-time",       result: validateRequired(matchTime)    },
  ];

  fieldChecks.forEach(({ id, result }) => {
    if (!result.valid) {
      setFieldError(id, result.message);
      hasError = true;
    }
  });

  // Validar que local ≠ visitante
  if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
    setFieldError("m-away", "El equipo visitante debe ser diferente al local.");
    hasError = true;
  }

  if (hasError) return;

  const btn = document.getElementById("btn-save-match");
  btn.disabled    = true;
  btn.textContent = "Guardando…";

  const matchData = {
    tournamentId,
    homeTeamId,
    awayTeamId,
    matchDate,
    matchTime,
    location: location || null,
  };

  let result;
  if (editMatchId) {
    result = await updateDocument("matches", editMatchId, matchData);
  } else {
    result = await createDocument("matches", {
      ...matchData,
      status:    "scheduled",
      homeScore: null,
      awayScore: null,
    });
  }

  btn.disabled  = false;
  btn.innerHTML = '<i class="bi bi-floppy me-1"></i>Programar partido';

  if (!result.success) {
    showAlert("Error al guardar el partido: " + result.message, "danger");
    return;
  }

  showAlert(editMatchId ? "Partido actualizado correctamente." : "Partido programado correctamente.", "success");
  editMatchId = null;
  modal.hide();
  await loadAll();
});

document.getElementById("btn-save-result").addEventListener("click", saveMatchResult);

// Reset modal 
document.getElementById("modal-match").addEventListener("hidden.bs.modal", resetModal);

function resetModal() {
  document.getElementById("match-form").reset();
  clearFieldErrors(["m-tournament", "m-home", "m-away", "m-date", "m-time"]);
  editMatchId = null;
  document.getElementById("modal-match-label").innerHTML =
    '<i class="bi bi-calendar-plus me-2 text-primary"></i>Nuevo partido';
  document.getElementById("btn-save-match").innerHTML =
    '<i class="bi bi-floppy me-1"></i>Programar partido';
}

function openEditModal(matchId) {
  if (!ensureAdmin()) return;

  const match = allMatches.find((m) => m.id === matchId);
  if (!match) return;

  editMatchId = matchId;
  resetModal();
  editMatchId = matchId;

  document.getElementById("modal-match-label").innerHTML =
    '<i class="bi bi-pencil me-2 text-primary"></i>Editar partido';
  document.getElementById("btn-save-match").innerHTML =
    '<i class="bi bi-floppy me-1"></i>Guardar cambios';

  document.getElementById("m-tournament").value = match.tournamentId ?? "";
  document.getElementById("m-home").value        = match.homeTeamId   ?? "";
  document.getElementById("m-away").value        = match.awayTeamId   ?? "";
  document.getElementById("m-date").value        = match.matchDate    ?? "";
  document.getElementById("m-time").value        = match.matchTime    ?? "";
  document.getElementById("m-location").value   = match.location     ?? "";

  modal.show();
}

async function cancelMatch(matchId) {
  if (!ensureAdmin()) return;

  if (!confirm("¿Cancelar este partido? Esta acción cambiará su estado a 'Cancelado'.")) return;

  const result = await updateDocument("matches", matchId, { status: "cancelled" });

  if (!result.success) {
    showAlert("Error al cancelar el partido: " + result.message, "danger");
    return;
  }

  showAlert("Partido cancelado correctamente.", "success");
  await loadAll();
}

function openResultModal(matchId) {
  if (!ensureAdmin()) return;

  const match = allMatches.find((m) => m.id === matchId);
  if (!match) return;

  selectedResultMatchId = matchId;
  clearFieldErrors(["result-home", "result-away"]);

  const teamMap = {};
  allTeams.forEach((t) => { teamMap[t.id] = t.name; });

  document.getElementById("result-match-summary").textContent =
    `${teamMap[match.homeTeamId] ?? "Local"} vs ${teamMap[match.awayTeamId] ?? "Visitante"}`;
  document.getElementById("result-home").value = match.homeScore ?? "";
  document.getElementById("result-away").value = match.awayScore ?? "";
  resultModal.show();
}

async function saveMatchResult() {
  if (!ensureAdmin()) return;

  if (!selectedResultMatchId) return;

  const homeScore = document.getElementById("result-home").value;
  const awayScore = document.getElementById("result-away").value;
  clearFieldErrors(["result-home", "result-away"]);

  const checks = [
    { id: "result-home", result: validateNonNegativeInteger(homeScore) },
    { id: "result-away", result: validateNonNegativeInteger(awayScore) },
  ];

  let hasError = false;
  checks.forEach(({ id, result }) => {
    if (!result.valid) {
      setFieldError(id, result.message);
      hasError = true;
    }
  });

  if (hasError) return;

  const btn = document.getElementById("btn-save-result");
  btn.disabled = true;
  btn.textContent = "Guardando...";

  const result = await updateDocument("matches", selectedResultMatchId, {
    homeScore: Number(homeScore),
    awayScore: Number(awayScore),
    status: "played",
  });

  btn.disabled = false;
  btn.innerHTML = '<i class="bi bi-floppy me-1"></i>Guardar resultado';

  if (!result.success) {
    showAlert("Error al guardar el resultado: " + result.message, "danger");
    return;
  }

  showAlert("Resultado registrado correctamente.", "success");
  resultModal.hide();
  selectedResultMatchId = null;
  await loadAll();
}

function ensureAdmin() {
  if (isAdmin) return true;
  showAlert("Solo un usuario administrador puede modificar partidos.", "warning");
  return false;
}

// Loader
function showLoader() {
  document.getElementById("table-container").innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="text-muted small mt-2 mb-0">Cargando partidos...</p>
    </div>`;
}

function hideLoader() {
  const el = document.getElementById("table-loader");
  if (el) el.remove();
}

// Utilidades de formulario
function setFieldError(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (el) el.classList.add("is-invalid");
  const errEl = document.getElementById("err-" + fieldId);
  if (errEl && message) errEl.textContent = message;
}

function clearFieldErrors(fieldIds) {
  fieldIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("is-invalid");
  });
}

// Tabla de posiciones
function renderStandings(tournamentId) {
  const container = document.getElementById("standings-container");
  if (!container) return;

  if (!tournamentId) {
    container.innerHTML = `<div class="text-center py-4 text-muted small">Selecciona un torneo para ver la tabla de posiciones.</div>`;
    return;
  }

  const tournamentMatches = allMatches.filter(
    (m) => m.tournamentId === tournamentId && m.status === "played"
  );

  const teamIds = new Set();
  tournamentMatches.forEach((m) => { teamIds.add(m.homeTeamId); teamIds.add(m.awayTeamId); });

  if (teamIds.size === 0) {
    container.innerHTML = `<div class="text-center py-4 text-muted small">No hay partidos jugados en este torneo aún.</div>`;
    return;
  }

  const teamMap = {};
  allTeams.forEach((t) => { teamMap[t.id] = t.name; });

  const stats = {};
  teamIds.forEach((id) => {
    stats[id] = { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
  });

  tournamentMatches.forEach((m) => {
    const h  = m.homeTeamId;
    const a  = m.awayTeamId;
    const hs = Number(m.homeScore);
    const as_ = Number(m.awayScore);
    if (!stats[h] || !stats[a]) return;

    stats[h].pj++; stats[a].pj++;
    stats[h].gf += hs; stats[h].gc += as_;
    stats[a].gf += as_; stats[a].gc += hs;

    if (hs > as_) {
      stats[h].pg++; stats[h].pts += 3; stats[a].pp++;
    } else if (hs < as_) {
      stats[a].pg++; stats[a].pts += 3; stats[h].pp++;
    } else {
      stats[h].pe++; stats[h].pts += 1;
      stats[a].pe++; stats[a].pts += 1;
    }
  });

  const rows = Object.entries(stats)
    .sort(([, a], [, b]) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      return (b.gf - b.gc) - (a.gf - a.gc);
    })
    .map(([id, s], i) => `
      <tr>
        <td class="text-muted small">${i + 1}</td>
        <td class="fw-semibold">${escHtml(teamMap[id] ?? id)}</td>
        <td class="text-center">${s.pj}</td>
        <td class="text-center">${s.pg}</td>
        <td class="text-center">${s.pe}</td>
        <td class="text-center">${s.pp}</td>
        <td class="text-center">${s.gf}</td>
        <td class="text-center">${s.gc}</td>
        <td class="text-center">${s.gf - s.gc}</td>
        <td class="text-center fw-bold text-primary">${s.pts}</td>
      </tr>`)
    .join("");

  container.innerHTML = `
    <div class="table-wrapper">
      <table class="table table-hover align-middle mb-0 text-sm">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Equipo</th>
            <th class="text-center">PJ</th>
            <th class="text-center">PG</th>
            <th class="text-center">PE</th>
            <th class="text-center">PP</th>
            <th class="text-center">GF</th>
            <th class="text-center">GC</th>
            <th class="text-center">DG</th>
            <th class="text-center">PTS</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// Formatters
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
