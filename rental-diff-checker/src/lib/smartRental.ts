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

  // 월렌탈료: contains '월' + ('렌탈료' or '렌탈') + month number, NOT '총'
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
    상품명: find('상품명') || find('제품명') || find('품명') || '',
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
    if (!상품명 && !모델명) return; // skip blank rows

    const groupCode = resolveGroupCode(String(row[cols.품목] ?? ''));

    periods.forEach(({ col, months }) => {
      if (!col) return;
      const fee = cleanFee(row[col]);
      if (!fee) return; // skip if no fee for this period

      result.push({
        제품코드: '',
        제품명: 상품명 ? `${상품명}(${months})` : '',
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

export function exportSmartRentalCms(rows: CmsRow[]): void {
  const aoa: unknown[][] = [CMS_COLUMNS as unknown as unknown[]];
  rows.forEach(r => aoa.push(CMS_COLUMNS.map(c => r[c])));

  const ws = XLSXStyle.utils.aoa_to_sheet(aoa) as Record<string, XlsxCell>;

  // Header: purple
  CMS_COLUMNS.forEach((_, ci) => {
    const addr = XLSXStyle.utils.encode_cell({ r: 0, c: ci });
    if (!ws[addr]) return;
    ws[addr].s = {
      fill: { patternType: 'solid', fgColor: { rgb: '7C3AED' } },
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center' },
    };
  });

  // Data rows: light yellow
  rows.forEach((_, ri) => {
    CMS_COLUMNS.forEach((_, ci) => {
      const addr = XLSXStyle.utils.encode_cell({ r: ri + 1, c: ci });
      if (!ws[addr]) ws[addr] = { v: '', t: 's' };
      ws[addr].s = {
        fill: { patternType: 'solid', fgColor: { rgb: 'FEFCE8' } },
      };
    });
  });

  (ws as Record<string, unknown>)['!cols'] = CMS_COLUMNS.map(c => ({
    wch: Math.max(c.length + 4, 14),
  }));

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, 'CMS업로드');
  XLSXStyle.writeFile(wb, `스마트렌탈_CMS변환_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
