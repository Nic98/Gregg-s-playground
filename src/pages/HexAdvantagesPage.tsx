import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudioLayout } from '../components/StudioLayout';
import {
  HexInspector,
  HexNavigation,
  HexReference,
  HexNotes,
} from '../components/HexWorkbench';
import { divisionByTwo, hexToBinary, screenCapacity } from '../lib/hexadecimal';
import '../hex.css';

function NotationSwitch({
  hex,
  onChange,
}: {
  hex: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="hex-actions" aria-label="Display notation">
      <Button
        variant={hex ? 'outline' : 'accent'}
        aria-pressed={!hex}
        onClick={() => onChange(false)}
      >
        Binary
      </Button>
      <Button
        variant={hex ? 'accent' : 'outline'}
        aria-pressed={hex}
        onClick={() => onChange(true)}
      >
        Hexadecimal
      </Button>
    </div>
  );
}

function SpaceExperiment() {
  const [hex, setHex] = useState(false),
    [value, setValue] = useState('B9F24C80');
  return (
    <div className="hex-experiment-grid">
      <section className="hex-panel">
        <h2>32 digits → 8 digits.</h2>
        <NotationSwitch hex={hex} onChange={setHex} />
        <div className="hex-terminal hex-space-screen">
          <span>ONE 32-BIT VALUE</span>
          <code className="hex-space-value">
            {hex ? value : hexToBinary(value)}
          </code>
        </div>
        <div className="hex-metric-pair">
          <div>
            <strong>{hex ? 8 : 32}</strong>
            <span>displayed digits</span>
          </div>
          <div>
            <strong>32 bits</strong>
            <span>same data</span>
          </div>
        </div>
        <label className="hex-select-label">
          Example value
          <select value={value} onChange={(e) => setValue(e.target.value)}>
            <option>B9F24C80</option>
            <option>000000AF</option>
            <option>FFFFFFFF</option>
          </select>
        </label>
      </section>
      <aside className="hex-panel">
        <HexInspector value={value} />
        <div
          className="hex-length-comparison"
          aria-label="Binary uses 32 digits; hexadecimal uses 8"
        >
          <div>
            <span>Binary · 32</span>
            <i />
          </div>
          <div>
            <span>Hex · 8</span>
            <i />
          </div>
        </div>
        <div className="hex-mini-equation">75% fewer digits · same 32 bits</div>
        <HexNotes>
          <p>
            This saves display space, not memory for the underlying 32-bit
            value. Both representations describe the same data. Storing the
            written digits as a text file would be a separate encoding question.
          </p>
          <p>Display counts exclude prefixes and spaces.</p>
        </HexNotes>
      </aside>
    </div>
  );
}

