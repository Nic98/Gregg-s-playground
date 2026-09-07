import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
const route =
  './#/topics/1-data-representation/1-2-text-sound-images/how-image-becomes-binary';

test('four stages progressively reveal resolution, colour codes and sequence', async ({
  page,
}) => {
  await page.goto(route);
  await expect(
    page.getByRole('heading', {
      name: 'How an image becomes binary',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('.image-pixel')).toHaveCount(16);
  await expect(
    page.getByRole('region', { name: 'Pixel encoding sequence' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Next stage', exact: true }).click();
  await expect(page.locator('.image-calculation')).toContainText('16 pixels');
  await page.getByLabel('Image width', { exact: true }).selectOption('6');
  await expect(page.locator('.image-calculation')).toContainText('24 pixels');
  await page.getByLabel('Image height', { exact: true }).selectOption('2');
  await expect(page.locator('.image-pixel')).toHaveCount(12);
  await page.getByRole('button', { name: 'Next stage', exact: true }).click();
  await expect(
    page.getByRole('list', { name: 'Colour code table' }).getByRole('listitem'),
  ).toHaveCount(4);
  await page
    .getByLabel('Image colour depth', { exact: true })
    .selectOption('3');
  await expect(
    page.getByRole('list', { name: 'Colour code table' }).getByRole('listitem'),
  ).toHaveCount(8);
  await page.getByRole('button', { name: 'Next stage', exact: true }).click();
  await page.getByRole('button', { name: 'Show all', exact: true }).click();
  await expect(page.locator('.image-raw-stream code')).toHaveText(/^[01]{36}$/);
  await expect(page.locator('.image-size-formula')).toContainText('36 bits');
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.locator('.image-pixel')).toHaveCount(16);
  await expect(page.getByRole('button', { name: '01 Pixels' })).toHaveAttribute(
    'aria-current',
    'step',
  );
});
test('manual scan crosses row boundaries and the same code maps back to its pixel', async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole('button', { name: '04 Sequence' }).click();
  for (let i = 0; i < 5; i++)
    await page.getByRole('button', { name: 'Next pixel', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Selected pixel', exact: true }),
  ).toContainText('row 2, column 1');
  await expect(page.locator('.image-raw-stream code')).toHaveText('0001101101');
  await page
    .getByRole('button', { name: 'Sequence pixel 2, code 01', exact: true })
    .click();
  await expect(page.locator('.image-pixel').nth(1)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Restart scan', exact: true }).click();
  await expect(
    page.getByText('0 / 16 pixels stored', { exact: false }),
  ).toBeVisible();
});
test('scan pauses, finishes, and clears after configuration changes', async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole('button', { name: '04 Sequence' }).click();
  await page.getByRole('button', { name: 'Scan pixels', exact: true }).click();
  await expect(
    page.getByText('1 / 16 pixels stored', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Pause scan', exact: true }).click();
  const count = await page.locator('.image-raw-stream code').textContent();
  await page.waitForTimeout(750);
  await expect(page.locator('.image-raw-stream code')).toHaveText(count!);
  await page.getByRole('button', { name: 'Show all', exact: true }).click();
  await page.getByRole('button', { name: '03 Colour codes' }).click();
  await page
    .getByLabel('Image colour depth', { exact: true })
    .selectOption('1');
  await page.getByRole('button', { name: '04 Sequence' }).click();
  await expect(
    page.getByText('0 / 16 pixels stored', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Scan pixels', exact: true }).click();
  await expect(
    page.getByText('16 / 16 pixels stored', { exact: false }),
  ).toBeVisible({ timeout: 12000 });
  await expect(
    page.getByRole('button', { name: 'Scan pixels', exact: true }),
  ).toBeVisible();
});
test('keyboard selection and accessibility at every stage', async ({
  page,
}) => {
  await page.goto(route);
  await page.locator('.image-pixel').first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.image-pixel').nth(4)).toBeFocused();
  for (const name of [
    '01 Pixels',
    '02 Resolution',
    '03 Colour codes',
    '04 Sequence',
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await expect(page.locator('.image-pixel-board')).toBeInViewport();
  for (const selector of ['.image-pixel-readout', '.image-size-formula']) {
    const bounds = await page.locator(selector).boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(768);
  }
  await expect(
    page.getByRole('button', { name: 'Next pixel', exact: true }),
  ).toBeInViewport();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: '02 Resolution' }).click();
  await page.getByLabel('Image width', { exact: true }).selectOption('2');
  await page.getByLabel('Image height', { exact: true }).selectOption('8');
  const box = await page.locator('.image-pixel').first().boundingBox();
  expect(Math.abs(box!.width - box!.height)).toBeLessThan(2);
});
