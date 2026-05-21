import { logout, preventBackAccess, requireAuth, showUserInNavbar } from "./auth.js";
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  checkDuplicate,
  toggleActive,
  deleteDocument
} from "./firestore.js";
import { showAlert, showLoader, hideLoader, showEmptyState, showConfirmModal } from "./ui.js";
import { validateRequired, validateMinLength } from "./validators.js";

let allTeams = [];

const modalCreate = new bootstrap.Modal(document.getElementById("modal-create"));
const modalDetail = new bootstrap.Modal(document.getElementById("modal-detail"));
const modalEdit   = new bootstrap.Modal(document.getElementById("modal-edit"));

preventBackAccess();

requireAuth().then((user) => {
  showUserInNavbar(user);
  document.getElementById("btn-logout").addEventListener("click", logout);
  loadTeams();
  bindEvents();
});

async function loadTeams() {
  const container = document.getElementById("table-container");
  container.innerHTML = `
    <div class="text-center py-5" id="table-loader">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando equipos...</span>
      </div>
      <p class="text-muted small mt-2 mb-0">Cargando equipos...</p>
    </div>`;

  const result = await getDocuments("teams");

  if (!result.success) {
    showAlert("Error al cargar equipos: " + result.message, "danger");
    container.innerHTML = "";
    showEmptyState(container, "No se pudieron cargar los equipos.");
    return;
  }

  allTeams = result.data;
  applyFilters();
}

function renderTable(teams) {
  const container = document.getElementById("table-container");

  if (teams.length === 0) {
    
    if (allTeams.length === 0) {
      showEmptyState(container, "No hay equipos registrados. ¡Crea el primero!");
    } 
    else {
      showEmptyState(container, "No se encontraron equipos con ese criterio.");
    }
    
    return;
  }

  const rows = teams.map((t) => {

    const isActive = t.active !== false;
    
    const toggleIcon = isActive ? 'bi-toggle-on' : 'bi-toggle-off';
    const toggleColor = isActive ? 'btn-outline-secondary' : 'btn-outline-success';
    const toggleTitle = isActive ? 'Desactivar equipo' : 'Activar equipo';
    const badgeHtml = isActive 
      ? '<span class="badge badge-active">Activo</span>' 
      : '<span class="badge badge-danger">Inactivo</span>';

    return `
    <tr>
      <td>
        <div class="d-flex align-items-center gap-2">
          ${t.logoUrl
            ? `<img src="${escHtml(t.logoUrl)}" width="32" height="32" class="rounded-circle" style="object-fit:cover;" onerror="this.style.display='none'" />`
            : `<span class="d-inline-flex align-items-center justify-content-center rounded-circle" style="width:32px;height:32px;background:rgba(124,58,237,.15);"><i class="bi bi-shield-fill text-primary small"></i></span>`}
          <span class="fw-semibold">${escHtml(t.name)}</span>
        </div>
      </td>
      <td class="text-muted">${escHtml(t.coach)}</td>
      <td><span class="badge badge-upcoming">${escHtml(t.category)}</span></td>
      <td>${badgeHtml}</td>
      <td>
        <div class="d-flex gap-1 flex-wrap">
          <button class="btn btn-outline-primary btn-sm" data-action="detail" data-id="${t.id}" title="Ver detalle">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-outline-warning btn-sm" data-action="edit" data-id="${t.id}" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn ${toggleColor} btn-sm" data-action="toggle" data-id="${t.id}" data-state="${isActive}" title="${toggleTitle}">
            <i class="bi ${toggleIcon}"></i>
          </button>
          <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${t.id}" title="Eliminar permanentemente">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join("");

  container.innerHTML = `
    <div class="table-wrapper">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th>Equipo</th>
            <th>Entrenador</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  container.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const { action, id, state } = btn.dataset;
      if (action === "detail") openDetail(id);
      if (action === "edit")   openEdit(id);
      if (action === "toggle") toggleTeamStatus(id, state === "true");
      if (action === "delete") deleteTeam(id);
    });
  });
}

function bindEvents() {
  document.getElementById("btn-new-team").addEventListener("click", () => {
    clearCreateForm();
    modalCreate.show();
  });

  document.getElementById("btn-create-save").addEventListener("click", saveNewTeam);
  document.getElementById("btn-edit-save").addEventListener("click", saveEditTeam);

  document.getElementById("search-team").addEventListener("input", applyFilters);
  document.getElementById("filter-category").addEventListener("change", applyFilters);
  document.getElementById("filter-status").addEventListener("change", applyFilters);
}

