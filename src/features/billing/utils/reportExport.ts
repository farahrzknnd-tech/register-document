import { formatDate } from '../../../lib/utils';
import type {
  BillingReportRow,
  BillingReportSummary,
  BillingTerminReportRow,
} from '../types';
import { formatRupiah } from './monitoring';
import { BILLING_TERMIN_STATUS_LABELS } from './reports';

export interface BillingReportExportMeta {
  filters: string[];
  generatedAt?: Date;
}

export function sanitizeSpreadsheetText(value: string | null | undefined): string {
  const text = String(value ?? '');
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

export function escapeReportHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatGeneratedAt(date: Date): string {
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function filterLabel(filters: string[]): string {
  return filters.length ? filters.join(' | ') : 'Semua Data';
}

function summaryRows(summary: BillingReportSummary): Array<[string, string | number]> {
  return [
    ['Total Monitoring', summary.totalBillings],
    ['Monitoring Aktif', summary.activeBillings],
    ['Monitoring Selesai', summary.completedBillings],
    ['Nilai Kontrak', summary.totalContractValue],
    ['Nilai Rencana Termin', summary.totalPlanned],
    ['Sudah Ditagihkan', summary.totalBilled],
    ['Sudah Dibayar', summary.totalPaid],
    ['Sisa Belum Ditagihkan', summary.remainingUnbilled],
    ['Tagihan Belum Dibayar', summary.outstandingPayment],
    ['Realisasi Tagihan (%)', summary.billingPercentage],
    ['Realisasi Pembayaran (%)', summary.paymentPercentage],
  ];
}

export async function exportBillingReportExcel(
  rows: BillingReportRow[],
  terminRows: BillingTerminReportRow[],
  summary: BillingReportSummary,
  meta: BillingReportExportMeta,
): Promise<void> {
  const XLSX = await import('xlsx');
  const generatedAt = meta.generatedAt ?? new Date();
  const workbook = XLSX.utils.book_new();

  const recapData: Array<Array<string | number>> = [
    ['LAPORAN MONITORING TAGIHAN'],
    [`Filter: ${filterLabel(meta.filters)}`],
    [`Tanggal Cetak: ${formatGeneratedAt(generatedAt)}`],
    [],
    ['REKAPITULASI', 'NILAI'],
    ...summaryRows(summary),
  ];
  const recapSheet = XLSX.utils.aoa_to_sheet(recapData);
  recapSheet['!cols'] = [{ wch: 30 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(workbook, recapSheet, 'Rekap');

  const monitoringSheet = XLSX.utils.json_to_sheet(rows.map((row) => ({
    'Nomor SPK': sanitizeSpreadsheetText(row.spkNumber),
    'Tanggal SPK': row.spkDate ?? '',
    'Kontraktor': sanitizeSpreadsheetText(row.contractorName),
    'Nama Pekerjaan': sanitizeSpreadsheetText(row.workName),
    'Lokasi': sanitizeSpreadsheetText(row.workLocation),
    'Project': sanitizeSpreadsheetText(row.projectName),
    'Cluster': sanitizeSpreadsheetText(row.clusterName),
    'Status Billing': sanitizeSpreadsheetText(row.statusName),
    'Tahapan Approval': sanitizeSpreadsheetText(row.currentStageName),
    'Tanggal Mulai': row.workStartDate ?? '',
    'Tanggal Selesai': row.workFinishDate ?? '',
    'Nilai Kontrak': row.contractValue,
    'Rencana Termin': row.plannedAmount,
    'Sudah Ditagihkan': row.billedAmount,
    'Sudah Dibayar': row.paidAmount,
    'Sisa Belum Ditagihkan': row.remainingUnbilled,
    'Tagihan Belum Dibayar': row.outstandingPayment,
    'Realisasi Tagihan (%)': row.billingPercentage,
    'Realisasi Pembayaran (%)': row.paymentPercentage,
    'Link Dokumen': sanitizeSpreadsheetText(row.documentDriveUrl),
  })));
  monitoringSheet['!cols'] = [
    { wch: 18 }, { wch: 13 }, { wch: 24 }, { wch: 32 }, { wch: 24 },
    { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 13 },
    { wch: 13 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 36 },
  ];
  XLSX.utils.book_append_sheet(workbook, monitoringSheet, 'Monitoring');

  const terminSheet = XLSX.utils.json_to_sheet(terminRows.map((row) => ({
    'Nomor SPK': sanitizeSpreadsheetText(row.spkNumber),
    'Kontraktor': sanitizeSpreadsheetText(row.contractorName),
    'Project': sanitizeSpreadsheetText(row.projectName),
    'Cluster': sanitizeSpreadsheetText(row.clusterName),
    'Urutan': row.sequenceNo,
    'Nama Termin': sanitizeSpreadsheetText(row.terminName),
    'Persentase (%)': row.percentage ?? '',
    'Nilai Rencana': row.plannedAmount,
    'Nilai Ditagihkan': row.billedAmount,
    'Nilai Dibayar': row.paidAmount,
    'Status Termin': BILLING_TERMIN_STATUS_LABELS[row.status],
    'Tanggal Tagihan': row.billedDate ?? '',
    'Tanggal Pembayaran': row.paidDate ?? '',
    'Catatan': sanitizeSpreadsheetText(row.notes),
  })));
  terminSheet['!cols'] = [
    { wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 22 }, { wch: 8 },
    { wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 20 }, { wch: 16 }, { wch: 20 }, { wch: 32 },
  ];
  XLSX.utils.book_append_sheet(workbook, terminSheet, 'Termin');

  XLSX.writeFile(workbook, `Laporan_Tagihan_${generatedAt.toISOString().slice(0, 10)}.xlsx`);
}

export async function exportBillingReportPdf(
  rows: BillingReportRow[],
  terminRows: BillingTerminReportRow[],
  summary: BillingReportSummary,
  meta: BillingReportExportMeta,
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const generatedAt = meta.generatedAt ?? new Date();
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('LAPORAN MONITORING TAGIHAN', pageWidth / 2, 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Filter: ${filterLabel(meta.filters)}`, pageWidth / 2, 20, { align: 'center' });
  doc.text(`Tanggal Cetak: ${formatGeneratedAt(generatedAt)}`, pageWidth / 2, 25, { align: 'center' });

  autoTable(doc, {
    startY: 31,
    head: [['Rekapitulasi', 'Nilai']],
    body: summaryRows(summary).map(([label, value]) => [
      label,
      typeof value === 'number' && label.includes('%') ? `${value}%` :
        typeof value === 'number' && !label.includes('Monitoring') ? formatRupiah(value) : String(value),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 7.5 },
    tableWidth: 105,
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  autoTable(doc, {
    startY: Math.max(finalY + 7, 31),
    head: [[
      'SPK', 'Kontraktor', 'Pekerjaan', 'Project / Cluster', 'Status', 'Tahapan',
      'Kontrak', 'Ditagihkan', 'Dibayar', 'Sisa',
    ]],
    body: rows.map((row) => [
      `${row.spkNumber}\n${formatDate(row.spkDate)}`,
      row.contractorName,
      row.workName,
      `${row.projectName}\n${row.clusterName}`,
      row.statusName,
      row.currentStageName,
      formatRupiah(row.contractValue),
      formatRupiah(row.billedAmount),
      formatRupiah(row.paidAmount),
      formatRupiah(row.remainingUnbilled),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 6.3, cellPadding: 1.6, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 23 },
      1: { cellWidth: 27 },
      2: { cellWidth: 37 },
      3: { cellWidth: 31 },
      4: { cellWidth: 21 },
      5: { cellWidth: 28 },
      6: { cellWidth: 24 },
      7: { cellWidth: 24 },
      8: { cellWidth: 24 },
      9: { cellWidth: 24 },
    },
    didDrawPage: (data) => {
      doc.setFontSize(7);
      doc.text(
        `Project Document Register • Halaman ${data.pageNumber}`,
        pageWidth - 12,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'right' },
      );
    },
  });

  if (terminRows.length > 0) {
    doc.addPage('a4', 'landscape');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('DETAIL TERMIN PEMBAYARAN', pageWidth / 2, 14, { align: 'center' });
    autoTable(doc, {
      startY: 20,
      head: [[
        'SPK', 'Termin', '%', 'Rencana', 'Ditagihkan', 'Dibayar', 'Status',
        'Tgl Tagihan', 'Tgl Bayar',
      ]],
      body: terminRows.map((row) => [
        row.spkNumber,
        `${row.sequenceNo}. ${row.terminName}`,
        row.percentage === null ? '-' : `${row.percentage}%`,
        formatRupiah(row.plannedAmount),
        formatRupiah(row.billedAmount),
        formatRupiah(row.paidAmount),
        BILLING_TERMIN_STATUS_LABELS[row.status],
        formatDate(row.billedDate),
        formatDate(row.paidDate),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 6.8, cellPadding: 1.8 },
    });
  }

  doc.save(`Laporan_Tagihan_${generatedAt.toISOString().slice(0, 10)}.pdf`);
}

export function printBillingReport(
  rows: BillingReportRow[],
  terminRows: BillingTerminReportRow[],
  summary: BillingReportSummary,
  meta: BillingReportExportMeta,
): void {
  const generatedAt = meta.generatedAt ?? new Date();
  const summaryHtml = summaryRows(summary).map(([label, value]) => {
    const display = typeof value === 'number' && label.includes('%') ? `${value}%` :
      typeof value === 'number' && !label.includes('Monitoring') ? formatRupiah(value) : String(value);
    return `<div class="summary-item"><span>${escapeReportHtml(label)}</span><strong>${escapeReportHtml(display)}</strong></div>`;
  }).join('');

  const monitoringRows = rows.map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${escapeReportHtml(row.spkNumber)}</strong><br><small>${escapeReportHtml(formatDate(row.spkDate))}</small></td>
      <td>${escapeReportHtml(row.contractorName)}</td>
      <td>${escapeReportHtml(row.workName)}</td>
      <td>${escapeReportHtml(row.projectName)}<br><small>${escapeReportHtml(row.clusterName)}</small></td>
      <td>${escapeReportHtml(row.statusName)}<br><small>${escapeReportHtml(row.currentStageName)}</small></td>
      <td>${escapeReportHtml(formatRupiah(row.contractValue))}</td>
      <td>${escapeReportHtml(formatRupiah(row.billedAmount))}</td>
      <td>${escapeReportHtml(formatRupiah(row.paidAmount))}</td>
      <td>${escapeReportHtml(formatRupiah(row.remainingUnbilled))}</td>
    </tr>
  `).join('');

  const terminRowsHtml = terminRows.map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeReportHtml(row.spkNumber)}</td>
      <td>${escapeReportHtml(`${row.sequenceNo}. ${row.terminName}`)}</td>
      <td>${escapeReportHtml(row.percentage === null ? '-' : `${row.percentage}%`)}</td>
      <td>${escapeReportHtml(formatRupiah(row.plannedAmount))}</td>
      <td>${escapeReportHtml(formatRupiah(row.billedAmount))}</td>
      <td>${escapeReportHtml(formatRupiah(row.paidAmount))}</td>
      <td>${escapeReportHtml(BILLING_TERMIN_STATUS_LABELS[row.status])}</td>
      <td>${escapeReportHtml(formatDate(row.billedDate))}</td>
      <td>${escapeReportHtml(formatDate(row.paidDate))}</td>
    </tr>
  `).join('');

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Laporan Monitoring Tagihan</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, sans-serif; color: #1f2937; font-size: 10px; }
  h1 { margin: 0; font-size: 18px; }
  h2 { margin: 20px 0 8px; font-size: 13px; }
  .header { border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 12px; }
  .header p { margin: 3px 0 0; color: #4b5563; }
  .toolbar { margin-bottom: 12px; }
  .toolbar button { padding: 7px 14px; margin-right: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 14px; }
  .summary-item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 7px; }
  .summary-item span { display: block; color: #6b7280; font-size: 9px; }
  .summary-item strong { display: block; margin-top: 3px; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f3f4f6; text-align: left; padding: 5px; border: 1px solid #d1d5db; font-size: 8px; }
  td { padding: 5px; border: 1px solid #e5e7eb; vertical-align: top; }
  small { color: #6b7280; }
  .footer { margin-top: 14px; padding-top: 7px; border-top: 1px solid #e5e7eb; color: #6b7280; display: flex; justify-content: space-between; }
  @media print { .no-print { display: none; } tr { break-inside: avoid; } }
</style>
</head>
<body>
  <div class="header">
    <h1>LAPORAN MONITORING TAGIHAN</h1>
    <p>Filter: ${escapeReportHtml(filterLabel(meta.filters))}</p>
    <p>Tanggal Cetak: ${escapeReportHtml(formatGeneratedAt(generatedAt))}</p>
  </div>
  <div class="toolbar no-print">
    <button onclick="window.print()">Print</button>
    <button onclick="window.close()">Tutup</button>
  </div>
  <div class="summary">${summaryHtml}</div>
  <h2>Detail Monitoring</h2>
  <table>
    <thead><tr><th>No</th><th>SPK</th><th>Kontraktor</th><th>Pekerjaan</th><th>Project / Cluster</th><th>Status / Tahapan</th><th>Kontrak</th><th>Ditagihkan</th><th>Dibayar</th><th>Sisa</th></tr></thead>
    <tbody>${monitoringRows || '<tr><td colspan="10">Tidak ada data.</td></tr>'}</tbody>
  </table>
  <h2>Detail Termin</h2>
  <table>
    <thead><tr><th>No</th><th>SPK</th><th>Termin</th><th>%</th><th>Rencana</th><th>Ditagihkan</th><th>Dibayar</th><th>Status</th><th>Tgl Tagihan</th><th>Tgl Bayar</th></tr></thead>
    <tbody>${terminRowsHtml || '<tr><td colspan="10">Tidak ada data termin.</td></tr>'}</tbody>
  </table>
  <div class="footer"><span>Created by Farah Ananda © 2026. All Rights Reserved.</span><span>Project Document Register</span></div>
  <script>window.onload = () => setTimeout(() => window.print(), 250);</script>
</body>
</html>`;

  const popup = window.open('', '_blank');
  if (!popup) throw new Error('Pop-up diblokir. Izinkan pop-up untuk mencetak laporan.');
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}
