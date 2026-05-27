import * as XLSX from 'xlsx';
import * as XLSXStyle from 'xlsx-js-style';
import { PRODUCT_GROUPS } from '@/lib/productGroups';
import { CMS_COLUMNS } from '@/lib/cms';
import type { CmsRow } from '@/lib/cms';

// ── 컬럼 인덱스 (0-based) ───────────────────────────────────────────────────
const COL_A = 0;   // 제품구분명 (정수기, 공기청정기 등)
const COL_C = 2;   // 모델명 (줄바꿈으로 복수 모델 가능)
const COL_E = 4;   // 약정기간 (예: "5X12=60")
const COL_F = 5;   // 관리방법 (self / 3 / 5 / 6)
const COL_G = 6;   // 관리세부 (예: "6개월택배+12개월방문")
const COL_K = 10;  // 정상가
const COL_L = 11;  // 타사보상(할인가)
const COL_M = 12;  // 프로모션 정상가 (있으면 K 무시)
const COL_N = 13;  // 프로모션 타사보상 (있으면 L 무시)
// O~R (14~17): 무시
const COL_S = 18;  // 프로모션 내용 → 상품명 뒤에 [ ] 붙임
// T (19): 무시

// 비교 범위 (compareSheets 용)
const COMPARE_START = 9;  // J
const COMPARE_END = 19;   // T

// ── 타입 ────────────────────────────────────────────────────────────────────
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

// ── 파싱 유틸 ────────────────────────────────────────────────────────────────
function normalizeCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).normalize('NFC').replace(/[\s　]+/g, ' ').trim().toLowerCase();
}

function buildKey(row: unknown[]): string {
  return [row[COL_C], row[4], row[5], row[6]]
    .map(normalizeCell)
    .join('|||');
}

function isDataRow(row: unknown[]): boolean {
  return [row[COL_C], row[4], row[5], row[6]].some((v) => normalizeCell(v) !== '');
}

// ── 파일 파싱 ────────────────────────────────────────────────────────────────
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

