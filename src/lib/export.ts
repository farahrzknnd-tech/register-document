import type { DocType } from './types';
import { DOC_TYPE_LABELS } from './types';
import { formatDate } from './utils';

export interface ExportRow {
  register_no: string | null;
  title: string;
  clusterName: string;
  type: DocType;
  subtitle: string;
  date: string;
  status: string;
  link: string | null;
}

export interface ExportMeta {
  title: string;
  filters: string[];
}

function escapeCsv(v: string): string {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportToCsv(rows: ExportRow[], meta: ExportMeta): void {
  const header = ['Nomor Register', 'Judul / Perihal', 'Cluster', 'Jenis Dokumen', 'Sub Jenis', 'Tanggal', 'Status', 'Link Google Drive'];
  const lines = rows.map((r) => [
    escapeCsv(r.register_no || ''),
    escapeCsv(r.title),
    escapeCsv(r.clusterName),
    escapeCsv(DOC_TYPE_LABELS[r.type]),
    escapeCsv(r.subtitle),
    escapeCsv(formatDate(r.date)),
    escapeCsv(r.status),
    escapeCsv(r.link || ''),
  ].join(','));

  const dateStr = new Date().toLocaleString('id-ID');
  const metaLines = [
    `# ${meta.title}`,
    `# Filter: ${meta.filters.length ? meta.filters.join(' | ') : 'Semua'}`,
    `# Tanggal Cetak: ${dateStr}`,
    '',
    header.join(','),
    ...lines,
  ];

  const csv = metaLines.join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `register-dokumen-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printDocuments(rows: ExportRow[], meta: ExportMeta): void {
  const dateStr = new Date().toLocaleString('id-ID');
  const filterText = meta.filters.length ? meta.filters.join(' | ') : 'Semua';

  const rowsHtml = rows.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.register_no || '-'}</td>
      <td>${r.title}</td>
      <td>${r.clusterName}</td>
      <td>${DOC_TYPE_LABELS[r.type]}</td>
      <td>${r.subtitle}</td>
      <td>${formatDate(r.date)}</td>
      <td>${r.status}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>${meta.title}</title>
<style>
  @page { size: A4 landscape; margin: 1.5cm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; margin: 0; }
  .header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
  .logo { width: 40px; height: 40px; background: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; }
  .title-block h1 { font-size: 18px; margin: 0; }
  .title-block p { font-size: 12px; color: #6b7280; margin: 2px 0 0; }
  .meta { font-size: 11px; color: #4b5563; margin-bottom: 12px; display: flex; gap: 24px; flex-wrap: wrap; }
  .meta span b { color: #111827; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f3f4f6; text-align: left; padding: 6px 8px; border-bottom: 2px solid #d1d5db; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
  td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 16px; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  @media print { .no-print { display: none; } }
  .toolbar { margin-bottom: 12px; }
  .toolbar button { padding: 6px 14px; margin-right: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer; font-size: 12px; }
  .toolbar button:hover { background: #f3f4f6; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">R</div>
    <div class="title-block">
      <h1>${meta.title}</h1>
      <p>Project Document Register</p>
    </div>
  </div>
  <div class="meta">
    <span><b>Filter:</b> ${filterText}</span>
    <span><b>Tanggal Cetak:</b> ${dateStr}</span>
    <span><b>Total Dokumen:</b> ${rows.length}</span>
  </div>
  <div class="toolbar no-print">
    <button onclick="window.print()">Print</button>
    <button onclick="window.close()">Tutup</button>
  </div>
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Nomor Register</th>
        <th>Judul / Perihal</th>
        <th>Cluster</th>
        <th>Jenis Dokumen</th>
        <th>Sub Jenis</th>
        <th>Tanggal</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="footer">
    <span>Project Document Register</span>
    <span>Halaman <span id="page-num"></span></span>
  </div>
  <script>
    window.onload = () => { setTimeout(() => window.print(), 300); };
  </script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) {
    alert('Mohon izinkan pop-up untuk mencetak dokumen.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function printDetail(title: string, fields: { label: string; value: string }[], refs: { label: string; register: string }[]): void {
  const dateStr = new Date().toLocaleString('id-ID');
  const fieldsHtml = fields.map((f) => `
    <tr><td class="lbl">${f.label}</td><td>: ${f.value || '-'}</td></tr>
  `).join('');
  const refsHtml = refs.length ? refs.map((r) => `
    <tr><td>${r.label}</td><td>${r.register}</td></tr>
  `).join('') : '<tr><td colspan="2" style="color:#9ca3af">Tidak ada referensi</td></tr>';

  const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: A4; margin: 1.5cm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; margin: 0; }
  .header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
  .logo { width: 40px; height: 40px; background: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; }
  h1 { font-size: 18px; margin: 0; }
  .sub { font-size: 12px; color: #6b7280; margin: 2px 0 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  td.lbl { width: 160px; font-weight: 600; color: #4b5563; }
  .section-title { font-size: 13px; font-weight: 700; margin: 16px 0 6px; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .footer { margin-top: 20px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  .toolbar { margin-bottom: 12px; }
  .toolbar button { padding: 6px 14px; margin-right: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer; font-size: 12px; }
  @media print { .no-print { display: none; } }
</style></head>
<body>
  <div class="header">
    <div class="logo">R</div>
    <div><h1>Detail Dokumen</h1><p class="sub">Project Document Register</p></div>
  </div>
  <div class="toolbar no-print">
    <button onclick="window.print()">Print</button>
    <button onclick="window.close()">Tutup</button>
  </div>
  <table>${fieldsHtml}</table>
  <div class="section-title">Referensi Dokumen</div>
  <table><thead><tr><th style="text-align:left">Jenis</th><th style="text-align:left">Nomor Register</th></tr></thead><tbody>${refsHtml}</tbody></table>
  <div class="footer">Dicetak: ${dateStr}</div>
  <script>setTimeout(() => window.print(), 300);</script>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) { alert('Mohon izinkan pop-up untuk mencetak.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
