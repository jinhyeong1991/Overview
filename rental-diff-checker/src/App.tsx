import { useState, useCallback } from 'react';
import { Moon, Sun, Download, RefreshCw, GitCompare, UploadCloud, ArrowRightLeft, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/components/UploadZone';
import { SummaryDashboard } from '@/components/SummaryDashboard';
import { ResultTable } from '@/components/ResultTable';
import { ColumnMappingModal } from '@/components/ColumnMappingModal';
import { CmsGenerator } from '@/components/CmsGenerator';
import { CmsConverter } from '@/components/CmsConverter';
import { SmartRentalConverter } from '@/components/SmartRentalConverter';
import { parseExcel, diffExcelData, exportToExcel, autoDetectMapping } from '@/lib/excel';
import type { DiffResult, SummaryStats, ColumnMapping } from '@/types';

type Tab = 'compare' | 'cms' | 'converter' | 'smart';

type Theme = 'light' | 'dark';

function useTheme(): [Theme, () => void] {
  const initial = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const [theme, setTheme] = useState<Theme>(() => {
    if (document.documentElement.classList.contains('dark')) return 'dark';
    return initial;
  });

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  return [theme, toggle];
}

function calcStats(results: DiffResult[]): SummaryStats {
  const stats: SummaryStats = { 신규: 0, 업데이트: 0, 유지: 0, 단종: 0, total: results.length };
  results.forEach((r) => stats[r._status]++);
  return stats;
}

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('compare');
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mapping modal
  const [showMapping, setShowMapping] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ 모델명: '', 렌탈기간: '', 렌탈료: '', 프로모션: undefined });

  // Results
  const [results, setResults] = useState<DiffResult[] | null>(null);
  const [visibleHeaders, setVisibleHeaders] = useState<string[]>([]);
  const [rawA, setRawA] = useState<Record<string, unknown>[]>([]);
  const [rawB, setRawB] = useState<Record<string, unknown>[]>([]);

  async function handleAnalyze() {
    if (!fileA || !fileB) return;
    setLoading(true);
    setError(null);
    try {
      const [parsedA, parsedB] = await Promise.all([parseExcel(fileA), parseExcel(fileB)]);
      const allHeaders = [...new Set([...parsedA.headers, ...parsedB.headers])];
      setHeaders(allHeaders);
      setRawA(parsedA.rows);
      setRawB(parsedB.rows);

      const detected = autoDetectMapping(allHeaders);
      setMapping({
        모델명: detected.모델명 ?? '',
        렌탈기간: detected.렌탈기간 ?? '',
        렌탈료: detected.렌탈료 ?? '',
        제품코드: detected.제품코드,
        상품명: detected.상품명,
        단품결합: detected.단품결합,
        프로모션: detected.프로모션,
      });
      setShowMapping(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirmMapping() {
    if (!mapping.모델명 || !mapping.렌탈기간 || !mapping.렌탈료) return;
    setShowMapping(false);
    const diff = diffExcelData(rawA, rawB, mapping);
    setResults(diff);

    const priority = [
      mapping.제품코드,
      mapping.상품명,
      mapping.모델명,
      mapping.렌탈기간,
      mapping.단품결합,
      mapping.렌탈료,
      mapping.프로모션,
    ].filter(Boolean) as string[];

    const rest = headers.filter((h) => !priority.includes(h));
    setVisibleHeaders([...priority, ...rest]);
  }

  function handleReset() {
    setFileA(null);
    setFileB(null);
    setResults(null);
    setError(null);
    setHeaders([]);
    setRawA([]);
    setRawB([]);
  }

  const stats = results ? calcStats(results) : null;
  const canAnalyze = fileA && fileB && !loading;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <GitCompare className="w-5 h-5 text-blue-600" />
          <span className="font-bold tracking-tight text-lg">렌탈료 비교 분석기</span>
          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
            v1.0 beta
          </span>
          <span className="text-xs text-muted-foreground hidden sm:block">
            — 두 엑셀 파일의 렌탈 상품을 비교·분류합니다
          </span>
          <div className="ml-auto flex items-center gap-2">
            {results && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                초기화
              </Button>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="테마 전환"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Tab Navigation */}
        <div className="flex rounded-lg border overflow-hidden w-fit">
          {([
            { id: 'compare' as Tab, label: '비교 분석', icon: <GitCompare className="w-3.5 h-3.5" /> },
            { id: 'cms' as Tab, label: 'CMS 업로드 생성', icon: <UploadCloud className="w-3.5 h-3.5" /> },
            { id: 'converter' as Tab, label: 'CMS → GPT 변환', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
            { id: 'smart' as Tab, label: '스마트렌탈 → CMS', icon: <Shuffle className="w-3.5 h-3.5" /> },
          ] as const).map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {icon}{label}
              {id === 'cms' && results && results.filter(r => r._status === '업데이트').length > 0 && (
                <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {results.filter(r => r._status === '업데이트').length}
                </span>
              )}
              {(id === 'converter' || id === 'smart') && (
                <span className="ml-1 bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  NEW
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB 1: 비교 분석 ── */}
        {activeTab === 'compare' && (
        <div className="space-y-8">
        {/* Upload Section */}
        {!results && (
          <section className="space-y-6">
            <div>
              <h2 className="text-base font-semibold mb-1">파일 업로드</h2>
              <p className="text-sm text-muted-foreground">
                비교 기준이 되는 <strong>과거(A)</strong> 파일과 최신 <strong>현재(B)</strong> 파일을 각각 올려주세요.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  A. 과거 데이터 (기준)
                </p>
                <UploadZone
                  label="과거 엑셀 파일 (A)"
                  sublabel=".xlsx / .xls"
                  file={fileA}
                  onFile={setFileA}
                  accent="slate"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  B. 현재 데이터 (최신)
                </p>
                <UploadZone
                  label="현재 엑셀 파일 (B)"
                  sublabel=".xlsx / .xls"
                  file={fileB}
                  onFile={setFileB}
                  accent="blue"
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <Button
                size="lg"
                className="px-12 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
                disabled={!canAnalyze}
                onClick={handleAnalyze}
              >
                {loading ? '분석 중...' : '비교 분석 실행'}
              </Button>
              {!canAnalyze && !loading && (
                <p className="text-xs text-muted-foreground">
                  {!fileA && !fileB
                    ? 'A, B 파일을 모두 업로드해 주세요.'
                    : !fileA
                    ? 'A (과거) 파일을 업로드해 주세요.'
                    : 'B (현재) 파일을 업로드해 주세요.'}
                </p>
              )}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-2 rounded-lg">
                  {error}
                </p>
              )}
            </div>

            {/* Status Guide */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {[
                { dot: '🟢', label: '신규', desc: 'B에만 있는 상품' },
                { dot: '🟠', label: '변동', desc: '렌탈료가 바뀐 상품' },
                { dot: '⚪', label: '유지', desc: '동일한 상품' },
                { dot: '⚫', label: '단종', desc: 'A에만 있는 상품' },
              ].map((g) => (
                <div key={g.label} className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 text-sm">
                  <span>{g.dot}</span>
                  <div>
                    <span className="font-medium">{g.label}</span>
                    <p className="text-xs text-muted-foreground">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results Section */}
        {results && stats && (
          <section className="space-y-5">
            <SummaryDashboard stats={stats} />
            <ResultTable
              results={results}
              visibleHeaders={visibleHeaders}
              feeColumn={mapping.렌탈료}
              promoColumn={mapping.프로모션}
            />
          </section>
        )}
        </div>
        )}

        {/* ── TAB 2: CMS 업로드 생성 ── */}
        {activeTab === 'cms' && (
          <section className="space-y-2">
            <div className="mb-4">
              <h2 className="text-base font-semibold">CMS 업로드 파일 생성기</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                비교 분석의 <strong>업데이트 항목</strong>과 기존 CMS 엑셀을 연결해
                CMS 업로드용 엑셀 파일을 자동 생성합니다.
              </p>
            </div>
            <CmsGenerator
              diffResults={results}
              compMapping={results ? mapping : null}
            />
          </section>
        )}

        {/* ── TAB 3: CMS → GPT 변환 ── */}
        {activeTab === 'converter' && (
          <section className="space-y-2">
            <div className="mb-4">
              <h2 className="text-base font-semibold">CMS → GPT 형식 변환기</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                기존 CMS 엑셀을 비교 분석 도구에 바로 사용할 수 있는 GPT 형식으로 변환합니다.
              </p>
            </div>
            <CmsConverter />
          </section>
        )}

        {/* ── TAB 4: 스마트렌탈 → CMS 변환 ── */}
        {activeTab === 'smart' && (
          <section className="space-y-2">
            <div className="mb-4">
              <h2 className="text-base font-semibold">스마트렌탈 → CMS 변환기</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                스마트렌탈 가로형식 엑셀을 CMS 업로드용 세로형식으로 자동 변환합니다.
              </p>
            </div>
            <SmartRentalConverter />
          </section>
        )}
      </main>

      {/* Floating Download Button (compare tab only) */}
      {results && activeTab === 'compare' && (
        <div className="fixed bottom-6 right-6 z-30">
          <Button
            size="lg"
            className="h-12 px-6 gap-2 shadow-xl bg-blue-600 hover:bg-blue-700 font-semibold"
            onClick={() => exportToExcel(results, mapping, visibleHeaders)}
          >
            <Download className="w-4 h-4" />
            결과 엑셀 다운로드
          </Button>
        </div>
      )}

      {/* Column Mapping Modal */}
      <ColumnMappingModal
        open={showMapping}
        headers={headers}
        mapping={mapping}
        onChange={setMapping}
        onConfirm={handleConfirmMapping}
      />
    </div>
  );
}
