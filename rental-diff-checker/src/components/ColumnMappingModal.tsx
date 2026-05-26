import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ColumnMapping } from '@/types';

interface Props {
  open: boolean;
  headers: string[];
  mapping: ColumnMapping;
  onChange: (m: ColumnMapping) => void;
  onConfirm: () => void;
}

const REQUIRED_FIELDS: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: '모델명', label: '모델명 컬럼', required: true },
  { key: '렌탈기간', label: '렌탈기간 컬럼', required: true },
  { key: '렌탈료', label: '렌탈료 컬럼', required: true },
  { key: '제품코드', label: '제품코드 컬럼', required: false },
  { key: '상품명', label: '상품명 컬럼', required: false },
  { key: '단품결합', label: '단품/결합 구분 컬럼', required: false },
  { key: '프로모션', label: '프로모션 컬럼', required: false },
];

export function ColumnMappingModal({ open, headers, mapping, onChange, onConfirm }: Props) {
  const isValid = mapping.모델명 && mapping.렌탈기간 && mapping.렌탈료;

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>컬럼 매핑 설정</DialogTitle>
          <p className="text-sm text-muted-foreground">
            엑셀 파일의 헤더와 비교 기준 컬럼을 매핑해 주세요.
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {REQUIRED_FIELDS.map(({ key, label, required }) => (
            <div key={key} className="grid grid-cols-2 items-center gap-3">
              <Label className="text-right text-sm">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Select
                value={mapping[key] ?? '__none__'}
                onValueChange={(v) =>
                  onChange({ ...mapping, [key]: v === '__none__' ? undefined : v })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="선택 안함" />
                </SelectTrigger>
                <SelectContent>
                  {!required && (
                    <SelectItem value="__none__">선택 안함</SelectItem>
                  )}
                  {headers.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={onConfirm} disabled={!isValid} className="w-full">
            비교 분석 시작
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
