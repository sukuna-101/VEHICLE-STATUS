import { calcularIndicadores } from '../services/garantia.service.js';

export function renderDashboard(lista) {
  const ind = calcularIndicadores(lista);
  const map = {
    'kpi-total': ind.total,
    'kpi-liberado': ind.liberado,
    'kpi-avencer': ind.avencer,
    'kpi-vencido': ind.vencido,
    'kpi-7dias': ind.proximos7,
    'kpi-30dias': ind.proximos30,
  };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val.toLocaleString('pt-BR');
  });
}
