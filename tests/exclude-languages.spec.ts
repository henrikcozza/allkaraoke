import { expect, test } from '@playwright/test';
import { initTestMode, mockSongs } from './helpers';

test.beforeEach(async ({ page, context }) => {
    await initTestMode({ page, context });
    await mockSongs({ page, context });
});

test('exclude languages from first start and menu', async ({ page }) => {
    await page.goto('/?e2e-test');
    await page.getByTestId('advanced').click();
    await page.getByTestId('save-button').click();

    await test.step('Exclude Polish', async () => {
        await page.getByTestId('sing-a-song').click();
        await page.getByTestId('lang-Polish').click();
        await expect(page.getByTestId('lang-Polish')).toBeVisible();
        await page.getByTestId('close-exclude-languages').click();

        await expect(page.getByTestId('song-e2e-test.json')).toBeVisible();
        await expect(page.getByTestId('song-e2e-test-multitrack.json')).not.toBeVisible();
    });

    await test.step('Exclude English', async () => {
        await page.keyboard.press('Backspace'); // Main menu

        await page.getByTestId('manage-songs').click();
        await page.getByTestId('exclude-languages').click();
        await page.getByTestId('lang-Polish').click();
        await page.getByTestId('lang-English').click();
        await expect(page.getByTestId('lang-Polish')).toBeVisible();
        await page.getByTestId('close-exclude-languages').click();

        await page.getByTestId('sing-a-song').click();

        await expect(page.getByTestId('song-e2e-test-multitrack.json')).toBeVisible();
        await expect(page.getByTestId('song-e2e-test.json')).not.toBeVisible();
    });

    await test.step('Include all', async () => {
        await page.keyboard.press('Backspace'); // Main menu

        await page.getByTestId('manage-songs').click();
        await page.getByTestId('exclude-languages').click();
        await page.getByTestId('lang-English').click();
        await expect(page.getByTestId('lang-Polish')).toBeVisible();
        await page.getByTestId('close-exclude-languages').click();

        await page.getByTestId('sing-a-song').click();

        await expect(page.getByTestId('song-e2e-test.json')).toBeVisible();
        await expect(page.getByTestId('song-e2e-test-multitrack.json')).toBeVisible();
    });
});