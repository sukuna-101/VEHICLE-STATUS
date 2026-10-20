import { isValidISODate } from './dates.js';

export function normalizeSerial(serial) {
  if (serial == null) return '';
  return String(serial).trim().toUpperCase();
}

export function isValidSerial(serial) {
  const s = normalizeSerial(serial);
  return s.length >= 3 && s.length <= 40 && /^[A-Z0-9\-_.]+$/i.test(s);
}

export function normalizePhone(tel) {
  if (!tel || tel === 'SEM DADO') return 'SEM DADO';
  return String(tel).trim();
}

export function normalizeName(nome) {
  if (!nome) return '';
  return String(nome).trim().replace(/\s+/g, ' ');
}

export function validateCliente(data, { requireSerial = true } = {}) {
  const errors = [];
  const serial = normalizeSerial(data.serial);
  if (requireSerial && !isValidSerial(serial)) {
    errors.push('Serial é obrigatório e deve conter apenas letras, números e hífens (3-40 caracteres).');
  }
  if (data.data && !isValidISODate(data.data)) {
    errors.push('Data de cadastro inválida. Use o formato AAAA-MM-DD.');
  }
  if (data.vencimento && !isValidISODate(data.vencimento)) {
    errors.push('Data de vencimento inválida. Use o formato AAAA-MM-DD.');
  }
  return {
    valid: errors.length === 0,
    errors,
    normalized: {
      serial,
      nome: normalizeName(data.nome) || 'Cliente sem nome',
      tel: normalizePhone(data.tel),
      equipamento: (data.equipamento || '').trim() || 'Não informado',
      data: data.data || '',
      vencimento: data.vencimento || '',
    },
  };
}
