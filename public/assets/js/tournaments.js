import { logout, preventBackAccess, requireAuth, showUserInNavbar } from "./auth.js";
import { createDocument, getDocuments, updateDocument, deleteDocument, checkDuplicate } from "./firestore.js";
import { validateRequired, validateDate, validateDateChronology, validateReasonableYear } from "./validators.js";
import { showAlert, showEmptyState, showConfirmModal } from "./ui.js";

let allTournaments = [];
let editingId      = null;

const modal       = new bootstrap.Modal(document.getElementById("modal-tournament"));
const modalDetail = new bootstrap.Modal(document.getElementById("modal-detail-tournament"));

preventBackAccess();
requireAuth().then((user) => {
  showUserInNavbar(user);
  document.getElementById("btn-logout").addEventListener("click", logout);
  loadTournaments();
});

// Cargar torneos
document.getElementById("btn-new").addEventListener("click", () => {
  resetModal();
  modal.show();
});

async function loadTournaments() {
  const result = await getDocuments("tournaments");
  if (!result.success) {
    showAlert("Error al cargar torneos.", "danger");
    return;
  }
  allTournaments = result.data;
  renderMetrics(allTournaments);
  renderTournaments(allTournaments);
}

// Métricas 
function renderMetrics(tournaments) {
  const row = document.getElementById("metrics-row");
  if (!row) return;

  const total    = tournaments.length;
  const upcoming = tournaments.filter((t) => t.status === "upcoming").length;
  const active   = tournaments.filter((t) => t.status === "active").length;
  const finished = tournaments.filter((t) => t.status === "finished").length;

  row.innerHTML = `
    <div class="col-6 col-md-3">
      <div class="metric-card">
        <div class="d-flex justify-content-between align-items-start">
          <div><div class="metric-value">${total}</div><div class="metric-label">Total torneos</div></div>
          <i class="bi bi-trophy-fill metric-icon"></i>
        </div>
      </div>
    </div>
    <div class="col-6 col-md-3">
      <div class="metric-card">
        <div class="d-flex justify-content-between align-items-start">
          <div><div class="metric-value">${upcoming}</div><div class="metric-label">Próximos</div></div>
          <i class="bi bi-calendar-event metric-icon"></i>
        </div>
      </div>
    </div>
    <div class="col-6 col-md-3">
      <div class="metric-card mc-success">
        <div class="d-flex justify-content-between align-items-start">
          <div><div class="metric-value">${active}</div><div class="metric-label">En curso</div></div>
          <i class="bi bi-play-circle-fill metric-icon"></i>
        </div>
      </div>
    </div>
    <div class="col-6 col-md-3">
      <div class="metric-card mc-muted">
        <div class="d-flex justify-content-between align-items-start">
          <div><div class="metric-value">${finished}</div><div class="metric-label">Finalizados</div></div>
          <i class="bi bi-flag-fill metric-icon"></i>
        </div>
      </div>
    </div>
  `;
}

