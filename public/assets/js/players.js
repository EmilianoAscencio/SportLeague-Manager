import { auth, db } from "./firebase.js";
import { applyAdminVisibility, logout, preventBackAccess, requireAuth, showUserInNavbar, userIsAdmin } from "./auth.js";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { validateRequired, validateMinLength, validateShirtNumber } from "./validators.js";
import { showAlert, showEmptyState, showConfirmModal } from "./ui.js";


const SPORT_POSITIONS = {
  "Fútbol":           ["Portero", "Defensa", "Mediocampista", "Delantero"],
  "Baloncesto":       ["Base", "Escolta", "Alero", "Ala-Pívot", "Pívot"],
  "Voleibol":         ["Colocador", "Opuesto", "Receptor", "Central", "Líbero"],
  "Béisbol":          ["Lanzador", "Receptor", "Primera base", "Segunda base",
                       "Tercera base", "Shortstop", "Jardín izquierdo",
                       "Jardín central", "Jardín derecho"],
  "Softbol":          ["Lanzador", "Receptor", "Primera base", "Segunda base",
                       "Tercera base", "Shortstop", "Jardín izquierdo",
                       "Jardín central", "Jardín derecho"],
  "Fútbol Americano": ["Quarterback", "Running back", "Wide receiver",
                       "Tight end", "Liniero ofensivo", "Liniero defensivo",
                       "Linebacker", "Cornerback", "Safety", "Pateador"],
};


const ALL_POSITIONS = [...new Set(Object.values(SPORT_POSITIONS).flat())].sort();

let allPlayers = [];
let allTeams   = [];
let isAdmin = false;

const modal       = new bootstrap.Modal(document.getElementById("modal-player"));
const modalDetail = new bootstrap.Modal(document.getElementById("modal-detail"));
const modalEdit = new bootstrap.Modal(document.getElementById("modal-edit"));

preventBackAccess();
requireAuth().then(async (user) => {
  isAdmin = await userIsAdmin(user);
  applyAdminVisibility(isAdmin);
  showUserInNavbar(user);
  document.getElementById("btn-logout").addEventListener("click", logout);
  init();
});



async function init() {
  await loadTeams();
  await loadPlayers();
  bindFormEvents();
}



async function loadTeams() {
  const snapshot = await getDocs(collection(db, "teams"));
  allTeams = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  allTeams.forEach((team) => {
    document.getElementById("teamId").innerHTML      += `<option value="${team.id}">${team.name}</option>`;
    document.getElementById("filter-team").innerHTML += `<option value="${team.id}">${team.name}</option>`;
    document.getElementById("edit-teamId").innerHTML += `<option value="${team.id}">${team.name}</option>`;
  });
}

async function loadPlayers() {
  const snapshot = await getDocs(collection(db, "players"));
  allPlayers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderPlayers(allPlayers);
}



function applyFilters() {
  const teamId = document.getElementById("filter-team").value;
  const searchTerm = document.getElementById("search-player").value.toLowerCase().trim();

  const filtered = allPlayers.filter((p) => {
    const matchesTeam = teamId === "" || p.teamId === teamId;
    const matchesName = p.fullName.toLowerCase().includes(searchTerm);

    return matchesTeam && matchesName;
  });

  renderPlayers(filtered);
}

document.getElementById("filter-team").addEventListener("change", applyFilters);
document.getElementById("search-player").addEventListener("input", applyFilters);

function bindFormEvents() {
  document.getElementById("teamId").addEventListener("change", (e) => {
    const selectedId = e.target.value;
    const badge = document.getElementById("team-sport-badge");
    const label = document.getElementById("team-sport-label");

    if (!selectedId) {
      badge.style.display = "none";
      resetPositionSelect();
      return;
    }

    const team = allTeams.find((t) => t.id === selectedId);
    if (team?.sport) {
      label.textContent = team.sport;
      badge.style.display = "";
    } else {
      badge.style.display = "none";
    }

    updatePositionOptions(team?.sport ?? null);
  });

  
  document.getElementById("participantType").addEventListener("change", (e) => {
    const isStudent = e.target.value === "Estudiante";
    const wrapper   = document.getElementById("studentNumber-wrapper");
    wrapper.style.display = isStudent ? "" : "none";
    if (!isStudent) {
      document.getElementById("studentNumber").value = "";
      document.getElementById("studentNumber").classList.remove("is-invalid");
    }
  });

  
  document.getElementById("edit-teamId").addEventListener("change", (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      document.getElementById("edit-position").innerHTML = `<option value="">— Selecciona un equipo primero —</option>`;
      document.getElementById("edit-position").disabled = true;
      return;
    }
    const team = allTeams.find((t) => t.id === selectedId);
    updateEditPositionOptions(team?.sport ?? null);
  });

  document.getElementById("edit-participantType").addEventListener("change", (e) => {
    const isStudent = e.target.value === "Estudiante";
    const wrapper   = document.getElementById("edit-studentNumber-wrapper");
    
    wrapper.style.display = isStudent ? "" : "none";
    
    if (!isStudent) {
      document.getElementById("edit-studentNumber").value = "";
      document.getElementById("edit-studentNumber").classList.remove("is-invalid");
    }
  });
}

