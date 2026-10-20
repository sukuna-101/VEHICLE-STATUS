import { normalizeSerial } from '../utils/validators.js';
import { isValidISODate } from '../utils/dates.js';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportarCSV(lista) {
  const headers = ['id', 'serial', 'nome', 'tel', 'equipamento', 'data', 'vencimento'];
  const rows = [headers.join(';')];
  for (const c of lista) {
    const line = headers.map((h) => {
      let v = String(c[h] ?? '').replace(/"/g, '""');
      if (v.includes(';') || v.includes('"') || v.includes('\n')) v = `"${v}"`;
      return v;
    });
    rows.push(line.join(';'));
  }
  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `vehicle-status-export-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportarJSON(lista) {
  const payload = {
    app: 'VEHICLE STATUS',
    version: '2.2.0',
    exportedAt: new Date().toISOString(),
    count: lista.length,
    clientes: lista,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `vehicle-status-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

export function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = splitCSVLine(lines[0], sep).map((h) => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i], sep);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (cols[idx] || '').trim(); });
    rows.push(obj);
  }
  return { headers, rows };
}

function splitCSVLine(line, sep) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current);
      current = '';
    } else current += ch;
  }
  result.push(current);
  return result;
}

export function processarImportacao(rawList, existentes) {
  const existentesSerial = new Map(existentes.map((c) => [c.serial.toUpperCase(), c]));
  const aceitos = [];
  const rejeitados = [];
  const duplicados = [];
  const seen = new Set();

  for (const raw of rawList) {
    const serial = normalizeSerial(raw.serial || raw.SERIAL || '');
    if (!serial || serial.length < 3) {
      rejeitados.push({ raw, motivo: 'Serial inválido ou ausente' });
      continue;
    }
    if (seen.has(serial)) {
      rejeitados.push({ raw, motivo: 'Serial duplicado no arquivo' });
      continue;
    }
    seen.add(serial);
    if (existentesSerial.has(serial)) {
      duplicados.push({ serial, existente: existentesSerial.get(serial), raw });
      continue;
    }
    const data = raw.data || raw.DATA || '';
    const venc = raw.vencimento || raw.VENCIMENTO || '';
    if (data && !isValidISODate(data)) {
      rejeitados.push({ raw, motivo: 'Data de cadastro inválida' });
      continue;
    }
    if (venc && !isValidISODate(venc)) {
      rejeitados.push({ raw, motivo: 'Data de vencimento inválida' });
      continue;
    }
    aceitos.push({
      id: Number(raw.id) || Date.now() + Math.floor(Math.random() * 10000),
      serial,
      nome: (raw.nome || raw.NOME || '').trim() || 'Cliente sem nome',
      tel: (raw.tel || raw.TELEFONE || raw.phone || 'SEM DADO').trim(),
      equipamento: (raw.equipamento || raw.EQUIPAMENTO || '').trim() || 'Não informado',
      data: data || '',
      vencimento: venc || '',
      createdBy: null,
      createdByUsername: null,
    });
  }
  return { aceitos, rejeitados, duplicados };
}

export function lerArquivoTexto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'UTF-8');
  });
}
