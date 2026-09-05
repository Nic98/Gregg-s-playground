import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Mail, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudioLayout, Walkthrough } from '../components/StudioLayout';
import {
  binary,
  characterLabel,
  decodeBits,
  encodeText,
  encodings,
  hex,
  windowsCharacter,
  type Encoding,
} from '../lib/textEncoding';

const lessons = [
  {
    title: 'Every character counts.',
    text: 'Letters, digits, punctuation and spaces are all characters. Select a stamp to follow its journey.',
  },
  {
    title: 'Look up a unique code.',
    text: 'A character set defines which characters are available and assigns a unique code to each. Upper-case A and lower-case a have different codes.',
  },
  {
    title: 'Write the code in binary.',
    text: 'Each code is represented by bits. In the ASCII teaching model, each code is 7 bits long.',
  },
  {
    title: 'Join. Send. Decode.',
    text: 'The codes form a sequence in the same order as the text. The receiver needs the correct encoding to recover the message. Encoding is not encryption.',
  },
];
export function TextStudioPage() {
  const composing = useRef(false);
  const [input, setInput] = useState('Hello!');
  const [encoding, setEncoding] = useState<Encoding>('ascii');
  const [selected, setSelected] = useState(0);
  const [edits, setEdits] = useState<Set<number>>(new Set());
  const [boundaries, setBoundaries] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [compare, setCompare] = useState(false);
  const [walk, setWalk] = useState(false);
  const [step, setStep] = useState(0);
  const [stamped, setStamped] = useState(80);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState(
    'Select a character to follow its code.',
  );
  const result = useMemo(() => encodeText(input, encoding), [input, encoding]);
  const active = result.characters[selected];
  const workingBits = result.bits
    .split('')
    .map((bit, i) => (edits.has(i) ? (bit === '0' ? '1' : '0') : bit))
    .join('');
  const decoded = result.valid ? decodeBits(workingBits, encoding) : null;
  const tableStart = active?.supported
    ? Math.floor((active.bytes[0] ?? 0) / 32) * 32
    : 64;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setStamped((n) => {
          if (n >= result.characters.length) return n;
          setSelected(n);
          return n + 1;
        }),
      700,
    );
    return () => clearInterval(timer);
  }, [playing, result.characters.length]);
  useEffect(() => {
    if (stamped >= result.characters.length) setPlaying(false);
  }, [stamped, result.characters.length]);
  function rebuild(text: string, nextEncoding = encoding) {
    setInput(text);
    setEncoding(nextEncoding);
    setSelected(0);
    setEdits(new Set());
    setPlaying(false);
    setStamped(80);
    setStatus('Message encoded. Previous bit edits cleared.');
  }
  function flip(position: number) {
    setEdits((previous) => {
      const next = new Set(previous);
      if (next.has(position)) next.delete(position);
      else next.add(position);
      return next;
    });
    setStatus(`Bit ${position + 1} changed. Check the decoded message.`);
  }
  return (
    <StudioLayout
      title="Binary Post Office"
      kind="text"
      reference={
        <>
          <h2>Characters become codes. Codes become bits.</h2>
          <div className="studio-concepts">
            <article>
              <h3>Character set</h3>
              <p>
                A defined collection of characters, each assigned a unique code.
                The same character uses the same code within that set.
              </p>
            </article>
            <article>
              <h3>ASCII and Unicode</h3>
              <p>
                ASCII uses 7-bit codes and has 128 code positions. Unicode
                covers far more characters across many writing systems.
              </p>
            </article>
            <article>
              <h3>Binary sequence</h3>
              <p>
                The character codes are placed in order. Spaces and punctuation
                need codes too. The decoding must match the encoding.
              </p>
            </article>
          </div>
          <details>
            <summary>
              Explore further · UTF-8, UTF-16 and real text files
            </summary>
            <p>
              Unicode assigns code points; UTF-8 and UTF-16 encode them. UTF-8
              uses 1–4 bytes per code point. UTF-16 uses one or two 16-bit code
              units. Here UTF-16LE stores the least significant byte first,
              without a byte-order mark (BOM). Combining marks can make one
              visible character consist of several code points. Input is not
              normalised. These implementation details are extension material.
            </p>
            <p>
              Extended ASCII is a family of 8-bit encodings, not a single
              universal table. This lab uses Windows-1252. File sizes exclude
              BOMs, metadata, compression and file-system allocation.
            </p>
          </details>
        </>
      }
    >
      <div className="studio-formula">
        <span className="studio-kicker">Text → binary</span>
        <strong>{result.characters.length} code points</strong>
        <ArrowRight size={18} />
        <strong>
          {result.valid
            ? `${result.bits.length.toLocaleString()} bits`
            : 'Not representable'}
        </strong>
        <span>
          {encoding === 'ascii'
            ? '7-bit teaching model'
            : `${result.byteCount} bytes · no BOM`}
        </span>
      </div>
      <div className="studio-grid">
        <div className="studio-stage" tabIndex={-1}>
          <section className="studio-panel message-panel">
            <div className="studio-row">
              <h2>
                <Mail size={20} /> Your message
              </h2>
              <span className="studio-meta">
                {Array.from(input).length} / 80 code points
              </span>
            </div>
            <label className="sr-only" htmlFor="text-message">
              Message to encode
            </label>
            <textarea
              id="text-message"
              value={input}
              rows={1}
              onCompositionStart={() => {
                composing.current = true;
              }}
              onChange={(event) =>
                rebuild(
                  composing.current
                    ? event.target.value
                    : Array.from(event.target.value).slice(0, 80).join(''),
                )
              }
              onCompositionEnd={(event) => {
                composing.current = false;
                if (Array.from(event.currentTarget.value).length > 80)
                  rebuild(
                    Array.from(event.currentTarget.value).slice(0, 80).join(''),
                  );
              }}
              onBlur={() => {
                if (Array.from(input).length > 80)
                  rebuild(Array.from(input).slice(0, 80).join(''));
              }}
              aria-describedby="message-limit"
            />
            <span id="message-limit" className="studio-meta">
              Up to 80 code points. Spaces and punctuation count too.
            </span>
            <div className="studio-row presets">
              {['Hi!', 'Aa 1!', 'Café', '你好😀'].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  onClick={() => rebuild(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
            <div className="character-stamps" aria-label="Message characters">
              {result.characters.slice(0, 80).map((char, i) => (
                <button
                  key={i}
                  aria-label={`Character ${i + 1}: ${characterLabel(char.char)}`}
                  aria-pressed={i === selected}
                  className={`character-stamp ${!char.supported ? 'is-invalid' : ''}`}
                  onClick={() => setSelected(i)}
                >
                  <span>{characterLabel(char.char)}</span>
                  <small>{i + 1}</small>
                </button>
              ))}
            </div>
            {!input && (
              <p className="studio-muted">
                Type a message to make your first binary tape.
              </p>
            )}
          </section>
          <section className="studio-panel lookup-panel">
            <div className="studio-row">
              <h2>01 / Find the code</h2>
              <span className="studio-meta">
                {encodings.find((e) => e.id === encoding)?.label}
              </span>
            </div>
            {active ? (
              <>
                <div className="encoding-readout">
                  <strong className="letter-display">
                    {characterLabel(active.char)}
                  </strong>
                  <ArrowRight />
                  {(encoding === 'utf-8' || encoding === 'utf-16le') && (
                    <>
                      <div>
                        <span>Unicode code point</span>
                        <strong>U+{hex(active.codePoint, 4)}</strong>
                      </div>
                      <ArrowRight />
                    </>
                  )}
                  <div>
                    <span>
                      {encoding === 'ascii' || encoding === 'windows-1252'
                        ? 'Character code (decimal)'
                        : 'Encoded bytes (hex)'}
                    </span>
                    <strong>
                      {active.supported
                        ? encoding === 'ascii' || encoding === 'windows-1252'
                          ? active.bytes[0]
                          : active.bytes.map((byte) => hex(byte)).join(' ')
                        : 'Not representable'}
                    </strong>
                  </div>
                </div>
                {encoding === 'utf-16le' && (
                  <p className="studio-meta">
                    16-bit code units:{' '}
                    {active.units
                      .map((unit) => `0x${hex(unit, 4)} (${binary(unit, 16)})`)
                      .join(' + ')}
                  </p>
                )}
                {(encoding === 'ascii' || encoding === 'windows-1252') && (
                  <details className="character-table">
                    <summary>
                      Character table · codes {tableStart}–
                      {Math.min(
                        tableStart + 31,
                        encoding === 'ascii' ? 127 : 255,
                      )}
                    </summary>
                    <div className="character-table-grid">
                      {Array.from({ length: 32 }, (_, i) => tableStart + i)
                        .filter(
                          (code) => code < (encoding === 'ascii' ? 128 : 256),
                        )
                        .map((code) => (
                          <div
                            key={code}
                            className={
                              active.bytes[0] === code ? 'is-current' : ''
                            }
                          >
                            <strong>
                              {characterLabel(windowsCharacter(code) ?? '—')}
                            </strong>
                            <span>{code}</span>
                            <code>
                              {binary(code, encoding === 'ascii' ? 7 : 8)}
                            </code>
                          </div>
                        ))}
                    </div>
                  </details>
                )}
              </>
            ) : (
              <p>Select or type a character.</p>
            )}
          </section>
          <section className="studio-panel tape-panel">
            <div className="studio-row">
              <h2>02 / Binary tape</h2>
              <label className="studio-check">
                <input
                  type="checkbox"
                  checked={boundaries}
                  onChange={(event) => setBoundaries(event.target.checked)}
                />{' '}
                Show boundaries
              </label>
            </div>
            {!result.valid ? (
              <p className="studio-error">
                This encoding cannot represent every character. Choose UTF-8 or
                UTF-16 to encode the complete message.
              </p>
            ) : (
              <>
                <div
                  className={`binary-tape ${boundaries ? '' : 'binary-tape--continuous'}`}
                  aria-label="Encoded binary sequence"
                >
                  {result.characters.slice(0, stamped).map((char, i) => (
                    <button
                      key={i}
                      aria-pressed={selected === i}
                      aria-label={`Binary for character ${i + 1}: ${characterLabel(char.char)}`}
                      onClick={() => setSelected(i)}
                    >
                      <code>
                        {workingBits
                          .slice(char.start, char.start + char.bits.length)
                          .match(/.{1,8}/g)
                          ?.join(boundaries && encoding !== 'ascii' ? ' ' : '')}
                      </code>
                      {boundaries && <span>{characterLabel(char.char)}</span>}
                    </button>
                  ))}
                </div>
                <p className="studio-meta">
                  {boundaries
                    ? 'Boundaries are visual guides, not extra stored bits.'
                    : 'One continuous sequence. Select a section to trace it back to its character.'}
                </p>
                {editMode && active && (
                  <div className="bit-editor">
                    <span className="studio-meta">
                      Flip a bit in selected character {selected + 1}
                    </span>
                    <div>
                      {active.bits.split('').map((_, i) => (
                        <button
                          key={i}
                          aria-label={`Flip bit ${active.start + i + 1}`}
                          aria-pressed={edits.has(active.start + i)}
                          onClick={() => flip(active.start + i)}
                        >
                          {workingBits[active.start + i]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="studio-row">
                  <Button
                    variant="outline"
                    disabled={!input}
                    onClick={() => {
                      if (playing) setPlaying(false);
                      else {
                        setStamped(0);
                        setPlaying(true);
                      }
                    }}
                  >
                    {playing ? <Pause /> : <Play />}
                    {playing ? 'Pause' : 'Stamp one by one'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setPlaying(false);
                      setStamped(80);
                    }}
                  >
                    Show all
                  </Button>
                </div>
              </>
            )}
          </section>
          <section className="studio-panel decoded-panel">
            <div className="studio-row">
              <h2>03 / Received message</h2>
              <span className="studio-kicker">
                {edits.size
                  ? `${edits.size} bits changed`
                  : 'Decoded using the same encoding'}
              </span>
            </div>
            <p className="decoded-message" aria-label="Decoded message">
              {decoded?.text || '—'}
            </p>
            {decoded?.error && <p className="studio-error">{decoded.error}</p>}
            {!!edits.size && <p className="studio-meta">Original: {input}</p>}
          </section>
        </div>
        <aside className="studio-rail" aria-label="Text controls" tabIndex={-1}>
          <div className="studio-switch">
            <Button
              variant={!walk ? 'default' : 'ghost'}
              aria-pressed={!walk}
              onClick={() => setWalk(false)}
            >
              Explore
            </Button>
            <Button
              variant={walk ? 'default' : 'ghost'}
              aria-pressed={walk}
              onClick={() => setWalk(true)}
            >
              Walkthrough
            </Button>
          </div>
          {walk && (
            <Walkthrough
              steps={lessons}
              step={step}
              setStep={(next) => {
                setStep(next);
                if (next === 3) {
                  setStamped(0);
                  setPlaying(true);
                }
              }}
            />
          )}
          <label className="studio-field">
            Character set / encoding
            <select
              value={encoding}
              onChange={(event) =>
                rebuild(input, event.target.value as Encoding)
              }
            >
              {encodings.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>
          <p className="studio-muted">
            Choose how the same message is represented. The receiver must use
            the matching encoding.
          </p>
          <label className="studio-check">
            <input
              type="checkbox"
              checked={compare}
              onChange={(event) => setCompare(event.target.checked)}
            />{' '}
            Compare encodings
          </label>
          {compare && (
            <div className="encoding-comparison">
              {encodings.map((e) => {
                const encoded = encodeText(input, e.id);
                return (
                  <article key={e.id}>
                    <strong>{e.label}</strong>
                    <span>
                      {encoded.valid
                        ? e.id === 'ascii'
                          ? `${encoded.bits.length} code bits · ${encoded.byteCount} stored bytes`
                          : `${encoded.byteCount} bytes · ${encoded.bits.length} bits`
                        : 'Not representable'}
                    </span>
                    <code>
                      {encoded.valid
                        ? encoded.characters
                            .flatMap((c) => c.bytes)
                            .map((b) => hex(b))
                            .join(' ')
                        : '—'}
                    </code>
                  </article>
                );
              })}
            </div>
          )}
          <div className="studio-note">
            <h3>How big is this message?</h3>
            {!result.valid ? (
              <p>No complete file size: some characters cannot be encoded.</p>
            ) : encoding === 'ascii' ? (
              <p>
                {result.characters.length} × 7 ={' '}
                <strong>{result.bits.length} bits</strong> in this teaching
                model. Common ASCII files store each code in an 8-bit byte:{' '}
                <strong>{result.byteCount} bytes</strong>, with a leading zero
                bit.
              </p>
            ) : (
              <p>
                {result.valid
                  ? `${result.byteCount} bytes = ${result.bits.length} bits (${(result.byteCount / 1024).toFixed(3)} KiB).`
                  : 'No complete file size: some characters cannot be encoded.'}{' '}
                {encoding === 'windows-1252'
                  ? 'Windows-1252 uses one byte per supported character.'
                  : 'UTF encodings do not use a fixed number of bytes for every character.'}
              </p>
            )}
          </div>
          <label className="studio-check">
            <input
              type="checkbox"
              checked={editMode}
              onChange={(event) => setEditMode(event.target.checked)}
            />{' '}
            Edit bits
          </label>
          <p className="studio-meta">
            Change one bit and observe the received text. Changing the message
            or encoding clears your bit edits.
          </p>
          <Button
            variant="outline"
            disabled={!edits.size}
            onClick={() => {
              setEdits(new Set());
              setStatus('Original bits restored.');
            }}
          >
            <RotateCcw />
            Restore bits
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              rebuild('Hello!', 'ascii');
              setEditMode(false);
              setCompare(false);
              setBoundaries(true);
              setWalk(false);
              setStep(0);
            }}
          >
            Reset demo
          </Button>
        </aside>
      </div>
      <output className="studio-status">{status}</output>
    </StudioLayout>
  );
}
