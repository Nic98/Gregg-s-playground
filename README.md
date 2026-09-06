# Gregg’s IGCSE CS Playground

An English-language collection of interactive demonstrations for the Cambridge IGCSE Computer Science 0478 syllabus (2026–2028).

**Live site:** [https://nic98.github.io/Gregg-s-playground/](https://nic98.github.io/Gregg-s-playground/)

Topic 1.2, _Text, sound and images_, contains four live teacher-led studios:

- **UTF-16 Keyboard**: type hex code units using a large keypad or physical keyboard, preview Chinese characters, and press Enter to compose a message. Includes 27 lookup entries and five practice phrases. Start with `8F93 → 输`, then try `4F60 597D 4E16 754C → 你好世界`. Surrogate pairs such as `D83D DE00 → 😀` are an explicit extension; the lab never claims all characters use only 16 bits. This is an in-page teaching keyboard, not an installed system input method.

- **Binary Post Office**: enter a message, trace a character through its code to a binary sequence, flip individual bits and inspect the received text. ASCII and Unicode are the syllabus focus. Windows-1252, UTF-8 and UTF-16LE make the real encoding choices explicit; UTF implementation details are extension material. ASCII shows 7-bit codes separately from typical 8-bit file storage.
- **Sound Sampling Studio**: inspect regular samples, quantised amplitude levels and binary codes. Compare reference/digital playback, select a sample with arrow keys, or record a three-second clip locally. Blind Listening hides randomised A/B settings until the teacher reveals them. Rate, sample resolution and equal-size trials use the same source, duration, fixed gain and speed. No scoring or persistence.
- **Pixel Bead Simulator**: uses a Mona Lisa bead image to help learners explore:

- one bead as one pixel;
- image resolution as pixel dimensions and total pixel count;
- colour depth as bits used to represent each pixel’s colour;
- the way resolution and colour depth affect fidelity; and
- theoretical raw image size: `width × height × bits per pixel`.

The size shown in the lab is raw, uncompressed pixel data. Real PNG and JPEG files also include file structures and may use compression, metadata, palettes and transparency.

## Run locally

Requirements: Node.js 22.13 or later and npm.

```bash
npm ci
npm run dev
```

Vite prints the local address. The project is configured with the GitHub Pages base path `/Gregg-s-playground/`.

## Quality checks

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

The unit suite covers image-size maths, binary codes, crop boundaries, area averaging, deterministic palette generation, OKLab colour matching, high-DPI canvas rendering and drag grouping. The browser suite covers routes, default metrics, guided presets, 8×8 and 64×64 boards, the 256-colour palette, inspecting, painting, undo/redo, restore/reset, keyboard use, mobile navigation and image-load failure.

## Routes

The site uses hash routing so every activity works on static GitHub Pages hosting.

- `#/` — full syllabus catalogue
- `#/topics/1-data-representation/1-2-text-sound-images` — Topic 1.2
- `#/topics/1-data-representation/1-2-text-sound-images/pixel-bead-simulator` — Pixel Bead Simulator
- `#/topics/1-data-representation/1-2-text-sound-images/binary-post-office` — Binary Post Office
- `#/topics/1-data-representation/1-2-text-sound-images/sound-sampling-studio` — Sound Sampling Studio
- `#/topics/1-data-representation/1-2-text-sound-images/utf16-keyboard` — UTF-16 Keyboard

## Teaching sound with a blind comparison

1. Use a comfortable speaker volume. Open **Blind listening**, choose **Sample rate**, play A and B, and ask learners to describe the missing high-frequency detail. Reveal the settings afterwards.
2. Choose **Sample resolution**. The fading notes make the error from 4-bit quantisation audible; 16-bit audio stays cleaner. This is deliberately a strong contrast, not a promise that all bit depths can be distinguished by ear.
3. Choose **Same size** to compare `16,000 × 4` with `8,000 × 8`: both use 64,000 bits per second. Discuss the trade-off instead of choosing a universal winner.
4. Return to Explore and connect what learners heard to sample spacing, amplitude levels and the binary sequence. For mono audio: `sample rate × seconds × bits per sample` gives theoretical raw bits.

Built-in signals are deterministic 48 kHz synthetic clips. Lower-rate versions use a windowed-sinc low-pass filter before sampling; quantisation uses unsigned endpoint-uniform levels with dithering disabled. Playback uses Web Audio at the represented rate, not slowed-down playback. Browser microphone input has already been digitised by hardware, so reprocessing it is an ADC teaching model, not access to an analogue signal. Microphone access requires localhost or HTTPS and explicit permission. Tracks are released on completion, cancellation or navigation. Unsupported/denied microphones leave the built-in examples usable. Blind trials deliberately use the curated built-in sources so the contrast is repeatable.

## Add a future demonstration

1. Add or update the topic/subsection in `src/data/syllabus.ts`, including its status and route.
2. Add the new page in `src/pages/`.
3. Register the route in `src/App.tsx`.
4. For Topic 1.2, add a `studioDemos` registry entry; the launch card and focus-shell routing use it automatically. For other subsections, add a launch card to that subsection page.
5. Add unit or browser coverage for its important teaching interactions.

Shared curriculum navigation and status badges read from the typed syllabus registry, so the catalogue stays consistent as more demonstrations become live.

## Typography licences

The interface self-hosts Bricolage Grotesque Variable and Manrope Variable;
no font CDN is used. Both fonts are distributed under the SIL Open Font
License 1.1. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and
[`LICENSES/OFL-1.1.txt`](LICENSES/OFL-1.1.txt).

## Image processing used by the simulator

The reference image remains intact on screen. Colour analysis uses the inner crop `(13, 13, 400, 400)` so the white frame does not distort the palette. Transparent pixels are composited onto a fixed background. Every settings change resamples the original crop with area averaging; the result is never generated from an earlier low-resolution board.

Palettes are deterministic, cached per colour depth, independent of output resolution and matched in OKLab colour space without dithering. `baseIndices` and editable `workingIndices` are the board’s source of truth; Canvas is only the renderer.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy-pages.yml` tests and builds every push to `main`, then publishes `dist/` using the official GitHub Pages actions. In the repository settings, choose **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Pull requests run linting, unit tests, a production build and Chromium browser tests before merge.
