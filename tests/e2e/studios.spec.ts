import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const section = '#/topics/1-data-representation/1-2-text-sound-images';
const textRoute = `${section}/binary-post-office`;
const soundRoute = `${section}/sound-sampling-studio`;

test.use({
  launchOptions: {
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
    ],
  },
});
test.describe('microphone lifecycle with a virtual microphone', () => {
  test('records three seconds, releases tracks, and cancels on navigation', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const original = navigator.mediaDevices.getUserMedia.bind(
        navigator.mediaDevices,
      );
      const captured: MediaStreamTrack[] = [];
      Object.defineProperty(window, 'studioTestTracks', { value: captured });
      navigator.mediaDevices.getUserMedia = async (options) => {
        const media = await original(options);
        captured.push(...media.getTracks());
        return media;
      };
    });
    await page.goto(`./${soundRoute}`);
    await page.getByRole('button', { name: 'Record 3 seconds' }).click();
    await expect(
      page.getByText('Your microphone recording', { exact: false }),
    ).toBeVisible({ timeout: 12000 });
    expect(
      await page.evaluate(() =>
        (
          window as unknown as { studioTestTracks: MediaStreamTrack[] }
        ).studioTestTracks.every((track) => track.readyState === 'ended'),
      ),
    ).toBe(true);
    await page.getByRole('button', { name: 'Record 3 seconds' }).click();
    await expect(
      page.getByRole('button', { name: 'Cancel recording' }),
    ).toBeVisible();
    await page
      .getByLabel('Sample resolution', { exact: true })
      .selectOption('8');
    await expect(
      page.getByRole('button', { name: 'Record 3 seconds' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Record 3 seconds' }).click();
    await expect(
      page.getByRole('button', { name: 'Cancel recording' }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Topic 1.2', exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          (
            window as unknown as { studioTestTracks: MediaStreamTrack[] }
          ).studioTestTracks.every((track) => track.readyState === 'ended'),
        ),
      )
      .toBe(true);
  });
});

