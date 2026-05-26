export type ItemStatus = '신규' | '업데이트' | '유지' | '단종';

export interface RentalItem {
  제품코드?: string;
  상품명?: string;
  모델명: string;
  렌탈기간: string;
  렌탈료: string | number;
  단품결합?: string;
  [key: string]: string | number | undefined;
}

export interface DiffResult extends RentalItem {
  _status: ItemStatus;
  _prevRentalFee?: string | number;
  _prevPromo?: string | number;
  _key: string;
  _rowIndex: number;
}

export interface SummaryStats {
  신규: number;
  업데이트: number;
  유지: number;
  단종: number;
  total: number;
}

export interface ColumnMapping {
  모델명: string;
  렌탈기간: string;
  렌탈료: string;
  제품코드?: string;
  상품명?: string;
  단품결합?: string;
  프로모션?: string;
}
