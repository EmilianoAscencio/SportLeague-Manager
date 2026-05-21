export function showAlert(message, type = "success") {
  const container = document.getElementById("alert-container");
  if (!container) return;

  const alert = document.createElement("div");
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.role = "alert";
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  container.appendChild(alert);
  setTimeout(() => alert.remove(), 4000);
}

// Deshabilita el botón y muestra texto de carga
export function showLoader(buttonEl, loadingText = "Cargando...") {
  buttonEl.disabled = true;
  buttonEl.dataset.originalText = buttonEl.innerHTML;
  buttonEl.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
    ${loadingText}
  `;
}

// Restaura el botón a su estado original
export function hideLoader(buttonEl, originalText = null) {
  buttonEl.disabled = false;
  buttonEl.innerHTML = originalText ?? buttonEl.dataset.originalText;
}

// Muestra un estado vacío dentro de un contenedor
export function showEmptyState(containerEl, message = "No hay datos disponibles.") {
  containerEl.innerHTML = `
    <div class="text-center text-muted py-5">
      <i class="bi bi-inbox fs-1 d-block mb-2"></i>
      <p class="mb-0">${message}</p>
    </div>
  `;
}

// Muestra un modal de confirmación antes de eliminar o desactivar
export function showConfirmModal(message, onConfirm) {
  const existing = document.getElementById("confirm-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "confirm-modal";
  modal.className = "modal fade";
  modal.tabIndex = -1;
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirmar acción</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">${message}</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-danger" id="confirm-btn">Confirmar</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  const instance = new bootstrap.Modal(modal);
  instance.show();

  modal.querySelector("#confirm-btn").addEventListener("click", () => {
    instance.hide();
    onConfirm();
  });

  modal.addEventListener("hidden.bs.modal", () => modal.remove());
}

export function renderTableRow(columns = []) {
  const cells = columns.map((col) => `<td>${col}</td>`).join("");
  return `<tr>${cells}</tr>`;
}