async function saveNewTeam() {
  const name     = document.getElementById("create-name").value.trim();
  const coach    = document.getElementById("create-coach").value.trim();
  const category = document.getElementById("create-category").value;
  const logo     = document.getElementById("create-logo").value.trim();

  clearFieldErrors(["create-name", "create-coach", "create-category"]);

  let hasError = false;

  const nameCheck = validateMinLength(name, 3);
  if (!nameCheck.valid) { setFieldError("create-name", nameCheck.message); hasError = true; }

  const coachCheck = validateMinLength(coach, 3);
  if (!coachCheck.valid) { setFieldError("create-coach", coachCheck.message); hasError = true; }

  const catCheck = validateRequired(category);
  if (!catCheck.valid) { setFieldError("create-category", "Selecciona una categoría."); hasError = true; }

  if (hasError) return;

  const btn = document.getElementById("btn-create-save");
  showLoader(btn, "Guardando...");

  // Verificar nombre duplicado
  const dupCheck = await checkDuplicate("teams", "name", name);
  if (dupCheck.isDuplicate) {
    setFieldError("create-name", "Ya existe un equipo con ese nombre.");
    hideLoader(btn);
    return;
  }

  const result = await createDocument("teams", {
    name,
    coach,
    category,
    logoUrl: logo || null,
  });

  hideLoader(btn);

  if (result.success) {
    showAlert("Equipo registrado correctamente.", "success");
    modalCreate.hide();
    clearCreateForm();
    loadTeams();
  } else {
    showAlert("Error al guardar: " + result.message, "danger");
  }
}

