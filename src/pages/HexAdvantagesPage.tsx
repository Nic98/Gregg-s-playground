import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudioLayout } from '../components/StudioLayout';
import {
  HexInspector,
  HexNavigation,
  HexReference,
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
        <p className="studio-kicker">01 / Save screen space</p>
        <h2>Keep the value. Shorten the notation.</h2>
        <p>
          Switch the display format. The characters use the same font and size,
          so you can compare the space they need.
        </p>
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
            <span>underlying value in either notation</span>
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
        <h3>Four become one</h3>
        <HexInspector value={value} />
        <div className="hex-callout">
          <strong>8 instead of 32 digits</strong>
          <p>
            Hex uses one quarter as many digits as binary: 75% fewer displayed
            digits here, excluding prefixes and spaces.
          </p>
        </div>
        <p className="hex-note">
          This saves display space, not memory for the underlying 32-bit value.
          Both representations describe the same data. Storing the written
          digits as a text file would be a separate encoding question.
        </p>
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
    <div className="hex-experiment-grid">
      <section className="hex-panel">
        <p className="studio-kicker">02 / Read, compare, debug</p>
        <h2>Find the copying error.</h2>
        <p>
          One bit was copied incorrectly. Compare the expected value with the
          received value, then select the mismatching group below.
        </p>
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
      <aside className="hex-panel">
        <h3>Less to read. Less to copy.</h3>
        <p>
          Eight hex digits replace thirty-two binary digits. Shorter codes are
          usually easier for humans to read, compare and report, helping reduce
          transcription mistakes and making debugging easier.
        </p>
        <div className="hex-callout">
          <strong>Notation helps the human.</strong>
          <p>
            The mismatch exists in both displays. Hexadecimal does not detect or
            correct errors automatically.
          </p>
        </div>
        <p className="hex-note">
          Try the same example in each notation. Discuss which is easier to
          inspect; this is a classroom comparison, not a timed or scientific
          test of reading speed.
        </p>
      </aside>
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
        <p className="studio-kicker">03 / Smaller displays, more information</p>
        <h2>How much fits on this screen?</h2>
        <p>
          This display has two rows of fixed-width character slots. Every stored
          value is 16 bits; leading zeros are kept.
        </p>
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
            <span>represented by the visible values</span>
          </div>
        </div>
      </section>
      <aside className="hex-panel">
        <h3>Two ways to use the saved space</h3>
        <div className="hex-callout">
          <strong>Same screen → more information</strong>
          <p>
            {capacity.binary} binary values or {capacity.hex} hex values fit in
            this screen.
          </p>
        </div>
        <div className="hex-callout">
          <strong>Same information → smaller display</strong>
          <p>
            Two 16-bit values need 32 binary digits, but only 8 hex digits. They
            can fit in fewer character slots at the same text size.
          </p>
        </div>
        <p className="hex-note">
          The bands distinguish values without using separator characters. These
          counts exclude labels, punctuation and spacing. Actual screen
          dimensions also depend on font size and layout.
        </p>
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
          <p className="studio-kicker">04 / Easier conversion to binary</p>
          <h2>Map each digit. Join the four-bit groups.</h2>
          <p>
            16 = 2⁴, so each hex digit maps directly to four bits. Denary digits
            do not have this one-to-four relationship.
          </p>
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
          <p>Use the 0–F lookup table. Keep all four bits for each digit.</p>
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
          <HexInspector value={hex} />
        </section>
        <section className="hex-panel">
          <h3>From denary: {value}</h3>
          <p>
            One method is repeated division by 2, followed by reading the
            remainders from bottom to top.
          </p>
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
            <span>Same answer · pad to 8 bits if needed</span>
          </div>
          <p className="hex-note">
            Place-value subtraction is another denary conversion method. Hex is
            convenient because every digit can be replaced directly with its
            four-bit group; it is not a claim that every person always converts
            hex faster.
          </p>
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
      reference={
        <>
          <HexReference />
          <div className="studio-concepts">
            <article>
              <h3>Compact</h3>
              <p>
                Fewer digits mean less screen space. The same display can show
                more information, or the same information can use a smaller
                display.
              </p>
            </article>
            <article>
              <h3>Human-readable</h3>
              <p>
                Shorter codes are easier to read and compare, making debugging
                easier and transcription mistakes less likely.
              </p>
            </article>
            <article>
              <h3>Easy to convert</h3>
              <p>
                One hex digit maps directly to four bits. This simple grouping
                does not work for denary digits.
              </p>
            </article>
          </div>
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
          <span>SAME DATA · FRIENDLIER NOTATION</span>
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
