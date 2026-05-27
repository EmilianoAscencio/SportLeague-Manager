import { auth, db } from "./firebase.js";
import { logout, preventBackAccess, requireAuth, showUserInNavbar } from "./auth.js";
import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { validateRequired, validateMinLength, validateShirtNumber } from "./validators.js";
import { showAlert, showEmptyState } from "./ui.js";

// ── HU-29: Posiciones por deporte ────────────────────────────────────────────
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

// Todas las posiciones combinadas (fallback para equipos sin deporte registrado)
const ALL_POSITIONS = [...new Set(Object.values(SPORT_POSITIONS).flat())].sort();

let allPlayers = [];
let allTeams   = [];

const modal       = new bootstrap.Modal(document.getElementById("modal-player"));
const modalDetail = new bootstrap.Modal(document.getElementById("modal-detail"));

preventBackAccess();
requireAuth().then((user) => {
  showUserInNavbar(user);
  document.getElementById("btn-logout").addEventListener("click", logout);
  init();
});

// ── Inicialización ───────────────────────────────────────────────────────────

async function init() {
  await loadTeams();
  await loadPlayers();
  bindFormEvents();
}

// ── Carga de datos ───────────────────────────────────────────────────────────

async function loadTeams() {
  const snapshot = await getDocs(collection(db, "teams"));
  allTeams = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  allTeams.forEach((team) => {
    document.getElementById("teamId").innerHTML      += `<option value="${team.id}">${team.name}</option>`;
    document.getElementById("filter-team").innerHTML += `<option value="${team.id}">${team.name}</option>`;
  });
}

async function loadPlayers() {
  const snapshot = await getDocs(collection(db, "players"));
  allPlayers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderPlayers(allPlayers);
}

// ── Filtro por equipo ────────────────────────────────────────────────────────

document.getElementById("filter-team").addEventListener("change", (e) => {
  const teamId   = e.target.value;
  const filtered = teamId ? allPlayers.filter((p) => p.teamId === teamId) : allPlayers;
  renderPlayers(filtered);
});

// ── Eventos del formulario ───────────────────────────────────────────────────

function bindFormEvents() {
  // HU-29: Cambio de equipo → actualizar posiciones
  document.getElementById("teamId").addEventListener("change", (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      // Sin equipo → deshabilitar posición
      resetPositionSelect();
      return;
    }
    const team = allTeams.find((t) => t.id === selectedId);
    // Si el equipo tiene deporte, carga sus posiciones; si no, carga todas
    updatePositionOptions(team?.sport ?? null);
  });

  // HU-28: Cambio de tipo → mostrar/ocultar matrícula
  document.getElementById("participantType").addEventListener("change", (e) => {
    const isStudent = e.target.value === "Estudiante";
    const wrapper   = document.getElementById("studentNumber-wrapper");
    wrapper.style.display = isStudent ? "" : "none";
    if (!isStudent) {
      document.getElementById("studentNumber").value = "";
      document.getElementById("studentNumber").classList.remove("is-invalid");
    }
  });
}

// ── HU-29: Manejo del select de posición ─────────────────────────────────────

/** Deshabilita el select de posición (estado inicial / sin equipo) */
function resetPositionSelect() {
  const posSelect = document.getElementById("position");
  posSelect.innerHTML = `<option value="">— Selecciona un equipo primero —</option>`;
  posSelect.disabled  = true;
}

/**
 * Popula y habilita el select de posición.
 * @param {string|null} sport - deporte del equipo, o null si no tiene registrado
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

// ── Renderizar tabla ─────────────────────────────────────────────────────────

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
      </td>
    </tr>`;
  }).join("");

  tbody.querySelectorAll(".btn-detail").forEach((btn) => {
    btn.addEventListener("click", () => openDetail(btn.dataset.id));
  });
}

// ── HU-30: Modal de detalle ──────────────────────────────────────────────────

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

// ── Guardar jugador ──────────────────────────────────────────────────────────

document.getElementById("btn-save").addEventListener("click", async () => {
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

// ── Reset del formulario ─────────────────────────────────────────────────────

function resetForm() {
  document.getElementById("player-form").reset();
  document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
  document.getElementById("studentNumber-wrapper").style.display = "";
  resetPositionSelect();
}

document.getElementById("modal-player").addEventListener("hidden.bs.modal", resetForm);

// ── Helper ───────────────────────────────────────────────────────────────────

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}