// ── 비교 로직 ────────────────────────────────────────────────────────────────
export function compareSheets(sheetMay: unknown[][], sheetJune: unknown[][]): KyowonRow[] {
  const mayData = sheetMay.slice(1).filter(isDataRow);
  const juneData = sheetJune.slice(1).filter(isDataRow);

  const mayMap = new Map<string, unknown[]>();
  mayData.forEach((row) => {
    const key = buildKey(row);
    mayMap.set(key, row);
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

// ── 비교 결과 엑셀 내보내기 ──────────────────────────────────────────────────
export function exportKyowonExcel(rows: KyowonRow[], header: unknown[]): void {
  const STATUS_COL = '상태';
  const headerRow = [STATUS_COL, ...header];
  const aoa: unknown[][] = [headerRow];
  rows.forEach((r) => aoa.push([r.status, ...r.row]));

  const ws = XLSXStyle.utils.aoa_to_sheet(aoa) as Record<string, XlsxCell>;
  const totalCols = headerRow.length;
  const enc = (r: number, c: number) => XLSXStyle.utils.encode_cell({ r, c });

  for (let ci = 0; ci < totalCols; ci++) {
    const addr = enc(0, ci);
    if (!ws[addr]) continue;
    ws[addr].s = {
      fill: { patternType: 'solid', fgColor: { rgb: '1E3A5F' } },
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center' },
    };
  }

  rows.forEach((r, ri) => {
    const rowIdx = ri + 1;
    const rowFill = r.status === '신규' ? 'C6EFCE' : r.status === '단종' ? 'D9D9D9' : null;
    const diffSet = new Set(r.diffCols);

    for (let ci = 0; ci < totalCols; ci++) {
      const addr = enc(rowIdx, ci);
      if (!ws[addr]) ws[addr] = { v: '', t: 's' };
      const origColIdx = ci - 1;
      const isDiffCell = r.status === '변경' && ci > 0 && diffSet.has(origColIdx);
      if (isDiffCell) {
        ws[addr].s = { fill: { patternType: 'solid', fgColor: { rgb: 'FFC000' } } };
      } else if (rowFill) {
        ws[addr].s = { fill: { patternType: 'solid', fgColor: { rgb: rowFill } } };
      }
    }
  });

  (ws as Record<string, unknown>)['!cols'] = Array.from({ length: totalCols }, (_, i) =>
    i === 0 ? { wch: 8 } : { wch: 14 }
  );

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, '비교결과');
  XLSXStyle.writeFile(wb, `교원웰스_비교결과_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── CMS 생성 로직 ────────────────────────────────────────────────────────────

// A열값 → 제품그룹 코드 매핑 (PRODUCT_GROUPS에서 키워드 매칭)
function detectProductGroup(aVal: string): string {
  const a = aVal.trim();
  // 정확 일치 먼저
  const exact = PRODUCT_GROUPS.find((g) => g.name === a);
  if (exact) return exact.code;
  // 특수 케이스
  if (a.includes('패키지') || a.includes('결합상품')) return '082';
  // 얼음정수기 → 041 (정수기보다 먼저)
  if (a.includes('얼음정수기')) return '041';
  // 침대세트 → 089, 침대프레임 → 083, 침대 → 044 (긴 것 먼저)
  if (a.includes('침대세트')) return '089';
  if (a.includes('침대프레임')) return '083';
  // 부분 일치
  for (const g of PRODUCT_GROUPS) {
    if (a.includes(g.name) || g.name.includes(a)) return g.code;
  }
  return '047'; // 생활가전 기본값
}

// E열 "5X12=60" → { yearLabel:"5년약정", months:"60" }
function parseContractPeriod(eVal: string): { yearLabel: string; months: string } {
  const eqMatch = eVal.match(/=\s*(\d+)/);
  if (eqMatch) {
    const months = parseInt(eqMatch[1]);
    const years = Math.round(months / 12);
    return { yearLabel: `${years}년약정`, months: String(months) };
  }
  const numMatch = eVal.replace(/\s/g, '').match(/^(\d+)$/);
  if (numMatch) {
    const n = parseInt(numMatch[1]);
    if (n > 12) return { yearLabel: `${Math.round(n / 12)}년약정`, months: String(n) };
    return { yearLabel: `${n}년약정`, months: String(n * 12) };
  }
  return { yearLabel: eVal, months: '' };
}

// F열 + G열 → 관리방법 { cmsLabel, nameLabel }
// 규칙: G열에 방문 있으면 방문 우선(뒤쪽), 택배만이면 자가관리, F열 기반
function parseManagementMethod(
  fVal: string,
  gVal: string
): { cmsLabel: string; nameLabel: string } {
  const g = gVal.trim();
  if (g) {
    const parts = g.split('+').map((p) => p.trim());
    // 뒤에서부터 방문 찾기
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].includes('방문')) {
        const m = parts[i].match(/(\d+)개월/);
        if (m) return { cmsLabel: `${m[1]}개월방문관리`, nameLabel: `${m[1]}개월방문` };
        return { cmsLabel: '방문관리', nameLabel: '방문관리' };
      }
    }
    // 택배만 있으면 자가관리
    if (g.includes('택배')) return { cmsLabel: '자가관리', nameLabel: '셀프관리' };
  }
  // F열 기반
  const f = fVal.trim().toLowerCase();
  if (!f || f === 'self') return { cmsLabel: '자가관리', nameLabel: '셀프관리' };
  const n = parseInt(f);
  if (!isNaN(n)) return { cmsLabel: `${n}개월방문관리`, nameLabel: `${n}개월방문` };
  return { cmsLabel: fVal, nameLabel: fVal };
}

function getTodayDateCode(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return yy + mm + dd;
}

// 신규+변경 행으로부터 CMS 행 생성
export function generateKyowonCmsRows(diffRows: KyowonRow[], startSeq = 1): CmsRow[] {
  const dateCode = getTodayDateCode();
  let seq = startSeq;
  const makeCode = () => `kw${dateCode}${String(seq++).padStart(3, '0')}`;

  const result: CmsRow[] = [];

  for (const { status, row, diffCols } of diffRows) {
    if (status === '단종' || status === '유지') continue;

    const g = (i: number) => String(row[i] ?? '').trim();
    const isNew = status === '신규';
    const diffSet = new Set(diffCols);

    const aVal = g(COL_A);
    const cVal = g(COL_C);
    const eVal = g(COL_E);
    const fVal = g(COL_F);
    const gVal = g(COL_G);
    const kVal = g(COL_K);
    const lVal = g(COL_L);
    const mVal = g(COL_M);
    const nVal = g(COL_N);
    const sVal = g(COL_S);

    const period = parseContractPeriod(eVal);
    const mgmt = parseManagementMethod(fVal, gVal);
    const productGroup = detectProductGroup(aVal);

    // M이 있으면 K 무시, N이 있으면 L 무시
    const normalFee = mVal || kVal;
    const tasaFee = nVal || lVal;
    const normalType = mVal ? '프로모션' : '정상가';
    const tasaType = nVal ? '타사보상 프로모션' : '타사보상';

    // 변경 행은 실제로 바뀐 렌탈료 컬럼만 포함
    const normalChanged = isNew || diffSet.has(COL_K) || diffSet.has(COL_M);
    const tasaChanged = isNew || diffSet.has(COL_L) || diffSet.has(COL_N);

    // S열 프로모션 타겟: "타사보상" 포함 → 타사보상 행에만 붙임
    const promoOnlyTasa = sVal.includes('타사보상');

    // C열 줄바꿈 → 모델 분리
    const models = cVal.split(/\r?\n/).map((m) => m.trim()).filter(Boolean);
    if (!models.length) continue;

    for (const model of models) {
      // 정상가 / 프로모션 행
      if (normalFee && normalChanged) {
        const promoStr = sVal && !promoOnlyTasa ? ` [${sVal}]` : '';
        result.push({
          제품코드: isNew ? makeCode() : '',
          제품명: `${model} ${aVal} ${period.yearLabel}_${mgmt.nameLabel}_${normalType}${promoStr}`.trim(),
          모델명: model,
          관리방법: mgmt.cmsLabel,
          제품그룹: productGroup,
          브랜드: '교원웰스',
          의무기간: period.months,
          렌탈가: normalFee,
          일반판매가: '',
          접수여부: 'Y',
          조리수체크: '',
          제품설명: '',
          세부구분: '001',
          입력자: 'TNC임진형',
          입력일시: '',
          수정자: '',
          수정일시: '',
        });
      }

      // 타사보상 / 타사보상 프로모션 행
      if (tasaFee && tasaChanged) {
        const promoStr = sVal ? ` [${sVal}]` : '';
        result.push({
          제품코드: isNew ? makeCode() : '',
          제품명: `${model} ${aVal} ${period.yearLabel}_${mgmt.nameLabel}_${tasaType}${promoStr}`.trim(),
          모델명: model,
          관리방법: mgmt.cmsLabel,
          제품그룹: productGroup,
          브랜드: '교원웰스',
          의무기간: period.months,
          렌탈가: tasaFee,
          일반판매가: '',
          접수여부: 'Y',
          조리수체크: '',
          제품설명: '',
          세부구분: '008',
          입력자: 'TNC임진형',
          입력일시: '',
          수정자: '',
          수정일시: '',
        });
      }
    }
  }

  return result;
}

// 단일 시트 전체를 신규로 간주하여 CMS 행 생성 (비교 없이 전체 변환)
export function generateKyowonCmsFromSheet(sheet: unknown[][], startSeq = 1): CmsRow[] {
  const dataRows = sheet.slice(1).filter(isDataRow);
  const allAsNew: KyowonRow[] = dataRows.map((row) => ({
    status: '신규' as const,
    row,
    diffCols: [],
  }));
  return generateKyowonCmsRows(allAsNew, startSeq);
}

// CMS 엑셀 내보내기 (구전산 양식, 노란 배경)
export function exportKyowonCmsExcel(rows: CmsRow[]): void {
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
      ws[addr].s = { fill: { patternType: 'solid', fgColor: { rgb: 'FFC000' } } };
    });
  });

  (ws as Record<string, unknown>)['!cols'] = CMS_COLUMNS.map((c) => ({
    wch: Math.max(c.length + 4, 16),
  }));

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, 'CMS업로드');
  XLSXStyle.writeFile(wb, `교원웰스_CMS_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
