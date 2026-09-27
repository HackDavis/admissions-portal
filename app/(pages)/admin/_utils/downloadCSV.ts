'use client';

// Making Excel friendly CSVs
const FORMULA_START = /^[=+\-@\t\r]/;
const BOM = '\uFEFF';

export function csvField(value: unknown) {
  const str = String(value ?? '');
  const safe = FORMULA_START.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
