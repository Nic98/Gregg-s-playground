# Gregg’s IGCSE CS Playground

An English-language collection of interactive demonstrations for the Cambridge IGCSE Computer Science 0478 syllabus (2026–2028).

**Live site:** [https://nic98.github.io/Gregg-s-playground/](https://nic98.github.io/Gregg-s-playground/)

The first live activity is the **Pixel Bead Simulator** in Topic 1.2, _Text, sound and images_. It uses a Mona Lisa bead image to help learners explore:

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

## Add a future demonstration

1. Add or update the topic/subsection in `src/data/syllabus.ts`, including its status and route.
2. Add the new page in `src/pages/`.
3. Register the route in `src/App.tsx`.
4. Add its launch card to the relevant subsection page.
5. Add unit or browser coverage for its important teaching interactions.

Shared curriculum navigation and status badges read from the typed syllabus registry, so the catalogue stays consistent as more demonstrations become live.

## Image processing used by the simulator

The reference image remains intact on screen. Colour analysis uses the inner crop `(13, 13, 400, 400)` so the white frame does not distort the palette. Transparent pixels are composited onto a fixed background. Every settings change resamples the original crop with area averaging; the result is never generated from an earlier low-resolution board.

Palettes are deterministic, cached per colour depth, independent of output resolution and matched in OKLab colour space without dithering. `baseIndices` and editable `workingIndices` are the board’s source of truth; Canvas is only the renderer.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy-pages.yml` tests and builds every push to `main`, then publishes `dist/` using the official GitHub Pages actions. In the repository settings, choose **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Pull requests run linting, unit tests, a production build and Chromium browser tests before merge.
