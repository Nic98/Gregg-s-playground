// oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The overflow table region needs focus for native keyboard scrolling.
import { useRef, useState } from 'react';
import {
  ArrowRight,
  CornerDownLeft,
  Delete,
  Copy,
  Keyboard,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudioLayout } from '../components/StudioLayout';
import { characterLabel } from '../lib/textEncoding';
import {
  hanziTable,
  normaliseUtf16Draft,
  readUtf16Draft,
  utf16Examples,
  utf16Units,
} from '../lib/utf16Keyboard';
import '../utf16-keyboard.css';

export function Utf16KeyboardPage() {
  const [draft, setDraft] = useState('8F93');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(
    '8F93 is ready: press Enter to type 输.',
  );
  const [example, setExample] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const preview = readUtf16Draft(draft);
  const characters = Array.from(message);
  const units = utf16Units(message);
  const target = example === null ? null : utf16Examples[example];
  const matched = target ? message === target.text : false;
  const onTrack = target ? target.text.startsWith(message) : true;
  function insert(character = preview.character) {
    if (character === null) {
      setStatus(preview.message);
      return;
    }
    if (characters.length >= 80) {
      setStatus(
        'The message is full (80 code points). Remove a character or clear it first.',
      );
      return;
    }
    setMessage((previous) => previous + character);
    setDraft('');
    setStatus(
      `Inserted ${characterLabel(character)} · ${utf16Units(character)
        .map((unit) => `0x${unit}`)
        .join(' ')}.`,
    );
  }
  function digit(value: string) {
    const clean = normaliseUtf16Draft(draft);
    if (!/^[0-9A-F]*$/.test(clean)) {
      setStatus('Clear the invalid input before using the keypad.');
      return;
    }
    if (
      clean.length >= 8 ||
      (clean.length >= 4 && readUtf16Draft(clean).state === 'ready')
    ) {
      setStatus(
        'Press Enter to insert this character, or clear the code to start again.',
      );
      return;
    }
    setDraft(clean + value);
  }
  function backspace() {
    if (draft) setDraft((previous) => previous.slice(0, -1));
    else {
      setMessage((previous) => Array.from(previous).slice(0, -1).join(''));
      setStatus('Removed the last character.');
    }
  }
  function chooseCode(unit: string) {
    setDraft(unit);
    setStatus(
      `Loaded ${unit}. Press Enter to insert; the table never types for you.`,
    );
  }
  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setStatus('Message copied.');
    } catch {
      setStatus(
        'Clipboard unavailable. Select and copy the message from the output field.',
      );
    }
  }
  return (
    <StudioLayout
      title="UTF-16 Keyboard"
      kind="text"
      showSettings={false}
      reference={
        <>
          <h2>A different way to type a character.</h2>
          <div className="studio-concepts">
            <article>
              <h3>Character → code</h3>
              <p>
                Unicode gives characters unique code points. This keyboard turns
                UTF-16 code units into text, so you can see the link between a
                character and its binary representation.
              </p>
            </article>
            <article>
              <h3>Hex is a shorthand</h3>
              <p>
                One hexadecimal digit represents four bits. Four hex digits
                represent one 16-bit code unit. For example, 4F60 represents 你;
                the prefix 0x is a label, not stored data.
              </p>
            </article>
            <article>
              <h3>Not always 16 bits</h3>
              <p>
                The Chinese characters in this table use one code unit each.
                Some characters, including many emoji, use two code units: a
                surrogate pair. UTF-16 does not always use 16 bits per
                character.
              </p>
            </article>
          </div>
          <details>
            <summary>
              Explore further · encoding is not a real system input method
            </summary>
            <p>
              This is a classroom keyboard inside the webpage, not an installed
              operating-system input method. The syllabus focus is character
              sets, Unicode and binary representation; surrogate pairs and byte
              order are extension material.
            </p>
            <p>
              Codes here are written as UTF-16 code units, not bytes in file
              order. For 你 (4F60), UTF-16LE stores bytes 60 4F; UTF-16BE stores
              4F 60. The raw size excludes a byte-order mark, file headers and
              metadata. Combining marks can mean one visible symbol contains
              several code points.
            </p>
          </details>
        </>
      }
    >
      <div className="utf-intro">
        <p>
          <Keyboard size={18} />
          <strong>Type a code. Make a character.</strong>
        </p>
        <span>Four hex digits → 16 bits → a Chinese character</span>
      </div>
      <div className="utf-workspace">
        <div className="utf-composer">
          <section
            className="utf-keyboard"
            aria-label="Hexadecimal input keyboard"
          >
            <div className="utf-display">
              <div className="utf-code-input">
                <label htmlFor="utf-code">
                  UTF-16 code units · hexadecimal
                </label>
                <div>
                  <span aria-hidden="true">0x</span>
                  <input
                    ref={input}
                    id="utf-code"
                    value={draft}
                    maxLength={24}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="4F60"
                    aria-describedby="utf-preview-hint"
                    aria-invalid={preview.state === 'invalid'}
                    onChange={(event) =>
                      setDraft(event.target.value.toUpperCase())
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        insert();
                      } else if (event.key === 'Escape') {
                        event.preventDefault();
                        setDraft('');
                      } else if (event.key === 'Backspace' && !draft) {
                        event.preventDefault();
                        backspace();
                      } else if (event.key === ' ' && !draft) {
                        event.preventDefault();
                        insert(' ');
                      }
                    }}
                  />
                </div>
                <p
                  id="utf-preview-hint"
                  className={preview.state === 'invalid' ? 'utf-invalid' : ''}
                >
                  {preview.message}
                </p>
              </div>
              <div className="utf-character" aria-label="Character preview">
                <strong lang="zh">
                  {preview.character === null
                    ? '—'
                    : characterLabel(preview.character)}
                </strong>
                <span>
                  {preview.state === 'ready'
                    ? 'Ready to insert'
                    : 'Waiting for a code'}
                </span>
              </div>
            </div>
            <div className="utf-binary">
              <span>Binary</span>
              <code>{preview.binary || '□□□□ □□□□ □□□□ □□□□'}</code>
            </div>
            <div className="utf-keypad">
              {'0123456789ABCDE'.split('').map((key) => (
                <Button
                  key={key}
                  className="utf-key"
                  variant="ghost"
                  aria-label={`Hex ${key}`}
                  onClick={() => digit(key)}
                >
                  {key}
                </Button>
              ))}
              <Button
                className="utf-key utf-key-tool"
                variant="ghost"
                onClick={() => {
                  setDraft('');
                  setStatus('Code cleared. Type four hex digits.');
                }}
              >
                Clear code
              </Button>
              <Button
                className="utf-key utf-key-tool"
                variant="ghost"
                onClick={() => insert(' ')}
              >
                Space
              </Button>
              <Button
                className="utf-key"
                variant="ghost"
                aria-label="Hex F"
                onClick={() => digit('F')}
              >
                F
              </Button>
              <Button
                className="utf-key utf-key-tool"
                variant="ghost"
                aria-label="Backspace"
                onClick={backspace}
              >
                <Delete />
              </Button>
              <Button
                className="utf-key utf-enter"
                variant="accent"
                disabled={preview.state !== 'ready' || characters.length >= 80}
                onClick={() => insert()}
              >
                <CornerDownLeft />
                <span>Enter</span>
              </Button>
            </div>
            <p className="utf-shortcuts">
              Use the keypad or your keyboard. Enter = insert · Esc = clear code
              · Backspace = remove.
            </p>
          </section>
          <section className="utf-output studio-panel">
            <div className="studio-row">
              <h2>Your message</h2>
              <Button
                variant="outline"
                disabled={!message}
                onClick={copyMessage}
              >
                <Copy />
                Copy
              </Button>
            </div>
            <label htmlFor="utf-message" className="sr-only">
              Composed message
            </label>
            <textarea
              id="utf-message"
              value={message}
              readOnly
              rows={2}
              placeholder="Your characters will appear here…"
              lang="zh"
            />
            <div className="utf-size">
              <span>{characters.length} code points</span>
              <span>
                {units.length} × 16 = <strong>{units.length * 16} bits</strong>
              </span>
              <span>{units.length * 2} raw bytes</span>
            </div>
            <ol className="utf-message-codes" aria-label="Message code units">
              {characters.map((char, index) => (
                <li key={index}>
                  <strong lang="zh">{characterLabel(char)}</strong>
                  <code>{utf16Units(char).join(' ')}</code>
                </li>
              ))}
            </ol>
            <div className="studio-row">
              <span className="studio-meta">
                80-code-point limit · no BOM or file overhead
              </span>
              <Button
                variant="ghost"
                disabled={!message}
                onClick={() => {
                  setMessage('');
                  setStatus('Message cleared.');
                }}
              >
                <RotateCcw />
                Clear message
              </Button>
            </div>
          </section>
        </div>
        <aside
          className="utf-table-panel studio-panel"
          aria-label="Chinese character lookup"
        >
          <div className="studio-row">
            <h2>Character lookup</h2>
            <span className="studio-meta">{hanziTable.length} codes</span>
          </div>
          <p>
            Find a character, type its four-digit code, then press Enter. “Load”
            fills the code without inserting it.
          </p>
          <section
            className="utf-table-scroll"
            tabIndex={0}
            aria-label="Scrollable Chinese character table"
          >
            <table>
              <caption className="sr-only">
                Chinese characters and UTF-16 hexadecimal code units
              </caption>
              <thead>
                <tr>
                  <th scope="col">Character</th>
                  <th scope="col">Meaning</th>
                  <th scope="col">UTF-16</th>
                  <th scope="col">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {hanziTable.map((row) => (
                  <tr
                    key={row.unit}
                    className={
                      preview.character === row.character
                        ? 'utf-row-selected'
                        : ''
                    }
                  >
                    <td lang="zh">
                      {row.character === ' ' ? '␣' : row.character}
                    </td>
                    <td>{row.meaning}</td>
                    <td>
                      <code>{row.unit}</code>
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Load ${characterLabel(row.character)} (${row.unit})`}
                        onClick={() => chooseCode(row.unit)}
                      >
                        Load
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <div className="utf-table-note">
            <strong>Try the screenshot’s character</strong>
            <p>
              <code>8F93</code> <ArrowRight size={14} />{' '}
              <span lang="zh">输</span> — one code unit, 16 bits.
            </p>
          </div>
        </aside>
      </div>
      <output className="studio-status utf-status">{status}</output>
      <section className="utf-examples" aria-label="Practice examples">
        <div className="studio-row">
          <div>
            <p className="studio-kicker">Put the codes together</p>
            <h2>Try a whole phrase.</h2>
          </div>
          <span className="studio-meta">
            Examples load a target, not a pre-typed answer.
          </span>
        </div>
        <div className="utf-example-grid">
          {utf16Examples.map((item, index) => (
            <button
              key={item.text}
              className="utf-example"
              aria-pressed={example === index}
              onClick={() => {
                setExample(index);
                setStatus(
                  'Practice target selected. Your existing message has been kept. Clear it if you want to start again.',
                );
              }}
            >
              <strong lang="zh">{item.text}</strong>
              <span>{item.meaning}</span>
              <code>{utf16Units(item.text).join(' ')}</code>
              {index === 4 && <small>Explore further · surrogate pair</small>}
            </button>
          ))}
        </div>
        {target && (
          <div className="utf-practice">
            <div>
              <h3>
                Type <span lang="zh">{target.text}</span>
              </h3>
              <p>{target.detail}</p>
              <p>
                {matched
                  ? 'Phrase complete — every code is in the correct order.'
                  : onTrack
                    ? `Next character: ${Array.from(target.text)[characters.length]}. Use the lookup table or the example codes.`
                    : 'Your message differs from the target. Remove the last character or clear the message to try again.'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setDraft('');
                input.current?.focus();
              }}
            >
              Type the next code
            </Button>
          </div>
        )}
      </section>
    </StudioLayout>
  );
}
