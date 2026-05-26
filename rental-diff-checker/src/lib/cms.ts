import * as XLSXStyle from 'xlsx-js-style';
import type { DiffResult, ColumnMapping } from '@/types';
import { normalizeKey } from '@/lib/excel';
import { normalizeGroupCode } from '@/lib/productGroups';

// Fixed CMS output columns — exact order for upload
export const CMS_COLUMNS = [
  '제품코드', '제품명', '모델명', '관리방법', '제품그룹', '브랜드',
  '의무기간', '렌탈가', '일반판매가', '접수여부', '조리수체크',
  '제품설명', '세부구분', '입력자', '입력일시', '수정자', '수정일시',
] as const;

export type CmsRow = { [K in (typeof CMS_COLUMNS)[number]]: string };

interface XlsxCell {
  v: unknown;
  t: string;
  s?: object;
}

export function detectCmsCols(headers: string[]): Record<string, string> {
  const lc = headers.map((h) => ({ h, l: h.toLowerCase() }));
  const find = (...kws: string[]) =>
    lc.find(({ l }) => kws.some((k) => l.includes(k)))?.h ?? '';
  return {
    제품코드: find('제품코드', '코드', 'code', 'sku'),
    제품명: find('제품명', '상품명', '품명', 'name'),
    모델명: find('모델명', '모델', 'model'),
    관리방법: find('관리방법', '관리'),
    제품그룹: find('제품그룹', '그룹', 'group', '분류'),
    브랜드: find('브랜드', 'brand'),
    의무기간: find('의무기간', '렌탈기간', '기간', 'period'),
    렌탈가: find('렌탈가', '렌탈료', '월렌탈', 'fee', 'price'),
    일반판매가: find('일반판매가', '판매가', '정가'),
    접수여부: find('접수여부', '접수'),
    조리수체크: find('조리수체크', '조리수'),
    제품설명: find('제품설명', '설명', 'desc'),
    세부구분: find('세부구분', '구분'),
  };
}

// Returns all candidates per key (handles duplicate model+period in CMS)
export function buildCmsMap(
  cmsRows: Record<string, unknown>[],
  cols: ReturnType<typeof detectCmsCols>
): Map<string, Record<string, unknown>[]> {
  const map = new Map<string, Record<string, unknown>[]>();
  cmsRows.forEach((row) => {
    const model = String(row[cols.모델명] ?? '');
    const period = String(row[cols.의무기간] ?? '');
    const key = normalizeKey(model, period);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  });
  return map;
}

function levenshtein(a: string, b: string): number {
  const la = a.length, lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  const prev = Array.from({ length: lb + 1 }, (_, i) => i);
  for (let i = 1; i <= la; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= lb; j++) {
      const temp = prev[j];
      prev[j] = a[i - 1] === b[j - 1] ? diag : 1 + Math.min(prev[j], prev[j - 1], diag);
      diag = temp;
    }
  }
  return prev[lb];
}

function findBestCmsMatch(
  candidates: Record<string, unknown>[],
  prevFee: string,
  productName: string,
  cmsCols: ReturnType<typeof detectCmsCols>
): Record<string, unknown> | undefined {
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  const normFee = (v: unknown) => String(v ?? '').replace(/[,\s]/g, '').trim();
  const normName = (s: string) => s.normalize('NFC').toLowerCase().trim();

  // Priority 1: match by old 렌탈가
  const normPrev = normFee(prevFee);
  if (normPrev) {
    const feeMatches = candidates.filter((c) => normFee(c[cmsCols.렌탈가]) === normPrev);
    if (feeMatches.length === 1) return feeMatches[0];
    if (feeMatches.length > 1) {
      // Among fee matches, refine by 상품명 fuzzy
      if (productName) {
        const cleanP = normName(productName);
        const best = feeMatches.find(
          (c) => levenshtein(cleanP, normName(String(c[cmsCols.제품명] ?? ''))) <= 2
        );
        if (best) return best;
      }
      return feeMatches[0];
    }
  }

  // Priority 2: fuzzy 상품명 (Levenshtein ≤ 2)
  if (productName) {
    const cleanP = normName(productName);
    const best = candidates.find(
      (c) => levenshtein(cleanP, normName(String(c[cmsCols.제품명] ?? ''))) <= 2
    );
    if (best) return best;
  }

  return candidates[0];
}

