import { CONFIG, STATUS, STATUS_CLASS } from '../config.js';
import { parseISODate, todayLocal, daysBetween } from '../utils/dates.js';

export function calcularStatus(vencimentoStr, alertDays = CONFIG.ALERT_DAYS) {
  if (!vencimentoStr || vencimentoStr === 'SEM DADO') {
    return { texto: STATUS.REVISAO, classe: STATUS_CLASS[STATUS.REVISAO], dias: null, status: STATUS.REVISAO };
  }
  const venc = parseISODate(vencimentoStr);
  if (!venc) {
    return { texto: STATUS.REVISAO, classe: STATUS_CLASS[STATUS.REVISAO], dias: null, status: STATUS.REVISAO };
  }
  const hoje = todayLocal();
  const dias = daysBetween(hoje, venc);
  if (dias < 0) {
    return { texto: STATUS.VENCIDO, classe: STATUS_CLASS[STATUS.VENCIDO], dias, status: STATUS.VENCIDO };
  }
  if (dias <= alertDays) {
    return { texto: `${STATUS.AVENCER} (${dias}d)`, classe: STATUS_CLASS[STATUS.AVENCER], dias, status: STATUS.AVENCER };
  }
  return { texto: STATUS.LIBERADO, classe: STATUS_CLASS[STATUS.LIBERADO], dias, status: STATUS.LIBERADO };
}

export function calcularIndicadores(lista, alertDays = CONFIG.ALERT_DAYS) {
  let total = 0, liberado = 0, avencer = 0, vencido = 0, revisao = 0, proximos7 = 0, proximos30 = 0;
  for (const c of lista) {
    total++;
    const st = calcularStatus(c.vencimento, alertDays);
    if (st.status === STATUS.LIBERADO) liberado++;
    else if (st.status === STATUS.AVENCER) avencer++;
    else if (st.status === STATUS.VENCIDO) vencido++;
    else revisao++;
    if (st.dias !== null && st.dias >= 0 && st.dias <= 7) proximos7++;
    if (st.dias !== null && st.dias >= 0 && st.dias <= 30) proximos30++;
  }
  return { total, liberado, avencer, vencido, revisao, proximos7, proximos30 };
}