function updateEditPositionOptions(sport) {
  const posSelect = document.getElementById("edit-position");
  const positions = sport ? (SPORT_POSITIONS[sport] ?? ALL_POSITIONS) : ALL_POSITIONS;

  posSelect.innerHTML = `<option value="">Selecciona</option>`;
  positions.forEach((pos) => {
    posSelect.innerHTML += `<option value="${pos}">${pos}</option>`;
  });
  posSelect.disabled = false;
}


function resetPositionSelect() {
  const posSelect = document.getElementById("position");
  posSelect.innerHTML = `<option value="">— Selecciona un equipo primero —</option>`;
  posSelect.disabled = false;
}

/**
 * 
 * @param {string|null} sport 
 */
function updatePositionOptions(sport) {
  const posSelect = document.getElementById("position");
  const positions = sport ? (SPORT_POSITIONS[sport] ?? ALL_POSITIONS) : ALL_POSITIONS;

  posSelect.innerHTML = `<option value="">Selecciona</option>`;
  positions.forEach((pos) => {
    posSelect.innerHTML += `<option value="${pos}">${pos}</option>`;
  });
  posSelect.disabled = false;
}



function renderPlayers(players) {
  const tbody = document.getElementById("players-tbody");
  const empty = document.getElementById("players-empty");

  if (players.length === 0) {
    tbody.innerHTML = "";
    showEmptyState(empty, "No hay jugadores registrados.");
    return;
  }

  empty.innerHTML = "";
  tbody.innerHTML = players.map((p, i) => {
    const teamName  = allTeams.find((t) => t.id === p.teamId)?.name ?? "—";
    const tipo      = p.participantType ?? "—";
    const matricula = p.participantType === "Estudiante" ? (p.studentNumber ?? "—") : "N/A";

    const isActive    = p.active !== false; 
    const statusIcon  = isActive ? "bi-toggle-on" : "bi-toggle-off";
    const statusClass = isActive ? "btn-outline-success" : "btn-outline-secondary";
    const statusTitle = isActive ? "Desactivar" : "Activar";
    const rowClass = isActive ? "" : "text-muted opacity-75";

    return `<tr>
      <td>${i + 1}</td>
      <td>${escHtml(p.fullName)}</td>
      <td>${escHtml(tipo)}</td>
      <td>${escHtml(matricula)}</td>
      <td>${escHtml(p.position ?? "—")}</td>
      <td>${p.shirtNumber ?? "—"}</td>
      <td>${escHtml(teamName)}</td>
      <td>
        <button class="btn btn-outline-primary btn-sm btn-detail" data-id="${p.id}" title="Ver ficha">
          <i class="bi bi-eye"></i>
        </button>
        ${isAdmin ? `
          <button class="btn btn-outline-warning btn-sm btn-edit ms-1" data-id="${p.id}" title="Editar">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button class="btn ${statusClass} btn-sm btn-toggle ms-1" data-id="${p.id}" title="${statusTitle}">
            <i class="bi ${statusIcon}"></i>
          </button>
          <button class="btn btn-outline-danger btn-sm btn-delete ms-1" data-id="${p.id}" title="Eliminar definitivamente">
            <i class="bi bi-trash-fill"></i>
          </button>
        ` : ""}
      </td>
    </tr>`;
  }).join("");

  tbody.querySelectorAll(".btn-detail").forEach((btn) => {
    btn.addEventListener("click", () => openDetail(btn.dataset.id));
  });

  tbody.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => openEdit(btn.dataset.id));
  });
  
  tbody.querySelectorAll(".btn-toggle").forEach((btn) => {
    btn.addEventListener("click", () => togglePlayerStatus(btn.dataset.id));
  });

  tbody.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => deletePlayer(btn.dataset.id));
  });
}



