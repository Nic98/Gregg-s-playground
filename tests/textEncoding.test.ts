import { describe, expect, it } from 'vitest';
import {
  binary,
  characterLabel,
  decodeBits,
  encodeText,
  windowsCharacter,
  type Encoding,
} from '../src/lib/textEncoding';

describe('text representation', () => {
  it('encodes ASCII as ordered seven-bit codes, including spaces', () => {
    const result = encodeText('A a!', 'ascii');
    expect(result.characters.map((c) => c.bytes[0])).toEqual([65, 32, 97, 33]);
    expect(result.characters[0].bits).toBe('1000001');
    expect(result.characters[1].start).toBe(7);
    expect(result.bits).toHaveLength(28);
    expect(result.byteCount).toBe(4);
    expect(characterLabel(' ')).toBe('SPACE');
  });
  it('refuses non-ASCII text without silent substitutions', () => {
    expect(encodeText('Café', 'ascii').valid).toBe(false);
    expect(
      encodeText('你好😀', 'ascii').characters.every((c) => !c.supported),
    ).toBe(true);
  });
  it('uses the explicit Windows-1252 mapping', () => {
    expect(
      encodeText('é€', 'windows-1252').characters.flatMap((c) => c.bytes),
    ).toEqual([0xe9, 0x80]);
    expect(windowsCharacter(0x81)).toBeNull();
    expect(decodeBits('10000001', 'windows-1252').error).toContain('Undefined');
  });
  it('encodes multilingual UTF-8 and surrogate-pair UTF-16LE exactly', () => {
    expect(encodeText('你', 'utf-8').characters[0].bytes).toEqual([
      0xe4, 0xbd, 0xa0,
    ]);
    const emoji = encodeText('😀', 'utf-16le').characters[0];
    expect(emoji.bytes).toEqual([0x3d, 0xd8, 0x00, 0xde]);
    expect(emoji.units).toEqual([0xd83d, 0xde00]);
    expect(emoji.bits).toHaveLength(32);
  });
  it.each<Encoding>(['ascii', 'windows-1252', 'utf-8', 'utf-16le'])(
    'round-trips %s and empty input',
    (encoding) => {
      const text =
        encoding === 'ascii'
          ? 'Hi!\n'
          : encoding === 'windows-1252'
            ? 'Café €'
            : '你好😀 A\n';
      expect(decodeBits(encodeText(text, encoding).bits, encoding)).toEqual({
        text,
        error: null,
      });
      expect(decodeBits(encodeText('', encoding).bits, encoding)).toEqual({
        text: '',
        error: null,
      });
    },
  );
  it('a bit flip can change ASCII A into C', () => {
    expect(decodeBits('1000011', 'ascii').text).toBe('C');
  });
  it('reports invalid Unicode sequences and incomplete tape', () => {
    expect(decodeBits('11111111', 'utf-8').error).toContain('Invalid');
    expect(decodeBits('0011110111011000', 'utf-16le').error).toContain(
      'Invalid',
    );
    expect(decodeBits('101', 'ascii').error).toContain('Incomplete');
    expect(binary(6, 3)).toBe('110');
  });
});
