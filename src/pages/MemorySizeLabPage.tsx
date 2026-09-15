import { Fragment, useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Binary,
  HardDrive,
  Layers3,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { StudioLayout } from '../components/StudioLayout';
import {
  bitsPerUnit,
  displayRatio,
  groupInteger,
  memoryUnits,
  stepFactor,
  type MemorySystem,
} from '../lib/memoryUnits';
import '../memory.css';

function SystemSwitch({
  system,
  onChange,
}: {
  system: MemorySystem;
  onChange: (value: MemorySystem) => void;
}) {
  return (
    <fieldset className="memory-system-switch" aria-label="Memory size system">
      <Button
        variant={system === 'iec' ? 'accent' : 'outline'}
        aria-pressed={system === 'iec'}
        onClick={() => onChange('iec')}
      >
        IEC · ×1,024
      </Button>
      <Button
        variant={system === 'denary' ? 'accent' : 'outline'}
        aria-pressed={system === 'denary'}
        onClick={() => onChange('denary')}
      >
        Denary · ×1,000
      </Button>
    </fieldset>
  );
}

function UnitPicker({
  system,
  index,
  onChange,
  ladder = false,
}: {
  system: MemorySystem;
  index: number;
  onChange: (index: number) => void;
  ladder?: boolean;
}) {
  return (
    <fieldset
      className={ladder ? 'memory-unit-ladder' : 'memory-unit-picker'}
      aria-label="Choose a memory unit"
    >
      {memoryUnits[system].map((unit, i) => (
        <Fragment key={i}>
          {ladder && i > 0 && (
            <span className="memory-step-arrow" aria-hidden="true">
              ÷{i === 1 ? '8' : system === 'iec' ? '1,024' : '1,000'}
              <ArrowRight size={14} />
            </span>
          )}
          <Button
            variant={i === index ? 'accent' : 'outline'}
            aria-pressed={i === index}
            aria-label={`${unit.symbol}, ${unit.name}`}
            onClick={() => onChange(i)}
          >
            <strong>{unit.symbol}</strong>
            {ladder && <small>{unit.name}</small>}
          </Button>
        </Fragment>
      ))}
    </fieldset>
  );
}

function ExactCapacity({ bits }: { bits: bigint | null }) {
  return (
    <div className="memory-exact-capacity">
      <div>
        <span>Bytes · B</span>
        <strong>{bits === null ? '—' : displayRatio(bits, 8n).text}</strong>
      </div>
      <div>
        <span>Bits · b</span>
        <strong>{bits === null ? '—' : groupInteger(bits)}</strong>
      </div>
    </div>
  );
}

function UnitLadder() {
  const [system, setSystem] = useState<MemorySystem>('iec');
  const [index, setIndex] = useState(2);
  const unit = memoryUnits[system][index];
  const lowerUnit = memoryUnits[system][Math.max(0, index - 1)];
  const factor = stepFactor(system, index);
  const bits = bitsPerUnit(system, index);
  return (
    <div className="memory-scene">
      <div className="memory-scene-heading">
        <div>
          <span className="memory-eyebrow">Choose a unit. Look inside.</span>
          <h2>Small bits. Bigger bundles.</h2>
        </div>
        <SystemSwitch system={system} onChange={setSystem} />
      </div>
      <UnitPicker system={system} index={index} onChange={setIndex} ladder />
      <div className="memory-ladder-stage">
        <section
          className="memory-unit-inside"
          aria-label={`Inside one ${unit.name}`}
        >
          <div className="studio-row">
            <span className="memory-eyebrow">Inside 1 {unit.symbol}</span>
            <span>
              {index === 0
                ? 'One binary digit'
                : `Each square = 1 ${lowerUnit.symbol}`}
            </span>
          </div>
          {index === 0 ? (
            <div className="memory-single-bit">
              <span>0</span>
              <small>or</small>
              <span>1</span>
            </div>
          ) : (
            <figure
              className={`memory-bundle-grid ${index === 1 ? 'memory-bundle-grid--byte' : ''}`}
              aria-label={`One ${unit.name} contains ${factor} ${lowerUnit.name}s`}
            >
              {Array.from({ length: index === 1 ? 8 : 1024 }, (_, i) => (
                <span
                  key={i}
                  className={
                    i >= factor
                      ? 'memory-cell-empty'
                      : i >= 1000
                        ? 'memory-cell-extra'
                        : undefined
                  }
                  aria-hidden="true"
                >
                  {index === 1 ? 'b' : null}
                </span>
              ))}
            </figure>
          )}
          <div className="memory-bundle-caption">
            <strong>
              {index === 0
                ? '1 bit'
                : `${factor.toLocaleString('en-GB')} ${lowerUnit.symbol}`}
            </strong>
            <span>
              {index < 2
                ? 'Same in both systems'
                : system === 'iec'
                  ? '1,000 + 24 filled squares'
                  : '1,000 filled · 24 empty'}
            </span>
          </div>
        </section>
        <section
          className="memory-unit-equation"
          aria-label="Selected unit relationship"
        >
          <span className="memory-eyebrow">{unit.name}</span>
          <div className="memory-main-equation">
            <strong>
              1 <em>{unit.symbol}</em>
            </strong>
            <span>=</span>
            <strong>
              {index === 0 ? '1' : factor.toLocaleString('en-GB')}{' '}
              <em>{index === 0 ? 'bit' : lowerUnit.symbol}</em>
            </strong>
          </div>
          <div className="memory-power-note">
            {index < 2 ? (
              '8 b = 1 B'
            ) : (
              <>
                1 {unit.symbol} = {system === 'iec' ? '2' : '10'}
                <sup>{(index - 1) * (system === 'iec' ? 10 : 3)}</sup> B
              </>
            )}
          </div>
          <ExactCapacity bits={bits} />
          <div className="memory-step-controls">
            <Button
              variant="outline"
              disabled={index === 0}
              onClick={() => setIndex((value) => value - 1)}
            >
              <ArrowLeft />
              Smaller unit
            </Button>
            <Button
              variant="accent"
              disabled={index === 7}
              onClick={() => setIndex((value) => value + 1)}
            >
              Larger unit
              <ArrowRight />
            </Button>
          </div>
        </section>
      </div>
      <p className="memory-takeaway">
        Smaller units → multiply. Larger units → divide. The b ↔ B step is
        always 8.
      </p>
    </div>
  );
}

function BitsAndBytes() {
  const [value, setValue] = useState(65);
  return (
    <div className="memory-scene">
      <div className="memory-scene-heading">
        <div>
          <span className="memory-eyebrow">Case matters</span>
          <h2>Little b. Big B.</h2>
        </div>
        <div className="memory-inline-equation">
          8 b <span>=</span> 1 B
        </div>
      </div>
      <section
        className="memory-byte-stage"
        aria-label="One byte made of eight editable bits"
      >
        <div className="studio-row">
          <span className="memory-eyebrow">One byte · Eight slots</span>
          <span>Click a bit to flip it</span>
        </div>
        <div className="memory-bit-switches">
          {Array.from({ length: 8 }, (_, i) => {
            const weight = 2 ** (7 - i);
            const on = (value & weight) !== 0;
            return (
              <div key={i}>
                <span>{weight}</span>
                <Button
                  variant={on ? 'accent' : 'outline'}
                  aria-label={`Bit ${i + 1}, weight ${weight}, value ${on ? 1 : 0}. Flip bit.`}
                  aria-pressed={on}
                  onClick={() => setValue((current) => current ^ weight)}
                >
                  {on ? '1' : '0'}
                </Button>
                <small>1 b</small>
              </div>
            );
          })}
        </div>
        <div className="memory-byte-bracket">
          <span>1 B</span>
        </div>
      </section>
      <div className="memory-byte-results">
        <div>
          <span>Unsigned denary value</span>
          <strong>{value}</strong>
        </div>
        <div>
          <span>Storage size · unchanged</span>
          <strong>8 b = 1 B</strong>
        </div>
        <div className="memory-byte-actions">
          <Button variant="outline" onClick={() => setValue(0)}>
            All 0s
          </Button>
          <Button variant="outline" onClick={() => setValue(255)}>
            All 1s
          </Button>
          <Button variant="ghost" onClick={() => setValue(65)}>
            <RotateCcw />
            Reset
          </Button>
        </div>
      </div>
      <p className="memory-takeaway">
        Changing the bits changes the value—not the storage size.
      </p>
    </div>
  );
}

function SameStorage() {
  const [system, setSystem] = useState<MemorySystem>('denary');
  const [index, setIndex] = useState(5);
  const [amount, setAmount] = useState('1');
  const valid = /^\d{1,4}$/.test(amount) && Number(amount) <= 1024;
  const bits = valid ? BigInt(amount) * bitsPerUnit(system, index) : null;
  const sourceUnit = memoryUnits[system][index];
  function preset(
    nextSystem: MemorySystem,
    nextIndex: number,
    nextAmount = '1',
  ) {
    setSystem(nextSystem);
    setIndex(nextIndex);
    setAmount(nextAmount);
  }
  return (
    <div className="memory-scene">
      <div className="memory-scene-heading">
        <div>
          <span className="memory-eyebrow">Same bytes. Different labels.</span>
          <h2>Did the storage shrink?</h2>
        </div>
        <fieldset className="memory-presets" aria-label="Storage examples">
          <Button variant="outline" onClick={() => preset('denary', 5)}>
            1 TB drive
          </Button>
          <Button variant="outline" onClick={() => preset('iec', 5)}>
            1 TiB
          </Button>
          <Button variant="outline" onClick={() => preset('iec', 7)}>
            1 EiB
          </Button>
          <Button variant="outline" onClick={() => preset('denary', 0, '8')}>
            8 bits
          </Button>
        </fieldset>
      </div>
      <div className="memory-storage-layout">
        <section
          className="memory-capacity-input"
          aria-label="Set the storage capacity"
        >
          <span className="memory-eyebrow">Input capacity</span>
          <SystemSwitch system={system} onChange={setSystem} />
          <div className="memory-amount-field">
            <label htmlFor="memory-amount">Amount</label>
            <div>
              <input
                id="memory-amount"
                inputMode="numeric"
                type="text"
                maxLength={4}
                value={amount}
                aria-invalid={!valid}
                aria-describedby="memory-amount-hint"
                onChange={(event) => setAmount(event.target.value)}
              />
              <strong>{sourceUnit.symbol}</strong>
            </div>
            <span
              id="memory-amount-hint"
              className={!valid ? 'memory-input-error' : ''}
            >
              {valid
                ? 'Whole units · 0–1,024'
                : 'Enter a whole number from 0 to 1,024.'}
            </span>
          </div>
          <Slider
            value={[valid ? Number(amount) : 0]}
            min={0}
            max={1024}
            step={1}
            aria-label="Storage amount"
            aria-valuetext={
              valid
                ? `${amount} ${sourceUnit.name}${amount === '1' ? '' : 's'}`
                : 'Enter a valid amount or move the slider'
            }
            onValueChange={(next) =>
              setAmount(String(Array.isArray(next) ? next[0] : next))
            }
          />
          <UnitPicker system={system} index={index} onChange={setIndex} />
        </section>
        <section
          className="memory-same-storage"
          aria-label="Same capacity expressed in denary and IEC units"
        >
          <div className="memory-readout-pair">
            {(['denary', 'iec'] as const).map((outputSystem) => {
              const result =
                bits === null
                  ? null
                  : displayRatio(bits, bitsPerUnit(outputSystem, index));
              return (
                <div
                  className={`memory-system-readout memory-system-readout--${outputSystem}`}
                  key={outputSystem}
                >
                  <div className="studio-row">
                    <span className="memory-eyebrow">
                      {outputSystem === 'iec'
                        ? 'IEC · Binary prefixes'
                        : 'Denary · Decimal prefixes'}
                    </span>
                    <HardDrive aria-hidden="true" />
                  </div>
                  <div className="memory-converted-number">
                    <span>{result?.sign ?? ''}</span>
                    <strong>{result?.text ?? '—'}</strong>
                    <em>{memoryUnits[outputSystem][index].symbol}</em>
                  </div>
                  <div className="memory-same-bar" aria-hidden="true">
                    <span
                      style={{ width: bits && bits > 0n ? '100%' : '0%' }}
                    />
                  </div>
                  <span className="memory-system-footnote">
                    {index < 2
                      ? 'Bits and bytes are shared units'
                      : `1 ${memoryUnits[outputSystem][index].symbol} = ${outputSystem === 'iec' ? '1,024' : '1,000'} ${memoryUnits[outputSystem][index - 1].symbol}`}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="memory-same-label">
            <ArrowRightLeft size={18} />
            Identical storage in both readouts · ≈ means rounded
          </div>
          <ExactCapacity bits={bits} />
        </section>
      </div>
      <p className="memory-takeaway">
        No bytes disappear when the same capacity is expressed using a different
        unit.
      </p>
    </div>
  );
}

function MemoryNotes() {
  return (
    <div className="memory-teacher-notes">
      <p>
        <strong>0478 / 1.3:</strong> denary prefixes use powers of 1,000; IEC
        binary prefixes use powers of 1,024 (2¹⁰). A bit is a binary digit, and
        one byte is eight bits in either system. Lowercase b means bit;
        uppercase B means byte. SI kilo is lowercase k: kB, not KB.
      </p>
      <p>
        <strong>Reading the ladder:</strong> moving from a larger unit to a
        smaller unit multiplies the numerical amount; moving the other way
        divides it. The bit/byte step uses 8, not 1,000 or 1,024. The square
        diagram always unpacks one unit; its last 24 spaces make the difference
        between the two prefix systems visible.
      </p>
      <p>
        <strong>Same storage:</strong> 1 TB = 1,000,000,000,000 B ≈ 0.909495
        TiB. The two readouts represent identical bit counts, not compression or
        lost capacity. Formatting and file-system overhead are separate issues.
        Some software historically uses decimal-looking labels for binary
        quantities; this demo uses explicit SI/IEC symbols.
      </p>
      <p>
        <strong>Beyond the core:</strong> PiB/EiB and PB/EB extend the same
        rule, as requested. Use the syllabus and question wording to decide the
        expected units. Whole capacities and byte counts remain exact through
        EiB; a ≈ marks rounded conversions.
      </p>
      <div className="memory-reference-table">
        <table>
          <caption>One unit expressed in bytes</caption>
          <thead>
            <tr>
              <th>Denary unit</th>
              <th>Bytes</th>
              <th>IEC unit</th>
              <th>Bytes</th>
            </tr>
          </thead>
          <tbody>
            {memoryUnits.iec.map((unit, i) => (
              <tr key={unit.symbol}>
                <th scope="row">
                  {memoryUnits.denary[i].symbol} · {memoryUnits.denary[i].name}
                </th>
                <td>{displayRatio(bitsPerUnit('denary', i), 8n).text}</td>
                <th scope="row">
                  {unit.symbol} · {unit.name}
                </th>
                <td>{displayRatio(bitsPerUnit('iec', i), 8n).text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MemorySizeLabPage() {
  const [scene, setScene] = useState('ladder');
  return (
    <StudioLayout
      title="Memory Size Lab"
      kind="memory"
      sectionId="1.3"
      showSettings={false}
      collapseReference
      referenceTitle="Teacher notes & unit reference"
      reference={<MemoryNotes />}
    >
      <Tabs.Root
        className="memory-lab"
        value={scene}
        onValueChange={(value) => setScene(String(value))}
      >
        <Tabs.List
          className="memory-scene-tabs"
          aria-label="Memory size experiments"
        >
          <Tabs.Tab value="ladder">
            <Layers3 />
            Unit ladder
          </Tabs.Tab>
          <Tabs.Tab value="bits">
            <Binary />b ≠ B
          </Tabs.Tab>
          <Tabs.Tab value="storage">
            <HardDrive />
            Same storage
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="ladder" keepMounted>
          <UnitLadder />
        </Tabs.Panel>
        <Tabs.Panel value="bits" keepMounted>
          <BitsAndBytes />
        </Tabs.Panel>
        <Tabs.Panel value="storage" keepMounted>
          <SameStorage />
        </Tabs.Panel>
      </Tabs.Root>
    </StudioLayout>
  );
}
