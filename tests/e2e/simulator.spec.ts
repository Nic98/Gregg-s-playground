import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const sectionHash = '#/topics/1-data-representation/1-2-text-sound-images';
const simulatorHash = `${sectionHash}/pixel-bead-simulator`;

async function waitForFonts(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

async function openSimulator(page: Page) {
  await page.goto(`http://127.0.0.1:4173/Gregg-s-playground/${simulatorHash}`);
  await waitForFonts(page);
  await expect(
    page.getByRole('heading', { name: 'Pixel Bead Simulator' }),
  ).toBeVisible();
  const canvas = page.getByRole('application', {
    name: /interactive bead image/i,
  });
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  return canvas;
}

async function contrastRatio(locator: Locator) {
  return locator.evaluate((element) => {
    const parse = (value: string) =>
      value
        .match(/[\d.]+/g)
        ?.slice(0, 3)
        .map(Number) ?? [0, 0, 0];
    const luminance = (rgb: number[]) => {
      const channels = rgb.map((channel) => {
        const normalised = channel / 255;
        return normalised <= 0.04045
          ? normalised / 12.92
          : ((normalised + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const style = getComputedStyle(element);
    const foreground = luminance(parse(style.color));
    const background = luminance(parse(style.backgroundColor));
    return (
      (Math.max(foreground, background) + 0.05) /
      (Math.min(foreground, background) + 0.05)
    );
  });
}

async function expectMinimumTargetSize(locator: Locator, minimum = 44) {
  const boxes = await locator.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }),
  );
  expect(boxes.length).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(minimum);
    expect(box.height).toBeGreaterThanOrEqual(minimum);
  }
}

test('catalogue, subsection and direct hash routes work under the Pages base', async ({
  page,
}) => {
  await page.goto('./');
  await waitForFonts(page);
  await expect(
    page.getByRole('heading', {
      name: 'Learn computer science by changing things.',
    }),
  ).toBeVisible();
  await expect(page.locator('.topic-card')).toHaveCount(10);

  const heroCta = page.getByRole('link', {
    name: 'Open Pixel Bead Simulator',
  });
  await expect(heroCta).toBeVisible();
  expect(await contrastRatio(heroCta)).toBeGreaterThanOrEqual(4.5);

  await page
    .getByRole('link', { name: /Explore topic 1: Data representation/ })
    .click();
  await expect(page).toHaveURL(new RegExp(`${sectionHash}$`));
  await expect(
    page.getByRole('heading', { name: 'Text, sound and images' }),
  ).toBeVisible();
  await expect(page.getByText('White frame excluded')).toHaveCount(0);

  await page.getByRole('link', { name: /Open Pixel Bead Simulator/ }).click();
  await expect(page).toHaveURL(new RegExp(`${simulatorHash}$`));
  await expect(
    page.getByRole('application', {
      name: /32 by 32 interactive bead image/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('White frame excluded from colour analysis'),
  ).toBeVisible();
});

test('button and link-button typography, height and explicit colours are stable', async ({
  page,
}) => {
  await openSimulator(page);
  const linkButton = page.getByRole('link', {
    name: '1.2 Text, sound and images',
  });
  const nativeButton = page.getByRole('button', { name: 'Fullscreen' });
  const [linkStyle, buttonStyle] = await Promise.all([
    linkButton.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        fontSize: style.fontSize,
        height: element.getBoundingClientRect().height,
        color: style.color,
      };
    }),
    nativeButton.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        fontSize: style.fontSize,
        height: element.getBoundingClientRect().height,
        color: style.color,
      };
    }),
  ]);
  expect(linkStyle.fontSize).toBe(buttonStyle.fontSize);
  expect(linkStyle.height).toBe(buttonStyle.height);
  expect(linkStyle.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(buttonStyle.color).not.toBe('rgba(0, 0, 0, 0)');
});

test('dark system preference still renders the deliberate light theme', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await openSimulator(page);
  const theme = await page.evaluate(() => ({
    scheme: getComputedStyle(document.documentElement).colorScheme,
    body: getComputedStyle(document.body).backgroundColor,
    rail: getComputedStyle(document.querySelector('.lab-rail')!)
      .backgroundColor,
  }));
  expect(theme.scheme).toBe('light');
  expect(theme.body).toBe('rgb(242, 241, 234)');
  expect(theme.rail).toBe('rgb(255, 255, 255)');
});

