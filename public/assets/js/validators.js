// Valida que el campo no esté vacío
export function validateRequired(value) {
  const valid = value !== null && value !== undefined && String(value).trim().length > 0;
  return { valid, message: valid ? "" : "Este campo es obligatorio." };
}

// Valida formato de correo electrónico
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid = regex.test(String(email).trim());
  return { valid, message: valid ? "" : "Ingresa un correo electrónico válido." };
}

// Valida longitud mínima de un string
export function validateMinLength(value, min) {
  const valid = String(value).trim().length >= min;
  return { valid, message: valid ? "" : `Mínimo ${min} caracteres.` };
}

// Valida que el valor sea un número positivo mayor a cero
export function validatePositiveNumber(value) {
  const num = Number(value);
  const valid = !isNaN(num) && num > 0;
  return { valid, message: valid ? "" : "Debe ser un número mayor a cero." };
}

// Valida que la fecha tenga formato válido y no sea una fecha inválida
export function validateDate(date) {
  const valid = !isNaN(Date.parse(date));
  return { valid, message: valid ? "" : "Ingresa una fecha válida." };
}

// Valida número de camiseta entre 1 y 99
export function validateShirtNumber(value) {
  const num = Number(value);
  const valid = Number.isInteger(num) && num >= 1 && num <= 99;
  return { valid, message: valid ? "" : "El número debe ser entero entre 1 y 99." };
}