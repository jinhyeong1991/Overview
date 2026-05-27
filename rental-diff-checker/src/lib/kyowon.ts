import * as XLSX from 'xlsx';
import * as XLSXStyle from 'xlsx-js-style';

// Fixed column indices (0-based): A=0, B=1, C=2 ...
const COL_C = 2;
const COL_E = 4;
const COL_F = 5;
const COL_G = 6;
const COMPARE_START = 9;  // J
const COMPARE_END = 19;   // T (inclusive)

export interface KyowonRow {
  status: '신규' | '변경' | '유지' | '단종';
  row: unknown[];
  mayRow?: unknown[];
  diffCols: number[];
}

export interface KyowonSummary {
  신규: number;
  변경: number;
  유지: number;
  단종: number;
  total: number;
}

type XlsxCell = { v: unknown; t: string; s?: Record<string, unknown> };

function normalizeCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).normalize('NFC').replace(/[\s　]+/g, ' ').trim().toLowerCase();
}

function buildKey(row: unknown[]): string {
  return [row[COL_C], row[COL_E], row[COL_F], row[COL_G]]
    .map(normalizeCell)
    .join('|||');
}

function isDataRow(row: unknown[]): boolean {
  // Skip rows where all key columns are empty
  return [row[COL_C], row[COL_E], row[COL_F], row[COL_G]].some(
    (v) => normalizeCell(v) !== ''
  );
}

export function parseKyowonSheet(file: File): Promise<unknown[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: '',
          raw: false,
        });
        resolve(rows);
      } catch (err) {
        reject(new Error('엑셀 파일 파싱 실패: ' + (err as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });
}

export function compareSheets(
  sheetMay: unknown[][],
  sheetJune: unknown[][]
): KyowonRow[] {
  // First row is header — skip it
  const mayData = sheetMay.slice(1).filter(isDataRow);
  const juneData = sheetJune.slice(1).filter(isDataRow);

  // Build May map: key → row (last row wins for duplicates)
  const mayMap = new Map<string, unknown[]>();
  mayData.forEach((row) => {
    const key = buildKey(row);
    if (key !== '|||'.repeat(3)) mayMap.set(key, row);
  });

  const matchedMayKeys = new Set<string>();
  const results: KyowonRow[] = [];

  juneData.forEach((juneRow) => {
    const key = buildKey(juneRow);
    const mayRow = mayMap.get(key);

    if (!mayRow) {
      results.push({ status: '신규', row: juneRow, diffCols: [] });
      return;
    }

    matchedMayKeys.add(key);

    const diffCols: number[] = [];
    for (let ci = COMPARE_START; ci <= COMPARE_END; ci++) {
      if (normalizeCell(juneRow[ci]) !== normalizeCell(mayRow[ci])) {
        diffCols.push(ci);
      }
    }

    results.push({
      status: diffCols.length > 0 ? '변경' : '유지',
      row: juneRow,
      mayRow,
      diffCols,
    });
  });

  // Discontinued: May rows that were never matched
  mayData.forEach((mayRow) => {
    const key = buildKey(mayRow);
    if (!matchedMayKeys.has(key)) {
      results.push({ status: '단종', row: mayRow, diffCols: [] });
    }
  });

  return results;
}

export function calcKyowonSummary(rows: KyowonRow[]): KyowonSummary {
  const s: KyowonSummary = { 신규: 0, 변경: 0, 유지: 0, 단종: 0, total: rows.length };
  rows.forEach((r) => s[r.status]++);
  return s;
}

export function exportKyowonExcel(rows: KyowonRow[], header: unknown[]): void {
  // Status column prepended, then original columns
  const STATUS_COL = '상태';
  const headerRow = [STATUS_COL, ...header];
  const aoa: unknown[][] = [headerRow];

  rows.forEach((r) => {
    aoa.push([r.status, ...r.row]);
  });

  const ws = XLSXStyle.utils.aoa_to_sheet(aoa) as Record<string, XlsxCell>;
  const totalCols = headerRow.length;

  // Encode helper
  const enc = (r: number, c: number) => XLSXStyle.utils.encode_cell({ r, c });

  // Style header row
  for (let ci = 0; ci < totalCols; ci++) {
    const addr = enc(0, ci);
    if (!ws[addr]) continue;
    ws[addr].s = {
      fill: { patternType: 'solid', fgColor: { rgb: '1E3A5F' } },
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center' },
    };
  }

  // Style data rows
  rows.forEach((r, ri) => {
    const rowIdx = ri + 1; // offset by header

    const getRowFill = (status: KyowonRow['status']): string | null => {
      if (status === '신규') return 'C6EFCE';
      if (status === '단종') return 'D9D9D9';
      return null;
    };

    const rowFill = getRowFill(r.status);
    const diffSet = new Set(r.diffCols);

    for (let ci = 0; ci < totalCols; ci++) {
      const addr = enc(rowIdx, ci);
      if (!ws[addr]) {
        ws[addr] = { v: '', t: 's' };
      }

      // ci=0 is status column, original col index = ci-1
      const origColIdx = ci - 1;
      const isDiffCell =
        r.status === '변경' && ci > 0 && diffSet.has(origColIdx);

      if (isDiffCell) {
        ws[addr].s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'FFC000' } },
        };
      } else if (rowFill) {
        ws[addr].s = {
          fill: { patternType: 'solid', fgColor: { rgb: rowFill } },
        };
      }
    }
  });

  // Column widths
  (ws as Record<string, unknown>)['!cols'] = Array.from({ length: totalCols }, (_, i) =>
    i === 0 ? { wch: 8 } : { wch: 14 }
  );

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, '비교결과');

  const date = new Date().toISOString().slice(0, 10);
  XLSXStyle.writeFile(wb, `교원웰스_비교결과_${date}.xlsx`);
}
