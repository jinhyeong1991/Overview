import { useState } from 'react';
import { FileSpreadsheet, Download, Scale, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/components/UploadZone';
import {
  parseKyowonFile,
  compareSheets,
  calcKyowonSummary,
  exportKyowonExcel,
} from '@/lib/kyowon';
import type { KyowonRow, KyowonSummary } from '@/lib/kyowon';

function autoSelectSheet(names: string[], keywords: string[]): string {
  return (
    names.find((n) =>
      keywords.some((kw) => n.toLowerCase().includes(kw))
    ) ?? names[0] ?? ''
  );
}

export function KyowonComparator() {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [rawSheets, setRawSheets] = useState<Map<string, unknown[][]>>(new Map());
  const [selectedMay, setSelectedMay] = useState('');
  const [selectedJune, setSelectedJune] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KyowonRow[] | null>(null);
  const [summary, setSummary] = useState<KyowonSummary | null>(null);
  const [header, setHeader] = useState<unknown[]>([]);

  async function handleFileLoad(f: File | null) {
    setFile(f);
    setSheetNames([]);
    setRawSheets(new Map());
    setSelectedMay('');
    setSelectedJune('');
    setResult(null);
    setSummary(null);
    setError(null);
    if (!f) return;

    setLoading(true);
    try {
      const { sheetNames: names, rawSheets: sheets } = await parseKyowonFile(f);

      if (names.length < 2) {
        setError('시트가 2개 이상 필요합니다. 파일에 5월/6월 시트가 모두 있는지 확인해 주세요.');
        return;
      }

      setSheetNames(names);
      setRawSheets(sheets);

      const maySheet = autoSelectSheet(names, ['5', 'may', '기준', '이전', '전월']);
      const juneSheet =
        names.find(
          (n) =>
            n !== maySheet &&
            ['6', 'jun', '비교', '신규', '금월'].some((kw) =>
              n.toLowerCase().includes(kw)
            )
        ) ?? names.find((n) => n !== maySheet) ?? '';

      setSelectedMay(maySheet);
      setSelectedJune(juneSheet);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleCompare() {
    if (!selectedMay || !selectedJune) {
      setError('5월(기준)과 6월(비교) 시트를 모두 선택해 주세요.');
      return;
    }
    if (selectedMay === selectedJune) {
      setError('기준 시트와 비교 시트가 동일합니다.');
      return;
    }

    setError(null);
    setResult(null);
    setSummary(null);

    const sheetMay = rawSheets.get(selectedMay)!;
    const sheetJune = rawSheets.get(selectedJune)!;

    const headerRow = sheetJune[0] ?? sheetMay[0] ?? [];
    setHeader(headerRow);

    const rows = compareSheets(sheetMay, sheetJune);
    const s = calcKyowonSummary(rows);
    setResult(rows);
    setSummary(s);
  }

  function handleDownload() {
    if (!result) return;
    exportKyowonExcel(result, header);
  }

  const summaryCards = summary
    ? [
        { label: '신규', count: summary.신규, color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', dot: 'bg-green-500' },
        { label: '변경', count: summary.변경, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', dot: 'bg-orange-500' },
        { label: '유지', count: summary.유지, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500' },
        { label: '단종', count: summary.단종, color: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300', dot: 'bg-gray-400' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
        <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-800 dark:text-indigo-300">교원웰스 프로모션 비교</p>
          <p className="text-indigo-700 dark:text-indigo-400 mt-0.5">
            5월/6월 시트가 포함된 엑셀 파일을 업로드하세요.
            C·E·F·G열 기준으로 행을 매칭하고, J~T열의 차이를 색상으로 표시한 엑셀을 내보냅니다.
          </p>
        </div>
      </div>

      {/* File upload */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          교원웰스 엑셀 업로드 (5월+6월 시트 포함)
        </p>
        <UploadZone
          label="교원웰스 파일"
          sublabel=".xlsx / .xls — 두 시트 포함"
          file={file}
          onFile={handleFileLoad}
          accent="blue"
        />
        {loading && <p className="text-xs text-muted-foreground mt-1">파일 파싱 중...</p>}
      </div>

      {/* Sheet selection */}
      {sheetNames.length >= 2 && (
        <div className="rounded-xl border p-4 space-y-4">
          <p className="text-sm font-semibold">시트 선택</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                기준 시트 (5월)
              </label>
              <select
                value={selectedMay}
                onChange={(e) => { setSelectedMay(e.target.value); setResult(null); setSummary(null); }}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sheetNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                비교 시트 (6월)
              </label>
              <select
                value={selectedJune}
                onChange={(e) => { setSelectedJune(e.target.value); setResult(null); setSummary(null); }}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sheetNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <Button
            onClick={handleCompare}
            disabled={!selectedMay || !selectedJune || selectedMay === selectedJune}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Scale className="w-4 h-4" />
            비교 시작
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Results */}
      {summary && result && (
        <div className="rounded-xl border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <p className="text-sm font-semibold">비교 완료 — 총 {summary.total}행</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {summaryCards.map(({ label, count, color, dot }) => (
              <div
                key={label}
                className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg ${color} text-sm font-medium`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span>{label}</span>
                </div>
                <span className="text-2xl font-bold">{count}</span>
              </div>
            ))}
          </div>

          {/* Color legend */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-green-300" />신규 — 연두색 행
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-orange-400" />변경 — 주황색 셀(J~T)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-gray-300" />단종 — 회색 행
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm border bg-white dark:bg-zinc-800" />유지 — 강조 없음
            </span>
          </div>

          <Button
            size="lg"
            className="gap-2 h-12 px-8 bg-indigo-600 hover:bg-indigo-700 font-semibold"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
            엑셀 다운로드 ({summary.total}행)
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!file && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">교원웰스 엑셀 파일을 업로드해 주세요.</p>
          <p className="text-xs text-muted-foreground">5월과 6월 시트가 모두 포함된 파일을 선택하세요.</p>
        </div>
      )}
    </div>
  );
}
