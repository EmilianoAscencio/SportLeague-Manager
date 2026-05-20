import { auth } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

/* Redirige a login.html si no hay sesión activa.
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
*/

// Modo temporal sin login
export function requireAuth() {
  return Promise.resolve(true);
}