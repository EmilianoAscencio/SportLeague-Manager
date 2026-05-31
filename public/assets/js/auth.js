import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function logout() {
  await signOut(auth);
  window.location.replace("login.html");
}

export function preventBackAccess() {
  history.pushState(null, "", location.href);
  window.addEventListener("popstate", () => history.pushState(null, "", location.href));
}

// Muestra el nombre/correo del usuario en el sidebar y su inicial en el avatar
export function showUserInNavbar(user) {
  const name = user.displayName || user.email || "?";

  const nameEl = document.getElementById("navbar-user");
  if (nameEl) nameEl.textContent = name;

  const avatarEl = document.getElementById("sidebar-avatar");
  if (avatarEl) avatarEl.textContent = name[0].toUpperCase();
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
  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    name,
    email,
    role: "admin",
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return credential.user;
}

export async function getCurrentUserProfile(user = auth.currentUser) {
  if (!user) return null;

  const directSnapshot = await getDoc(doc(db, "users", user.uid));
  if (directSnapshot.exists()) {
    return { id: directSnapshot.id, ...directSnapshot.data() };
  }

  const fallbackQuery = query(collection(db, "users"), where("uid", "==", user.uid), limit(1));
  const fallbackSnapshot = await getDocs(fallbackQuery);
  if (fallbackSnapshot.empty) return null;

  const userDoc = fallbackSnapshot.docs[0];
  const profile = { id: userDoc.id, ...userDoc.data() };

  try {
    await setDoc(doc(db, "users", user.uid), {
      ...userDoc.data(),
      uid: user.uid,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn("No se pudo migrar el perfil de usuario a users/{uid}.", error);
  }

  return profile;
}

export async function userIsAdmin(user = auth.currentUser) {
  const profile = await getCurrentUserProfile(user);
  return profile?.role === "admin" && profile?.active !== false;
}

export function applyAdminVisibility(isAdmin) {
  document.querySelectorAll("[data-admin-only]").forEach((el) => {
    el.classList.toggle("d-none", !isAdmin);
  });
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
