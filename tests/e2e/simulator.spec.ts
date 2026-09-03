import { expect, test, type Page } from '@playwright/test';

const simulatorHash =
  '#/topics/1-data-representation/1-2-text-sound-images/pixel-bead-simulator';

async function openSimulator(page: Page) {
  await page.goto(`./${simulatorHash}`);
  await expect(
    page.getByRole('heading', { name: 'Pixel Bead Simulator' }),
  ).toBeVisible();
  await expect(
    page.getByRole('grid', { name: /interactive bead image/i }),
  ).toBeVisible({
    timeout: 15_000,
  });
}

test('catalogue, subsection and direct hash routes work under the Pages base', async ({
  page,
}) => {
  await page.goto('./');
  await expect(
    page.getByRole('heading', {
      name: 'Learn computer science by changing things.',
    }),
  ).toBeVisible();
  await expect(page.locator('.topic-card')).toHaveCount(10);
  await page.getByRole('link', { name: 'Explore topic' }).click();
  await expect(
    page.getByRole('heading', { name: 'Text, sound and images' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Open lab' }).click();
  await expect(page).toHaveURL(new RegExp(`${simulatorHash}$`));
  await expect(
    page.getByRole('grid', { name: /32 by 32 interactive bead image/i }),
  ).toBeVisible();
});

test('default metrics, resolution presets and colour-depth lesson stay accurate', async ({
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
    page.getByRole('grid', { name: /8 by 8 interactive bead image/i }),
  ).toBeVisible();
  await expect(metrics).toContainText('64');

  await page.getByRole('button', { name: '64', exact: true }).click();
  await expect(
    page.getByRole('grid', { name: /64 by 64 interactive bead image/i }),
  ).toBeVisible();
  await expect(metrics).toContainText('4,096');

  await page.getByRole('tab', { name: /Colour depth/ }).click();
  await page.getByRole('button', { name: '8 bpp · 256 colours' }).click();
  await expect(page.locator('.palette-swatch')).toHaveCount(256);
  await expect(metrics).toContainText('8 bpp');
  await expect(metrics).toContainText('256');

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(
    page.getByRole('grid', { name: /32 by 32 interactive bead image/i }),
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
  const colourDepth = page.getByRole('slider', {
    name: 'Colour depth in bits per pixel',
  });
  await colourDepth.press('Home');
  for (let bits = 1; bits <= 8; bits += 1) {
    await expect(page.locator('.palette-swatch')).toHaveCount(2 ** bits);
    await expect(page.locator('.metrics-strip')).toContainText(`${bits} bpp`);
    if (bits < 8) await colourDepth.press('ArrowRight');
  }
});

test('inspect, paint, one-step undo, redo, restore and setting rebuild work', async ({
  page,
}) => {
  await openSimulator(page);
  const canvas = page.getByRole('grid', { name: /interactive bead image/i });
  await canvas.click({ position: { x: 20, y: 20 } });
  await expect(page.locator('.pixel-inspector')).toContainText(
    'One bead = one pixel.',
  );
  await expect(page.locator('.pixel-inspector')).toContainText(
    'Example 4-bit code',
  );

  await page.locator('.palette-swatch').nth(1).click();
  await expect(page.getByText('Paint mode is on')).toBeVisible();
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
  await restore.click();
  await expect(restore).toBeDisabled();

  await page.locator('.palette-swatch').nth(2).click();
  await canvas.click({ position: { x: 30, y: 30 } });
  await expect(undo).toBeEnabled();
  await page.getByRole('button', { name: '48', exact: true }).click();
  await expect(
    page.getByRole('grid', { name: /48 by 48 interactive bead image/i }),
  ).toBeVisible();
  await expect(undo).toBeDisabled();
  await expect(restore).toBeDisabled();
});

test('keyboard navigation and palette roving focus are usable', async ({
  page,
}) => {
  await openSimulator(page);
  const canvas = page.getByRole('grid', { name: /interactive bead image/i });
  await canvas.focus();
  await canvas.press('ArrowRight');
  await expect(page.locator('.pixel-inspector')).toContainText('(0, 0)');
  await canvas.press('ArrowRight');
  await expect(page.locator('.pixel-inspector')).toContainText('(1, 0)');

  const firstSwatch = page.locator('.palette-swatch').first();
  await firstSwatch.focus();
  await firstSwatch.press('ArrowRight');
  await expect(page.locator('.palette-swatch').nth(1)).toBeFocused();
  await expect(page.locator('.palette-swatch').nth(1)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('mobile navigation opens, traps initial focus and closes with Escape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const open = page.getByRole('button', { name: 'Open syllabus navigation' });
  await open.click();
  const drawer = page.getByRole('dialog', { name: 'Syllabus navigation' });
  await expect(drawer).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Close navigation' }).last(),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(open).toBeFocused();
});

test('image-load failure has a clear retry state', async ({ page }) => {
  await page.route('**/assets/mona-lisa-beads.png', (route) => route.abort());
  await page.goto(`./${simulatorHash}`);
  await expect(page.getByText('Reference unavailable')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});
