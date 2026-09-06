import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
const section = '#/topics/1-data-representation/1-2-text-sound-images';
const route = `./${section}/utf16-keyboard`;

test('chapter links to keyboard and screenshot example is ready', async ({
  page,
}) => {
  await page.goto(`./${section}`);
  await page
    .getByRole('link', { name: 'Open lab: Open UTF-16 Keyboard' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'UTF-16 Keyboard', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Character preview')).toContainText('输');
  await page.getByRole('button', { name: 'Enter', exact: true }).click();
  await expect(page.getByLabel('Composed message')).toHaveValue('输');
  await expect(page.locator('.utf-size')).toContainText('16 bits');
});
test('on-screen keypad builds Chinese phrase without automatic insertion', async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole('button', { name: 'Clear code', exact: true }).click();
  for (const code of ['4F60', '597D', '4E16', '754C']) {
    for (const digit of code)
      await page
        .getByRole('button', { name: `Hex ${digit}`, exact: true })
        .click();
    await page.getByRole('button', { name: 'Enter', exact: true }).click();
  }
  await expect(page.getByLabel('Composed message')).toHaveValue('你好世界');
  await expect(page.locator('.utf-size')).toContainText('64 bits');
  await page.getByRole('button', { name: 'Space', exact: true }).click();
  await expect(page.getByLabel('Composed message')).toHaveValue('你好世界 ');
  await page.getByRole('button', { name: 'Backspace', exact: true }).click();
  await expect(page.getByLabel('Composed message')).toHaveValue('你好世界');
});
test('physical keyboard, surrogate pairs, invalid input and deletion', async ({
  page,
}) => {
  await page.goto(route);
  const code = page.getByLabel('UTF-16 code units · hexadecimal');
  await code.fill('D83D');
  await expect(
    page.getByRole('button', { name: 'Enter', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText('High surrogate:', { exact: false }),
  ).toBeVisible();
  await code.fill('D83D DE00');
  await code.press('Enter');
  await expect(page.getByLabel('Composed message')).toHaveValue('😀');
  await expect(page.locator('.utf-size')).toContainText('2 × 16 = 32 bits');
  await code.press('Backspace');
  await expect(page.getByLabel('Composed message')).toHaveValue('');
  await code.fill('DE00');
  await expect(code).toHaveAttribute('aria-invalid', 'true');
  await code.press('Enter');
  await expect(page.getByLabel('Composed message')).toHaveValue('');
  await code.fill('XYZ');
  await expect(code).toHaveAttribute('aria-invalid', 'true');
  await code.press('Escape');
  await expect(code).toHaveValue('');
});
test('table loads only a code and examples guide a phrase without overwriting text', async ({
  page,
}) => {
  await page.goto(route);
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(28);
  await page
    .getByRole('button', { name: 'Load 你 (4F60)', exact: true })
    .click();
  await expect(page.getByLabel('Composed message')).toHaveValue('');
  await page.getByRole('button', { name: 'Enter', exact: true }).click();
  await page.getByRole('button', { name: /你好世界 Hello, world/ }).click();
  await expect(page.getByLabel('Composed message')).toHaveValue('你');
  await expect(
    page.getByText('Next character: 好.', { exact: false }),
  ).toBeVisible();
  for (const code of ['597D', '4E16', '754C']) {
    await page.getByLabel('UTF-16 code units · hexadecimal').fill(code);
    await page.getByLabel('UTF-16 code units · hexadecimal').press('Enter');
  }
  await expect(
    page.getByText('Phrase complete', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Clear message' }).click();
  await expect(page.getByLabel('Composed message')).toHaveValue('');
});
test('keyboard has accessible controls and works at narrow widths', async ({
  page,
}) => {
  await page.goto(route);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole('button', { name: 'Enter', exact: true }),
  ).toBeInViewport();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  const boxes = await page
    .locator('.utf-keypad button')
    .evaluateAll((buttons) =>
      buttons.map((button) => ({
        w: button.getBoundingClientRect().width,
        h: button.getBoundingClientRect().height,
      })),
    );
  expect(boxes.every((box) => box.w >= 44 && box.h >= 44)).toBe(true);
});
