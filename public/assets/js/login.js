import { getAuthErrorMessage, loginWithEmail, redirectIfAuthenticated } from "./auth.js";
import { hideLoader, showAlert, showLoader } from "./ui.js";
import { validateEmail, validateRequired } from "./validators.js";

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("btn-login");

redirectIfAuthenticated();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearFieldErrors();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const emailCheck = validateEmail(email);
  const passwordCheck = validateRequired(password);

  let isValid = true;

  if (!emailCheck.valid) {
    setFieldError(emailInput, "email-feedback", emailCheck.message);
    isValid = false;
  }

  if (!passwordCheck.valid) {
    setFieldError(passwordInput, "password-feedback", "Ingresa tu contraseña.");
    isValid = false;
  }

  if (!isValid) return;

  showLoader(submitButton, "Iniciando sesión...");

  try {
    await loginWithEmail(email, password);
    showAlert("Sesión iniciada correctamente.", "success");
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
  [emailInput, passwordInput].forEach((input) => input.classList.remove("is-invalid"));
}