test('all four studios launch from the chapter registry', async ({ page }) => {
  await page.goto(`./${section}`);
  await expect(page.locator('.chapter-studio')).toHaveCount(4);
  await page
    .getByRole('link', { name: 'Open lab: Open Binary Post Office' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Binary Post Office', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.desktop-sidebar')).toHaveCount(0);
});
test('text codes, bit edits, restore and unsupported character feedback', async ({
  page,
}) => {
  await page.goto(`./${textRoute}`);
  await page.getByLabel('Message to encode').fill('A');
  await expect(page.getByLabel('Encoded binary sequence')).toContainText(
    '1000001',
  );
  await page.getByLabel('Edit bits', { exact: true }).check();
  await page.getByRole('button', { name: 'Flip bit 6', exact: true }).click();
  await expect(page.getByLabel('Decoded message')).toHaveText('C');
  await page.getByRole('button', { name: 'Restore bits' }).click();
  await expect(page.getByLabel('Decoded message')).toHaveText('A');
  await page.getByRole('button', { name: '你好😀', exact: true }).click();
  await expect(
    page.getByText('This encoding cannot represent every character.', {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByLabel('Character set / encoding').selectOption('utf-8');
  await expect(page.getByLabel('Decoded message')).toHaveText('你好😀');
  await page.getByLabel('Character set / encoding').selectOption('utf-16le');
  await page
    .getByRole('button', { name: 'Character 3: 😀', exact: true })
    .click();
  await expect(page.locator('.encoding-readout')).toContainText('3D D8 00 DE');
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.getByLabel('Message to encode')).toHaveValue('Hello!');
});
test('text limit, animation, comparison and walkthrough', async ({ page }) => {
  await page.goto(`./${textRoute}`);
  await page.getByLabel('Message to encode').fill('a'.repeat(90));
  await expect(page.getByLabel('Message to encode')).toHaveValue(
    'a'.repeat(80),
  );
  await page.getByRole('button', { name: 'Hi!', exact: true }).click();
  await page.getByLabel('Compare encodings', { exact: true }).check();
  await expect(page.locator('.encoding-comparison article')).toHaveCount(4);
  await page.getByRole('button', { name: 'Stamp one by one' }).click();
  await expect(
    page.getByLabel('Encoded binary sequence').getByRole('button'),
  ).toHaveCount(3, { timeout: 5000 });
  await page.getByRole('button', { name: 'Walkthrough', exact: true }).click();
  await expect(page.getByText('Step 1 / 4')).toBeVisible();
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(page.getByText('Step 2 / 4')).toBeVisible();
});
test('sound formulas, waveform keyboard selection and binary agree', async ({
  page,
}) => {
  await page.goto(`./${soundRoute}`);
  await expect(page.getByLabel('Sound data formula')).toContainText(
    '96,000 bits',
  );
  await page.getByLabel('Sample resolution', { exact: true }).selectOption('3');
  await expect(page.getByLabel('Sound data formula')).toContainText(
    '72,000 bits',
  );
  const scope = page.getByRole('slider', { name: /Waveform:/ });
  await scope.focus();
  await page.keyboard.press('ArrowRight');
  await expect(scope).toHaveAttribute('aria-valuenow', '2');
  const readout = page.getByLabel('Selected sample details');
  await expect(readout).toContainText('0.125 ms');
  const values = await readout.locator('strong').allTextContents();
  expect(parseInt(values[4], 2)).toBe(Number(values[3]));
  await page.getByLabel('Sample rate', { exact: true }).selectOption('48000');
  await expect(page.getByLabel('Sound data formula')).toContainText(
    '432,000 bits',
  );
  await page.getByRole('button', { name: 'Play digital', exact: true }).click();
  await expect(page.locator('.studio-status')).toContainText('Playing Digital');
  await page
    .getByLabel('Sample resolution', { exact: true })
    .selectOption('16');
  await expect(page.locator('.studio-status')).not.toContainText('Playing');
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.getByLabel('Sample rate', { exact: true })).toHaveValue(
    '8000',
  );
});
test('blind listening hides answer cues, reveals both settings and resets rounds', async ({
  page,
}) => {
  await page.goto(`./${soundRoute}`);
  await page
    .getByRole('button', { name: 'Blind listening', exact: true })
    .click();
  await expect(page.getByLabel('Sound controls')).toHaveCount(0);
  await expect(page.locator('.listening-answer')).toHaveCount(0);
  await expect(page.locator('.blind-workspace')).not.toContainText(
    /48,000|8,000|16 bits/,
  );
  await page.getByRole('button', { name: 'Play A', exact: true }).click();
  await expect(page.locator('.studio-status')).toContainText('Playing A');
  await page.getByRole('button', { name: 'Play B', exact: true }).click();
  await expect(page.locator('.studio-status')).toContainText('Playing B');
  await page.getByRole('button', { name: 'Reveal settings' }).click();
  await expect(page.locator('.listening-answer')).toHaveCount(2);
  await expect(
    page.getByRole('heading', { name: '48,000 Hz · 16 bits' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'New round' }).click();
  await expect(page.locator('.listening-answer')).toHaveCount(0);
  await expect(page.locator('.studio-status')).not.toContainText('Playing');
  await page.getByRole('button', { name: 'Same size', exact: true }).click();
  await page.getByRole('button', { name: 'Reveal settings' }).click();
  await expect(
    page.locator('.listening-answer').filter({ hasText: '24,000 bytes' }),
  ).toHaveCount(2);
});
test('microphone denial leaves built-in audio usable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: () =>
        Promise.reject(new DOMException('Denied', 'NotAllowedError')),
    });
  });
  await page.goto(`./${soundRoute}`);
  await page.getByRole('button', { name: 'Record 3 seconds' }).click();
  await expect(page.locator('.studio-status')).toContainText(
    'permission denied',
  );
  await page.getByRole('button', { name: 'Play reference' }).click();
  await expect(page.locator('.studio-status')).toContainText(
    'Playing Reference',
  );
});
test('fullscreen preserves text state and navigation returns focus', async ({
  page,
}) => {
  await page.goto(`./${textRoute}`);
  await page.getByLabel('Message to encode').fill('ABC');
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Exit fullscreen' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Exit fullscreen' }).click();
  await expect(page.getByLabel('Message to encode')).toHaveValue('ABC');
  const menu = page.getByRole('button', { name: 'Open course navigation' });
  await menu.click();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
});
for (const route of [textRoute, soundRoute]) {
  test(`studio accessible and usable at desktop and touch widths: ${route}`, async ({
    page,
  }) => {
    await page.goto(`./${route}`);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    const boxes = await page
      .locator('.studio button:visible')
      .evaluateAll((elements) =>
        elements.map((el) => el.getBoundingClientRect().height),
      );
    expect(boxes.every((height) => height >= 44)).toBe(true);
  });
}
