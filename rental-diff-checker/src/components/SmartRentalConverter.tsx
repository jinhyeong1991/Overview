import { useState } from 'react';
import { FileSpreadsheet, Download, Shuffle, CheckCircle2, AlertCircle, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/components/UploadZone';
import { parseExcel } from '@/lib/excel';
import {
  detectSmartRentalCols,
  convertSmartRentalToCms,
  exportSmartRentalCms,
  matchProductCodes,
  detectCmsRefCols,
  exportSmartRentalCmsWithCodes,
} from '@/lib/smartRental';
import type { SmartRentalCols, CodeMatchResult } from '@/lib/smartRental';
import type { CmsRow } from '@/lib/cms';

export function SmartRentalConverter() {
  // ── 1단계 상태 ──────────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedCols, setDetectedCols] = useState<SmartRentalCols | null>(null);
  const [preview, setPreview] = useState<{ source: number; output: number } | null>(null);
  const [converted, setConverted] = useState<CmsRow[] | null>(null);

  // ── 2단계 상태 ──────────────────────────────────────────────────────────
  const [cmsRefFile, setCmsRefFile] = useState<File | null>(null);
  const [step2Loading, setStep2Loading] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<CodeMatchResult | null>(null);

  // ── 1단계: 스마트렌탈 파일 로드 ─────────────────────────────────────────
  async function handleFileLoad(f: File | null) {
    setFile(f);
    setDetectedCols(null);
    setPreview(null);
    setConverted(null);
    setError(null);
    setCmsRefFile(null);
    setMatchResult(null);
    setStep2Error(null);
    if (!f) return;

    setLoading(true);
    try {
      const { rows, headers } = await parseExcel(f);
      const cols = detectSmartRentalCols(headers);

      if (!cols.상품명 && !cols.모델명) {
        setError('상품명 또는 모델명 컬럼을 찾지 못했습니다. 스마트렌탈 파일이 맞는지 확인해 주세요.');
        setLoading(false);
        return;
      }
      if (!cols.fee36 && !cols.fee48 && !cols.fee60) {
        setError('월 렌탈료 컬럼(36/48/60개월)을 찾지 못했습니다. 컬럼명을 확인해 주세요.');
        setLoading(false);
        return;
      }

      setDetectedCols(cols);
      const result = convertSmartRentalToCms(rows, cols);
      setConverted(result);
      setPreview({ source: rows.length, output: result.length });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // ── 2단계: 기존 CMS 참조 파일로 제품코드 매칭 ───────────────────────────
  async function handleCmsRefLoad(f: File | null) {
    setCmsRefFile(f);
    setMatchResult(null);
    setStep2Error(null);
    if (!f || !converted) return;

    setStep2Loading(true);
    try {
      const { rows, headers } = await parseExcel(f);
      const { modelCol, codeCol } = detectCmsRefCols(headers);

      if (!modelCol) {
        setStep2Error('CMS 파일에서 모델명 컬럼을 찾지 못했습니다.');
        setStep2Loading(false);
        return;
      }
      if (!codeCol) {
        setStep2Error('CMS 파일에서 제품코드 컬럼을 찾지 못했습니다.');
        setStep2Loading(false);
        return;
      }

      const result = matchProductCodes(converted, rows, modelCol, codeCol);
      setMatchResult(result);
    } catch (e) {
      setStep2Error((e as Error).message);
    } finally {
      setStep2Loading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 설명 배너 */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
        <Shuffle className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-violet-800 dark:text-violet-300">
            스마트렌탈 가로형식 → CMS 세로형식 변환
          </p>
          <p className="text-violet-700 dark:text-violet-400 mt-0.5">
            스마트렌탈 엑셀(1행 = 1상품, 여러 기간 열)을 CMS 업로드 양식(1행 = 1기간)으로 자동 변환합니다.
          </p>
        </div>
      </div>

      {/* 변환 규칙 */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">변환 규칙</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { from: '품목', to: '제품그룹 (3자리 코드 / 미매칭 시 047)' },
            { from: '상품명', to: '제품명 + 기간 (예: 상품명 (36))' },
            { from: '모델명', to: '모델명' },
            { from: '월 렌탈료(36개월)', to: '의무기간=36, 렌탈가' },
            { from: '월 렌탈료(48개월)', to: '의무기간=48, 렌탈가' },
            { from: '월 렌탈료(60개월)', to: '의무기간=60, 렌탈가' },
            { from: '총 렌탈료 (전체)', to: '무시 (제외)' },
            { from: '렌탈료 빈값', to: '해당 기간 행 생성 안 함' },
          ].map(rule => (
            <div key={rule.from} className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 border">
              <span className="text-muted-foreground shrink-0">{rule.from}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium text-violet-700 dark:text-violet-400">{rule.to}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 1단계: 파일 업로드 ── */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          1단계 · 스마트렌탈 엑셀 업로드
        </p>
        <UploadZone
          label="스마트렌탈 파일"
          sublabel="품목·상품명·모델명·월 렌탈료(36/48/60개월) 컬럼 포함"
          file={file}
          onFile={handleFileLoad}
          accent="blue"
        />
        {loading && <p className="text-xs text-muted-foreground mt-1">변환 중...</p>}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg mt-1">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>

      {/* 감지된 컬럼 */}
      {detectedCols && (
        <div className="rounded-xl border p-4 space-y-3">
          <p className="text-sm font-semibold">감지된 컬럼</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {([
              ['품목', detectedCols.품목],
              ['상품명', detectedCols.상품명],
              ['모델명', detectedCols.모델명],
              ['월렌탈료(36)', detectedCols.fee36],
              ['월렌탈료(48)', detectedCols.fee48],
              ['월렌탈료(60)', detectedCols.fee60],
            ] as [string, string][]).map(([label, col]) => (
              <div key={label} className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border">
                <span className="text-muted-foreground">{label}:</span>
                {col ? (
                  <span className="font-medium text-green-700 dark:text-green-400 truncate" title={col}>{col}</span>
                ) : (
                  <span className="text-red-500">미감지</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 변환 결과 + 1단계 다운로드 */}
      {preview && converted && (
        <div className="rounded-xl border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">1단계 변환 결과</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-sm font-medium">
              📋 원본 <strong>{preview.source}행</strong>
            </div>
            <span className="self-center text-muted-foreground text-sm">→</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              CMS <strong>{preview.output}행</strong>
              <span className="text-xs opacity-70">(렌탈기간별 분리)</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-violet-300 text-violet-700 hover:bg-violet-50"
            onClick={() => exportSmartRentalCms(converted)}
          >
            <Download className="w-3.5 h-3.5" />
            1단계 파일 다운로드 (제품코드 없음)
          </Button>
        </div>
      )}

      {/* ── 2단계: 기존 CMS로 제품코드 매칭 ── */}
      {converted && converted.length > 0 && (
        <div className="rounded-xl border-2 border-teal-200 dark:border-teal-800 p-5 space-y-4 bg-teal-50/40 dark:bg-teal-950/10">
          <div className="flex items-start gap-2">
            <Link className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">
                2단계 · 기존 CMS에서 제품코드 매칭
              </p>
              <p className="text-xs text-teal-700 dark:text-teal-400 mt-0.5">
                기존 CMS 엑셀을 업로드하면 모델명이 일치하는 행에서 제품코드를 자동으로 찾아 넣어줍니다.
              </p>
            </div>
          </div>

          <UploadZone
            label="기존 CMS 파일 (제품코드 참조용)"
            sublabel="모델명·제품코드 컬럼이 포함된 현재 CMS 엑셀"
            file={cmsRefFile}
            onFile={handleCmsRefLoad}
            accent="blue"
          />

          {step2Loading && <p className="text-xs text-muted-foreground">매칭 중...</p>}
          {step2Error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {step2Error}
            </div>
          )}

          {matchResult && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-sm font-medium">
                  ✅ 제품코드 매칭 <strong>{matchResult.matched}건</strong>
                </div>
                {matchResult.unmatched > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 text-sm font-medium">
                    ⚠️ 미매칭 <strong>{matchResult.unmatched}건</strong>
                    <span className="text-xs">(제품코드 빈칸)</span>
                  </div>
                )}
              </div>
              <Button
                size="lg"
                className="gap-2 h-12 px-8 bg-teal-600 hover:bg-teal-700 font-semibold"
                onClick={() => exportSmartRentalCmsWithCodes(matchResult.rows)}
              >
                <Download className="w-4 h-4" />
                2단계 파일 다운로드 (제품코드 포함, {matchResult.rows.length}행)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 안내 (파일 없을 때) */}
      {!file && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">스마트렌탈 엑셀 파일을 업로드해 주세요.</p>
          <p className="text-xs text-muted-foreground">
            가로형식(1행 = 1상품)을 CMS 세로형식(1행 = 1기간)으로 자동 변환합니다.
          </p>
        </div>
      )}
    </div>
  );
}
