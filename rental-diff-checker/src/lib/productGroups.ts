export const PRODUCT_GROUPS: { code: string; name: string }[] = [
  { code: '001', name: '정수기' },
  { code: '002', name: '공기청정기' },
  { code: '003', name: '비데' },
  { code: '004', name: '안마의자' },
  { code: '005', name: '제빙기' },
  { code: '006', name: '오븐/레인지' },
  { code: '007', name: '이온수기' },
  { code: '008', name: '식기세척기' },
  { code: '009', name: '건조기' },
  { code: '010', name: '메트리스' },
  { code: '012', name: '스타일러' },
  { code: '013', name: '승마기' },
  { code: '014', name: '연수기' },
  { code: '015', name: '커피머신' },
  { code: '016', name: '식물재배기' },
  { code: '018', name: '제습기' },
  { code: '019', name: '뷰티/헤어' },
  { code: '020', name: '기타/취미용품' },
  { code: '021', name: '음식물처리기' },
  { code: '030', name: 'TV/모니터' },
  { code: '031', name: '냉장고' },
  { code: '032', name: '김치냉장고' },
  { code: '033', name: '세탁기/워시타워' },
  { code: '034', name: '에어컨' },
  { code: '035', name: '청소기' },
  { code: '036', name: '가구' },
  { code: '037', name: '유아용품' },
  { code: '038', name: '냉난방기' },
  { code: '039', name: '모션배드' },
  { code: '040', name: 'PC/노트북' },
  { code: '041', name: '얼음정수기' },
  { code: '042', name: '마사지/바디' },
  { code: '043', name: '흙돌침대' },
  { code: '044', name: '침대' },
  { code: '045', name: '식탁' },
  { code: '046', name: '소파' },
  { code: '047', name: '생활가전' },
  { code: '048', name: '건강관리' },
  { code: '059', name: '리클라이너' },
  { code: '060', name: '홈케어서비스' },
  { code: '061', name: '사무기기' },
  { code: '062', name: '에어드레서' },
  { code: '063', name: '냉동고' },
  { code: '064', name: '반려용품' },
  { code: '065', name: '의류청정기' },
  { code: '066', name: '헬스/러닝머신' },
  { code: '067', name: '디지털/AI' },
  { code: '068', name: '차량/전기자전거' },
  { code: '069', name: '빔/사운드바' },
  { code: '070', name: '게임기' },
  { code: '071', name: '주방가전' },
  { code: '072', name: '카메라' },
  { code: '073', name: '살균기/바이러스' },
  { code: '074', name: '라이트테라피' },
  { code: '079', name: '환기청정/환경' },
  { code: '080', name: '타이어' },
  { code: '081', name: '의료기기' },
  { code: '082', name: '결합상품' },
  { code: '083', name: '침대프레임' },
  { code: '084', name: '와인셀러/저장고' },
  { code: '085', name: '인터넷&IPTV' },
  { code: '086', name: '상조' },
  { code: '088', name: '가습기' },
  { code: '089', name: '침대세트' },
  { code: '090', name: '인터넷' },
  { code: '091', name: '난방기' },
  { code: '092', name: '파운데이션' },
  { code: '093', name: '해충방제' },
  { code: '094', name: '제습기' },
  { code: '095', name: '슈케어' },
  { code: '096', name: '보일러' },
  { code: '999', name: '단종 및 일시중단' },
];

const nameToCode = new Map<string, string>(
  PRODUCT_GROUPS.map((g) => [g.name, g.code])
);
const codeToCode = new Map<string, string>(
  PRODUCT_GROUPS.map((g) => [g.code, g.code])
);

export function normalizeGroupCode(value: string): string {
  const v = String(value).trim();
  if (!v) return '';

  // Already a numeric string → pad to 3 digits
  if (/^\d{1,3}$/.test(v)) return v.padStart(3, '0');

  // Exact name match
  const byName = nameToCode.get(v);
  if (byName) return byName;

  // Padded code match
  const padded = v.padStart(3, '0');
  if (codeToCode.has(padded)) return padded;

  // Partial name match (e.g. "세탁기" matches "세탁기/워시타워")
  for (const [name, code] of nameToCode) {
    if (name.includes(v) || v.includes(name)) return code;
  }

  return v; // return as-is if not found
}
