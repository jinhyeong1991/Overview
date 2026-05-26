import { useState } from 'react';
import { FileSpreadsheet, Download, Shuffle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/components/UploadZone';
import { parseExcel } from '@/lib/excel';
import {
  detectSmartRentalCols,
  convertSmartRentalToCms,
  exportSmartRentalCms,
} from '@/lib/smartRental';
import type { SmartRentalCols } from '@/lib/smartRental';

export function SmartRentalConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedCols, setDetectedCols] = useState<SmartRentalCols | null>(null);
  const [preview, setPreview] = useState<{ source: number; output: number } | null>(null);
  const [converted, setConverted] = useState<ReturnType<typeof convertSmartRentalToCms> | null>(null);

  async function handleFileLoad(f: File | null) {
    setFile(f);
    setDetectedCols(null);
    setPreview(null);
    setConverted(null);
    setError(null);
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
            { from: '상품명', to: '제품명' },
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

      {/* 파일 업로드 */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          스마트렌탈 엑셀 업로드
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

      {/* 감지된 컬럼 표시 */}
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
                  <span className="font-medium text-green-700 dark:text-green-400 truncate" title={col}>
                    {col}
                  </span>
                ) : (
                  <span className="text-red-500">미감지</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 변환 결과 */}
      {preview && (
        <div className="rounded-xl border p-4 space-y-3">
          <p className="text-sm font-semibold">변환 결과</p>
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
          <p className="text-xs text-muted-foreground">
            빈 렌탈료 기간은 제외됩니다.
          </p>
        </div>
      )}

      {/* 출력 컬럼 미리보기 */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          출력 컬럼 (CMS 업로드 양식)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(['제품코드','제품명','모델명','관리방법','제품그룹','브랜드','의무기간','렌탈가','일반판매가','접수여부','조리수체크','제품설명','세부구분','입력자','입력일시','수정자','수정일시'] as const).map(col => {
            const isKey = ['제품명','모델명','제품그룹','의무기간','렌탈가'].includes(col);
            return (
              <span
                key={col}
                className={`px-2 py-0.5 rounded text-xs font-medium border ${
                  isKey
                    ? 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-300'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {col}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="text-violet-600">보라색</span> = 스마트렌탈에서 채워지는 핵심 컬럼 / 나머지는 빈칸
        </p>
      </div>

      {/* 다운로드 버튼 */}
      {converted && converted.length > 0 && (
        <div className="flex justify-end pt-2">
          <Button
            size="lg"
            className="gap-2 h-12 px-8 bg-violet-600 hover:bg-violet-700 font-semibold"
            onClick={() => exportSmartRentalCms(converted)}
          >
            <Download className="w-4 h-4" />
            CMS 변환 파일 다운로드 ({preview?.output}행)
          </Button>
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