const challenges = [
  { value: 'B9F24C80', position: 2 },
  { value: '0A71E3D5', position: 5 },
  { value: 'C480B26F', position: 7 },
];
function ReadabilityExperiment() {
  const [hex, setHex] = useState(false),
    [round, setRound] = useState(0),
    [answer, setAnswer] = useState<number | null>(null);
  const item = challenges[round],
    changed = item.value.split('');
  changed[item.position] = (parseInt(changed[item.position], 16) ^ 1)
    .toString(16)
    .toUpperCase();
  const good = answer === item.position;
  return (
    <div className="hex-experiment-grid hex-experiment-grid--solo">
      <section className="hex-panel">
        <h2>Find the copying error.</h2>
        <p>One bit changed. Tap the mismatch.</p>
        <NotationSwitch
          hex={hex}
          onChange={(next) => {
            setHex(next);
            setAnswer(null);
          }}
        />
        <div className="hex-debug-board">
          <span>EXPECTED</span>
          <div className="hex-debug-groups">
            {item.value.split('').map((d, i) => (
              <code key={i}>{hex ? d : hexToBinary(d)}</code>
            ))}
          </div>
          <span>RECEIVED · SELECT A GROUP</span>
          <div className="hex-debug-groups">
            {changed.map((d, i) => (
              <button
                key={i}
                aria-label={`Received group ${i + 1}: ${hex ? d : hexToBinary(d)}`}
                aria-pressed={answer === i}
                onClick={() => setAnswer(i)}
              >
                {hex ? d : hexToBinary(d)}
              </button>
            ))}
          </div>
        </div>
        <output className="hex-feedback">
          {answer === null
            ? 'Which group differs?'
            : good
              ? `Correct. Group ${item.position + 1} should be ${item.value[item.position]}, not ${changed[item.position]}.`
              : 'That group matches. Compare both rows and try another group.'}
        </output>
        <div className="hex-actions">
          <Button variant="outline" onClick={() => setAnswer(item.position)}>
            Reveal mismatch
          </Button>
          <Button
            variant="default"
            onClick={() => {
              setRound((round + 1) % challenges.length);
              setAnswer(null);
            }}
          >
            Next example <ArrowRight />
          </Button>
        </div>
      </section>
      <HexNotes>
        <p>
          Eight hex digits replace thirty-two binary digits. Shorter codes are
          usually easier for humans to read, compare and report, helping reduce
          transcription mistakes and making debugging easier.
        </p>
        <p>
          The mismatch exists in both displays. Hexadecimal does not detect or
          correct errors automatically.
        </p>
      </HexNotes>
    </div>
  );
}

const screenValues = [
  '000A',
  '00F2',
  'B104',
  'CAFE',
  '000F',
  'ABCD',
  '10FF',
  '8001',
  'A001',
  '1234',
  'D00D',
  '0000',
];
function CapacityExperiment() {
  const [hex, setHex] = useState(false),
    [columns, setColumns] = useState(16);
  const slots = columns * 2,
    capacity = screenCapacity(slots),
    count = hex ? capacity.hex : capacity.binary;
  const tape = screenValues
    .slice(0, count)
    .map((v) => (hex ? v : hexToBinary(v)))
    .join('');
  return (
    <div className="hex-experiment-grid">
      <section className="hex-panel">
        <h2>Same screen. More values.</h2>
        <NotationSwitch hex={hex} onChange={setHex} />
        <label className="hex-select-label">
          Screen width
          <select
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
          >
            <option value={16}>16 characters per row</option>
            <option value={24}>24 characters per row</option>
          </select>
        </label>
        <div
          className="hex-slot-screen"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          aria-label={`${slots} character display`}
        >
          {tape
            .padEnd(slots, ' ')
            .split('')
            .map((digit, i) => (
              <span
                key={i}
                className={
                  Math.floor(i / (hex ? 4 : 16)) % 2 ? 'hex-slot-alternate' : ''
                }
              >
                {digit}
              </span>
            ))}
        </div>
        <div className="hex-metric-pair">
          <div>
            <strong>{count} values</strong>
            <span>fit in {slots} character slots</span>
          </div>
          <div>
            <strong>{count * 16} bits</strong>
            <span>visible data · 16 bits per value</span>
          </div>
        </div>
      </section>
      <aside className="hex-panel">
        <h3>{slots} slots</h3>
        <div className="hex-capacity-comparison">
          <div>
            <span>Binary</span>
            <strong>{capacity.binary}</strong>
            <span>values</span>
          </div>
          <ArrowRight />
          <div>
            <span>Hex</span>
            <strong>{capacity.hex}</strong>
            <span>values</span>
          </div>
        </div>
        <div className="hex-mini-equation">4× as many values</div>
        <HexNotes>
          <p>
            Same data, smaller display: two 16-bit values need 32 binary digits,
            but only 8 hex digits.
          </p>
          <p>
            The bands distinguish values without using separator characters.
            These counts exclude labels, punctuation and spacing. Actual screen
            dimensions also depend on font size and layout.
          </p>
        </HexNotes>
      </aside>
    </div>
  );
}

