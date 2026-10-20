let state = { status: 'todos', equipamento: 'todos', ordenarPor: 'vencimento', direcao: 'asc' };
let onChange = null;

export function getFiltros() {
  return { ...state };
}

export function initFiltros(callback) {
  onChange = callback;
  document.querySelectorAll('[data-filter-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.status = btn.dataset.filterStatus;
      document.querySelectorAll('[data-filter-status]').forEach((b) => {
        b.classList.toggle('active', b.dataset.filterStatus === state.status);
      });
      onChange?.(state);
    });
  });
  const equipSelect = document.getElementById('filtro-equipamento');
  if (equipSelect) {
    equipSelect.addEventListener('change', () => {
      state.equipamento = equipSelect.value;
      onChange?.(state);
    });
  }
  const ordenarSelect = document.getElementById('ordenar-por');
  if (ordenarSelect) {
    ordenarSelect.addEventListener('change', () => {
      state.ordenarPor = ordenarSelect.value;
      onChange?.(state);
    });
  }
  const dirBtn = document.getElementById('btn-direcao');
  if (dirBtn) {
    dirBtn.addEventListener('click', () => {
      state.direcao = state.direcao === 'asc' ? 'desc' : 'asc';
      dirBtn.innerHTML =
        state.direcao === 'asc'
          ? '<i class="fa-solid fa-arrow-up-short-wide"></i>'
          : '<i class="fa-solid fa-arrow-down-wide-short"></i>';
      onChange?.(state);
    });
  }
}

export function popularEquipamentos(modelos) {
  const select = document.getElementById('filtro-equipamento');
  if (!select) return;
  const current = select.value;
  select.replaceChildren();
  const optAll = document.createElement('option');
  optAll.value = 'todos';
  optAll.textContent = 'Todos os equipamentos';
  select.appendChild(optAll);
  modelos.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  });
  if ([...select.options].some((o) => o.value === current)) select.value = current;
}
