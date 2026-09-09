import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
const section = './#/topics/1-data-representation/1-1-number-systems';
const applications = `${section}/hexadecimal-in-action`;
const advantages = `${section}/why-hexadecimal`;

test('chapter 1.1 has two labs and correct section navigation', async ({
  page,
}) => {
  await page.goto('./');
  await page
    .getByRole('navigation', { name: 'Live data representation sections' })
    .getByRole('link', { name: /1.1/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Number systems', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.chapter-studio')).toHaveCount(2);
  await page
    .getByRole('link', { name: 'Open Hexadecimal in action', exact: true })
    .click();
  await expect(page.locator('.app-shell--lab')).toBeVisible();
  await page.getByRole('link', { name: 'Topic 1.1', exact: true }).click();
  await page
    .getByRole('link', { name: 'Open Why hexadecimal?', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Why hexadecimal?', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Open course navigation' }).click();
  await expect(page.getByRole('dialog')).toContainText('Number systems');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open course navigation' }),
  ).toBeFocused();
});

test('simulated error codes can be triggered, decoded and reset', async ({
  page,
}) => {
  await page.goto(applications);
  await page.getByRole('button', { name: 'Overheat the device' }).click();
  await expect(page.locator('.hex-error-code')).toHaveText('0xB104');
  await page.getByRole('button', { name: 'Look up the error' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Temperature limit reached' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Hex digit 1: B', exact: true })
    .click();
  await expect(page.locator('.hex-nibble')).toContainText('1011');
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.locator('.hex-error-code')).toHaveText('0x000A');
});

