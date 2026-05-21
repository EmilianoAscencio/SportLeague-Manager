import { getAuthErrorMessage, redirectIfAuthenticated, registerWithEmail } from "./auth.js";
import { hideLoader, showAlert, showLoader } from "./ui.js";
import { validateEmail, validateMinLength, validateRequired } from "./validators.js";

const form = document.getElementById("register-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm-password");
const submitButton = document.getElementById("btn-register");

redirectIfAuthenticated();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearFieldErrors();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmInput.value;

  let isValid = true;

  const nameCheck = validateMinLength(name, 3);
  if (!nameCheck.valid) {
    setFieldError(nameInput, "name-feedback", "Ingresa al menos 3 caracteres.");
    isValid = false;
  }

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    setFieldError(emailInput, "email-feedback", emailCheck.message);
    isValid = false;
  }

  const passwordCheck = validateMinLength(password, 6);
  if (!passwordCheck.valid) {
    setFieldError(passwordInput, "password-feedback", "La contraseña debe tener al menos 6 caracteres.");
    isValid = false;
  }

  const confirmCheck = validateRequired(confirmPassword);
  if (!confirmCheck.valid || password !== confirmPassword) {
    setFieldError(confirmInput, "confirm-feedback", "Las contraseñas deben coincidir.");
    isValid = false;
  }

  if (!isValid) return;

  showLoader(submitButton, "Creando cuenta...");

  try {
    await registerWithEmail({ name, email, password });
    showAlert("Cuenta creada correctamente.", "success");
    window.location.replace("dashboard.html");
  } catch (error) {
    showAlert(getAuthErrorMessage(error), "danger");
  } finally {
    hideLoader(submitButton);
  }
});

function setFieldError(input, feedbackId, message) {
  input.classList.add("is-invalid");
  document.getElementById(feedbackId).textContent = message;
}

function clearFieldErrors() {
  [nameInput, emailInput, passwordInput, confirmInput]
    .forEach((input) => input.classList.remove("is-invalid"));
}