// Status labels
const STATUS_LABELS = {
  upcoming:  { label: "Próximo",    cls: "badge-upcoming" },
  active:    { label: "En curso",   cls: "badge-active"   },
  finished:  { label: "Finalizado", cls: "badge-finished" },
  cancelled: { label: "Cancelado",  cls: "badge-danger"   },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// Render tabla 
function renderTournaments(tournaments) {
  const tbody = document.getElementById("tournaments-tbody");
  const empty = document.getElementById("tournaments-empty");

  if (tournaments.length === 0) {
    tbody.innerHTML = "";
    showEmptyState(empty, "No hay torneos registrados.");
    return;
  }

  empty.innerHTML = "";
  tbody.innerHTML = tournaments.map((t, i) => {
    const st = STATUS_LABELS[t.status] ?? STATUS_LABELS.upcoming;
    return `<tr>
      <td>${i + 1}</td>
      <td class="fw-semibold">${escHtml(t.name)}</td>
      <td>${escHtml(t.sport)}</td>
      <td>${formatDate(t.startDate)}</td>
      <td>${formatDate(t.endDate)}</td>
      <td><span class="badge ${st.cls}">${st.label}</span></td>
      <td>
        <div class="d-flex gap-1 flex-wrap">
          <button class="btn btn-sm btn-outline-secondary" data-view="${t.id}" title="Ver detalle">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-primary" data-edit="${t.id}" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" data-del="${t.id}" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join("");

}

// Delegación persistente
document.getElementById("tournaments-tbody").addEventListener("click", (e) => {
  const viewBtn = e.target.closest("[data-view]");
  const editBtn = e.target.closest("[data-edit]");
  const delBtn  = e.target.closest("[data-del]");

  if (viewBtn) openDetailModal(viewBtn.dataset.view);
  if (editBtn) {
    const t = allTournaments.find((t) => t.id === editBtn.dataset.edit);
    if (t) openEditModal(t);
  }
  if (delBtn) deleteTournament(delBtn.dataset.del);
});

// Eliminar torneo
function deleteTournament(id) {
  const t = allTournaments.find((t) => t.id === id);
  const name = t ? escHtml(t.name) : "este torneo";

  showConfirmModal(
    `⚠️ Esta acción es irreversible. ¿Deseas eliminar el torneo "<strong>${name}</strong>" de la base de datos?`,
    async () => {
      const result = await deleteDocument("tournaments", id);
      if (result.success) {
        showAlert("Torneo eliminado permanentemente.", "success");
        loadTournaments();
      } else {
        showAlert("Error al eliminar el torneo: " + result.message, "danger");
      }
    }
  );
}

// Modal de detalle
async function openDetailModal(id) {
  const t = allTournaments.find((t) => t.id === id);
  if (!t) return;

  const body = document.getElementById("modal-detail-body");
  const st   = STATUS_LABELS[t.status] ?? STATUS_LABELS.upcoming;

  // Render info básica
  body.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-12">
        <h5 class="fw-bold mb-1">${escHtml(t.name)}</h5>
        <span class="badge ${st.cls}">${st.label}</span>
      </div>
      <div class="col-6 col-md-3">
        <div class="detail-item p-2 rounded" style="background:rgba(255,255,255,.04);border:1px solid var(--border);">
          <div class="text-muted small mb-1">Deporte</div>
          <div class="fw-semibold small">${escHtml(t.sport)}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="detail-item p-2 rounded" style="background:rgba(255,255,255,.04);border:1px solid var(--border);">
          <div class="text-muted small mb-1">Fecha inicio</div>
          <div class="fw-semibold small">${formatDate(t.startDate)}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="detail-item p-2 rounded" style="background:rgba(255,255,255,.04);border:1px solid var(--border);">
          <div class="text-muted small mb-1">Fecha fin</div>
          <div class="fw-semibold small">${formatDate(t.endDate)}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="detail-item p-2 rounded" style="background:rgba(255,255,255,.04);border:1px solid var(--border);">
          <div class="text-muted small mb-1">Estado</div>
          <div class="fw-semibold small"><span class="badge ${st.cls}">${st.label}</span></div>
        </div>
      </div>
      ${t.description ? `
      <div class="col-12">
        <div class="p-2 rounded" style="background:rgba(255,255,255,.04);border:1px solid var(--border);">
          <div class="text-muted small mb-1">Descripción</div>
          <div class="small">${escHtml(t.description)}</div>
        </div>
      </div>` : ''}
    </div>

    <hr style="border-color:var(--border);" />

    <h6 class="fw-semibold mb-3">
      <i class="bi bi-calendar3 me-2 text-primary"></i>Partidos asociados
    </h6>
    <div id="detail-matches-container">
      <div class="text-center py-3">
        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
        <p class="text-muted small mt-2 mb-0">Cargando partidos…</p>
      </div>
    </div>
  `;

  modalDetail.show();

  // Cargar partidos de este torneo
  const matchesResult = await getDocuments("matches");
  const container = document.getElementById("detail-matches-container");
  if (!container) return;

  if (!matchesResult.success) {
    container.innerHTML = `<p class="text-muted small">No se pudieron cargar los partidos.</p>`;
    return;
  }

  // Cargar equipos para resolver nombres
  const teamsResult = await getDocuments("teams");
  const teamsMap = {};
  if (teamsResult.success) {
    teamsResult.data.forEach((tm) => { teamsMap[tm.id] = tm.name; });
  }

  const matches = matchesResult.data.filter((m) => m.tournamentId === id);

  if (matches.length === 0) {
    container.innerHTML = `
      <div class="text-center py-3 text-muted">
        <i class="bi bi-calendar-x fs-4 d-block mb-1"></i>
        <small>No hay partidos registrados para este torneo.</small>
      </div>`;
    return;
  }

  const MATCH_STATUS = {
    scheduled: { label: "Programado", cls: "badge-upcoming" },
    played:    { label: "Jugado",     cls: "badge-active"   },
    cancelled: { label: "Cancelado",  cls: "badge-danger"   },
  };

  const rows = matches
    .sort((a, b) => (a.matchDate || "").localeCompare(b.matchDate || ""))
    .map((m) => {
      const mst   = MATCH_STATUS[m.status] ?? MATCH_STATUS.scheduled;
      const home  = escHtml(teamsMap[m.homeTeamId] ?? "—");
      const away  = escHtml(teamsMap[m.awayTeamId] ?? "—");
      const score = m.status === "played"
        ? `<strong>${m.homeScore ?? 0} – ${m.awayScore ?? 0}</strong>`
        : `—`;
      return `<tr>
        <td>${home} <span class="text-muted">vs</span> ${away}</td>
        <td>${formatDate(m.matchDate)}</td>
        <td>${m.matchTime ?? "—"}</td>
        <td>${score}</td>
        <td><span class="badge ${mst.cls}">${mst.label}</span></td>
      </tr>`;
    }).join("");

  container.innerHTML = `
    <div class="table-wrapper">
      <table class="table table-sm align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th>Partido</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Resultado</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// Editar torneo (incluye estado)
function openEditModal(tournament) {
  editingId = tournament.id;
  document.getElementById("modal-tournament-title").textContent = "Editar torneo";
  document.getElementById("t-name").value        = tournament.name;
  document.getElementById("t-sport").value       = tournament.sport;
  document.getElementById("t-start").value       = tournament.startDate;
  document.getElementById("t-end").value         = tournament.endDate;
  document.getElementById("t-description").value = tournament.description ?? "";

  // Mostrar y preseleccionar estado
  const statusWrap = document.getElementById("t-status-wrap");
  statusWrap.classList.remove("d-none");
  document.getElementById("t-status").value = tournament.status ?? "upcoming";

  modal.show();
}

// Guardar (crear o editar)
document.getElementById("btn-save").addEventListener("click", async () => {
  const name        = document.getElementById("t-name").value.trim();
  const sport       = document.getElementById("t-sport").value;
  const startDate   = document.getElementById("t-start").value;
  const endDate     = document.getElementById("t-end").value;
  const description = document.getElementById("t-description").value.trim();
  const status      = document.getElementById("t-status").value || "upcoming";

  const checks = [
    { id: "t-name",  result: validateRequired(name) },
    { id: "t-sport", result: validateRequired(sport) },
    { id: "t-start", result: validateDate(startDate) },
    { id: "t-end",   result: validateDate(endDate) },
  ];

  if (checks[2].result.valid) checks[2].result = validateReasonableYear(startDate);
  if (checks[3].result.valid) checks[3].result = validateReasonableYear(endDate);

  let isValid = true;
  checks.forEach(({ id, result }) => {
    document.getElementById(id).classList.toggle("is-invalid", !result.valid);
    if (!result.valid) {
      isValid = false;
      // Actualizar texto del feedback si el elemento tiene id dinámico (ej: t-start-feedback)
      const feedbackEl = document.getElementById(id + "-feedback");
      if (feedbackEl && result.message) feedbackEl.textContent = result.message;
    }
  });

  // Validación de cronología: Fecha Fin debe ser >= Fecha Inicio (HU-35)
  if (isValid) {
    const chronologyCheck = validateDateChronology(startDate, endDate);
    if (!chronologyCheck.valid) {
      document.getElementById("t-end").classList.add("is-invalid");
      document.getElementById("t-end-feedback").textContent = chronologyCheck.message;
      isValid = false;
    }
  }

  if (!isValid) return;

  const btn = document.getElementById("btn-save");
  btn.disabled = true;

  const dupResult = await checkDuplicate("tournaments", "nameLower", name.toLowerCase(), editingId);
  if (!dupResult.success) {
    showAlert("Error al verificar duplicados.", "danger");
    btn.disabled = false;
    return;
  }
  if (dupResult.isDuplicate) {
    document.getElementById("t-name").classList.add("is-invalid");
    btn.disabled = false;
    showAlert("Ya existe un torneo con ese nombre.", "warning");
    return;
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  let finalStatus = status;

  if (!editingId) {
    if (endDate < todayStr) {
      finalStatus = "finished"; // El torneo ya terminó en el pasado
    } else if (startDate <= todayStr && endDate >= todayStr) {
      finalStatus = "active";   // El torneo empezó hoy o antes, y termina hoy o después
    } else {
      finalStatus = "upcoming"; // El torneo empieza en el futuro
    }
  }

  const data = {
    name,
    nameLower: name.toLowerCase(),
    sport,
    startDate,
    endDate,
    description,
    status: finalStatus,
  };

  const result = editingId
    ? await updateDocument("tournaments", editingId, data)
    : await createDocument("tournaments", data);

  if (!result.success) {
    showAlert("Error al guardar el torneo.", "danger");
    btn.disabled = false;
    return;
  }

  showAlert(
    editingId ? "Torneo actualizado correctamente." : "Torneo registrado correctamente.",
    "success"
  );
  modal.hide();
  await loadTournaments();
  btn.disabled = false;
});

// Reset modal
document.getElementById("modal-tournament").addEventListener("hidden.bs.modal", resetModal);

function resetModal() {
  editingId = null;
  document.getElementById("tournament-form").reset();
  document.getElementById("modal-tournament-title").textContent = "Nuevo torneo";
  document.getElementById("t-start-feedback").textContent = "Ingresa la fecha de inicio.";
  document.getElementById("t-end-feedback").textContent   = "Ingresa la fecha de fin.";
  // Ocultar campo estado en modo crear
  document.getElementById("t-status-wrap").classList.add("d-none");
  document.getElementById("t-status").value = "upcoming";
  document.querySelectorAll("#tournament-form .is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));
}

// Utilidad
function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