export function generateCmsRows(
  diffResults: DiffResult[],
  compMapping: ColumnMapping,
  cmsMap: Map<string, Record<string, unknown>[]>,
  cmsCols: ReturnType<typeof detectCmsCols>
): { rows: CmsRow[]; unmatched: DiffResult[] } {
  const rows: CmsRow[] = [];
  const unmatched: DiffResult[] = [];

  const updateItems = diffResults.filter((r) => r._status === '업데이트');

  updateItems.forEach((r) => {
    const candidates = cmsMap.get(r._key);
    if (!candidates || candidates.length === 0) {
      unmatched.push(r);
      return;
    }

    const prevFee = String(r._prevRentalFee ?? '');
    const productName = compMapping.상품명 ? String(r[compMapping.상품명] ?? '') : '';
    const cmsRow = findBestCmsMatch(candidates, prevFee, productName, cmsCols);

    if (!cmsRow) {
      unmatched.push(r);
      return;
    }

    const existingSub = String(cmsRow[cmsCols.세부구분] ?? '').trim();
    const subCategory = existingSub.includes('타사보상') ? '008' : '001';

    const newFee = String(r[compMapping.렌탈료] ?? '').trim();
    const period = String(r[compMapping.렌탈기간] ?? '').trim();

    rows.push({
      제품코드: String(cmsRow[cmsCols.제품코드] ?? ''),
      제품명: String(cmsRow[cmsCols.제품명] ?? ''),
      모델명: String(cmsRow[cmsCols.모델명] ?? ''),
      관리방법: String(cmsRow[cmsCols.관리방법] ?? ''),
      제품그룹: normalizeGroupCode(String(cmsRow[cmsCols.제품그룹] ?? '')),
      브랜드: String(cmsRow[cmsCols.브랜드] ?? ''),
      의무기간: period,
      렌탈가: newFee,
      일반판매가: String(cmsRow[cmsCols.일반판매가] ?? ''),
      접수여부: String(cmsRow[cmsCols.접수여부] ?? ''),
      조리수체크: String(cmsRow[cmsCols.조리수체크] ?? ''),
      제품설명: String(cmsRow[cmsCols.제품설명] ?? ''),
      세부구분: subCategory,
      입력자: 'TNC임진형',
      입력일시: '',
      수정자: '',
      수정일시: '',
    });
  });

  return { rows, unmatched };
}

// ── GPT 변환 (CMS 형식 → 비교 분석 입력 형식) ──────────────────────────────

export const GPT_COLUMNS = [
  '제품코드', '상품명', '모델명', '렌탈기간', '렌탈료',
  '제품그룹', '관리방법', '브랜드', '일반판매가',
  '접수여부', '조리수체크', '제품설명', '세부구분',
] as const;

export type GptRow = { [K in (typeof GPT_COLUMNS)[number]]: string };

export function convertCmsToGpt(
  cmsRows: Record<string, unknown>[],
  cols: ReturnType<typeof detectCmsCols>
): GptRow[] {
  return cmsRows
    .filter((row) => {
      // skip completely empty rows
      const model = String(row[cols.모델명] ?? '').trim();
      const period = String(row[cols.의무기간] ?? '').trim();
      return model !== '' || period !== '';
    })
    .map((row) => ({
      제품코드: String(row[cols.제품코드] ?? ''),
      상품명: String(row[cols.제품명] ?? ''),
      모델명: String(row[cols.모델명] ?? ''),
      렌탈기간: String(row[cols.의무기간] ?? ''),
      렌탈료: String(row[cols.렌탈가] ?? ''),
      제품그룹: normalizeGroupCode(String(row[cols.제품그룹] ?? '')),
      관리방법: String(row[cols.관리방법] ?? ''),
      브랜드: String(row[cols.브랜드] ?? ''),
      일반판매가: String(row[cols.일반판매가] ?? ''),
      접수여부: String(row[cols.접수여부] ?? ''),
      조리수체크: String(row[cols.조리수체크] ?? ''),
      제품설명: String(row[cols.제품설명] ?? ''),
      세부구분: '',
    }));
}

export function exportGptExcel(rows: GptRow[]): void {
  const aoa: unknown[][] = [GPT_COLUMNS as unknown as unknown[]];
  rows.forEach((r) => aoa.push(GPT_COLUMNS.map((c) => r[c])));

  const ws = XLSXStyle.utils.aoa_to_sheet(aoa) as Record<string, XlsxCell>;

  GPT_COLUMNS.forEach((_, ci) => {
    const addr = XLSXStyle.utils.encode_cell({ r: 0, c: ci });
    if (!ws[addr]) return;
    ws[addr].s = {
      fill: { patternType: 'solid', fgColor: { rgb: '16A34A' } },
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center' },
    };
  });

  (ws as Record<string, unknown>)['!cols'] = GPT_COLUMNS.map((c) => ({
    wch: Math.max(c.length + 4, 14),
  }));

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, 'GPT형식');
  XLSXStyle.writeFile(wb, `GPT형식_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ────────────────────────────────────────────────────────────────────────────

export function exportCmsExcel(rows: CmsRow[]): void {
  const aoa: unknown[][] = [CMS_COLUMNS as unknown as unknown[]];
  rows.forEach((r) => aoa.push(CMS_COLUMNS.map((c) => r[c])));

  const ws = XLSXStyle.utils.aoa_to_sheet(aoa) as Record<string, XlsxCell>;

  CMS_COLUMNS.forEach((_, ci) => {
    const addr = XLSXStyle.utils.encode_cell({ r: 0, c: ci });
    if (!ws[addr]) return;
    ws[addr].s = {
      fill: { patternType: 'solid', fgColor: { rgb: '2563EB' } },
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center' },
    };
  });

  rows.forEach((_, ri) => {
    CMS_COLUMNS.forEach((_, ci) => {
      const addr = XLSXStyle.utils.encode_cell({ r: ri + 1, c: ci });
      if (!ws[addr]) ws[addr] = { v: '', t: 's' };
      ws[addr].s = {
        fill: { patternType: 'solid', fgColor: { rgb: 'FFC000' } },
      };
    });
  });

  (ws as Record<string, unknown>)['!cols'] = CMS_COLUMNS.map((c) => ({
    wch: Math.max(c.length + 4, 14),
  }));

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, 'CMS업로드');
  XLSXStyle.writeFile(wb, `CMS_업로드_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
