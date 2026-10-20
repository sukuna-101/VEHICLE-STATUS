import { CONFIG } from '../config.js';
import { calcularStatus } from '../services/garantia.service.js';
import { formatDateBR, formatPhone } from '../utils/formatters.js';
import * as auth from '../services/auth.service.js';

let currentPage = 1;
let currentList = [];
let onAction = null;

export function setActionHandler(fn) {
  onAction = fn;
}

export function renderTabela(lista, page = 1) {
  currentList = lista;
  currentPage = page;
  const total = lista.length;
  const pageSize = CONFIG.PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * pageSize;
  const slice = lista.slice(start, start + pageSize);
  const tbody = document.getElementById('tbody');
  if (!tbody) return;

  const frag = document.createDocumentFragment();
  if (slice.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 8;
    td.className = 'empty-row';
    td.textContent = 'Nenhum registro encontrado.';
    tr.appendChild(td);
    frag.appendChild(tr);
  } else {
    for (const c of slice) frag.appendChild(createRow(c));
  }
  tbody.replaceChildren(frag);

  const contagem = document.getElementById('contagem');
  if (contagem) contagem.textContent = `${total.toLocaleString('pt-BR')} registro${total !== 1 ? 's' : ''}`;
  renderPaginacao(totalPages);
}

function createRow(c) {
  const st = calcularStatus(c.vencimento);
  const tr = document.createElement('tr');
  tr.className = 'table-row';

  const cells = [
    { text: c.serial, className: 'cell-serial' },
    { text: c.nome || '—', className: 'cell-nome' },
    { text: c.equipamento || '—', className: 'cell-equip' },
    { text: formatDateBR(c.data), className: 'cell-date' },
    { text: formatDateBR(c.vencimento), className: 'cell-date' },
  ];
  cells.forEach(({ text, className }) => {
    const td = document.createElement('td');
    td.className = className;
    td.textContent = text;
    tr.appendChild(td);
  });

  const tdStatus = document.createElement('td');
  tdStatus.className = 'cell-status';
  const badge = document.createElement('span');
  badge.className = `status-badge ${st.classe}`;
  badge.textContent = st.texto;
  tdStatus.appendChild(badge);
  tr.appendChild(tdStatus);

  const tdTel = document.createElement('td');
  tdTel.className = 'cell-tel';
  tdTel.textContent = formatPhone(c.tel);
  tr.appendChild(tdTel);

  const tdAcoes = document.createElement('td');
  tdAcoes.className = 'cell-acoes';
  tdAcoes.appendChild(btnIcon('fa-eye', 'Ver detalhes', () => onAction?.('view', c)));
  if (auth.canEditRecord(c)) {
    tdAcoes.appendChild(btnIcon('fa-pen', 'Editar', () => onAction?.('edit', c)));
  }
  if (auth.canDeleteRecord()) {
    tdAcoes.appendChild(btnIcon('fa-trash', 'Excluir', () => onAction?.('delete', c), 'danger'));
  }
  tr.appendChild(tdAcoes);
  return tr;
}

function btnIcon(icon, label, handler, extraClass = '') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `action-btn ${extraClass}`;
  btn.setAttribute('aria-label', label);
  btn.title = label;
  const i = document.createElement('i');
  i.className = `fa-solid ${icon}`;
  btn.appendChild(i);
  btn.addEventListener('click', (e) => { e.stopPropagation(); handler(); });
  return btn;
}

function renderPaginacao(totalPages) {
  const el = document.getElementById('paginacao');
  if (!el) return;
  el.replaceChildren();
  if (totalPages <= 1) return;
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'page-btn';
  prev.textContent = '← Anterior';
  prev.disabled = currentPage <= 1;
  prev.addEventListener('click', () => renderTabela(currentList, currentPage - 1));
  el.appendChild(prev);
  const info = document.createElement('span');
  info.className = 'page-info';
  info.textContent = `Página ${currentPage} de ${totalPages}`;
  el.appendChild(info);
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'page-btn';
  next.textContent = 'Próxima →';
  next.disabled = currentPage >= totalPages;
  next.addEventListener('click', () => renderTabela(currentList, currentPage + 1));
  el.appendChild(next);
}
