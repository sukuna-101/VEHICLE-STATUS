import * as exportService from '../services/export.service.js';
import * as storage from '../services/storage.service.js';
import * as auth from '../services/auth.service.js';
import { abrirModal, fecharModal } from './modal.js';
import { success, error, warning, info } from './notificacoes.js';

let onDataChanged = null;
let pendingImport = null;

export function initImportacao(callback) {
  onDataChanged = callback;
  document.getElementById('btn-export-csv')?.addEventListener('click', async () => {
    if (!auth.can('importExport')) { error('Sem permissão.'); return; }
    exportService.exportarCSV(await storage.getAll());
    success('CSV exportado.');
  });
  document.getElementById('btn-export-json')?.addEventListener('click', async () => {
    if (!auth.can('importExport')) { error('Sem permissão.'); return; }
    exportService.exportarJSON(await storage.getAll());
    success('Backup JSON baixado.');
  });
  document.getElementById('btn-abrir-import')?.addEventListener('click', () => {
    if (!auth.can('importExport')) { error('Sem permissão.'); return; }
    document.getElementById('import-file').value = '';
    document.getElementById('import-preview')?.classList.add('hidden');
    pendingImport = null;
    abrirModal('modal-import');
  });
  document.getElementById('import-file')?.addEventListener('change', handleFileSelect);
  document.getElementById('btn-confirm-import')?.addEventListener('click', () => confirmarImport(false));
  document.getElementById('btn-replace-import')?.addEventListener('click', () => confirmarImport(true));
}

async function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await exportService.lerArquivoTexto(file);
    let rawList = [];
    if (file.name.toLowerCase().endsWith('.json')) {
      const json = JSON.parse(text);
      rawList = Array.isArray(json) ? json : json.clientes || json.data || [];
    } else {
      rawList = exportService.parseCSV(text).rows;
    }
    const result = exportService.processarImportacao(rawList, await storage.getAll());
    pendingImport = result;
    const preview = document.getElementById('import-preview');
    if (!preview) return;
    preview.classList.remove('hidden');
    preview.replaceChildren();
    const summary = document.createElement('div');
    summary.className = 'import-summary';
    [['Aceitos (novos)', result.aceitos.length], ['Duplicados', result.duplicados.length], ['Rejeitados', result.rejeitados.length]]
      .forEach(([label, n]) => {
        const p = document.createElement('p');
        p.textContent = `${label}: ${n}`;
        summary.appendChild(p);
      });
    preview.appendChild(summary);
  } catch (err) {
    error('Falha ao ler arquivo: ' + (err.message || err));
  }
}

async function confirmarImport(replace) {
  if (!auth.can('importExport')) { error('Sem permissão.'); return; }
  if (!pendingImport) { warning('Selecione um arquivo.'); return; }
  try {
    if (replace) {
      if (!confirm('Substituir TODOS os registros? Um backup será baixado.')) return;
      exportService.exportarJSON(await storage.getAll());
      info('Backup baixado.');
      const todos = [
        ...pendingImport.aceitos,
        ...pendingImport.duplicados.map((d) => ({
          id: d.existente.id,
          serial: d.serial,
          nome: (d.raw.nome || d.existente.nome || '').trim(),
          tel: d.raw.tel || d.existente.tel,
          equipamento: d.raw.equipamento || d.existente.equipamento,
          data: d.raw.data || d.existente.data,
          vencimento: d.raw.vencimento || d.existente.vencimento,
        })),
      ];
      await storage.replaceAll(todos);
      success(`Base substituída. ${todos.length} registros.`);
    } else {
      if (pendingImport.aceitos.length === 0) { warning('Nenhum registro novo.'); return; }
      await storage.bulkPut(pendingImport.aceitos);
      success(`${pendingImport.aceitos.length} importados.`);
    }
    fecharModal('modal-import');
    pendingImport = null;
    onDataChanged?.();
  } catch (err) {
    error('Erro: ' + (err.message || err));
  }
}
