import { describe, expect, it } from 'vitest';
import { escapeReportHtml, sanitizeSpreadsheetText } from './reportExport';

describe('billing report export safety', () => {
  it('prevents spreadsheet formula injection', () => {
    expect(sanitizeSpreadsheetText('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(sanitizeSpreadsheetText('+cmd')).toBe("'+cmd");
    expect(sanitizeSpreadsheetText('Normal')).toBe('Normal');
  });

  it('escapes dynamic HTML before printing', () => {
    expect(escapeReportHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(escapeReportHtml('A & B')).toBe('A &amp; B');
  });
});