function openDetail(id) {
  const p = allPlayers.find((pl) => pl.id === id);
  if (!p) return;

  const team     = allTeams.find((t) => t.id === p.teamId);
  const teamName = team?.name ?? "—";

  document.getElementById("detail-name").textContent     = p.fullName;
  document.getElementById("detail-team").textContent     = teamName;
  document.getElementById("detail-sport").textContent    = team?.sport ?? "—";
  document.getElementById("detail-type").textContent     = p.participantType ?? "—";
  document.getElementById("detail-position").textContent = p.position ?? "—";
  document.getElementById("detail-shirt").textContent    = p.shirtNumber ?? "—";
  document.getElementById("detail-status").innerHTML     = p.active !== false
    ? '<span class="badge badge-active">Activo</span>'
    : '<span class="badge badge-danger">Inactivo</span>';

  const matriculaRow = document.getElementById("detail-matricula-row");
  if (p.participantType === "Estudiante") {
    matriculaRow.style.display = "";
    document.getElementById("detail-matricula").textContent = p.studentNumber ?? "—";
  } else {
    matriculaRow.style.display = "none";
  }

  const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : null;
  document.getElementById("detail-created").textContent = createdAt
    ? createdAt.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  new bootstrap.Modal(document.getElementById("modal-detail")).show();
}



