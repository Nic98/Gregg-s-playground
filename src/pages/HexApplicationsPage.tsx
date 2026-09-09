import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Monitor,
  Network,
  Palette,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { StudioLayout } from '../components/StudioLayout';
import {
  HexInspector,
  HexNavigation,
  HexReference,
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
        <p className="studio-kicker">01 / Error code</p>
        <h2>A short code. A precise lookup.</h2>
        <p>
          Trigger a fault in this imaginary classroom device. Read its
          hexadecimal code, then use the codebook to find the problem.
        </p>
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
          <p>
            Same 16-bit code. Four hex digits instead of sixteen binary digits.
          </p>
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
        <p className="hex-note">
          These are invented teaching codes, not real operating-system errors.
          Their meanings come from this device’s documentation; hexadecimal
          alone does not explain an error.
        </p>
        <HexInspector value={item.code} />
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
        <p className="studio-kicker">02 / HTML colour code</p>
        <h2>Mix light with #RRGGBB.</h2>
        <p>
          Web pages can use six hexadecimal digits to describe an RGB colour.
          Two digits control each channel, from 00 to FF (0 to 255).
        </p>
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
        <h3>Red + green + blue</h3>
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
        <p className="hex-note">
          6 hex digits × 4 bits = 24 bits for this RGB colour. The # is a colour
          marker, not a digit. This example does not include transparency.
        </p>
        <HexInspector value={hex} />
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
        <p className="studio-kicker">03 / MAC address</p>
        <h2>Recognise a network interface.</h2>
        <p>
          A typical MAC address is a 48-bit identifier for a network interface.
          Hexadecimal displays it as six pairs of digits.
        </p>
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
        <p>2 hex digits = 8 bits = 1 byte.</p>
        <HexInspector value={bytes[byte]} />
        <div className="hex-callout">
          <strong>12 hex digits ↔ 48 bits</strong>
          <p>
            The colons separate the six bytes; they are not part of the 48-bit
            value.
          </p>
        </div>
        <p className="hex-note">
          These are fictional, locally administered addresses. A MAC identifies
          an interface on a local network, not its geographical location.
          Addresses can be changed or randomised; they are not a guarantee of
          identity.
        </p>
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
        <p className="studio-kicker">04 / IP address · IPv6</p>
        <h2>A readable address for 128 bits.</h2>
        <p>
          IPv6 uses hexadecimal notation. Its full form contains eight groups of
          four hex digits, separated by colons.
        </p>
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
        <p className="hex-note">
          {compressed
            ? 'Leading zeros can be omitted. One run of all-zero groups can be replaced with ::. The address still represents exactly the same 128 bits.'
            : 'Select any group above. Four hexadecimal digits represent sixteen bits, including leading zeros.'}
        </p>
      </section>
      <aside className="hex-panel">
        <h3>Inspect group {group + 1}</h3>
        <div className="hex-big-equation">
          <strong>{groups[group]}</strong>
          <ArrowRight />
          <code>{hexToBinary(groups[group])}</code>
        </div>
        <HexInspector value={groups[group]} />
        <div className="hex-callout">
          <strong>8 × 4 × 4 = 128 bits</strong>
          <p>8 groups × 4 hex digits × 4 bits per digit.</p>
        </div>
        <h3>IPv4 is different</h3>
        <p>
          <code>192.0.2.10</code> is dotted-denary IPv4: four decimal numbers
          representing 32 bits. Do not label it as hexadecimal.
        </p>
        <p className="hex-note">
          All addresses here use documentation-only example ranges. No network
          connection or device lookup is made.
        </p>
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
      reference={
        <>
          <HexReference />
          <div className="studio-concepts">
            <article>
              <AlertTriangle />
              <h3>Error codes</h3>
              <p>
                Compact identifiers make faults easier to report and look up.
              </p>
            </article>
            <article>
              <Palette />
              <h3>HTML colour codes</h3>
              <p>
                Pairs of hex digits represent red, green and blue channel
                values.
              </p>
            </article>
            <article>
              <Network />
              <h3>Network addresses</h3>
              <p>
                MAC and IPv6 addresses use hex to represent long binary values.
              </p>
            </article>
          </div>
        </>
      }
    >
      <div className="hex-workbench">
        <HexNavigation
          names={['Error code', 'HTML colour', 'MAC address', 'IP address']}
          selected={tab}
          onSelect={setTab}
        />
        <div className="hex-context">
          <span>HEX FIELD GUIDE · 4 APPLICATIONS</span>
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
