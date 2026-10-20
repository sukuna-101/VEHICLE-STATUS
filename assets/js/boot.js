/**
 * Bootstrap compartilhado — cada site passa o role esperado
 */
import { CONFIG, ROLE_LABELS, ROLES } from './config.js';
import * as storage from './services/storage.service.js';
import * as clienteService from './services/cliente.service.js';
import * as auth from './services/auth.service.js';
import { calcularStatus } from './services/garantia.service.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderTabela, setActionHandler } from './modules/tabela.js';
import { initBusca, getTermoBusca } from './modules/busca.js';
import { initFiltros, getFiltros, popularEquipamentos } from './modules/filtros.js';
import { initModalClose } from './modules/modal.js';
import {
  initFormularios,
  abrirEdicao,
  abrirDetalhe,
  confirmarExclusao,
} from './modules/formularios.js';
import { initImportacao } from './modules/importacao.js';
import { initUsuarios } from './modules/usuarios.js';
import { error as notifyError, info, success } from './modules/notificacoes.js';

let cacheLista = [];
let siteRole = null;

function showLogin() {
  document.getElementById('login-screen')?.classList.remove('hidden');
  document.getElementById('app-shell')?.classList.add('hidden');
}

function showApp() {
  document.getElementById('login-screen')?.classList.add('hidden');
  document.getElementById('app-shell')?.classList.remove('hidden');
  applyRoleUI();
}

function applyRoleUI() {
  const session = auth.getSession();
  const perms = auth.getPermissions();
  if (!session || !perms) return;

  const userLabel = document.getElementById('user-label');
  if (userLabel) {
    userLabel.textContent = `${session.nome} · ${ROLE_LABELS[session.role] || session.role}`;
  }

  const setVis = (id, show) => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? '' : 'none';
  };
  setVis('btn-novo', perms.create);
  setVis('btn-abrir-import', perms.importExport);
  setVis('btn-usuarios', perms.manageUsers);
}

async function carregarDados() {
  try {
    let lista = await storage.getAll();
    lista = auth.filterVisibleRecords(lista);
    cacheLista = lista;
    popularEquipamentos(clienteService.extrairModelos(cacheLista));
    aplicarFiltrosERender();
  } catch (err) {
    console.error(err);
    notifyError('Falha ao carregar dados.');
  }
}

function aplicarFiltrosERender() {
  const termo = getTermoBusca();
  const filtros = getFiltros();
  let lista = clienteService.filtrarTexto(cacheLista, termo);
  lista = clienteService.filtrarPorStatus(lista, filtros.status, calcularStatus);
  lista = clienteService.filtrarPorEquipamento(lista, filtros.equipamento);
  lista = clienteService.ordenar(lista, filtros.ordenarPor, filtros.direcao);
  renderDashboard(cacheLista);
  renderTabela(lista, 1);
}

function onDataChanged() {
  carregarDados();
}

function handleAction(type, cliente) {
  if (type === 'view') {
    abrirDetalhe(cliente, calcularStatus(cliente.vencimento).texto);
  } else if (type === 'edit') {
    abrirEdicao(cliente);
  } else if (type === 'delete') {
    confirmarExclusao(cliente);
  }
}

function initLoginForm() {
  const form = document.getElementById('form-login');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.textContent = '';
    try {
      await auth.login(username, password, siteRole);
      success('Login realizado!');
      showApp();
      await bootApp();
    } catch (err) {
      if (errEl) errEl.textContent = err.message || 'Falha no login.';
    }
  });
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    auth.logout();
    if (siteRole === ROLES.USUARIO) {
      // usuario sem senha — volta e reentra livre
      location.reload();
    } else {
      showLogin();
    }
  });
}

async function bootApp() {
  const ver = document.getElementById('app-version');
  if (ver) ver.textContent = `v${CONFIG.VERSION}`;
  initModalClose();
  initBusca(() => aplicarFiltrosERender());
  initFiltros(() => aplicarFiltrosERender());
  initFormularios(onDataChanged);
  initImportacao(onDataChanged);
  initUsuarios();
  setActionHandler(handleAction);
  applyRoleUI();
  info('Carregando base de dados…');
  await carregarDados();
}

/**
 * @param {string} role - ROLES.ADMIN | TECNICO | USUARIO | CLIENTE
 * @param {{ requireLogin?: boolean }} options
 */
export async function startSite(role, options = {}) {
  siteRole = role;
  const requireLogin = options.requireLogin !== false && role !== ROLES.USUARIO;

  await auth.ensureUsersSeeded();
  initLoginForm();

  if (role === ROLES.USUARIO) {
    // Portal público — sem senha
    auth.enterAsUsuario();
    showApp();
    await bootApp();
    return;
  }

  const session = auth.getSession();
  if (session && session.role === role) {
    showApp();
    await bootApp();
  } else {
    if (session && session.role !== role) auth.logout();
    showLogin();
  }
}
