// Lightweight, dependency-free toast notifications.
// Usage: showToast("Saved successfully"); showToast("Something went wrong", "error");

export function showToast(message, type = "success") {
  const container = document.getElementById("toast-container") || createContainer();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("toast-visible"));

  setTimeout(() => {
    toast.classList.remove("toast-visible");
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

function createContainer() {
  const el = document.createElement("div");
  el.id = "toast-container";
  document.body.appendChild(el);
  return el;
}
