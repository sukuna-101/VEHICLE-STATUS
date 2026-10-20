import * as auth from '../services/auth.service.js';
import { ROLES, ROLE_LABELS } from '../config.js';
import { abrirModal, fecharModal } from './modal.js';
import { success, error } from './notificacoes.js';

export function initUsuarios() {
  document.getElementById('btn-usuarios')?.addEventListener('click', () => {
    if (!auth.can('manageUsers')) { error('Sem permissão.'); return; }
    abrirGestao();
  });
  document.getElementById('form-usuario')?.addEventListener('submit', handleSaveUser);
  document.getElementById('btn-novo-usuario')?.addEventListener('click', () => abrirFormUsuario());
}

async function abrirGestao() {
  await renderListaUsuarios();
  abrirModal('modal-usuarios');
}

async function renderListaUsuarios() {
  const container = document.getElementById('lista-usuarios');
  if (!container) return;
  container.replaceChildren();
  const users = await auth.listUsers();
  users.forEach((u) => {
    const row = document.createElement('div');
    row.className = 'user-row';
    const info = document.createElement('div');
    info.className = 'user-info';
    const name = document.createElement('strong');
    name.textContent = u.nome || u.username;
    const meta = document.createElement('span');
    meta.className = 'user-meta';
    meta.textContent = `@${u.username} · ${ROLE_LABELS[u.role] || u.role}${u.clienteNome ? ' · ' + u.clienteNome : ''}`;
    info.append(name, meta);
    const actions = document.createElement('div');
    actions.className = 'user-actions';
    const btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.className = 'action-btn';
    btnEdit.innerHTML = '<i class="fa-solid fa-pen"></i>';
    btnEdit.addEventListener('click', () => abrirFormUsuario(u));
    const btnDel = document.createElement('button');
    btnDel.type = 'button';
    btnDel.className = 'action-btn danger';
    btnDel.innerHTML = '<i class="fa-solid fa-trash"></i>';
    btnDel.addEventListener('click', async () => {
      if (!confirm(`Excluir @${u.username}?`)) return;
      try {
        await auth.removeUser(u.id);
        success('Usuário excluído.');
        await renderListaUsuarios();
      } catch (err) {
        error(err.message);
      }
    });
    actions.append(btnEdit, btnDel);
    row.append(info, actions);
    container.appendChild(row);
  });
}

function abrirFormUsuario(user = null) {
  document.getElementById('form-usuario').reset();
  document.getElementById('user-edit-id').value = user?.id || '';
  document.getElementById('user-form-title').textContent = user ? 'Editar Usuário' : 'Novo Usuário';
  document.getElementById('user-username').value = user?.username || '';
  document.getElementById('user-nome').value = user?.nome || '';
  document.getElementById('user-role').value = user?.role || ROLES.TECNICO;
  document.getElementById('user-cliente-nome').value = user?.clienteNome || '';
  document.getElementById('user-password').value = '';
  document.getElementById('user-password').required = !user;
  toggleClienteNome();
  document.getElementById('user-role').onchange = toggleClienteNome;
  abrirModal('modal-user-form');
}

function toggleClienteNome() {
  const role = document.getElementById('user-role').value;
  const wrap = document.getElementById('wrap-cliente-nome');
  if (wrap) wrap.style.display = role === ROLES.CLIENTE ? 'block' : 'none';
}

async function handleSaveUser(e) {
  e.preventDefault();
  const id = document.getElementById('user-edit-id').value;
  const data = {
    username: document.getElementById('user-username').value,
    nome: document.getElementById('user-nome').value,
    role: document.getElementById('user-role').value,
    clienteNome: document.getElementById('user-cliente-nome').value,
    password: document.getElementById('user-password').value,
  };
  try {
    if (id) {
      await auth.updateUser(Number(id), data);
      success('Usuário atualizado.');
    } else {
      await auth.createUser(data);
      success('Usuário criado.');
    }
    fecharModal('modal-user-form');
    await renderListaUsuarios();
  } catch (err) {
    error(err.message || 'Erro ao salvar.');
  }
}