test('RGB editing, validation and slider keep hexadecimal and preview in sync', async ({
  page,
}) => {
  await page.goto(applications);
  await page.getByRole('button', { name: '02 HTML colour' }).click();
  for (const track of await page.locator('[data-slot="slider-track"]').all()) {
    expect((await track.boundingBox())!.height).toBeGreaterThanOrEqual(6);
  }
  await page.getByLabel('Try a hex colour').fill('#000FFF');
  await page.getByRole('button', { name: 'Apply colour' }).click();
  await expect(page.locator('.hex-colour-output strong')).toHaveText('#000FFF');
  await expect(page.locator('.hex-colour-swatch')).toHaveCSS(
    'background-color',
    'rgb(0, 15, 255)',
  );
  await page.getByRole('slider', { name: 'Red channel' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.hex-colour-output strong')).toHaveText('#010FFF');
  await page.getByLabel('Try a hex colour').fill('GGGGGG');
  await page.getByRole('button', { name: 'Apply colour' }).click();
  await expect(page.getByLabel('Try a hex colour')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(page.locator('.hex-colour-output strong')).toHaveText('#010FFF');
  await page.getByRole('button', { name: 'Use colour #FFFFFF' }).click();
  await expect(page.locator('.hex-colour-output strong')).toHaveText('#FFFFFF');
});

test('MAC bytes and IPv6 groups map to the correct binary values', async ({
  page,
}) => {
  await page.goto(applications);
  await page.getByRole('button', { name: '03 MAC address' }).click();
  await page.getByRole('button', { name: /Classroom tablet/ }).click();
  await page.getByRole('button', { name: 'MAC byte 6: B0' }).click();
  await expect(page.locator('.hex-big-equation')).toContainText('10110000');
  await expect(page.locator('.hex-binary-wrap')).toHaveText(
    /^(?:[01]{8} ){5}[01]{8}$/,
  );
  await page.getByRole('button', { name: '04 IP address' }).click();
  await expect(page.locator('.hex-ip-value')).toHaveText(
    '2001:0DB8:0000:0000:0000:0000:0000:00AF',
  );
  await page.getByRole('button', { name: 'IPv6 group 8: 00AF' }).click();
  await expect(page.locator('.hex-big-equation')).toContainText(
    '0000000010101111',
  );
  await page.getByRole('button', { name: 'Show shortened address' }).click();
  await expect(page.locator('.hex-ip-value')).toHaveText('2001:db8::af');
  await expect(page.getByText('192.0.2.10', { exact: true })).toBeVisible();
});

test('shorter displays preserve the value and small screens fit more values', async ({
  page,
}) => {
  await page.goto(advantages);
  await expect(page.locator('.hex-space-value')).toHaveText(
    '10111001111100100100110010000000',
  );
  await page.getByRole('button', { name: 'Hexadecimal', exact: true }).click();
  await expect(page.locator('.hex-space-value')).toHaveText('B9F24C80');
  await expect(page.locator('.hex-metric-pair')).toContainText('32 bits');
  await page.getByRole('button', { name: '03 Display capacity' }).click();
  await expect(page.locator('.hex-metric-pair')).toContainText('2 values');
  await page.getByRole('button', { name: 'Hexadecimal', exact: true }).click();
  await expect(page.locator('.hex-metric-pair')).toContainText('8 values');
  await page.getByLabel('Screen width').selectOption('24');
  await expect(page.locator('.hex-metric-pair')).toContainText('12 values');
  await expect(page.locator('.hex-slot-screen span')).toHaveCount(48);
});

test('debug exercise gives honest feedback and conversion preserves leading zeros', async ({
  page,
}) => {
  await page.goto(advantages);
  await page.getByRole('button', { name: '02 Read & debug' }).click();
  await page.getByRole('button', { name: /Received group 1:/ }).click();
  await expect(page.locator('.hex-feedback')).toContainText(
    'That group matches',
  );
  await page.getByRole('button', { name: /Received group 3:/ }).click();
  await expect(page.locator('.hex-feedback')).toContainText('Correct');
  await page.getByRole('button', { name: 'Next example', exact: true }).click();
  await expect(page.locator('.hex-feedback')).toHaveText(
    'Which group differs?',
  );
  await page.getByRole('button', { name: '04 Convert to binary' }).click();
  await expect(page.locator('.hex-result code').first()).toHaveText('10101111');
  await page.getByRole('button', { name: 'Show division steps' }).click();
  await expect(page.locator('.hex-division tbody tr')).toHaveCount(8);
  await page.getByLabel('Two-digit hex value').fill('0F');
  await page.getByRole('button', { name: 'Convert', exact: true }).click();
  await expect(page.locator('.hex-result code').first()).toHaveText('00001111');
  await expect(page.locator('.hex-division tbody tr')).toHaveCount(4);
  await page.getByLabel('Two-digit hex value').fill('ZZ');
  await page.getByRole('button', { name: 'Convert', exact: true }).click();
  await expect(page.getByLabel('Two-digit hex value')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.locator('.hex-space-value')).toHaveText(
    '10111001111100100100110010000000',
  );
});

for (const route of [applications, advantages]) {
  test(`all experiments are accessible and fit desktop and mobile: ${route}`, async ({
    page,
  }) => {
    await page.goto(route);
    for (let i = 0; i < 4; i++) {
      await page.locator('.hex-nav button').nth(i).click();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(1366);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (let i = 0; i < 4; i++) {
      await page.locator('.hex-nav button').nth(i).click();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(390);
      const targets = await page
        .locator('.hex-workbench button')
        .evaluateAll((nodes) =>
          nodes.map((n) => n.getBoundingClientRect().height),
        );
      expect(targets.every((height) => height >= 44)).toBe(true);
    }
  });
}

test('fullscreen preserves the experiment and the selected colour', async ({
  page,
}) => {
  await page.goto(applications);
  await page.getByRole('button', { name: '02 HTML colour' }).click();
  await page.getByRole('button', { name: 'Use colour #FF0000' }).click();
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Exit fullscreen', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Exit fullscreen', exact: true })
    .click();
  await expect(page.locator('.hex-colour-output strong')).toHaveText('#FF0000');
});

test('tablet width and enlarged text keep both labs horizontally usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  for (const route of [applications, advantages]) {
    await page.goto(route);
    for (const size of ['100%', '200%']) {
      await page.evaluate((fontSize) => {
        document.documentElement.style.fontSize = fontSize;
      }, size);
      for (let i = 0; i < 4; i++) {
        await page.locator('.hex-nav button').nth(i).click();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(1024);
      }
    }
  }
});