async function openDetail(id) {
  // Limpiar campos mientras carga
  ["detail-name", "detail-coach", "detail-category", "detail-status", "detail-created", "detail-updated"]
    .forEach((el) => { document.getElementById(el).textContent = "—"; });
  document.getElementById("detail-logo").style.display = "none";
  document.getElementById("detail-logo-placeholder").style.display = "flex";
  document.getElementById("detail-players-container").innerHTML = `
    <div class="text-center py-3">
      <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
    </div>`;

  modalDetail.show();

  const result = await getDocumentById("teams", id);
  if (!result.success) {
    showAlert("Error al cargar el equipo.", "danger");
    modalDetail.hide();
    return;
  }

  const t = result.data;

  document.getElementById("detail-name").textContent     = t.name;
  document.getElementById("detail-coach").textContent    = t.coach;
  document.getElementById("detail-category").textContent = t.category;
  document.getElementById("detail-status").innerHTML     = t.active !== false
    ? '<span class="badge badge-active">Activo</span>'
    : '<span class="badge badge-danger">Inactivo</span>';
  document.getElementById("detail-created").textContent  = formatTimestamp(t.createdAt);
  document.getElementById("detail-updated").textContent  = formatTimestamp(t.updatedAt);

  if (t.logoUrl) {
    const img = document.getElementById("detail-logo");
    img.src = t.logoUrl;
    img.style.display = "block";
    document.getElementById("detail-logo-placeholder").style.display = "none";
  }

  // Cargar jugadores del equipo
  const playersResult = await getDocuments("players");
  const playersContainer = document.getElementById("detail-players-container");

  if (!playersResult.success) {
    playersContainer.innerHTML = `<p class="text-muted small">No se pudieron cargar los jugadores.</p>`;
    return;
  }

  const players = playersResult.data.filter((p) => p.teamId === id && p.active !== false);

  if (players.length === 0) {
    showEmptyState(playersContainer, "Este equipo no tiene jugadores registrados aún.");
    return;
  }

  const rows = players.map((p) => `
    <tr>
      <td class="text-muted" style="width:40px;">#${p.shirtNumber ?? "—"}</td>
      <td>${escHtml(p.fullName)}</td>
      <td><span class="badge badge-upcoming">${escHtml(p.position ?? "—")}</span></td>
      <td class="text-muted small">${escHtml(p.studentNumber ?? "—")}</td>
    </tr>`).join("");

  playersContainer.innerHTML = `
    <div class="table-wrapper">
      <table class="table table-sm align-middle mb-0">
        <thead class="table-light">
          <tr><th>#</th><th>Nombre</th><th>Posición</th><th>Matrícula</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

async function openEdit(id) {
  clearEditErrors();

  const result = await getDocumentById("teams", id);
  if (!result.success) {
    showAlert("Error al cargar el equipo para editar.", "danger");
    return;
  }

  const t = result.data;
  document.getElementById("edit-id").value       = t.id;
  document.getElementById("edit-name").value     = t.name;
  document.getElementById("edit-coach").value    = t.coach;
  document.getElementById("edit-category").value = t.category;
  document.getElementById("edit-logo").value     = t.logoUrl ?? "";

  modalEdit.show();
}

async function saveEditTeam() {
  const id       = document.getElementById("edit-id").value;
  const name     = document.getElementById("edit-name").value.trim();
  const coach    = document.getElementById("edit-coach").value.trim();
  const category = document.getElementById("edit-category").value;
  const logo     = document.getElementById("edit-logo").value.trim();

  clearEditErrors();

  let hasError = false;

  const nameCheck = validateMinLength(name, 3);
  if (!nameCheck.valid) { setFieldError("edit-name", nameCheck.message); hasError = true; }

  const coachCheck = validateMinLength(coach, 3);
  if (!coachCheck.valid) { setFieldError("edit-coach", coachCheck.message); hasError = true; }

  const catCheck = validateRequired(category);
  if (!catCheck.valid) { setFieldError("edit-category", "Selecciona una categoría."); hasError = true; }

  if (hasError) return;

  const btn = document.getElementById("btn-edit-save");
  showLoader(btn, "Guardando...");

  // Verificar duplicado excluyendo el propio equipo
  const dupCheck = await checkDuplicate("teams", "name", name, id);
  if (dupCheck.isDuplicate) {
    setFieldError("edit-name", "Ya existe otro equipo con ese nombre.");
    hideLoader(btn);
    return;
  }

  const result = await updateDocument("teams", id, {
    name,
    coach,
    category,
    logoUrl: logo || null,
  });

  hideLoader(btn);

  if (result.success) {
    showAlert("Equipo actualizado correctamente.", "success");
    modalEdit.hide();
    loadTeams();
  } else {
    showAlert("Error al actualizar: " + result.message, "danger");
  }
}

function toggleTeamStatus(id, currentState) {
  const accion = currentState ? "desactivar" : "activar";
  
  showConfirmModal(`¿Estás seguro de que deseas ${accion} este equipo?`, async () => {
    
    const result = await toggleActive("teams", id, currentState);
    
    if (result.success) {
      showAlert(`Equipo ${accion}do correctamente.`, "success");
      loadTeams(); 
    } else {
      showAlert(`Error al ${accion} el equipo: ` + result.message, "danger");
    }
  });
}

function deleteTeam(id) {
  showConfirmModal(`ADVERTENCIA: Esta acción es irreversible. ¿Deseas eliminar este equipo de la base de datos?`, async () => {
    
    const result = await deleteDocument("teams", id);
    
    if (result.success) {
      showAlert("Equipo eliminado permanentemente.", "success");
      loadTeams(); 
    } else {
      showAlert("Error al eliminar el equipo: " + result.message, "danger");
    }
  });
}

function applyFilters() {
  const searchTerm = document.getElementById("search-team").value.toLowerCase();
  const category   = document.getElementById("filter-category").value;
  const status     = document.getElementById("filter-status").value;

  const filteredTeams = allTeams.filter((t) => {
    const matchName = t.name.toLowerCase().includes(searchTerm);
    
    const matchCategory = category === "" || t.category === category;
    
    let matchStatus = true;
    if (status === "active")   matchStatus = t.active !== false;
    if (status === "inactive") matchStatus = t.active === false;

    return matchName && matchCategory && matchStatus;
  });

  renderTable(filteredTeams);
}

function setFieldError(fieldId, message) {
  const el = document.getElementById(fieldId);
  el.classList.add("is-invalid");
  const err = document.getElementById("err-" + fieldId);
  if (err) err.textContent = message;
}

function clearFieldErrors(fieldIds) {
  fieldIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("is-invalid");
    const err = document.getElementById("err-" + id);
    if (err) err.textContent = "";
  });
}

function clearCreateForm() {
  ["create-name", "create-coach", "create-logo"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("create-category").value = "";
  clearFieldErrors(["create-name", "create-coach", "create-category"]);
}

function clearEditErrors() {
  clearFieldErrors(["edit-name", "edit-coach", "edit-category"]);
}

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTimestamp(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return isNaN(d) ? "—" : d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}
