import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const section = '#/topics/1-data-representation/1-2-text-sound-images';
const route = `${section}/how-sound-becomes-binary`;

test('chapter entry and four stages preserve the lesson data', async ({
  page,
}) => {
  await page.goto(`./${section}`);
  await page
    .getByRole('link', {
      name: 'Open lab: Open How sound becomes binary',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'How sound becomes binary',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('.journey-time-guide')).toHaveCount(0);
  await expect(page.locator('.journey-level-guide')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(page.locator('.journey-time-guide')).toHaveCount(11);
  await expect(page.locator('.journey-level-guide')).toHaveCount(0);
  await expect(page.locator('.journey-dot')).toHaveCount(10);
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(page.locator('.journey-level-guide')).toHaveCount(16);
  await expect(page.locator('.journey-big-readout')).toHaveText('7.8 → 8');
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(page.locator('.journey-big-readout')).toHaveText('8 → 1000');
  await expect(page.locator('.journey-codes code')).toHaveText([
    '0010',
    '0011',
    '0101',
    '1000',
    '0101',
    '0010',
    '0011',
    '0100',
    '0101',
    '0011',
  ]);
  await page
    .getByRole('button', { name: 'Sample 2: 0011', exact: true })
    .click();
  await expect(page.locator('.journey-big-readout')).toHaveText('3 → 0011');
  await page.getByRole('slider', { name: 'Selected sample' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.journey-big-readout')).toHaveText('5 → 0101');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('.journey-big-readout')).toHaveText('Analogue');
});

test('auto-play can pause, completes once, and restarts', async ({ page }) => {
  await page.clock.install();
  await page.goto(`./${route}`);
  await page.getByRole('button', { name: 'Auto-play steps' }).click();
  await page.clock.fastForward(4000);
  await expect(page.getByRole('button', { name: '02 Sample' })).toHaveAttribute(
    'aria-current',
    'step',
  );
  await page.getByRole('button', { name: 'Pause demo' }).click();
  await page.clock.fastForward(8000);
  await expect(page.getByRole('button', { name: '02 Sample' })).toHaveAttribute(
    'aria-current',
    'step',
  );
  await page.getByRole('button', { name: 'Auto-play steps' }).click();
  await page.clock.fastForward(4000);
  await page.clock.fastForward(4000);
  await expect(page.getByRole('button', { name: '04 Encode' })).toHaveAttribute(
    'aria-current',
    'step',
  );
  await expect(
    page.getByRole('button', { name: 'Auto-play steps' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Auto-play steps' }).click();
  await expect(
    page.getByRole('button', { name: '01 Capture' }),
  ).toHaveAttribute('aria-current', 'step');
});

for (const width of [1366, 390]) {
  test(`accessible and contained at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1366 ? 768 : 900 });
    await page.goto(`./${route}`);
    for (const stage of [
      '01 Capture',
      '02 Sample',
      '03 Quantise',
      '04 Encode',
    ]) {
      await page.getByRole('button', { name: stage }).click();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    await page.screenshot({
      path: `test-results/sound-journey-${width}.png`,
      fullPage: true,
    });
  });
}
