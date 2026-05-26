import { useState } from 'react';
import { FileSpreadsheet, Download, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/components/UploadZone';
import { parseExcel } from '@/lib/excel';
import {
  detectCmsCols,
  convertCmsToGpt,
  exportGptExcel,
  GPT_COLUMNS,
} from '@/lib/cms';

export function CmsConverter() {
  const [cmsFile, setCmsFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [convertedData, setConvertedData] = useState<ReturnType<typeof convertCmsToGpt> | null>(null);

  async function handleFileLoad(file: File | null) {
    setCmsFile(file);
    setConvertedData(null);
    setRowCount(null);
    setError(null);
    if (!file) return;

    setLoading(true);
    try {
      const { rows, headers } = await parseExcel(file);
      const cols = detectCmsCols(headers);

      if (!cols.모델명 || !cols.의무기간) {
        setError('모델명 또는 의무기간 컬럼을 찾지 못했습니다. CMS 파일이 맞는지 확인해 주세요.');
        setLoading(false);
        return;
      }

      const converted = convertCmsToGpt(rows, cols);
      setConvertedData(converted);
      setRowCount(converted.length);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!convertedData) return;
    exportGptExcel(convertedData);
  }

  return (
    <div className="space-y-6">
      {/* 설명 배너 */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
        <ArrowRightLeft className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-green-800 dark:text-green-300">
            CMS 양식 → GPT 비교 양식 변환
          </p>
          <p className="text-green-700 dark:text-green-400 mt-0.5">
            기존 CMS 엑셀을 업로드하면 비교 분석 도구에 사용할 수 있는 GPT 형식으로 자동 변환합니다.
          </p>
        </div>
      </div>

      {/* 변환 규칙 표시 */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">변환 규칙</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {[
            { from: '제품명', to: '상품명' },
            { from: '모델명', to: '모델명' },
            { from: '의무기간', to: '렌탈기간' },
            { from: '렌탈가', to: '렌탈료' },
            { from: '제품그룹 (한글명)', to: '제품그룹 (3자리 코드)' },
            { from: '세부구분 (값)', to: '세부구분 (빈칸)' },
          ].map((rule) => (
            <div
              key={rule.from}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 border"
            >
              <span className="text-muted-foreground">{rule.from}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium text-green-700 dark:text-green-400">{rule.to}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 파일 업로드 */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          CMS 엑셀 업로드
        </p>
        <UploadZone
          label="기존 CMS 파일"
          sublabel="제품명·모델명·의무기간·렌탈가·제품그룹 등이 포함된 CMS 엑셀"
          file={cmsFile}
          onFile={handleFileLoad}
          accent="blue"
        />
        {loading && <p className="text-xs text-muted-foreground mt-1">변환 중...</p>}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg mt-1">
            {error}
          </p>
        )}
      </div>

      {/* 변환 결과 */}
      {rowCount !== null && convertedData && (
        <div className="rounded-xl border p-4 space-y-3">
          <p className="text-sm font-semibold">변환 결과</p>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-sm font-medium w-fit">
            ✅ 변환 완료 <strong>{rowCount}행</strong>
          </div>
        </div>
      )}

      {/* 출력 컬럼 미리보기 */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          출력 컬럼 (GPT 형식)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {GPT_COLUMNS.map((col) => {
            const isConverted = ['상품명', '렌탈기간', '렌탈료', '제품그룹'].includes(col);
            const isBlank = col === '세부구분';
            return (
              <span
                key={col}
                className={`px-2 py-0.5 rounded text-xs font-medium border ${
                  isConverted
                    ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300'
                    : isBlank
                    ? 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {col}
                {isConverted && ' ✦'}
                {isBlank && ' (빈칸)'}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="text-green-600">✦ 변환·가공된 컬럼</span>
        </p>
      </div>

      {/* 다운로드 버튼 */}
      {convertedData && convertedData.length > 0 && (
        <div className="flex justify-end pt-2">
          <Button
            size="lg"
            className="gap-2 h-12 px-8 bg-green-600 hover:bg-green-700 font-semibold"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
            GPT 형식 다운로드 ({rowCount}행)
          </Button>
        </div>
      )}

      {/* 사용 안내 */}
      {!cmsFile && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">CMS 엑셀 파일을 업로드해 주세요.</p>
          <p className="text-xs text-muted-foreground">
            변환된 파일을 비교 분석 탭의 A 또는 B 파일로 사용할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
