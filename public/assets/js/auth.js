import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { createDocument } from "./firestore.js";

export async function logout() {
  await signOut(auth);
  window.location.replace("login.html");
}

export function preventBackAccess() {
  history.pushState(null, "", location.href);
  window.addEventListener("popstate", () => history.pushState(null, "", location.href));
}

// Muestra el nombre o correo del usuario autenticado en el navbar
export function showUserInNavbar(user) {
  const el = document.getElementById("navbar-user");
  if (el) el.textContent = user.displayName || user.email;
}

export function getAuthErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/invalid-email": "Ingresa un correo electrónico válido.",
    "auth/missing-password": "Ingresa tu contraseña.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  };

  return messages[error.code] || "No se pudo completar la operación.";
}

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function registerWithEmail({ name, email, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(credential.user, { displayName: name });
  await createDocument("users", {
    uid: credential.user.uid,
    name,
    email,
    role: "admin",
    active: true,
  });

  return credential.user;
}

export function redirectIfAuthenticated() {
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.replace("dashboard.html");
  });
}

// Redirige a login.html si no hay sesión activa.
export function requireAuth() {
  return new Promise((resolve) => {
    const loader = document.createElement("div");
    loader.id = "auth-loader";
    loader.innerHTML = `<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Verificando sesión...</span></div>`;
    document.body.appendChild(loader);

    onAuthStateChanged(auth, (user) => {
      loader.remove();
      if (!user) {
        window.location.replace("login.html");
        return;
      }
      resolve(user);
    });
  });
}