test('default metrics, resolution presets and guided colour-depth lesson stay accurate', async ({
  page,
}) => {
  await openSimulator(page);
  const metrics = page.locator('.metrics-strip');
  await expect(metrics).toContainText('32 × 32');
  await expect(metrics).toContainText('1,024');
  await expect(metrics).toContainText('4 bpp');
  await expect(metrics).toContainText('512 bytes');

  await page.getByRole('button', { name: '8', exact: true }).click();
  await expect(
    page.getByRole('application', { name: /8 by 8 interactive bead image/i }),
  ).toBeVisible();
  await expect(metrics).toContainText('64');

  await page.getByRole('button', { name: '64', exact: true }).click();
  await expect(
    page.getByRole('application', { name: /64 by 64 interactive bead image/i }),
  ).toBeVisible();
  await expect(metrics).toContainText('4,096');

  await page.getByRole('button', { name: 'Guided' }).click();
  await page.getByRole('tab', { name: 'Colour depth' }).click();
  const boardBefore = await page
    .getByRole('application', { name: /interactive bead image/i })
    .boundingBox();
  await page.getByRole('button', { name: 'B · 8 bpp · 256 colours' }).click();
  await expect(metrics).toContainText('8 bpp');
  await expect(metrics).toContainText('256');
  const boardAfter = await page
    .getByRole('application', { name: /interactive bead image/i })
    .boundingBox();
  expect(boardBefore?.y).toBe(boardAfter?.y);

  await page.getByRole('button', { name: 'Explore' }).click();
  await page.getByRole('button', { name: 'Paint' }).click();
  await expect(page.getByRole('radio')).toHaveCount(256);

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(
    page.getByRole('application', {
      name: /32 by 32 interactive bead image/i,
    }),
  ).toBeVisible();
  await expect(metrics).toContainText('4 bpp');
});

test('width and height can be adjusted independently and relinked', async ({
  page,
}) => {
  await openSimulator(page);
  const metrics = page.locator('.metrics-strip');
  await page.getByRole('button', { name: 'Linked', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Independent', exact: true }),
  ).toBeVisible();
  const heightSlider = page.getByRole('slider', {
    name: 'Image height in pixels',
  });
  await heightSlider.press('End');
  await expect(metrics).toContainText('32 × 64');
  await expect(metrics).toContainText('2,048');

  await page.getByRole('button', { name: 'Independent', exact: true }).click();
  await expect(metrics).toContainText('32 × 32');
});

test('every 1–8 bpp setting exposes its full selectable palette', async ({
  page,
}) => {
  await openSimulator(page);
  await page.getByRole('button', { name: 'Paint' }).click();
  const colourDepth = page.getByRole('slider', {
    name: 'Colour depth in bits per pixel',
  });
  await colourDepth.press('Home');
  for (let bits = 1; bits <= 8; bits += 1) {
    await expect(page.getByRole('radio')).toHaveCount(2 ** bits);
    await expect(page.locator('.metrics-strip')).toContainText(`${bits} bpp`);
    if (bits < 8) await colourDepth.press('ArrowRight');
  }
  const palette = page.locator('.palette-grid');
  expect(
    await palette.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true);
  const firstSwatch = page.getByRole('radio').first();
  await firstSwatch.focus();
  await firstSwatch.press('ArrowDown');
  await expect(firstSwatch).not.toBeFocused();

  const swatch200 = page.getByRole('radio').nth(200);
  await swatch200.click();
  await expect(swatch200).toHaveAttribute('aria-checked', 'true');
  await expect(
    page.locator('.current-colour-readout').getByText('200', { exact: true }),
  ).toBeVisible();
});

test('inspect, paint, one-step undo, redo, restore and dirty reset work', async ({
  page,
}) => {
  const canvas = await openSimulator(page);
  await canvas.click({ position: { x: 20, y: 20 } });
  await expect(page.locator('.pixel-inspector')).toContainText(
    'One bead = one pixel.',
  );
  await expect(page.locator('.pixel-inspector')).toContainText('4-bit code');

  await page.getByRole('button', { name: 'Paint' }).click();
  await page.getByRole('radio').nth(1).click();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no visible bounds.');
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 20, box.y + box.height - 20, {
    steps: 8,
  });
  await page.mouse.up();

  const undo = page.getByRole('button', { name: 'Undo' });
  const redo = page.getByRole('button', { name: 'Redo' });
  const restore = page.getByRole('button', { name: 'Restore image' });
  await expect(undo).toBeEnabled();
  await expect(restore).toBeEnabled();
  await undo.click();
  await expect(undo).toBeDisabled();
  await expect(redo).toBeEnabled();
  await redo.click();
  await expect(redo).toBeDisabled();

  await page.getByRole('button', { name: 'Reset demo' }).click();
  const confirmation = page.getByRole('dialog', {
    name: 'Reset the whole demo?',
  });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Keep editing' }).click();
  await expect(confirmation).toBeHidden();
  await expect(restore).toBeEnabled();

  await restore.click();
  await expect(restore).toBeDisabled();

  await page.getByRole('radio').first().click();
  await canvas.click({ position: { x: 30, y: 30 } });
  await page.getByRole('radio').nth(1).click();
  await canvas.click({ position: { x: 30, y: 30 } });
  await expect(undo).toBeEnabled();
  await expect(restore).toBeEnabled();
  await page.getByRole('button', { name: '48', exact: true }).click();
  await expect(
    page.getByRole('application', { name: /48 by 48 interactive bead image/i }),
  ).toBeVisible();
  await expect(undo).toBeDisabled();
  await expect(restore).toBeDisabled();
});

