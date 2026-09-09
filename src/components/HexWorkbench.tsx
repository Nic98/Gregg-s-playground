import { useState, type ReactNode } from 'react';
import { hexAlphabet, hexToBinary } from '../lib/hexadecimal';

export function HexNavigation({
  names,
  selected,
  onSelect,
}: {
  names: string[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav className="hex-nav" aria-label="Choose an experiment">
      {names.map((name, index) => (
        <button
          key={name}
          aria-pressed={selected === index}
          onClick={() => onSelect(index)}
        >
          <span>0{index + 1}</span>
          {name}
        </button>
      ))}
    </nav>
  );
}

export function HexInspector({ value }: { value: string }) {
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, value.length - 1);
  const digit = value[index];
  return (
    <section className="hex-inspector" aria-label="Hex digit inspector">
      <div>
        <h3>Tap a digit → 4 bits</h3>
      </div>
      <div className="hex-digit-strip">
        {value.split('').map((d, i) => (
          <button
            key={i}
            aria-label={`Hex digit ${i + 1}: ${d}`}
            aria-pressed={i === index}
            onClick={() => setSelected(i)}
          >
            {d}
          </button>
        ))}
      </div>
      <output className="hex-nibble">
        <strong>
          {digit}
          <sub>16</sub>
        </strong>
        <span>→</span>
        <strong>
          {hexToBinary(digit)}
          <sub>2</sub>
        </strong>
        <span>= {parseInt(digit, 16)} in denary</span>
      </output>
    </section>
  );
}

export function HexNotes({ children }: { children: ReactNode }) {
  return (
    <details className="hex-teacher-notes">
      <summary>Teacher notes</summary>
      <div>{children}</div>
    </details>
  );
}

export function HexReference() {
  return (
    <>
      <h2>Sixteen digits. A direct link to binary.</h2>
      <div className="hex-lookup" aria-label="Hexadecimal lookup table">
        {hexAlphabet.split('').map((d, n) => (
          <div key={d}>
            <strong>{d}</strong>
            <span>{n} denary</span>
            <code>{hexToBinary(d)}</code>
          </div>
        ))}
      </div>
      <p>
        Hexadecimal is a human-readable representation of binary values, not a
        different way for the computer to store those values. Prefixes such as
        0x, colour markers such as # and address separators are notation, not
        hexadecimal digits.
      </p>
    </>
  );
}
