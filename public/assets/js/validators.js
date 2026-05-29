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

// Valida números enteros mayores o iguales a cero
export function validateNonNegativeInteger(value) {
  const num = Number(value);
  const valid = String(value).trim() !== "" && Number.isInteger(num) && num >= 0;
  return { valid, message: valid ? "" : "Debe ser un entero mayor o igual a cero." };
}

export function validateDate(date) {
  if (!date || isNaN(Date.parse(date))) {
    return { valid: false, message: "Ingresa una fecha válida." };
  }
  const year = new Date(date).getFullYear();
  if (year < 2000 || year > 2100) {
    return { valid: false, message: "Ingresa una fecha válida." };
  }
  return { valid: true, message: "" };
}

// Valida número de camiseta entre 1 y 99
export function validateShirtNumber(value) {
  const num = Number(value);
  const valid = Number.isInteger(num) && num >= 1 && num <= 99;
  return { valid, message: valid ? "" : "El número debe ser entero entre 1 y 99." };
}

// ── Validaciones de Fechas (HU-35) ───────────────────────────────────────────

export function validateDateChronology(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return { valid: false, message: "Ambas fechas son requeridas." };
  
  const isValid = endDateStr >= startDateStr;
  
  return {
    valid: isValid,
    message: isValid ? "" : "La fecha de fin no puede ser anterior a la de inicio."
  };
}

export function validateReasonableYear(dateStr, minYear = 2020, maxYear = 2035) {
  if (!dateStr) return { valid: false, message: "Fecha requerida." };
  
  const year = parseInt(dateStr.split('-')[0], 10);
  const isValid = year >= minYear && year <= maxYear;
  
  return {
    valid: isValid,
    message: isValid ? "" : `El año debe ser coherente (entre ${minYear} y ${maxYear}).`
  };
}
