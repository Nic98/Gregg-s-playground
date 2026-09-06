import { binary, hex } from './textEncoding';

export function utf16Units(text: string): string[] {
  return Array.from({ length: text.length }, (_, i) =>
    hex(text.charCodeAt(i), 4),
  );
}

export function normaliseUtf16Draft(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((group) => group.replace(/^0x/i, ''))
    .join('')
    .toUpperCase();
}

export function readUtf16Draft(raw: string): {
  character: string | null;
  units: string[];
  binary: string;
  message: string;
  state: 'empty' | 'incomplete' | 'invalid' | 'ready';
} {
  const clean = normaliseUtf16Draft(raw);
  const pending = (
    state: 'empty' | 'incomplete' | 'invalid',
    message: string,
  ) => ({ character: null, units: [] as string[], binary: '', message, state });
  if (!clean)
    return pending('empty', 'Type four hex digits to preview a character.');
  if (!/^[0-9A-F]+$/.test(clean))
    return pending('invalid', 'Use hexadecimal digits 0–9 and A–F only.');
  if (clean.length < 4)
    return pending(
      'incomplete',
      `${4 - clean.length} more hex digit${clean.length === 3 ? '' : 's'} needed for one 16-bit code unit.`,
    );
  if (clean.length > 8)
    return pending(
      'invalid',
      'Enter one character at a time: four hex digits, or an eight-digit surrogate pair.',
    );
  const first = parseInt(clean.slice(0, 4), 16);
  if (first >= 0xdc00 && first <= 0xdfff)
    return pending(
      'invalid',
      'A low surrogate cannot appear first. Start with a high surrogate (D800–DBFF).',
    );
  const high = first >= 0xd800 && first <= 0xdbff;
  if (high && clean.length < 8)
    return pending(
      'incomplete',
      'High surrogate: add a low surrogate (DC00–DFFF) to complete this character.',
    );
  if (!high && clean.length !== 4)
    return pending(
      'invalid',
      'This character needs only four hex digits. Insert it before entering another character.',
    );
  const second = parseInt(clean.slice(4), 16);
  if (high && !(second >= 0xdc00 && second <= 0xdfff))
    return pending(
      'invalid',
      'The second code unit must be a low surrogate (DC00–DFFF).',
    );
  const values = high ? [first, second] : [first];
  return {
    character: String.fromCharCode(...values),
    units: values.map((unit) => hex(unit, 4)),
    binary: values.map((unit) => binary(unit, 16)).join(' '),
    message: high
      ? 'Two 16-bit code units, one character. Press Enter to insert.'
      : 'One 16-bit code unit. Press Enter to insert.',
    state: 'ready',
  };
}

export const hanziTable = [
  ['你', 'you'],
  ['好', 'good'],
  ['世', 'world'],
  ['界', 'boundary'],
  ['我', 'I / me'],
  ['爱', 'love'],
  ['中', 'middle'],
  ['国', 'country'],
  ['学', 'learn'],
  ['习', 'practise'],
  ['计', 'calculate'],
  ['算', 'compute'],
  ['机', 'machine'],
  ['编', 'encode / arrange'],
  ['码', 'code'],
  ['输', 'input / transport'],
  ['入', 'enter'],
  ['汉', 'Han / Chinese'],
  ['字', 'character'],
  ['文', 'text'],
  ['声', 'sound'],
  ['音', 'tone'],
  ['图', 'picture'],
  ['片', 'piece'],
  ['，', 'comma'],
  ['。', 'full stop'],
  [' ', 'space'],
].map(([character, meaning]) => ({
  character,
  meaning,
  unit: utf16Units(character)[0],
}));

export const utf16Examples = [
  {
    text: '你好世界',
    meaning: 'Hello, world',
    detail: 'Four Chinese characters. Four code units. 64 bits.',
  },
  {
    text: '我爱计算机',
    meaning: 'I love computers',
    detail: 'Five characters. Five code units. 80 bits.',
  },
  {
    text: '输入汉字',
    meaning: 'Enter Chinese characters',
    detail: 'Start with 8F93 → 输, just like the reference keyboard.',
  },
  {
    text: '学习编码',
    meaning: 'Learn to encode',
    detail: 'Look up each character, enter its code, and build the phrase.',
  },
  {
    text: '你好😀',
    meaning: 'Hello + a smile',
    detail:
      'Extension: three code points, but four UTF-16 code units. The emoji uses D83D DE00.',
  },
];