test('keyboard navigation and palette roving focus follow the visible grid', async ({
  page,
}) => {
  const canvas = await openSimulator(page);
  await canvas.focus();
  await canvas.press('ArrowRight');
  await expect(page.locator('.pixel-inspector')).toContainText('(0, 0)');
  await canvas.press('ArrowRight');
  await expect(page.locator('.pixel-inspector')).toContainText('(1, 0)');

  const openPalette = page.getByRole('button', { name: 'Open palette' });
  await openPalette.focus();
  await openPalette.press('Enter');
  const firstSwatch = page.getByRole('radio').first();
  await expect(firstSwatch).toBeFocused();
  await firstSwatch.press('ArrowRight');
  await expect(page.getByRole('radio').nth(1)).toBeFocused();
  await expect(page.getByRole('radio').nth(1)).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

test('mobile canvas scroll behaviour, targets, settings and drawer are accessible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const canvas = await openSimulator(page);
  await expect(canvas).toHaveCSS('touch-action', 'pan-y');
  const canvasBox = await canvas.boundingBox();
  expect((canvasBox?.y ?? 0) + (canvasBox?.height ?? 0)).toBeLessThan(760);

  const dock = page.getByRole('toolbar', { name: 'Mobile lab actions' });
  await expect(dock).toBeVisible();
  await expectMinimumTargetSize(dock.locator('button'));
  await expectMinimumTargetSize(
    page.locator('.mobile-stage-switch').getByRole('button'),
  );

  const settings = dock.getByRole('button', { name: 'Open lab settings' });
  await settings.click();
  const settingsDialog = page.getByRole('dialog', { name: 'Lab settings' });
  await expect(settingsDialog).toBeVisible();
  await expectMinimumTargetSize(
    settingsDialog.getByRole('button', { name: 'Linked', exact: true }),
  );
  await expectMinimumTargetSize(
    settingsDialog.locator('.preset-row').getByRole('button'),
  );
  await expectMinimumTargetSize(
    settingsDialog.getByRole('button', { name: 'Open palette' }),
  );
  await expectMinimumTargetSize(
    settingsDialog.locator('.true-colour-note summary'),
  );

  await settingsDialog.getByRole('button', { name: 'Guided' }).click();
  await expect(settingsDialog.getByRole('tab')).toHaveCount(4);
  await settingsDialog.getByRole('tab', { name: 'Resolution' }).click();
  await expect(
    settingsDialog.getByRole('button', { name: 'A · 8 × 8' }),
  ).toBeVisible();
  await settingsDialog.getByRole('button', { name: 'B · 48 × 48' }).click();
  await expect(settingsDialog).toBeHidden();
  await expect(
    page.getByRole('application', { name: /48 by 48 interactive bead image/i }),
  ).toBeVisible();
  const guidedCanvasBox = await canvas.boundingBox();
  expect(
    (guidedCanvasBox?.y ?? 0) + (guidedCanvasBox?.height ?? 0),
  ).toBeLessThan(760);

  await settings.click();
  await expect(settingsDialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(settings).toBeFocused();

  await dock.getByRole('button', { name: 'Paint' }).click();
  await expect(canvas).toHaveCSS('touch-action', 'none');

  await page.goto('./');
  const open = page.getByRole('button', { name: 'Open syllabus navigation' });
  await open.click();
  const drawer = page.getByRole('dialog', { name: 'Syllabus navigation' });
  await expect(drawer).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Close navigation' }).last(),
  ).toBeFocused();
  await expectMinimumTargetSize(drawer.getByRole('tab'));
  await expect(drawer.locator('.topic-row--static')).toHaveCount(5);
  await page.keyboard.press('Shift+Tab');
  const visibleDrawerTargets = drawer.locator(
    'a[href]:visible, button:not([disabled]):not([tabindex="-1"]):visible, [tabindex]:not([tabindex="-1"]):visible',
  );
  await expect(visibleDrawerTargets.last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Close navigation' }).last(),
  ).toBeFocused();
  await open.evaluate((element) => (element as HTMLElement).focus());
  await expect(open).not.toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(open).toBeFocused();
});

test('mobile home exposes the primary lab action before the preview image', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await waitForFonts(page);
  const cta = page.getByRole('link', { name: 'Open Pixel Bead Simulator' });
  const preview = page.locator('.hero-lab-card__visual');
  const [ctaBox, previewBox] = await Promise.all([
    cta.boundingBox(),
    preview.boundingBox(),
  ]);
  expect(ctaBox).not.toBeNull();
  expect(previewBox).not.toBeNull();
  expect((ctaBox?.y ?? 700) + (ctaBox?.height ?? 0)).toBeLessThanOrEqual(700);
  expect(ctaBox?.y ?? 0).toBeLessThan(previewBox?.y ?? 0);
});

