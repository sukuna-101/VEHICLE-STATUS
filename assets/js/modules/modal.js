let lastFocus = null;

export function abrirModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  lastFocus = document.activeElement;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.setAttribute('aria-hidden', 'false');
  const firstInput = modal.querySelector('input, button, select, textarea');
  if (firstInput) setTimeout(() => firstInput.focus(), 50);
  const onKey = (e) => { if (e.key === 'Escape') fecharModal(id); };
  modal._escHandler = onKey;
  document.addEventListener('keydown', onKey);
}

export function fecharModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  modal.setAttribute('aria-hidden', 'true');
  if (modal._escHandler) {
    document.removeEventListener('keydown', modal._escHandler);
    delete modal._escHandler;
  }
  if (lastFocus) lastFocus.focus();
}

export function initModalClose() {
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => fecharModal(btn.dataset.closeModal));
  });
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) fecharModal(backdrop.id);
    });
  });
}
