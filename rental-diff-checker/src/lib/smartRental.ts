import * as XLSXStyle from 'xlsx-js-style';
import { CMS_COLUMNS } from '@/lib/cms';
import type { CmsRow } from '@/lib/cms';
import { normalizeGroupCode } from '@/lib/productGroups';

interface XlsxCell { v: unknown; t: string; s?: object }

export interface SmartRentalCols {
  품목: string;
  상품명: string;
  모델명: string;
  fee36: string;
  fee48: string;
  fee60: string;
}

// Normalize Excel header: remove newlines, collapse spaces, lowercase
function normH(h: string): string {
  return h.replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ').toLowerCase().trim();
}

export function detectSmartRentalCols(headers: string[]): SmartRentalCols {
  const find = (...kws: string[]) =>
    headers.find(h => kws.every(k => normH(h).includes(k))) ?? '';

  // 월렌탈료: contains '월' + '렌탈' + month number, NOT '총'
  const findFee = (months: number) => {
    const m = String(months);
    return (
      headers.find(h => {
        const n = normH(h);
        return (
          !n.includes('총') &&
          n.includes(m) &&
          n.includes('렌탈') &&
          (n.includes('월') || n.includes('월렌탈'))
        );
      }) ?? ''
    );
  };

  return {
    품목: find('품목') || find('분류') || find('카테고리') || find('category') || '',
    상품명: find('상품명') || find('제품명') || find('품명') || find('상품') || '',
    모델명: find('모델명') || find('모델') || '',
    fee36: findFee(36),
    fee48: findFee(48),
    fee60: findFee(60),
  };
}

// Map product category text to 3-digit code; fallback to 047 (생활가전)
function resolveGroupCode(value: string): string {
  const trimmed = String(value).trim();
  if (!trimmed) return '047';
  const result = normalizeGroupCode(trimmed);
  return /^\d{3}$/.test(result) ? result : '047';
}

function cleanFee(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!s || s === '-' || s === '0') return '';
  return s;
}

export function convertSmartRentalToCms(
  rows: Record<string, unknown>[],
  cols: SmartRentalCols
): CmsRow[] {
  const result: CmsRow[] = [];

  const periods: { col: string; months: string }[] = [
    { col: cols.fee36, months: '36' },
    { col: cols.fee48, months: '48' },
    { col: cols.fee60, months: '60' },
  ];

  rows.forEach(row => {
    const 상품명 = String(row[cols.상품명] ?? '').trim();
    const 모델명 = String(row[cols.모델명] ?? '').trim();
    if (!상품명 && !모델명) return;

    const groupCode = resolveGroupCode(String(row[cols.품목] ?? ''));

    periods.forEach(({ col, months }) => {
      if (!col) return;
      const fee = cleanFee(row[col]);
      if (!fee) return;

      result.push({
        제품코드: '',
        제품명: 상품명 ? `${상품명} (${months})` : '',   // 공백 추가
        모델명: 모델명,
        관리방법: '',
        제품그룹: groupCode,
        브랜드: '',
        의무기간: months,
        렌탈가: fee,
        일반판매가: '',
        접수여부: '',
        조리수체크: '',
        제품설명: '',
        세부구분: '',
        입력자: '',
        입력일시: '',
        수정자: '',
        수정일시: '',
      });
    });
  });

  return result;
}

// ── 2단계: 기존 CMS에서 모델명 매칭 → 제품코드 채우기 ─────────────────────

export interface CodeMatchResult {
  rows: CmsRow[];
  matched: number;
  unmatched: number;
}

export function matchProductCodes(
  convertedRows: CmsRow[],
  cmsRefRows: Record<string, unknown>[],
  modelCol: string,
  codeCol: string
): CodeMatchResult {
  // Build map: normalized 모델명 → 제품코드 (first occurrence wins)
  const codeMap = new Map<string, string>();
  cmsRefRows.forEach(row => {
    const model = String(row[modelCol] ?? '').trim().toLowerCase();
    const code = String(row[codeCol] ?? '').trim();
    if (model && code && !codeMap.has(model)) {
      codeMap.set(model, code);
    }
  });

  let matched = 0;
  let unmatched = 0;

  const rows = convertedRows.map(row => {
    const key = row.모델명.trim().toLowerCase();
    const code = codeMap.get(key) ?? '';
    if (code) matched++;
    else unmatched++;
    return { ...row, 제품코드: code };
  });

  return { rows, matched, unmatched };
}

// Detect 모델명·제품코드 columns in a CMS reference file
export function detectCmsRefCols(headers: string[]): { modelCol: string; codeCol: string } {
  const norm = (h: string) => h.toLowerCase().trim();
  const find = (...kws: string[]) =>
    headers.find(h => kws.some(k => norm(h).includes(k))) ?? '';
  return {
    modelCol: find('모델명', 'model'),
    codeCol:  find('제품코드', '상품코드', 'code', 'sku'),
  };
}

// ── 엑셀 내보내기 ─────────────────────────────────────────────────────────

function buildSheet(rows: CmsRow[], headerColor: string): Record<string, XlsxCell> {
  const aoa: unknown[][] = [CMS_COLUMNS as unknown as unknown[]];
  rows.forEach(r => aoa.push(CMS_COLUMNS.map(c => r[c])));

  const ws = XLSXStyle.utils.aoa_to_sheet(aoa) as Record<string, XlsxCell>;

  CMS_COLUMNS.forEach((_, ci) => {
    const addr = XLSXStyle.utils.encode_cell({ r: 0, c: ci });
    if (!ws[addr]) return;
    ws[addr].s = {
      fill: { patternType: 'solid', fgColor: { rgb: headerColor } },
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center' },
    };
  });

  rows.forEach((_, ri) => {
    CMS_COLUMNS.forEach((_, ci) => {
      const addr = XLSXStyle.utils.encode_cell({ r: ri + 1, c: ci });
      if (!ws[addr]) ws[addr] = { v: '', t: 's' };
      ws[addr].s = { fill: { patternType: 'solid', fgColor: { rgb: 'FEFCE8' } } };
    });
  });

  (ws as Record<string, unknown>)['!cols'] = CMS_COLUMNS.map(c => ({
    wch: Math.max(c.length + 4, 14),
  }));

  return ws;
}

export function exportSmartRentalCms(rows: CmsRow[]): void {
  const ws = buildSheet(rows, '7C3AED');
  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws as Parameters<typeof XLSXStyle.utils.book_append_sheet>[1], 'CMS업로드');
  XLSXStyle.writeFile(wb, `스마트렌탈_CMS변환_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportSmartRentalCmsWithCodes(rows: CmsRow[]): void {
  const ws = buildSheet(rows, '0F766E');  // teal header — 2단계 파일 구분용
  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws as Parameters<typeof XLSXStyle.utils.book_append_sheet>[1], 'CMS업로드_제품코드');
  XLSXStyle.writeFile(wb, `스마트렌탈_CMS제품코드_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
