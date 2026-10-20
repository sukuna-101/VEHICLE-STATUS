const containerId = 'toast-container';

function ensureContainer() {
  let el = document.getElementById(containerId);
  if (!el) {
    el = document.createElement('div');
    el.id = containerId;
    el.className = 'toast-container';
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  return el;
}

export function notify(message, type = 'info', duration = 4000) {
  const container = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  const icon = document.createElement('i');
  icon.className =
    type === 'success' ? 'fa-solid fa-circle-check'
    : type === 'error' ? 'fa-solid fa-circle-exclamation'
    : type === 'warning' ? 'fa-solid fa-triangle-exclamation'
    : 'fa-solid fa-circle-info';
  toast.appendChild(icon);
  const span = document.createElement('span');
  span.textContent = message;
  toast.appendChild(span);
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export const success = (m) => notify(m, 'success');
export const error = (m) => notify(m, 'error', 6000);
export const warning = (m) => notify(m, 'warning');
export const info = (m) => notify(m, 'info');
