import { describe, expect, it } from 'vitest';
import {
  hanziTable,
  readUtf16Draft,
  utf16Examples,
  utf16Units,
} from '../src/lib/utf16Keyboard';

describe('UTF-16 keyboard', () => {
  it.each([
    ['8F93', '输'],
    ['4F60', '你'],
    ['597D', '好'],
    ['4E16', '世'],
    ['754C', '界'],
    ['0020', ' '],
  ])('decodes %s as %s', (code, char) => {
    const result = readUtf16Draft(code);
    expect(result.character).toBe(char);
    expect(result.state).toBe('ready');
    expect(result.binary).toHaveLength(16);
    expect(parseInt(result.binary, 2)).toBe(parseInt(code, 16));
  });
  it('accepts lowercase, optional 0x prefixes and separated code units', () => {
    expect(readUtf16Draft(' 0x4f60 ').character).toBe('你');
    expect(readUtf16Draft('0xD83D 0xDE00').character).toBe('😀');
    expect(readUtf16Draft('D83DDE00').units).toEqual(['D83D', 'DE00']);
    expect(readUtf16Draft('4F0x60').state).toBe('invalid');
  });
  it.each(['', '4', '4F', '4F6', 'D83D', 'D83DD', 'D83DDE0'])(
    'does not insert incomplete input %s',
    (code) => {
      expect(readUtf16Draft(code).character).toBeNull();
      expect(['empty', 'incomplete']).toContain(readUtf16Draft(code).state);
    },
  );
  it.each([
    'GHIJ',
    '-001',
    'DE00',
    'D83D0041',
    '4F60597D',
    '1F600',
    '123456789',
  ])('rejects invalid character entry %s', (code) => {
    expect(readUtf16Draft(code).state).toBe('invalid');
    expect(readUtf16Draft(code).character).toBeNull();
  });
  it('counts code units rather than assuming one character is always 16 bits', () => {
    expect(utf16Units('你好😀')).toEqual(['4F60', '597D', 'D83D', 'DE00']);
    expect(Array.from('你好😀')).toHaveLength(3);
    expect(utf16Units('你好😀').length * 16).toBe(64);
  });
  it('every lookup character and practice phrase can be typed', () => {
    expect(hanziTable).toHaveLength(27);
    for (const row of hanziTable)
      expect(readUtf16Draft(row.unit).character).toBe(row.character);
    for (const example of utf16Examples) {
      const recovered = Array.from(example.text)
        .map((char) => readUtf16Draft(utf16Units(char).join(' ')).character)
        .join('');
      expect(recovered).toBe(example.text);
    }
  });
});
