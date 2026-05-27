import { useState } from 'react';
import { FileSpreadsheet, Download, AlertCircle, CheckCircle2, FileText, GitCompare, RefreshCw, Presentation, Plus, Minus } from 'lucide-react';
import { parsePptxSlides, comparePptx } from '@/lib/kyowonPptx';
import type { PptxDiff } from '@/lib/kyowonPptx';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/components/UploadZone';
import {
  parseKyowonSheet,
  compareSheets,
  calcKyowonSummary,
  exportKyowonExcel,
  generateKyowonCmsRows,
  generateKyowonCmsFromSheet,
  exportKyowonCmsExcel,
} from '@/lib/kyowon';
import type { KyowonRow, KyowonSummary } from '@/lib/kyowon';
import type { CmsRow } from '@/lib/cms';

type Mode = 'compare' | 'direct' | 'pptx';

function getTodayDateCodePreview(): string {
  const d = new Date();
  return String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
}

// ── 전체 변환 모드 ────────────────────────────────────────────────────────────
function DirectCmsMode() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cmsRows, setCmsRows] = useState<CmsRow[] | null>(null);

  async function handleConvert() {
    if (!file) return;
    setError(null);
    setCmsRows(null);
    setLoading(true);
    try {
      const sheet = await parseKyowonSheet(file);
      if (sheet.length < 2) {
        setError('데이터 행이 없습니다. 파일을 확인해 주세요.');
        return;
      }
      const rows = generateKyowonCmsFromSheet(sheet);
      if (rows.length === 0) {
        setError('변환된 행이 없습니다. K~N열(렌탈료)에 값이 있는지 확인해 주세요.');
        return;
      }
      setCmsRows(rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm">
        <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-amber-800 dark:text-amber-300">전체 CMS 변환 모드</p>
          <p className="text-amber-700 dark:text-amber-400 mt-0.5">
            비교 없이 파일 전체를 CMS(구전산) 양식으로 변환합니다. 모든 행에 신규 코드(kw{getTodayDateCodePreview()}001~)가 부여됩니다.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">웰스 프로모션 파일</p>
        <UploadZone
          label="교원웰스 파일"
          sublabel=".xlsx / .xls"
          file={file}
          onFile={(f) => { setFile(f); setCmsRows(null); setError(null); }}
          accent="blue"
        />
      </div>

      {file && !cmsRows && (
        <Button onClick={handleConvert} disabled={loading} className="gap-2 bg-amber-600 hover:bg-amber-700">
          <FileText className="w-4 h-4" />
          {loading ? '변환 중...' : 'CMS 변환'}
        </Button>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {cmsRows && (
        <div className="rounded-xl border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <p className="text-sm font-semibold">변환 완료 — CMS {cmsRows.length}행</p>
          </div>
          <p className="text-xs text-muted-foreground">
            C열 복수 모델, M/N 프로모션 우선, S열 프로모션 자동 반영
          </p>
          <div className="flex gap-3">
            <Button
              size="lg"
              className="gap-2 h-12 px-8 bg-amber-600 hover:bg-amber-700 font-semibold"
              onClick={() => exportKyowonCmsExcel(cmsRows)}
            >
              <Download className="w-4 h-4" />
              CMS 엑셀 다운로드 ({cmsRows.length}행)
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => { setCmsRows(null); setFile(null); }}>
              <RefreshCw className="w-4 h-4" />
              초기화
            </Button>
          </div>
        </div>
      )}

      {!file && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">교원웰스 파일을 업로드해 주세요.</p>
          <p className="text-xs text-muted-foreground">전체 행이 신규로 변환됩니다.</p>
        </div>
      )}
    </div>
  );
}

// ── 비교 모드 ─────────────────────────────────────────────────────────────────
function CompareMode() {
  const [fileMay, setFileMay] = useState<File | null>(null);
  const [fileJune, setFileJune] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KyowonRow[] | null>(null);
  const [summary, setSummary] = useState<KyowonSummary | null>(null);
  const [header, setHeader] = useState<unknown[]>([]);
  const [cmsRows, setCmsRows] = useState<CmsRow[] | null>(null);

  function resetResult() {
    setResult(null); setSummary(null); setError(null); setCmsRows(null);
  }

  async function handleCompare() {
    if (!fileMay || !fileJune) { setError('5월 파일과 6월 파일을 모두 업로드해 주세요.'); return; }
    setError(null); setResult(null); setSummary(null); setCmsRows(null);
    setLoading(true);
    try {
      const [sheetMay, sheetJune] = await Promise.all([
        parseKyowonSheet(fileMay),
        parseKyowonSheet(fileJune),
      ]);
      setHeader(sheetJune[0] ?? sheetMay[0] ?? []);
      const rows = compareSheets(sheetMay, sheetJune);
      setSummary(calcKyowonSummary(rows));
      setResult(rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const cmsTargetCount = summary ? summary.신규 + summary.변경 : 0;

  const summaryCards = summary ? [
    { label: '신규', count: summary.신규, color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', dot: 'bg-green-500' },
    { label: '변경', count: summary.변경, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', dot: 'bg-orange-500' },
    { label: '유지', count: summary.유지, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500' },
    { label: '단종', count: summary.단종, color: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300', dot: 'bg-gray-400' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">기준 파일 (5월)</p>
          <UploadZone label="5월 프로모션 파일" sublabel=".xlsx / .xls" file={fileMay} onFile={(f) => { setFileMay(f); resetResult(); }} accent="blue" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">비교 파일 (6월)</p>
          <UploadZone label="6월 프로모션 파일" sublabel=".xlsx / .xls" file={fileJune} onFile={(f) => { setFileJune(f); resetResult(); }} accent="blue" />
        </div>
      </div>

      {fileMay && fileJune && !result && (
        <Button onClick={handleCompare} disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <GitCompare className="w-4 h-4" />
          {loading ? '비교 중...' : '비교 시작'}
        </Button>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {summary && result && (
        <div className="rounded-xl border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <p className="text-sm font-semibold">비교 완료 — 총 {summary.total}행</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {summaryCards.map(({ label, count, color, dot }) => (
              <div key={label} className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg ${color} text-sm font-medium`}>
                <div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${dot}`} /><span>{label}</span></div>
                <span className="text-2xl font-bold">{count}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-green-300" />신규 — 연두색</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-orange-400" />변경 — 주황색 셀</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-gray-300" />단종 — 회색</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm border bg-white dark:bg-zinc-800" />유지</span>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => exportKyowonExcel(result, header)}>
            <Download className="w-4 h-4" />비교 결과 엑셀 ({summary.total}행)
          </Button>
        </div>
      )}

      {result && cmsTargetCount > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-4">
          <div className="text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300">CMS(구전산) 파일 생성</p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              신규 {summary!.신규}건 + 변경 {summary!.변경}건 → CMS 업로드 양식 변환
            </p>
            <ul className="mt-2 text-xs space-y-0.5 text-amber-600 dark:text-amber-500">
              <li>• 신규: kw{getTodayDateCodePreview()}001~ 코드 자동 생성</li>
              <li>• 변경: 제품코드 빈칸 → 기존 코드 직접 입력 필요</li>
            </ul>
          </div>
          {!cmsRows ? (
            <Button onClick={() => setCmsRows(generateKyowonCmsRows(result))} className="gap-2 bg-amber-600 hover:bg-amber-700">
              <FileText className="w-4 h-4" />CMS 파일 생성
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />CMS 행 {cmsRows.length}건 생성 완료
              </div>
              <Button size="lg" className="gap-2 h-12 px-8 bg-amber-600 hover:bg-amber-700 font-semibold" onClick={() => exportKyowonCmsExcel(cmsRows)}>
                <Download className="w-4 h-4" />CMS 엑셀 다운로드 ({cmsRows.length}행)
              </Button>
            </div>
          )}
        </div>
      )}

      {!fileMay && !fileJune && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">5월·6월 파일을 각각 업로드해 주세요.</p>
        </div>
      )}
    </div>
  );
}

// ── PPTX 비교 모드 ───────────────────────────────────────────────────────────
function PptxMode() {
  const [fileMay, setFileMay] = useState<File | null>(null);
  const [fileJune, setFileJune] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diff, setDiff] = useState<PptxDiff | null>(null);
  const [showRemoved, setShowRemoved] = useState(true);

  function reset() { setDiff(null); setError(null); }

  async function handleCompare() {
    if (!fileMay || !fileJune) { setError('5월·6월 PPTX 파일을 모두 업로드해 주세요.'); return; }
    setError(null); setDiff(null); setLoading(true);
    try {
      const [may, june] = await Promise.all([
        parsePptxSlides(fileMay),
        parsePptxSlides(fileJune),
      ]);
      setDiff(comparePptx(may, june));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-sm">
        <Presentation className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-purple-800 dark:text-purple-300">PPTX 비교 모드</p>
          <p className="text-purple-700 dark:text-purple-400 mt-0.5">
            5월·6월 PPTX를 업로드하면 신규 추가된 내용과 삭제된 내용을 슬라이드 단위로 보여줍니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">기준 파일 (5월 PPTX)</p>
          <UploadZone label="5월 프로모션 PPTX" sublabel=".pptx" file={fileMay} onFile={(f) => { setFileMay(f); reset(); }} accent="blue" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">비교 파일 (6월 PPTX)</p>
          <UploadZone label="6월 프로모션 PPTX" sublabel=".pptx" file={fileJune} onFile={(f) => { setFileJune(f); reset(); }} accent="blue" />
        </div>
      </div>

      {fileMay && fileJune && !diff && (
        <Button onClick={handleCompare} disabled={loading} className="gap-2 bg-purple-600 hover:bg-purple-700">
          <GitCompare className="w-4 h-4" />
          {loading ? '분석 중...' : 'PPTX 비교 시작'}
        </Button>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {diff && (
        <div className="space-y-4">
          {/* 요약 */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-sm font-semibold">
              <Plus className="w-4 h-4" />신규 {diff.summary.newCount}건
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-sm font-semibold">
              <Minus className="w-4 h-4" />삭제 {diff.summary.removedCount}건
            </div>
          </div>

          {/* 신규 항목 */}
          {diff.newInJune.length > 0 && (
            <div className="rounded-xl border border-green-200 dark:border-green-800 overflow-hidden">
              <div className="bg-green-50 dark:bg-green-950/30 px-4 py-2.5 flex items-center gap-2">
                <Plus className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800 dark:text-green-300">6월 신규 추가 ({diff.newInJune.length}건)</span>
              </div>
              <div className="divide-y divide-green-100 dark:divide-green-900/30 max-h-80 overflow-y-auto">
                {diff.newInJune.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="text-xs text-green-600 dark:text-green-500 shrink-0 mt-0.5 font-mono">S{item.slideNumber}</span>
                    <span className="text-sm text-green-900 dark:text-green-200">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 삭제 항목 */}
          {diff.removedInMay.length > 0 && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
              <button
                className="w-full bg-red-50 dark:bg-red-950/30 px-4 py-2.5 flex items-center justify-between"
                onClick={() => setShowRemoved((v) => !v)}
              >
                <div className="flex items-center gap-2">
                  <Minus className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-800 dark:text-red-300">5월에서 삭제 ({diff.removedInMay.length}건)</span>
                </div>
                <span className="text-xs text-muted-foreground">{showRemoved ? '접기 ▲' : '펼치기 ▼'}</span>
              </button>
              {showRemoved && (
                <div className="divide-y divide-red-100 dark:divide-red-900/30 max-h-80 overflow-y-auto">
                  {diff.removedInMay.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="text-xs text-red-500 dark:text-red-400 shrink-0 mt-0.5 font-mono">S{item.slideNumber}</span>
                      <span className="text-sm text-red-800 dark:text-red-300 line-through opacity-70">{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {diff.newInJune.length === 0 && diff.removedInMay.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-5 h-5" />
              두 파일의 내용이 동일합니다. 차이점이 없습니다.
            </div>
          )}

          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setDiff(null); setFileMay(null); setFileJune(null); }}>
            <RefreshCw className="w-3.5 h-3.5" />초기화
          </Button>
        </div>
      )}

      {!fileMay && !fileJune && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Presentation className="w-12 h-12 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">5월·6월 PPTX 파일을 업로드해 주세요.</p>
          <p className="text-xs text-muted-foreground">슬라이드 텍스트 기반으로 신규·삭제 항목을 비교합니다.</p>
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export function KyowonComparator() {
  const [mode, setMode] = useState<Mode>('compare');

  return (
    <div className="space-y-5">
      {/* 모드 전환 */}
      <div className="flex rounded-lg border overflow-hidden w-fit flex-wrap">
        <button
          onClick={() => setMode('compare')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'compare' ? 'bg-indigo-600 text-white' : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          5월↔6월 비교 분석
        </button>
        <button
          onClick={() => setMode('direct')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'direct' ? 'bg-amber-600 text-white' : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          전체 CMS 변환
        </button>
        <button
          onClick={() => setMode('pptx')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'pptx' ? 'bg-purple-600 text-white' : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          <Presentation className="w-3.5 h-3.5" />
          PPTX 비교
        </button>
      </div>

      {mode === 'compare' && <CompareMode />}
      {mode === 'direct' && <DirectCmsMode />}
      {mode === 'pptx' && <PptxMode />}
    </div>
  );
}
