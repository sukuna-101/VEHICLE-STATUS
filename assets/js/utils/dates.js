export function parseISODate(str) {
  if (!str || typeof str !== 'string') return null;
  const m = str.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const d = parseInt(m[3], 10);
  const date = new Date(y, mo, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return null;
  return date;
}

export function todayLocal() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function daysBetween(fromDate, toDate) {
  const a = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const b = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.round((b - a) / 86400000);
}

export function toISODate(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addYearsISO(iso, years = 2) {
  const d = parseISODate(iso);
  if (!d) return '';
  d.setFullYear(d.getFullYear() + years);
  return toISODate(d);
}

export function isValidISODate(str) {
  return parseISODate(str) !== null;
}
