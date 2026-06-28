export interface TextChunkMetadata {
  heading?: string;
  overlapPrev?: number;
  overlapNext?: number;
}

export interface TextChunk {
  content: string;
  chunkIndex: number;
  charStart: number;
  charEnd: number;
  tokenEstimate: number;
  metadata: TextChunkMetadata;
}

export interface ChunkTextOptions {
  chunkSize?: number;
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 250;
const DEFAULT_OVERLAP = 50;

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, '\n').trim();
}

function findHeading(text: string, position: number): string | undefined {
  const prefix = text.slice(0, position);
  const matches = [...prefix.matchAll(/^#{1,6}\s+(.+)$/gm)];
  return matches.at(-1)?.[1]?.trim();
}

function findBreakIndex(text: string, start: number, end: number): number {
  const slice = text.slice(start, end);
  const candidates = [
    slice.lastIndexOf('\n\n'),
    slice.lastIndexOf('\n'),
    slice.lastIndexOf('. '),
    slice.lastIndexOf(' '),
  ].filter((index) => index > Math.floor(slice.length * 0.5));

  if (candidates.length === 0) {
    return end;
  }

  return start + Math.max(...candidates) + 1;
}

export function chunkText(
  input: string,
  options: ChunkTextOptions = {},
): TextChunk[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = Math.min(
    options.overlap ?? DEFAULT_OVERLAP,
    Math.max(0, chunkSize - 1),
  );
  const text = normalizeText(input);

  if (!text) {
    return [];
  }

  if (text.length <= chunkSize) {
    return [
      {
        content: text,
        chunkIndex: 0,
        charStart: 0,
        charEnd: text.length,
        tokenEstimate: estimateTokens(text),
        metadata: {
          heading: findHeading(text, text.length),
        },
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < text.length) {
    const hardEnd = Math.min(start + chunkSize, text.length);
    const end =
      hardEnd === text.length
        ? text.length
        : findBreakIndex(text, start, hardEnd);
    const content = text.slice(start, end).trim();

    if (!content) {
      break;
    }

    const charStart = start;
    const charEnd = end;
    chunks.push({
      content,
      chunkIndex: chunks.length,
      charStart,
      charEnd,
      tokenEstimate: estimateTokens(content),
      metadata: {
        heading: findHeading(text, charStart),
        overlapPrev: start > 0 ? overlap : undefined,
      },
    });

    if (end >= text.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  for (let index = 0; index < chunks.length - 1; index += 1) {
    chunks[index].metadata.overlapNext = overlap;
  }

  return chunks;
}
