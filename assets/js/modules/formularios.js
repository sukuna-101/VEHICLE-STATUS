import { abrirModal, fecharModal } from './modal.js';
import * as clienteService from '../services/cliente.service.js';
import * as auth from '../services/auth.service.js';
import { success, error } from './notificacoes.js';
import { toISODate, todayLocal, addYearsISO } from '../utils/dates.js';

let onDataChanged = null;
let editingId = null;

export function initFormularios(callback) {
  onDataChanged = callback;
  document.getElementById('form-cliente')?.addEventListener('submit', handleSubmit);
  document.getElementById('btn-novo')?.addEventListener('click', () => abrirNovo());
  document.getElementById('btn-confirm-delete')?.addEventListener('click', handleDelete);
}

export function abrirNovo() {
  if (!auth.can('create')) { error('Sem permissão para criar.'); return; }
  editingId = null;
  document.getElementById('modal-titulo').textContent = 'Novo Registro de Serial';
  document.getElementById('form-cliente').reset();
  document.getElementById('campo-id').value = '';
  document.getElementById('campo-data').value = toISODate(todayLocal());
  document.getElementById('campo-vencimento').value = addYearsISO(toISODate(todayLocal()), 2);
  abrirModal('modal-cliente');
}

export function abrirEdicao(cliente) {
  if (!auth.canEditRecord(cliente)) { error('Sem permissão para editar este registro.'); return; }
  editingId = cliente.id;
  document.getElementById('modal-titulo').textContent = 'Editar Registro';
  document.getElementById('campo-id').value = cliente.id;
  document.getElementById('campo-serial').value = cliente.serial || '';
  document.getElementById('campo-nome').value = cliente.nome || '';
  document.getElementById('campo-tel').value = cliente.tel === 'SEM DADO' ? '' : (cliente.tel || '');
  document.getElementById('campo-equip').value = cliente.equipamento || '';
  document.getElementById('campo-data').value = cliente.data || '';
  document.getElementById('campo-vencimento').value = cliente.vencimento || '';
  abrirModal('modal-cliente');
}

export function abrirDetalhe(cliente, statusTexto) {
  const body = document.getElementById('detalhe-body');
  if (!body) return;
  body.replaceChildren();
  const fields = [
    ['Serial', cliente.serial],
    ['Cliente', cliente.nome],
    ['Telefone', cliente.tel],
    ['Equipamento', cliente.equipamento],
    ['Cadastro', cliente.data],
    ['Vencimento', cliente.vencimento],
    ['Status', statusTexto],
  ];
  fields.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'detalhe-row';
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value || '—';
    row.append(dt, dd);
    body.appendChild(row);
  });
  abrirModal('modal-detalhe');
}

export function confirmarExclusao(cliente) {
  if (!auth.canDeleteRecord()) { error('Sem permissão para excluir.'); return; }
  document.getElementById('delete-id').value = cliente.id;
  document.getElementById('delete-serial').textContent = cliente.serial;
  document.getElementById('delete-nome').textContent = cliente.nome || '—';
  abrirModal('modal-delete');
}

async function handleSubmit(e) {
  e.preventDefault();
  const dados = {
    serial: document.getElementById('campo-serial').value,
    nome: document.getElementById('campo-nome').value,
    tel: document.getElementById('campo-tel').value || 'SEM DADO',
    equipamento: document.getElementById('campo-equip').value,
    data: document.getElementById('campo-data').value,
    vencimento: document.getElementById('campo-vencimento').value,
  };
  try {
    if (editingId) {
      await clienteService.atualizar(editingId, dados);
      success('Registro atualizado.');
    } else {
      await clienteService.criar(dados);
      success('Registro cadastrado.');
    }
    fecharModal('modal-cliente');
    onDataChanged?.();
  } catch (err) {
    error(err.message || 'Erro ao salvar.');
  }
}

async function handleDelete() {
  const id = Number(document.getElementById('delete-id').value);
  try {
    await clienteService.excluir(id);
    success('Registro excluído.');
    fecharModal('modal-delete');
    onDataChanged?.();
  } catch (err) {
    error(err.message || 'Erro ao excluir.');
  }
}