test('fullscreen exits without losing experiment state', async ({ page }) => {
  const canvas = await openSimulator(page);
  const colourDepth = page.getByRole('slider', {
    name: 'Colour depth in bits per pixel',
  });
  await colourDepth.press('Home');
  await colourDepth.press('ArrowRight');
  await colourDepth.press('ArrowRight');
  await expect(page.locator('.metrics-strip')).toContainText('3 bpp');

  await canvas.click({ position: { x: 24, y: 24 } });
  await page.getByRole('button', { name: 'Paint' }).click();
  await page.getByRole('radio').first().click();
  await canvas.click({ position: { x: 34, y: 34 } });
  await page.getByRole('radio').nth(1).click();
  await canvas.click({ position: { x: 34, y: 34 } });
  const undo = page.getByRole('button', { name: 'Undo' });
  await expect(undo).toBeEnabled();
  const coordinate = await page
    .locator('.inspector-values > span')
    .first()
    .locator('strong')
    .innerText();

  await page.getByRole('button', { name: 'Enter fullscreen' }).click();
  await expect
    .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
    .toBe(true);
  await page.getByRole('button', { name: 'Exit fullscreen' }).click();
  await expect
    .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
    .toBe(false);
  await expect(page.locator('.metrics-strip')).toContainText('3 bpp');
  await expect(page.getByRole('button', { name: 'Paint' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(undo).toBeEnabled();
  await expect(
    page.locator('.inspector-values > span').first().locator('strong'),
  ).toHaveText(coordinate);
});

test('mid-width simulation toolbar keeps every board action contained', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openSimulator(page);

  const toolbar = page.locator('.canvas-toolbar');
  const buttons = toolbar.getByRole('button');
  await expect(buttons).toHaveCount(4);

  const layout = await toolbar.evaluate((element) => {
    const boundary = element.getBoundingClientRect();
    const buttonRects = Array.from(element.querySelectorAll('button')).map(
      (button) => {
        const rect = button.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      },
    );
    return {
      boundary: {
        left: boundary.left,
        right: boundary.right,
        top: boundary.top,
        bottom: boundary.bottom,
      },
      buttonRects,
      hasOverflow:
        element.scrollWidth > element.clientWidth ||
        element.scrollHeight > element.clientHeight,
    };
  });

  expect(layout.hasOverflow).toBe(false);
  for (const rect of layout.buttonRects) {
    expect(rect.left).toBeGreaterThanOrEqual(layout.boundary.left);
    expect(rect.right).toBeLessThanOrEqual(layout.boundary.right);
    expect(rect.top).toBeGreaterThanOrEqual(layout.boundary.top);
    expect(rect.bottom).toBeLessThanOrEqual(layout.boundary.bottom);
  }
  for (let first = 0; first < layout.buttonRects.length; first += 1) {
    for (
      let second = first + 1;
      second < layout.buttonRects.length;
      second += 1
    ) {
      const a = layout.buttonRects[first];
      const b = layout.buttonRects[second];
      const overlapWidth =
        Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapHeight =
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      expect(overlapWidth > 0 && overlapHeight > 0).toBe(false);
    }
  }
});

test('tablet fullscreen keeps the below-stage control rail reachable', async ({
  page,
}) => {
  const viewport = { width: 768, height: 768 };
  await page.setViewportSize(viewport);
  await openSimulator(page);

  await page.getByRole('button', { name: 'Enter fullscreen' }).click();
  await expect
    .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
    .toBe(true);

  expect(
    await page
      .locator('.canvas-toolbar')
      .evaluate(
        (element) =>
          element.scrollWidth > element.clientWidth ||
          element.scrollHeight > element.clientHeight,
      ),
  ).toBe(false);

  const workspace = page.locator('.lab-layout');
  await expect(workspace).toHaveCSS('overflow-y', 'auto');
  expect(
    await workspace.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true);

  const reset = page.getByRole('button', { name: 'Reset demo' });
  await reset.scrollIntoViewIfNeeded();
  await expect(reset).toBeVisible();
  const resetBox = await reset.boundingBox();
  expect(resetBox?.y ?? -1).toBeGreaterThanOrEqual(0);
  expect((resetBox?.y ?? 0) + (resetBox?.height ?? 0)).toBeLessThanOrEqual(
    viewport.height,
  );
  expect(
    await workspace.evaluate((element) => element.scrollTop),
  ).toBeGreaterThan(0);
});

test('projector widths keep the board and core controls in view', async ({
  page,
}) => {
  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await openSimulator(page);
    const required = [
      page.getByRole('application', { name: /interactive bead image/i }),
      page.getByRole('slider', { name: 'Image width in pixels' }),
      page.getByRole('slider', { name: 'Image height in pixels' }),
      page.getByRole('slider', {
        name: 'Colour depth in bits per pixel',
      }),
      page.locator('.pixel-readout'),
    ];
    for (const element of required) {
      await expect(element).toBeVisible();
      const box = await element.boundingBox();
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
        viewport.height,
      );
    }
  }
});

