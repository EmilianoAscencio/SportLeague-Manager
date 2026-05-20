import { auth, db } from "./firebase.js";
import { logout, preventBackAccess, requireAuth, showUserInNavbar } from "./auth.js";
import { collection, getDocs, addDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { validateRequired, validateMinLength, validateShirtNumber } from "./validators.js";
import { showAlert, showEmptyState } from "./ui.js";

let allPlayers = [];
let allTeams   = [];

const modal = new bootstrap.Modal(document.getElementById("modal-player"));

preventBackAccess();
requireAuth().then((user) => {
  showUserInNavbar(user);
  init();
});

document.getElementById("btn-logout").addEventListener("click", logout);

async function init() {
  await loadTeams();
  await loadPlayers();
}

// Cargar equipos desde Firestore
async function loadTeams() {
  const snapshot = await getDocs(collection(db, "teams"));
  allTeams = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  allTeams.forEach((team) => {
    document.getElementById("teamId").innerHTML   += `<option value="${team.id}">${team.name}</option>`;
    document.getElementById("filter-team").innerHTML += `<option value="${team.id}">${team.name}</option>`;
  });
}

// Cargar jugadores desde Firestore
async function loadPlayers() {
  const snapshot = await getDocs(collection(db, "players"));
  allPlayers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderPlayers(allPlayers);
}

// Filtrar por equipo
document.getElementById("filter-team").addEventListener("change", (e) => {
  const teamId   = e.target.value;
  const filtered = teamId ? allPlayers.filter((p) => p.teamId === teamId) : allPlayers;
  renderPlayers(filtered);
});

// Renderizar tabla
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
    const teamName = allTeams.find((t) => t.id === p.teamId)?.name ?? "—";
    return `<tr>
      <td>${i + 1}</td>
      <td>${p.fullName}</td>
      <td>${p.studentNumber}</td>
      <td>${p.position}</td>
      <td>${p.shirtNumber}</td>
      <td>${teamName}</td>
    </tr>`;
  }).join("");
}

// Guardar jugador
document.getElementById("btn-save").addEventListener("click", async () => {
  const teamId        = document.getElementById("teamId").value;
  const fullName      = document.getElementById("fullName").value.trim();
  const studentNumber = document.getElementById("studentNumber").value.trim();
  const position      = document.getElementById("position").value;
  const shirtNumber   = Number(document.getElementById("shirtNumber").value);

  // Validaciones
  const checks = [
    { id: "teamId",        result: validateRequired(teamId) },
    { id: "fullName",      result: validateMinLength(fullName, 3) },
    { id: "studentNumber", result: validateRequired(studentNumber) },
    { id: "position",      result: validateRequired(position) },
    { id: "shirtNumber",   result: validateShirtNumber(shirtNumber) },
  ];

  let isValid = true;
  checks.forEach(({ id, result }) => {
    const el = document.getElementById(id);
    el.classList.toggle("is-invalid", !result.valid);
    if (!result.valid) isValid = false;
  });

  if (!isValid) return;

  // Validar duplicado de camiseta en el mismo equipo
  const duplicate = allPlayers.find(
    (p) => p.teamId === teamId && p.shirtNumber === shirtNumber
  );
  if (duplicate) {
    showAlert(`El número ${shirtNumber} ya está en uso en ese equipo.`, "danger");
    return;
  }

  // Guardar en Firestore
  await addDoc(collection(db, "players"), {
    teamId,
    fullName,
    studentNumber,
    position,
    shirtNumber,
    active:    true,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  showAlert("Jugador registrado correctamente.", "success");
  modal.hide();
  document.getElementById("player-form").reset();
  document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
  await loadPlayers();
});

// Limpiar al cerrar modal
document.getElementById("modal-player").addEventListener("hidden.bs.modal", () => {
  document.getElementById("player-form").reset();
  document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
});