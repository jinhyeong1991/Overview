import { useState } from 'react';
import { FileSpreadsheet, Download, Scale, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/components/UploadZone';
import {
  parseKyowonSheet,
  compareSheets,
  calcKyowonSummary,
  exportKyowonExcel,
} from '@/lib/kyowon';
import type { KyowonRow, KyowonSummary } from '@/lib/kyowon';

export function KyowonComparator() {
  const [fileMay, setFileMay] = useState<File | null>(null);
  const [fileJune, setFileJune] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KyowonRow[] | null>(null);
  const [summary, setSummary] = useState<KyowonSummary | null>(null);
  const [header, setHeader] = useState<unknown[]>([]);

  function resetResult() {
    setResult(null);
    setSummary(null);
    setError(null);
  }

  async function handleCompare() {
    if (!fileMay || !fileJune) {
      setError('5월 파일과 6월 파일을 모두 업로드해 주세요.');
      return;
    }

    setError(null);
    setResult(null);
    setSummary(null);
    setLoading(true);

    try {
      const [sheetMay, sheetJune] = await Promise.all([
        parseKyowonSheet(fileMay),
        parseKyowonSheet(fileJune),
      ]);

      const headerRow = sheetJune[0] ?? sheetMay[0] ?? [];
      setHeader(headerRow);

      const rows = compareSheets(sheetMay, sheetJune);
      setSummary(calcKyowonSummary(rows));
      setResult(rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
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
            5월 기준 파일과 6월 신규 파일을 각각 업로드하세요.
            C·E·F·G열 기준으로 행을 매칭하고, J~T열의 차이를 색상으로 표시한 엑셀을 내보냅니다.
          </p>
        </div>
      </div>

      {/* File upload — two files */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            기준 파일 (5월)
          </p>
          <UploadZone
            label="5월 프로모션 파일"
            sublabel=".xlsx / .xls"
            file={fileMay}
            onFile={(f) => { setFileMay(f); resetResult(); }}
            accent="blue"
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            비교 파일 (6월)
          </p>
          <UploadZone
            label="6월 프로모션 파일"
            sublabel=".xlsx / .xls"
            file={fileJune}
            onFile={(f) => { setFileJune(f); resetResult(); }}
            accent="blue"
          />
        </div>
      </div>

      {/* Compare button */}
      {fileMay && fileJune && !result && (
        <Button
          onClick={handleCompare}
          disabled={loading}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          <Scale className="w-4 h-4" />
          {loading ? '비교 중...' : '비교 시작'}
        </Button>
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
      {!fileMay && !fileJune && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">5월·6월 파일을 각각 업로드해 주세요.</p>
          <p className="text-xs text-muted-foreground">두 파일을 모두 선택하면 비교 버튼이 나타납니다.</p>
        </div>
      )}
    </div>
  );
}