test('DPR 2 touch canvas keeps a sharp backing store and coarse controls', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:4173/Gregg-s-playground/${simulatorHash}`);
  const canvas = page.getByRole('application', {
    name: /interactive bead image/i,
  });
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  const dimensions = await canvas.evaluate((element) => {
    const node = element as HTMLCanvasElement;
    const box = node.getBoundingClientRect();
    return { backingWidth: node.width, cssWidth: box.width };
  });
  expect(dimensions.backingWidth).toBeGreaterThanOrEqual(
    dimensions.cssWidth * 1.9,
  );
  await expect(canvas).toHaveCSS('touch-action', 'pan-y');
  await context.close();
});

test('200 percent text enlargement remains horizontally usable', async ({
  page,
}) => {
  await page.goto('./');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await expect(
    page.getByRole('link', { name: 'Open Pixel Bead Simulator' }),
  ).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

for (const route of ['./', `./${sectionHash}`, `./${simulatorHash}`]) {
  test(`axe finds no serious WCAG issues on ${route}`, async ({ page }) => {
    await page.goto(route);
    await waitForFonts(page);
    if (route.includes('pixel-bead-simulator')) {
      await expect(
        page.getByRole('application', { name: /interactive bead image/i }),
      ).toBeVisible({ timeout: 15_000 });
    }
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.filter(({ impact }) =>
        ['serious', 'critical'].includes(impact ?? ''),
      ),
    ).toEqual([]);
  });
}

test('image-load failure has a clear retry state', async ({ page }) => {
  await page.route('**/assets/mona-lisa-beads.png', (route) => route.abort());
  await page.goto(`./${simulatorHash}`);
  await expect(page.getByText('Reference unavailable')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});
