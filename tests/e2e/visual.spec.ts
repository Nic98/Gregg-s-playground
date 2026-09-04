import { expect, test, type Page } from '@playwright/test';

const sectionHash = '#/topics/1-data-representation/1-2-text-sound-images';
const simulatorHash = `${sectionHash}/pixel-bead-simulator`;

async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

test.use({ viewport: { width: 1366, height: 768 } });

test('catalogue visual baseline', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  await expect(page.locator('.hero-lab-card img')).toBeVisible();
  await expect(page).toHaveScreenshot('catalogue-1366x768.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.01,
  });
});

test('Topic 1.2 visual baseline', async ({ page }) => {
  await page.goto(`./${sectionHash}`);
  await ready(page);
  await expect(page.locator('.module-feature-link img')).toBeVisible();
  await expect(page).toHaveScreenshot('topic-1-2-1366x768.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.01,
  });
});

test('simulator workbench visual baseline', async ({ page }) => {
  await page.goto(`./${simulatorHash}`);
  await ready(page);
  await expect(
    page.getByRole('application', { name: /interactive bead image/i }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.lab-status')).not.toHaveClass(
    /lab-status-visible/,
    { timeout: 5_000 },
  );
  await expect(page.locator('.lab-workbench')).toHaveScreenshot(
    'simulator-workbench-1366x768.png',
    {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    },
  );
});

test('button visual states remain intentional', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  const accent = page.getByRole('link', { name: 'Open Pixel Bead Simulator' });
  await expect(accent).toHaveScreenshot('button-accent.png', {
    maxDiffPixelRatio: 0.08,
  });
  await accent.hover();
  await expect(accent).toHaveScreenshot('button-accent-hover.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.08,
  });
  await accent.focus();
  await expect(accent).toHaveScreenshot('button-accent-focus.png', {
    maxDiffPixelRatio: 0.08,
  });

  await page.goto(`./${simulatorHash}`);
  await expect(
    page.getByRole('application', { name: /interactive bead image/i }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Inspect' })).toHaveScreenshot(
    'button-primary.png',
    { maxDiffPixelRatio: 0.08 },
  );
  await expect(
    page.getByRole('button', { name: 'Fullscreen' }),
  ).toHaveScreenshot('button-outline.png', { maxDiffPixelRatio: 0.08 });
  await expect(
    page.getByRole('button', { name: 'Restore image' }),
  ).toHaveScreenshot('button-disabled.png', { maxDiffPixelRatio: 0.08 });
});
