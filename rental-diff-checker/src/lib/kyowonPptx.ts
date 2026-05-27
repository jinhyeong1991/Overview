// PPTX 파싱 — 외부 라이브러리 없이 브라우저 내장 API 사용
// PPTX = ZIP 컨테이너 + DrawingML XML

const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';

export interface SlideContent {
  slideNumber: number;
  paragraphs: string[];
}

export interface PptxDiffItem {
  text: string;
  slideNumber: number;
}

export interface PptxDiff {
  newInJune: PptxDiffItem[];
  removedInMay: PptxDiffItem[];
  summary: { newCount: number; removedCount: number };
}

// ── ZIP 파서 (중앙 디렉토리 기반) ────────────────────────────────────────────
async function decompressDeflate(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  await writer.write(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
  await writer.close();
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) { out.set(c, pos); pos += c.length; }
  return out;
}

async function extractSlideXmlFiles(buffer: ArrayBuffer): Promise<Map<string, string>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const dec = new TextDecoder();

  // 1. End of Central Directory 위치 찾기 (뒤에서 탐색)
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocdOffset = i; break; }
  }
  if (eocdOffset === -1) throw new Error('유효한 PPTX(ZIP) 파일이 아닙니다.');

  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const cdSize   = view.getUint32(eocdOffset + 12, true);

  const result = new Map<string, string>();
  let ptr = cdOffset;

  while (ptr < cdOffset + cdSize && ptr + 46 <= bytes.length) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break; // Central Dir 시그니처

    const method       = view.getUint16(ptr + 10, true);
    const compSize     = view.getUint32(ptr + 20, true);
    const filenameLen  = view.getUint16(ptr + 28, true);
    const extraLen     = view.getUint16(ptr + 30, true);
    const commentLen   = view.getUint16(ptr + 32, true);
    const localOffset  = view.getUint32(ptr + 42, true);
    const filename     = dec.decode(bytes.slice(ptr + 46, ptr + 46 + filenameLen));

    ptr += 46 + filenameLen + extraLen + commentLen;

    // 슬라이드 XML만 처리
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(filename)) continue;

    // Local File Header에서 실제 데이터 시작 위치 계산
    const localFilenameLen = view.getUint16(localOffset + 26, true);
    const localExtraLen    = view.getUint16(localOffset + 28, true);
    const dataStart        = localOffset + 30 + localFilenameLen + localExtraLen;
    const compressedData   = bytes.slice(dataStart, dataStart + compSize);

    let content: string;
    if (method === 0) {
      content = dec.decode(compressedData);
    } else if (method === 8) {
      content = dec.decode(await decompressDeflate(compressedData));
    } else {
      continue;
    }
    result.set(filename, content);
  }

  return result;
}

// ── XML 텍스트 추출 ───────────────────────────────────────────────────────────
function extractParagraphs(xmlContent: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'application/xml');
  const paragraphs = Array.from(doc.getElementsByTagNameNS(NS_A, 'p'));
  const result: string[] = [];
  for (const para of paragraphs) {
    const runs = Array.from(para.getElementsByTagNameNS(NS_A, 't'));
    const text = runs.map((t) => t.textContent ?? '').join('').trim();
    if (text.length > 1) result.push(text); // 1글자 이하 제외 (불필요 기호)
  }
  return result;
}

// ── 공개 API ─────────────────────────────────────────────────────────────────
export async function parsePptxSlides(file: File): Promise<SlideContent[]> {
  const buffer = await file.arrayBuffer();
  const xmlFiles = await extractSlideXmlFiles(buffer);

  if (xmlFiles.size === 0) {
    throw new Error('슬라이드를 찾지 못했습니다. 올바른 PPTX 파일인지 확인해 주세요.');
  }

  // 슬라이드 번호순 정렬
  const sorted = [...xmlFiles.keys()].sort((a, b) => {
    const na = parseInt(a.match(/slide(\d+)/)?.[1] ?? '0');
    const nb = parseInt(b.match(/slide(\d+)/)?.[1] ?? '0');
    return na - nb;
  });

  return sorted.map((filename, idx) => ({
    slideNumber: idx + 1,
    paragraphs: extractParagraphs(xmlFiles.get(filename)!),
  }));
}

export function comparePptx(may: SlideContent[], june: SlideContent[]): PptxDiff {
  // 5월 전체 텍스트 → Set (슬라이드 번호 포함)
  const mayMap = new Map<string, number>(); // text → slideNumber
  for (const slide of may) {
    for (const para of slide.paragraphs) {
      const key = para.normalize('NFC').toLowerCase().trim();
      if (!mayMap.has(key)) mayMap.set(key, slide.slideNumber);
    }
  }

  const newInJune: PptxDiffItem[] = [];
  const matchedKeys = new Set<string>();

  for (const slide of june) {
    for (const para of slide.paragraphs) {
      const key = para.normalize('NFC').toLowerCase().trim();
      if (!mayMap.has(key)) {
        newInJune.push({ text: para, slideNumber: slide.slideNumber });
      } else {
        matchedKeys.add(key);
      }
    }
  }

  // 5월에만 있는 것 (삭제)
  const removedInMay: PptxDiffItem[] = [];
  for (const slide of may) {
    for (const para of slide.paragraphs) {
      const key = para.normalize('NFC').toLowerCase().trim();
      if (!matchedKeys.has(key)) {
        removedInMay.push({ text: para, slideNumber: slide.slideNumber });
      }
    }
  }

  return {
    newInJune,
    removedInMay,
    summary: { newCount: newInJune.length, removedCount: removedInMay.length },
  };
}