function ConversionExperiment() {
  const [draft, setDraft] = useState('AF'),
    [hex, setHex] = useState('AF'),
    [error, setError] = useState(''),
    [show, setShow] = useState(false);
  const value = parseInt(hex, 16),
    binary = hexToBinary(hex),
    rows = divisionByTwo(value);
  return (
    <>
      <div className="hex-conversion-heading">
        <div>
          <h2>Two routes. Same binary.</h2>
        </div>
        <form
          className="hex-entry"
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^[\da-f]{2}$/i.test(draft.trim())) {
              setError('Enter exactly two hex digits, for example 0F or AF.');
              return;
            }
            setHex(draft.trim().toUpperCase());
            setError('');
          }}
        >
          <label htmlFor="conversion-value">Two-digit hex value</label>
          <div>
            <input
              id="conversion-value"
              value={draft}
              maxLength={2}
              onChange={(e) => {
                setDraft(e.target.value);
                setError('');
              }}
              spellCheck={false}
              aria-invalid={!!error}
              aria-describedby="conversion-error"
            />
            <Button type="submit" variant="default">
              Convert
            </Button>
          </div>
          <output id="conversion-error">{error}</output>
        </form>
      </div>
      <div className="hex-conversion-grid">
        <section className="hex-panel">
          <h3>From hexadecimal: {hex}</h3>
          <div className="hex-mapping">
            {hex.split('').map((d, i) => (
              <div key={i}>
                <strong>{d}</strong>
                <ArrowRight />
                <code>{hexToBinary(d)}</code>
              </div>
            ))}
          </div>
          <div className="hex-result">
            <code>{binary}</code>
            <span>Join left to right · 8 bits</span>
          </div>
          <div className="hex-mini-equation">1 hex digit → 4 bits</div>
        </section>
        <section className="hex-panel">
          <h3>From denary: {value}</h3>
          <Button
            variant="outline"
            onClick={() => setShow(!show)}
            aria-expanded={show}
          >
            {show ? 'Hide division steps' : 'Show division steps'}
          </Button>
          {show && (
            <table className="hex-table hex-division">
              <caption>Read the remainder column upwards ↑</caption>
              <thead>
                <tr>
                  <th>Divide</th>
                  <th>Quotient</th>
                  <th>Remainder</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td>{row.value} ÷ 2</td>
                    <td>{row.quotient}</td>
                    <td>{row.remainder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="hex-result">
            <code>{binary}</code>
            <span>Same answer · 8 bits</span>
          </div>
          <HexNotes>
            <p>
              Place-value subtraction is another denary conversion method. Hex
              is convenient because every digit can be replaced directly with
              its four-bit group; it is not a claim that every person always
              converts hex faster.
            </p>
          </HexNotes>
        </section>
      </div>
    </>
  );
}

export function HexAdvantagesPage() {
  const [tab, setTab] = useState(0),
    [revision, setRevision] = useState(0);
  const panels = [
    SpaceExperiment,
    ReadabilityExperiment,
    CapacityExperiment,
    ConversionExperiment,
  ];
  const Panel = panels[tab];
  return (
    <StudioLayout
      title="Why hexadecimal?"
      kind="hex"
      sectionId="1.1"
      showSettings={false}
      collapseReference
      reference={
        <>
          <HexReference />
        </>
      }
    >
      <div className="hex-workbench">
        <HexNavigation
          names={[
            'Save space',
            'Read & debug',
            'Display capacity',
            'Convert to binary',
          ]}
          selected={tab}
          onSelect={setTab}
        />
        <div className="hex-context">
          <Button
            variant="ghost"
            onClick={() => {
              setTab(0);
              setRevision(revision + 1);
            }}
          >
            <RotateCcw />
            Reset demo
          </Button>
        </div>
        <Panel key={`${tab}-${revision}`} />
      </div>
    </StudioLayout>
  );
}
