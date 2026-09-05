export type Encoding = 'ascii' | 'windows-1252' | 'utf-8' | 'utf-16le';
export const encodings: { id: Encoding; label: string }[] = [
  { id: 'ascii', label: 'ASCII · 7-bit' },
  { id: 'windows-1252', label: 'Extended ASCII · Windows-1252' },
  { id: 'utf-8', label: 'Unicode · UTF-8' },
  { id: 'utf-16le', label: 'Unicode · UTF-16LE' },
];
const extension: (number | null)[] = [
  0x20ac,
  null,
  0x201a,
  0x192,
  0x201e,
  0x2026,
  0x2020,
  0x2021,
  0x2c6,
  0x2030,
  0x160,
  0x2039,
  0x152,
  null,
  0x17d,
  null,
  null,
  0x2018,
  0x2019,
  0x201c,
  0x201d,
  0x2022,
  0x2013,
  0x2014,
  0x2dc,
  0x2122,
  0x161,
  0x203a,
  0x153,
  null,
  0x17e,
  0x178,
];
export const binary = (value: number, bits: number) =>
  value.toString(2).padStart(bits, '0');
export const hex = (value: number, width = 2) =>
  value.toString(16).toUpperCase().padStart(width, '0');
export function windowsCharacter(value: number): string | null {
  const code = value >= 128 && value <= 159 ? extension[value - 128] : value;
  return code == null ? null : String.fromCodePoint(code);
}
export function characterLabel(char: string) {
  if (char === ' ') return 'SPACE';
  if (char === '\n') return 'LF';
  if (char === '\t') return 'TAB';
  if (char.codePointAt(0)! < 32 || char === '\u007f')
    return `CTRL ${char.codePointAt(0)}`;
  return char;
}
export interface EncodedCharacter {
  char: string;
  codePoint: number;
  bytes: number[];
  units: number[];
  bits: string;
  start: number;
  supported: boolean;
}
export function encodeText(text: string, encoding: Encoding) {
  let start = 0;
  const characters: EncodedCharacter[] = Array.from(text).map((char) => {
    const codePoint = char.codePointAt(0)!;
    let bytes: number[] = [];
    const units = Array.from({ length: char.length }, (_, i) =>
      char.charCodeAt(i),
    );
    if (encoding === 'ascii') {
      if (codePoint < 128) bytes = [codePoint];
    } else if (encoding === 'windows-1252') {
      if (codePoint < 128 || (codePoint >= 160 && codePoint <= 255))
        bytes = [codePoint];
      else {
        const i = extension.indexOf(codePoint);
        if (i >= 0) bytes = [i + 128];
      }
    } else if (encoding === 'utf-8')
      bytes = [...new TextEncoder().encode(char)];
    else bytes = units.flatMap((unit) => [unit & 255, unit >>> 8]);
    const bits = bytes
      .map((byte) => binary(byte, encoding === 'ascii' ? 7 : 8))
      .join('');
    const result = {
      char,
      codePoint,
      bytes,
      units,
      bits,
      start,
      supported: bytes.length > 0,
    };
    start += bits.length;
    return result;
  });
  return {
    characters,
    bits: characters.map((c) => c.bits).join(''),
    valid: characters.every((c) => c.supported),
    byteCount: characters.reduce((n, c) => n + c.bytes.length, 0),
  };
}
export function decodeBits(
  bits: string,
  encoding: Encoding,
): { text: string; error: string | null } {
  const width = encoding === 'ascii' ? 7 : 8;
  if (bits.length % width)
    return { text: '', error: 'Incomplete code at the end of the tape.' };
  const bytes = Array.from({ length: bits.length / width }, (_, i) =>
    parseInt(bits.slice(i * width, (i + 1) * width), 2),
  );
  if (encoding === 'ascii')
    return { text: String.fromCharCode(...bytes), error: null };
  if (encoding === 'windows-1252') {
    const invalid = bytes.findIndex((byte) => windowsCharacter(byte) === null);
    return {
      text: bytes.map((byte) => windowsCharacter(byte) ?? '\ufffd').join(''),
      error:
        invalid < 0
          ? null
          : `Undefined Windows-1252 value at byte ${invalid + 1}.`,
    };
  }
  const buffer = new Uint8Array(bytes);
  try {
    return {
      text: new TextDecoder(encoding, { fatal: true, ignoreBOM: true }).decode(
        buffer,
      ),
      error: null,
    };
  } catch {
    let end = width;
    // Find the first invalid prefix, allowing incomplete multibyte characters while streaming.
    const decoder = new TextDecoder(encoding, { fatal: true, ignoreBOM: true });
    for (let i = 0; i < bytes.length; i++) {
      end = i + 1;
      try {
        decoder.decode(buffer.slice(i, i + 1), {
          stream: i < bytes.length - 1,
        });
      } catch {
        break;
      }
    }
    return {
      text: new TextDecoder(encoding, { ignoreBOM: true }).decode(buffer),
      error: `Invalid ${encoding.toUpperCase()} sequence at or ending near byte ${end}. Replacement characters mark decoding errors.`,
    };
  }
}