document.getElementById("btn-save").addEventListener("click", async () => {
  if (!ensureAdmin()) return;

  const teamId          = document.getElementById("teamId").value;
  const fullName        = document.getElementById("fullName").value.trim();
  const participantType = document.getElementById("participantType").value;
  const studentNumber   = document.getElementById("studentNumber").value.trim();
  const position        = document.getElementById("position").value;
  const shirtNumber     = Number(document.getElementById("shirtNumber").value);
  const isStudent       = participantType === "Estudiante";

  const checks = [
    { id: "teamId",          result: validateRequired(teamId) },
    { id: "fullName",        result: validateMinLength(fullName, 3) },
    { id: "participantType", result: validateRequired(participantType) },
    { id: "position",        result: validateRequired(position) },
    { id: "shirtNumber",     result: validateShirtNumber(shirtNumber) },
  ];

  if (isStudent) {
    checks.push({ id: "studentNumber", result: validateRequired(studentNumber) });
  }

  let isValid = true;
  checks.forEach(({ id, result }) => {
    const el = document.getElementById(id);
    el.classList.toggle("is-invalid", !result.valid);
    if (!result.valid) isValid = false;
  });

  if (!isValid) return;

  const duplicate = allPlayers.find(
    (p) => p.teamId === teamId && p.shirtNumber === shirtNumber
  );
  if (duplicate) {
    showAlert(`El número ${shirtNumber} ya está en uso en ese equipo.`, "danger");
    return;
  }

  await addDoc(collection(db, "players"), {
    teamId,
    fullName,
    participantType,
    studentNumber: isStudent ? studentNumber : null,
    position,
    shirtNumber,
    active:    true,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  showAlert("Jugador registrado correctamente.", "success");
  modal.hide();
  resetForm();
  await loadPlayers();
});


function openEdit(id) {
  if (!ensureAdmin()) return;

  const p = allPlayers.find((pl) => pl.id === id);
  if (!p) return;

  document.querySelectorAll("#edit-player-form .is-invalid").forEach(el => el.classList.remove("is-invalid"));

  document.getElementById("edit-id").value = p.id;
  document.getElementById("edit-fullName").value = p.fullName;
  document.getElementById("edit-shirtNumber").value = p.shirtNumber;
  document.getElementById("edit-participantType").value = p.participantType;
  const isStudent = p.participantType === "Estudiante";
  document.getElementById("edit-studentNumber-wrapper").style.display = isStudent ? "" : "none";
  document.getElementById("edit-studentNumber").value = isStudent ? (p.studentNumber || "") : "";
  document.getElementById("edit-teamId").value = p.teamId;
  const team = allTeams.find((t) => t.id === p.teamId);
  updateEditPositionOptions(team?.sport ?? null);
  document.getElementById("edit-position").value = p.position;

  modalEdit.show();
}



document.getElementById("btn-edit-save").addEventListener("click", async () => {
  if (!ensureAdmin()) return;

  const editId          = document.getElementById("edit-id").value;
  const teamId          = document.getElementById("edit-teamId").value;
  const fullName        = document.getElementById("edit-fullName").value.trim();
  const participantType = document.getElementById("edit-participantType").value;
  const studentNumber   = document.getElementById("edit-studentNumber").value.trim();
  const position        = document.getElementById("edit-position").value;
  const shirtNumber     = Number(document.getElementById("edit-shirtNumber").value);
  const isStudent       = participantType === "Estudiante";

  const checks = [
    { id: "edit-teamId",          result: validateRequired(teamId) },
    { id: "edit-fullName",        result: validateMinLength(fullName, 3) },
    { id: "edit-participantType", result: validateRequired(participantType) },
    { id: "edit-position",        result: validateRequired(position) },
    { id: "edit-shirtNumber",     result: validateShirtNumber(shirtNumber) },
  ];

  if (isStudent) {
    checks.push({ id: "edit-studentNumber", result: validateRequired(studentNumber) });
  }

  let isValid = true;
  checks.forEach(({ id, result }) => {
    const el = document.getElementById(id);
    el.classList.toggle("is-invalid", !result.valid);
    if (!result.valid) isValid = false;
  });

  if (!isValid) return; 

  const duplicate = allPlayers.find(
    (p) => p.teamId === teamId && p.shirtNumber === shirtNumber && p.id !== editId
  );
  if (duplicate) {
    showAlert(`El número ${shirtNumber} ya está en uso en este equipo.`, "danger");
    return;
  }

  try {
    const playerRef = doc(db, "players", editId);
    
    await updateDoc(playerRef, {
      teamId,
      fullName,
      participantType,
      studentNumber: isStudent ? studentNumber : null,
      position,
      shirtNumber,
      updatedAt: serverTimestamp(),
    });

    showAlert("Jugador actualizado correctamente.", "success");
    modalEdit.hide();
    await loadPlayers(); 
    
  } catch (error) {
    console.error("Error al actualizar jugador:", error);
    showAlert("Ocurrió un error al actualizar el jugador.", "danger");
  }
});



async function togglePlayerStatus(id) {
  if (!ensureAdmin()) return;

  // 1. Buscamos al jugador
  const p = allPlayers.find((pl) => pl.id === id);
  if (!p) return;

  // 2. Determinamos el nuevo estado y los textos
  const isCurrentlyActive = p.active !== false;
  const newStatus = !isCurrentlyActive;
  const actionText = isCurrentlyActive ? "desactivar" : "activar";

  // 3. Definimos el mensaje
  const mensaje = `¿Estás seguro de que deseas ${actionText} a <strong>${p.fullName}</strong>?`;

  // 4. Llamamos a tu modal pasando SOLO 2 parámetros (mensaje y callback)
  showConfirmModal(mensaje, async () => {
    
    try {
      const playerRef = doc(db, "players", id);
      
      await updateDoc(playerRef, {
        active: newStatus,
        updatedAt: serverTimestamp(),
      });

      showAlert(`Jugador ${newStatus ? 'activado' : 'desactivado'} correctamente.`, "success");
      await loadPlayers(); 
      
    } catch (error) {
      console.error("Error al cambiar estado del jugador:", error);
      showAlert(`Ocurrió un error al ${actionText} al jugador.`, "danger");
    }
    
  });
}



function deletePlayer(id) {
  if (!ensureAdmin()) return;

  const p = allPlayers.find((pl) => pl.id === id);
  if (!p) return;

  const mensaje = `¿Estás completamente seguro de que deseas eliminar permanentemente a <strong>${p.fullName}</strong>? <br><br><span class="text-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i> Esta acción no se puede deshacer.</span>`;

  showConfirmModal(mensaje, async () => {
    try {
      const playerRef = doc(db, "players", id);
      
      await deleteDoc(playerRef);

      showAlert("Jugador eliminado definitivamente del sistema.", "success");
      
      await loadPlayers(); 
      
    } catch (error) {
      console.error("Error al eliminar jugador:", error);
      showAlert("Ocurrió un error al intentar eliminar al jugador.", "danger");
    }
  });
}

function ensureAdmin() {
  if (isAdmin) return true;
  showAlert("Solo un usuario administrador puede modificar jugadores.", "warning");
  return false;
}



function resetForm() {
  document.getElementById("player-form").reset();
  document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
  document.getElementById("studentNumber-wrapper").style.display = "";
  document.getElementById("team-sport-badge").style.display = "none";
  resetPositionSelect();
}

document.getElementById("modal-player").addEventListener("hidden.bs.modal", resetForm);



function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
