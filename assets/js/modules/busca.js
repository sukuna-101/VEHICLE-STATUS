import { CONFIG } from '../config.js';

let debounceTimer = null;
let onSearch = null;

export function initBusca(callback) {
  onSearch = callback;
  const input = document.getElementById('search-input');
  const btn = document.getElementById('btn-buscar');
  const btnClear = document.getElementById('btn-limpar-busca');
  if (input) {
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => onSearch?.(input.value), CONFIG.DEBOUNCE_MS);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(debounceTimer);
        onSearch?.(input.value);
      }
    });
  }
  if (btn) btn.addEventListener('click', () => { clearTimeout(debounceTimer); onSearch?.(input?.value || ''); });
  if (btnClear) btnClear.addEventListener('click', () => { if (input) input.value = ''; onSearch?.(''); });
}

export function getTermoBusca() {
  return document.getElementById('search-input')?.value || '';
}
