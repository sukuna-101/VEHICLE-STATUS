/**
 * Autenticação local compartilhada (IndexedDB + sessionStorage)
 * Sites com senha: admin, tecnico, cliente
 * Site usuario: sem senha (acesso livre somente leitura)
 */
import { CONFIG, ROLES, PERMISSIONS, ROLE_LABELS } from '../config.js';

const DEFAULT_USERS = [
  {
    id: 1,
    username: 'admin',
    plainSeed: 'admin123',
    nome: 'Administrador',
    role: ROLES.ADMIN,
    clienteNome: null,
    active: true,
  },
  {
    id: 2,
    username: 'tecnico',
    plainSeed: 'tec123',
    nome: 'Técnico Demo',
    role: ROLES.TECNICO,
    clienteNome: null,
    active: true,
  },
  {
    id: 3,
    username: 'cliente',
    plainSeed: 'cli123',
    nome: 'Cliente Demo',
    role: ROLES.CLIENTE,
    clienteNome: 'MARCIO BRITO',
    active: true,
  },
];

async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(String(password) + '::vs-salt-v22');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

let dbPromise = null;

function openAuthDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(CONFIG.STORE_NAME)) {
        const store = db.createObjectStore(CONFIG.STORE_NAME, { keyPath: 'id' });
        store.createIndex('serial', 'serial', { unique: true });
        store.createIndex('nome', 'nome', { unique: false });
      }
      if (!db.objectStoreNames.contains(CONFIG.META_STORE)) {
        db.createObjectStore(CONFIG.META_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(CONFIG.USERS_STORE)) {
        const users = db.createObjectStore(CONFIG.USERS_STORE, { keyPath: 'id' });
        users.createIndex('username', 'username', { unique: true });
      }
    };
  });
  return dbPromise;
}

async function getAllUsers() {
  const db = await openAuthDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG.USERS_STORE, 'readonly');
    const req = tx.objectStore(CONFIG.USERS_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function putUser(user) {
  const db = await openAuthDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG.USERS_STORE, 'readwrite');
    tx.objectStore(CONFIG.USERS_STORE).put(user);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteUserById(id) {
  const db = await openAuthDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG.USERS_STORE, 'readwrite');
    tx.objectStore(CONFIG.USERS_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function ensureUsersSeeded() {
  const db = await openAuthDB();
  const count = await new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG.USERS_STORE, 'readonly');
    const req = tx.objectStore(CONFIG.USERS_STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (count > 0) return false;

  for (const u of DEFAULT_USERS) {
    const passwordHash = await hashPassword(u.plainSeed);
    const { plainSeed, ...rest } = u;
    await putUser({ ...rest, passwordHash, createdAt: new Date().toISOString() });
  }
  return true;
}

/**
 * Login — só para papéis que exigem senha (admin, tecnico, cliente)
 * expectedRole: o site só aceita login desse papel
 */
export async function login(username, password, expectedRole) {
  await ensureUsersSeeded();
  const users = await getAllUsers();
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === String(username).trim().toLowerCase() &&
      u.active !== false
  );
  if (!user) throw new Error('Usuário ou senha inválidos.');
  if (expectedRole && user.role !== expectedRole) {
    throw new Error(`Este portal é exclusivo para ${ROLE_LABELS[expectedRole]}. Use o site correto.`);
  }
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) throw new Error('Usuário ou senha inválidos.');

  const session = {
    id: user.id,
    username: user.username,
    nome: user.nome,
    role: user.role,
    clienteNome: user.clienteNome || null,
    loggedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));
  return session;
}

/** Acesso livre ao portal Usuário (sem senha) */
export function enterAsUsuario() {
  const session = {
    id: 0,
    username: 'visitante',
    nome: 'Visitante',
    role: ROLES.USUARIO,
    clienteNome: null,
    loggedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  sessionStorage.removeItem(CONFIG.SESSION_KEY);
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(CONFIG.SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getSession();
}

export function getPermissions() {
  const session = getSession();
  if (!session) return null;
  return PERMISSIONS[session.role] || PERMISSIONS[ROLES.USUARIO];
}

export function can(action) {
  const perms = getPermissions();
  if (!perms) return false;
  return !!perms[action];
}

export function canEditRecord(cliente) {
  const session = getSession();
  const perms = getPermissions();
  if (!session || !perms) return false;
  if (!perms.edit) return false;
  if (perms.editOwnOnly) {
    return cliente.createdBy === session.id || cliente.createdByUsername === session.username;
  }
  return true;
}

export function canDeleteRecord() {
  return can('delete');
}

export function filterVisibleRecords(lista) {
  const session = getSession();
  const perms = getPermissions();
  if (!session || !perms) return [];
  if (perms.ownRecordsOnly && session.clienteNome) {
    const target = session.clienteNome.toLowerCase().trim();
    return lista.filter((c) => (c.nome || '').toLowerCase().includes(target));
  }
  return lista;
}

export async function listUsers() {
  await ensureUsersSeeded();
  const users = await getAllUsers();
  return users.map(({ passwordHash, ...rest }) => rest);
}

export async function createUser({ username, password, nome, role, clienteNome }) {
  await ensureUsersSeeded();
  // Só admin/tecnico/cliente — usuario NÃO tem conta com senha
  if (role === ROLES.USUARIO) {
    throw new Error('O portal Usuário não usa senha. Não crie conta desse tipo.');
  }
  const users = await getAllUsers();
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('Nome de usuário já existe.');
  }
  if (![ROLES.ADMIN, ROLES.TECNICO, ROLES.CLIENTE].includes(role)) {
    throw new Error('Papel inválido.');
  }
  if (!password || password.length < 4) {
    throw new Error('Senha deve ter pelo menos 4 caracteres.');
  }
  const maxId = users.reduce((m, u) => Math.max(m, u.id), 0);
  const user = {
    id: maxId + 1,
    username: String(username).trim().toLowerCase(),
    passwordHash: await hashPassword(password),
    nome: String(nome || username).trim(),
    role,
    clienteNome: role === ROLES.CLIENTE ? String(clienteNome || '').trim() : null,
    active: true,
    createdAt: new Date().toISOString(),
  };
  await putUser(user);
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function updateUser(id, data) {
  const users = await getAllUsers();
  const existing = users.find((u) => u.id === id);
  if (!existing) throw new Error('Usuário não encontrado.');

  if (data.username) {
    const clash = users.find(
      (u) => u.id !== id && u.username.toLowerCase() === data.username.toLowerCase()
    );
    if (clash) throw new Error('Nome de usuário já existe.');
    existing.username = String(data.username).trim().toLowerCase();
  }
  if (data.nome != null) existing.nome = String(data.nome).trim();
  if (data.role) {
    if (![ROLES.ADMIN, ROLES.TECNICO, ROLES.CLIENTE].includes(data.role)) {
      throw new Error('Papel inválido.');
    }
    existing.role = data.role;
  }
  if (data.clienteNome != null) {
    existing.clienteNome = existing.role === ROLES.CLIENTE ? String(data.clienteNome).trim() : null;
  }
  if (data.active != null) existing.active = !!data.active;
  if (data.password && data.password.length >= 4) {
    existing.passwordHash = await hashPassword(data.password);
  }
  await putUser(existing);
  const { passwordHash, ...safe } = existing;
  return safe;
}

export async function removeUser(id) {
  const session = getSession();
  if (session && session.id === id) {
    throw new Error('Você não pode excluir a si mesmo.');
  }
  await deleteUserById(id);
}

export { ROLE_LABELS, ROLES };
