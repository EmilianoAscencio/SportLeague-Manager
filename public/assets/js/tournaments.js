import { logout, preventBackAccess, requireAuth, showUserInNavbar } from "./auth.js";
import { createDocument, getDocuments, updateDocument, checkDuplicate } from "./firestore.js";
import { validateRequired, validateDate } from "./validators.js";
import { showAlert, showEmptyState } from "./ui.js";

let allTournaments = [];
let editingId = null;

const modal = new bootstrap.Modal(document.getElementById("modal-tournament"));

preventBackAccess();
requireAuth().then((user) => {
  showUserInNavbar(user);
  document.getElementById("btn-logout").addEventListener("click", logout);
  loadTournaments();
});

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
      <td>${t.name}</td>
      <td>${t.sport}</td>
      <td>${formatDate(t.startDate)}</td>
      <td>${formatDate(t.endDate)}</td>
      <td><span class="badge ${st.cls}">${st.label}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary" data-edit="${t.id}">
          <i class="bi bi-pencil"></i>
        </button>
      </td>
    </tr>`;
  }).join("");
}

// Editar
document.getElementById("tournaments-tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-edit]");
  if (!btn) return;
  const tournament = allTournaments.find((t) => t.id === btn.dataset.edit);
  if (!tournament) return;
  openEditModal(tournament);
});

function openEditModal(tournament) {
  editingId = tournament.id;
  document.querySelector("#modal-tournament .modal-title").textContent = "Editar torneo";
  document.getElementById("t-name").value        = tournament.name;
  document.getElementById("t-sport").value       = tournament.sport;
  document.getElementById("t-start").value       = tournament.startDate;
  document.getElementById("t-end").value         = tournament.endDate;
  document.getElementById("t-description").value = tournament.description ?? "";
  modal.show();
}

// Guardar (crear o editar)
document.getElementById("btn-save").addEventListener("click", async () => {
  const name        = document.getElementById("t-name").value.trim();
  const sport       = document.getElementById("t-sport").value;
  const startDate   = document.getElementById("t-start").value;
  const endDate     = document.getElementById("t-end").value;
  const description = document.getElementById("t-description").value.trim();

  // Validaciones de campo
  const checks = [
    { id: "t-name",  result: validateRequired(name) },
    { id: "t-sport", result: validateRequired(sport) },
    { id: "t-start", result: validateDate(startDate) },
    { id: "t-end",   result: validateDate(endDate) },
  ];

  let isValid = true;
  checks.forEach(({ id, result }) => {
    document.getElementById(id).classList.toggle("is-invalid", !result.valid);
    if (!result.valid) isValid = false;
  });

  // Validar que fecha fin > fecha inicio
  if (isValid && new Date(endDate) <= new Date(startDate)) {
    const endEl = document.getElementById("t-end");
    endEl.classList.add("is-invalid");
    document.getElementById("t-end-feedback").textContent = "La fecha fin debe ser posterior a la fecha inicio.";
    isValid = false;
  }

  if (!isValid) return;

  const btn = document.getElementById("btn-save");
  btn.disabled = true;

  // Validar nombre único 
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

  const data = { name, nameLower: name.toLowerCase(), sport, startDate, endDate, description };

  const result = editingId
    ? await updateDocument("tournaments", editingId, data)
    : await createDocument("tournaments", { ...data, status: "upcoming" });

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

// Limpiar al cerrar modal
document.getElementById("modal-tournament").addEventListener("hidden.bs.modal", resetModal);

function resetModal() {
  editingId = null;
  document.getElementById("tournament-form").reset();
  document.querySelector("#modal-tournament .modal-title").textContent = "Nuevo torneo";
  document.getElementById("t-end-feedback").textContent = "Ingresa la fecha de fin.";
  document.querySelectorAll("#tournament-form .is-invalid").forEach((el) => el.classList.remove("is-invalid"));
}
