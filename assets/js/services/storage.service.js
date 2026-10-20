import { CONFIG } from '../config.js';
import { CLIENTES_ORIGINALS } from '../data/clientes.js';

let dbPromise = null;

function openDB() {
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

async function getMeta(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG.META_STORE, 'readonly');
    const req = tx.objectStore(CONFIG.META_STORE).get(key);
    req.onsuccess = () => resolve(req.result?.value);
    req.onerror = () => reject(req.error);
  });
}

async function setMeta(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG.META_STORE, 'readwrite');
    tx.objectStore(CONFIG.META_STORE).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function ensureMigrated() {
  const migrated = await getMeta('migrated_v2');
  if (migrated) return false;

  const db = await openDB();
  const count = await new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG.STORE_NAME, 'readonly');
    const req = tx.objectStore(CONFIG.STORE_NAME).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (count === 0) {
    await bulkPut(CLIENTES_ORIGINALS.map(normalizeRecord));
  }
  await setMeta('migrated_v2', true);
  await setMeta('schema_version', 2);
  return true;
}

function normalizeRecord(c) {
  return {
    id: c.id,
    serial: String(c.serial || '').trim(),
    nome: c.nome || '',
    tel: c.tel || 'SEM DADO',
    equipamento: c.equipamento || '',
    data: c.data || '',
    vencimento: c.vencimento || '',
    createdBy: c.createdBy ?? null,
    createdByUsername: c.createdByUsername ?? null,
  };
}

export async function getAll() {
  await ensureMigrated();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG.STORE_NAME, 'readonly');
    const req = tx.objectStore(CONFIG.STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG.STORE_NAME, 'readonly');
    const req = tx.objectStore(CONFIG.STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function put(cliente) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG.STORE_NAME, 'readwrite');
    const req = tx.objectStore(CONFIG.STORE_NAME).put(cliente);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function remove(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG.STORE_NAME, 'readwrite');
    const req = tx.objectStore(CONFIG.STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function bulkPut(registros) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG.STORE_NAME, 'readwrite');
    const store = tx.objectStore(CONFIG.STORE_NAME);
    for (const r of registros) store.put(r);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG.STORE_NAME, 'readwrite');
    const req = tx.objectStore(CONFIG.STORE_NAME).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function replaceAll(registros) {
  await clearAll();
  await bulkPut(registros.map(normalizeRecord));
}

export async function serialExists(serial, excludeId = null) {
  const all = await getAll();
  const target = String(serial).trim().toUpperCase();
  return all.some((c) => c.serial.toUpperCase() === target && c.id !== excludeId);
}
