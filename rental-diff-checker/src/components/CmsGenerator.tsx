import { useState } from 'react';
import { FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/components/UploadZone';
import { parseExcel } from '@/lib/excel';
import {
  detectCmsCols,
  buildCmsMap,
  generateCmsRows,
  exportCmsExcel,
  CMS_COLUMNS,
} from '@/lib/cms';
import type { DiffResult, ColumnMapping } from '@/types';

interface Props {
  diffResults: DiffResult[] | null;
  compMapping: ColumnMapping | null;
}

export function CmsGenerator({ diffResults, compMapping }: Props) {
  const [cmsFile, setCmsFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    matched: number;
    unmatched: number;
    ready: boolean;
  } | null>(null);
  const [cmsData, setCmsData] = useState<{
    rows: Record<string, unknown>[];
    cols: ReturnType<typeof detectCmsCols>;
  } | null>(null);

  const updateCount = diffResults?.filter((r) => r._status === '업데이트').length ?? 0;

  async function handleCmsFileLoad(file: File | null) {
    setCmsFile(file);
    setPreview(null);
    setCmsData(null);
    setError(null);
    if (!file || !diffResults || !compMapping) return;

    setLoading(true);
    try {
      const { rows, headers } = await parseExcel(file);
      const cols = detectCmsCols(headers);

      if (!cols.모델명 || !cols.의무기간) {
        setError('CMS 파일에서 모델명 또는 의무기간 컬럼을 찾지 못했습니다. 컬럼명을 확인해 주세요.');
        setLoading(false);
        return;
      }

      const cmsMap = buildCmsMap(rows, cols);
      const { rows: out, unmatched } = generateCmsRows(diffResults, compMapping, cmsMap, cols);

      setCmsData({ rows, cols });
      setPreview({ matched: out.length, unmatched: unmatched.length, ready: out.length > 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleGenerate() {
    if (!diffResults || !compMapping || !cmsData) return;
    const cmsMap = buildCmsMap(cmsData.rows, cmsData.cols);
    const { rows } = generateCmsRows(diffResults, compMapping, cmsMap, cmsData.cols);
    exportCmsExcel(rows);
  }

  // No comparison done yet
  if (!diffResults) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <FileSpreadsheet className="w-12 h-12 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">
          비교 분석 탭에서 먼저 A/B 파일을 비교해 주세요.
        </p>
        <p className="text-xs text-muted-foreground">
          업데이트 항목이 있어야 CMS 파일을 생성할 수 있습니다.
        </p>
      </div>
    );
  }

  if (updateCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500/60" />
        <p className="font-medium text-muted-foreground">업데이트 항목이 없습니다.</p>
        <p className="text-xs text-muted-foreground">CMS에 반영할 변경 사항이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
        <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-orange-800 dark:text-orange-300">
            업데이트 항목 {updateCount}건 감지됨
          </p>
          <p className="text-orange-700 dark:text-orange-400 mt-0.5">
            아래에 현재 CMS 참조 엑셀을 업로드하면, 해당 항목만 추출하여 CMS 업로드용 파일을 자동 생성합니다.
          </p>
        </div>
      </div>

      {/* CMS reference upload */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          CMS 참조 엑셀 업로드 (기존 CMS 데이터)
        </p>
        <UploadZone
          label="CMS 참조 파일"
          sublabel="제품코드·제품명·모델명·의무기간 등이 포함된 현재 CMS 엑셀"
          file={cmsFile}
          onFile={handleCmsFileLoad}
          accent="blue"
        />
        {loading && (
          <p className="text-xs text-muted-foreground mt-1">파일 분석 중...</p>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg mt-1">
            {error}
          </p>
        )}
      </div>

      {/* Match result */}
      {preview && (
        <div className="rounded-xl border p-4 space-y-3">
          <p className="text-sm font-semibold">매칭 결과</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-sm font-medium">
              ✅ 매칭 성공 <strong>{preview.matched}건</strong>
            </div>
            {preview.unmatched > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-sm font-medium">
                ⚠️ 매칭 실패 <strong>{preview.unmatched}건</strong>
                <span className="text-xs">(CMS에 해당 모델명+의무기간 없음)</span>
              </div>
            )}
          </div>
          {preview.unmatched > 0 && (
            <p className="text-xs text-muted-foreground">
              매칭 실패 항목은 CMS 파일에 해당 모델명+의무기간 조합이 없는 경우입니다.
              CMS 참조 파일을 확인해 주세요.
            </p>
          )}
        </div>
      )}

      {/* Output format preview */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          출력 컬럼 (CMS 업로드 양식)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CMS_COLUMNS.map((col) => {
            const isAuto = ['세부구분', '입력자', '입력일시', '수정자', '수정일시'].includes(col);
            const isUpdated = ['렌탈가', '의무기간'].includes(col);
            return (
              <span
                key={col}
                className={`px-2 py-0.5 rounded text-xs font-medium border ${
                  isUpdated
                    ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300'
                    : isAuto
                    ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {col}
                {isUpdated && ' ↑'}
                {isAuto && ' ✦'}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="text-orange-600">↑ 변경값 적용</span>
          {' · '}
          <span className="text-blue-600">✦ 자동 입력</span>
          {' (입력자: TNC임진형 / 세부구분: 타사보상=008, 그 외=001)'}
        </p>
      </div>

      {/* Download button */}
      {preview?.ready && (
        <div className="flex justify-end pt-2">
          <Button
            size="lg"
            className="gap-2 h-12 px-8 bg-blue-600 hover:bg-blue-700 font-semibold"
            onClick={handleGenerate}
          >
            <Download className="w-4 h-4" />
            CMS 업로드 파일 다운로드 ({preview.matched}건)
          </Button>
        </div>
      )}
    </div>
  );
}
