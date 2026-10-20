export function formatPhone(tel) {
  if (!tel || tel === 'SEM DADO') return '—';
  return tel;
}

export function formatDateBR(iso) {
  if (!iso) return '—';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}
