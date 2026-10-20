import * as storage from './storage.service.js';
import * as auth from './auth.service.js';
import { validateCliente } from '../utils/validators.js';
import { addYearsISO, toISODate, todayLocal } from '../utils/dates.js';

export async function criar(dados) {
  const perms = auth.getPermissions();
  if (!perms?.create) throw new Error('Sem permissão para criar registros.');

  const { valid, errors, normalized } = validateCliente(dados);
  if (!valid) throw new Error(errors.join(' '));
  if (await storage.serialExists(normalized.serial)) {
    throw new Error(`O serial "${normalized.serial}" já está cadastrado.`);
  }

  const session = auth.getSession();
  const dataCad = normalized.data || toISODate(todayLocal());
  const venc = normalized.vencimento || addYearsISO(dataCad, 2);

  const novo = {
    id: Date.now(),
    serial: normalized.serial,
    nome: normalized.nome,
    tel: normalized.tel,
    equipamento: normalized.equipamento,
    data: dataCad,
    vencimento: venc,
    createdBy: session?.id ?? null,
    createdByUsername: session?.username ?? null,
  };
  await storage.put(novo);
  return novo;
}

export async function atualizar(id, dados) {
  const existente = await storage.getById(id);
  if (!existente) throw new Error('Registro não encontrado.');
  if (!auth.canEditRecord(existente)) throw new Error('Sem permissão para editar este registro.');

  const { valid, errors, normalized } = validateCliente(dados);
  if (!valid) throw new Error(errors.join(' '));
  if (await storage.serialExists(normalized.serial, id)) {
    throw new Error(`O serial "${normalized.serial}" já está cadastrado em outro registro.`);
  }

  const atualizado = {
    ...existente,
    serial: normalized.serial,
    nome: normalized.nome,
    tel: normalized.tel,
    equipamento: normalized.equipamento,
    data: normalized.data || existente.data,
    vencimento: normalized.vencimento || existente.vencimento,
  };
  await storage.put(atualizado);
  return atualizado;
}

export async function excluir(id) {
  if (!auth.canDeleteRecord()) throw new Error('Sem permissão para excluir registros.');
  const existente = await storage.getById(id);
  if (!existente) throw new Error('Registro não encontrado.');
  await storage.remove(id);
  return existente;
}

export function filtrarTexto(lista, termo) {
  if (!termo || !termo.trim()) return lista;
  const t = termo.trim().toLowerCase().replace(/\s+/g, ' ');
  return lista.filter((c) => {
    const campos = [c.serial, c.nome, c.tel, c.equipamento, c.data, c.vencimento].map((v) =>
      (v || '').toString().toLowerCase()
    );
    return campos.some((campo) => campo.includes(t));
  });
}

export function filtrarPorStatus(lista, statusKey, calcularStatusFn) {
  if (!statusKey || statusKey === 'todos') return lista;
  return lista.filter((c) => {
    const st = calcularStatusFn(c.vencimento);
    if (statusKey === 'liberado') return st.status === 'LIBERADO';
    if (statusKey === 'avencer') return st.status === 'A VENCER';
    if (statusKey === 'vencido') return st.status === 'VENCIDO';
    if (statusKey === 'revisao') return st.status === 'REVISÃO';
    return true;
  });
}

export function filtrarPorEquipamento(lista, modelo) {
  if (!modelo || modelo === 'todos') return lista;
  const m = modelo.toLowerCase();
  return lista.filter((c) => (c.equipamento || '').toLowerCase().includes(m));
}

export function ordenar(lista, campo, direcao = 'asc') {
  const dir = direcao === 'desc' ? -1 : 1;
  const copy = [...lista];
  copy.sort((a, b) => {
    let va = a[campo] ?? '';
    let vb = b[campo] ?? '';
    if (campo === 'data' || campo === 'vencimento') {
      va = va || '0000-00-00';
      vb = vb || '0000-00-00';
    }
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });
  return copy;
}

export function extrairModelos(lista) {
  const set = new Set();
  lista.forEach((c) => {
    if (c.equipamento) set.add(c.equipamento.trim());
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
