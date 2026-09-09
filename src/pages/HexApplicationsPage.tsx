import { useState } from 'react';
import { AlertTriangle, ArrowRight, Monitor, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { StudioLayout } from '../components/StudioLayout';
import {
  HexInspector,
  HexNavigation,
  HexReference,
  HexNotes,
} from '../components/HexWorkbench';
import { compressIPv6, hexToBinary, rgbHex } from '../lib/hexadecimal';
import '../hex.css';

const faults = [
  {
    code: '000A',
    action: 'Disconnect the sensor',
    meaning: 'Sensor not connected',
    fix: 'Check the sensor connection, then try again.',
  },
  {
    code: '00F2',
    action: 'Fill the memory',
    meaning: 'Memory buffer full',
    fix: 'Clear the buffer before collecting more readings.',
  },
  {
    code: 'B104',
    action: 'Overheat the device',
    meaning: 'Temperature limit reached',
    fix: 'Let the device cool before restarting it.',
  },
];
const devices = [
  { name: 'Teacher laptop', address: '02:1A:4B:90:00:AF' },
  { name: 'Classroom tablet', address: '02:1A:4B:90:00:B0' },
  { name: 'Science sensor', address: '02:1A:4B:90:00:B1' },
];
const addresses = [
  '2001:0DB8:0000:0000:0000:0000:0000:00AF',
  '2001:0DB8:1234:0000:0000:0000:ABCD:0001',
];

function ErrorExperiment() {
  const [fault, setFault] = useState(0),
    [revealed, setRevealed] = useState(false);
  const item = faults[fault];
  return (
    <div className="hex-experiment-grid">
      <section className="hex-panel">
        <h2>Trigger a fault.</h2>
        <div className="hex-actions">
          {faults.map((f, i) => (
            <Button
              key={f.code}
              variant={fault === i ? 'accent' : 'outline'}
              aria-pressed={fault === i}
              onClick={() => {
                setFault(i);
                setRevealed(false);
              }}
            >
              {f.action}
            </Button>
          ))}
        </div>
        <div className="hex-terminal">
          <span>
            <AlertTriangle size={18} /> DEVICE DIAGNOSTIC · SIMULATION
          </span>
          <strong className="hex-error-code">0x{item.code}</strong>
          <code>{hexToBinary(item.code)} in binary</code>
          <span>4 hex digits ↔ 16 bits</span>
        </div>
        <Button
          variant="default"
          onClick={() => setRevealed(!revealed)}
          aria-expanded={revealed}
        >
          {revealed ? 'Hide diagnosis' : 'Look up the error'} <ArrowRight />
        </Button>
        {revealed && (
          <div className="hex-callout">
            <output>
              <strong>{item.meaning}</strong>
              {item.fix}
            </output>
          </div>
        )}
      </section>
      <aside className="hex-panel">
        <h3>Device codebook</h3>
        <table className="hex-table">
          <thead>
            <tr>
              <th>Hex code</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {faults.map((f) => (
              <tr
                key={f.code}
                className={
                  revealed && f.code === item.code ? 'hex-row-active' : ''
                }
              >
                <td>
                  <code>0x{f.code}</code>
                </td>
                <td>{f.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <HexInspector value={item.code} />
        <HexNotes>
          <p>
            These are invented teaching codes, not real operating-system errors.
            Their meanings come from this device’s documentation; hexadecimal
            alone does not explain an error.
          </p>
        </HexNotes>
      </aside>
    </div>
  );
}

function ColourExperiment() {
  const [channels, setChannels] = useState([185, 242, 76]);
  const [draft, setDraft] = useState('B9F24C');
  const [error, setError] = useState('');
  const hex = rgbHex(channels);
  function update(next: number[]) {
    setChannels(next);
    setDraft(rgbHex(next));
    setError('');
  }
  return (
    <div className="hex-experiment-grid">
      <section className="hex-panel">
        <h2>Mix a colour.</h2>
        <figure
          className="hex-colour-swatch"
          style={{ background: `#${hex}` }}
          aria-label={`Colour preview #${hex}`}
        />
        <div className="hex-colour-output">
          <strong>#{hex}</strong>
          <code>color: #{hex};</code>
        </div>
        <form
          className="hex-entry"
          onSubmit={(event) => {
            event.preventDefault();
            const clean = draft.trim().replace(/^#/, '');
            if (!/^[\da-f]{6}$/i.test(clean)) {
              setError('Enter exactly six hex digits, for example B9F24C.');
              return;
            }
            update([0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16)));
          }}
        >
          <label htmlFor="web-colour">Try a hex colour</label>
          <div>
            <input
              id="web-colour"
              value={draft}
              maxLength={7}
              onChange={(e) => {
                setDraft(e.target.value);
                setError('');
              }}
              spellCheck={false}
              aria-invalid={!!error}
              aria-describedby="colour-error"
            />
            <Button type="submit" variant="default">
              Apply colour
            </Button>
          </div>
          <output id="colour-error">{error}</output>
        </form>
        <div className="hex-actions">
          {['FF0000', '000000', 'FFFFFF', 'B9F24C'].map((preset) => (
            <Button
              key={preset}
              variant="outline"
              aria-label={`Use colour #${preset}`}
              onClick={() =>
                update(
                  [0, 2, 4].map((i) => parseInt(preset.slice(i, i + 2), 16)),
                )
              }
            >
              #{preset}
            </Button>
          ))}
        </div>
      </section>
      <aside className="hex-panel">
        <h3>#RR GG BB</h3>
        {['Red', 'Green', 'Blue'].map((label, i) => (
          <div className="hex-channel" key={label}>
            <div>
              <strong>{label}</strong>
              <code>
                {hex.slice(i * 2, i * 2 + 2)} = {channels[i]}
              </code>
            </div>
            <Slider
              aria-label={`${label} channel`}
              min={0}
              max={255}
              step={1}
              value={[channels[i]]}
              onValueChange={(value) =>
                update(
                  channels.map((v, j) =>
                    j === i ? (Array.isArray(value) ? value[0] : value) : v,
                  ),
                )
              }
            />
            <code>{hexToBinary(hex.slice(i * 2, i * 2 + 2))} · 8 bits</code>
          </div>
        ))}
        <div className="hex-mini-equation">6 hex digits × 4 = 24 bits</div>
        <HexInspector value={hex} />
        <HexNotes>
          <p>
            Each RGB channel runs from 00 to FF (0–255). The # is a marker, not
            a digit. This six-digit example has no transparency.
          </p>
        </HexNotes>
      </aside>
    </div>
  );
}

function MacExperiment() {
  const [device, setDevice] = useState(0),
    [byte, setByte] = useState(5);
  const selected = devices[device],
    bytes = selected.address.split(':');
  return (
    <div className="hex-experiment-grid">
      <section className="hex-panel">
        <h2>Pick a device. Tap a byte.</h2>
        <div className="hex-device-list">
          {devices.map((item, index) => (
            <button
              key={item.name}
              aria-pressed={device === index}
              onClick={() => setDevice(index)}
            >
              <Monitor size={22} />
              <span>
                <strong>{item.name}</strong>
                <code>{item.address}</code>
              </span>
            </button>
          ))}
        </div>
        <h3>{selected.name}</h3>
        <div className="hex-address" aria-label="MAC address bytes">
          {bytes.map((part, i) => (
            <button
              key={i}
              aria-label={`MAC byte ${i + 1}: ${part}`}
              aria-pressed={byte === i}
              onClick={() => setByte(i)}
            >
              {part}
            </button>
          ))}
        </div>
        <div className="hex-terminal">
          <span>SAME ADDRESS IN BINARY</span>
          <code className="hex-binary-wrap">
            {bytes.map((part) => hexToBinary(part)).join(' ')}
          </code>
        </div>
      </section>
      <aside className="hex-panel">
        <h3>Inspect byte {byte + 1}</h3>
        <div className="hex-big-equation">
          <strong>{bytes[byte]}</strong>
          <ArrowRight />
          <code>{hexToBinary(bytes[byte])}</code>
        </div>
        <div className="hex-mini-equation">2 hex digits = 8 bits</div>
        <HexInspector value={bytes[byte]} />
        <div className="hex-mini-equation">
          6 bytes · 12 hex digits · 48 bits
        </div>
        <HexNotes>
          <p>
            These are fictional, locally administered addresses. A MAC
            identifies an interface on a local network, not its geographical
            location. Addresses can be changed or randomised; they are not a
            guarantee of identity.
          </p>
          <p>Colons separate bytes; they are not part of the 48-bit value.</p>
        </HexNotes>
      </aside>
    </div>
  );
}

function IpExperiment() {
  const [example, setExample] = useState(0),
    [group, setGroup] = useState(7),
    [compressed, setCompressed] = useState(false);
  const address = addresses[example],
    groups = address.split(':');
  return (
    <div className="hex-experiment-grid">
      <section className="hex-panel">
        <h2>IPv6: tap a group.</h2>
        <div className="hex-actions">
          {addresses.map((_, i) => (
            <Button
              key={i}
              variant={example === i ? 'accent' : 'outline'}
              aria-pressed={example === i}
              onClick={() => setExample(i)}
            >
              Example {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            aria-pressed={compressed}
            onClick={() => setCompressed(!compressed)}
          >
            {compressed ? 'Show full address' : 'Show shortened address'}
          </Button>
        </div>
        <div className="hex-terminal">
          <span>
            {compressed ? 'SHORTENED IPv6 NOTATION' : 'FULL IPv6 NOTATION'}
          </span>
          <code className="hex-ip-value">
            {compressed ? compressIPv6(address) : address}
          </code>
        </div>
        <div
          className="hex-address hex-ip-groups"
          aria-label="Expanded IPv6 groups"
        >
          {groups.map((part, i) => (
            <button
              key={i}
              aria-label={`IPv6 group ${i + 1}: ${part}`}
              aria-pressed={group === i}
              onClick={() => setGroup(i)}
            >
              <small>Group {i + 1}</small>
              {part}
            </button>
          ))}
        </div>
        <div className="hex-mini-equation">
          {compressed
            ? 'Shorter notation. Still 128 bits.'
            : '8 groups × 16 bits = 128 bits'}
        </div>
      </section>
      <aside className="hex-panel">
        <h3>Inspect group {group + 1}</h3>
        <div className="hex-big-equation">
          <strong>{groups[group]}</strong>
          <ArrowRight />
          <code>{hexToBinary(groups[group])}</code>
        </div>
        <HexInspector value={groups[group]} />
        <div className="hex-address-contrast">
          <span>IPv4 · denary · 32 bits</span>
          <code>192.0.2.10</code>
        </div>
        <HexNotes>
          <p>
            All addresses here use documentation-only example ranges. No network
            connection or device lookup is made.
          </p>
          <p>
            IPv6 can omit leading zeros and replace one run of zero groups with
            ::. Shortening the notation does not change the address.
          </p>
        </HexNotes>
      </aside>
    </div>
  );
}

export function HexApplicationsPage() {
  const [tab, setTab] = useState(0),
    [revision, setRevision] = useState(0);
  const panels = [
    ErrorExperiment,
    ColourExperiment,
    MacExperiment,
    IpExperiment,
  ];
  const Panel = panels[tab];
  return (
    <StudioLayout
      title="Hexadecimal in action"
      kind="hex"
      sectionId="1.1"
      showSettings={false}
      collapseReference
      reference={<HexReference />}
    >
      <div className="hex-workbench">
        <HexNavigation
          names={['Error code', 'HTML colour', 'MAC address', 'IP address']}
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
