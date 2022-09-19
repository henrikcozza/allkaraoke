import { expect, test } from '@playwright/test';
import { initTestMode, mockSongs } from './helpers';

test.beforeEach(async ({ page }) => {
    await initTestMode(page);
    await mockSongs(page);
});

test('Basic sing a song', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-test="sing-a-song"]').click({ force: true });

    await expect(page.locator('[data-test="song-e2e-test.json"]')).toBeVisible();

    await page.keyboard.press('Enter'); // enter first song
    await expect(page.locator('[data-test="play-song-button"]')).toBeVisible();
    await page.keyboard.press('Backspace'); // escape
    await expect(page.locator('[data-test="play-song-button"]')).not.toBeVisible();
    await page.keyboard.press('ArrowRight'); // next song
    await page.keyboard.press('Enter'); // focus
    await expect(page.locator('[data-test="play-song-button"]')).toBeVisible();
    await page.keyboard.press('ArrowUp'); // player 2 track
    await page.keyboard.press('Enter'); // change to track 1
    await expect(page.locator('[data-test="player-2-track-setting"]')).toHaveAttribute('data-test-value', '1');
    await page.keyboard.press('ArrowUp'); // player 1 track
    await page.keyboard.press('Enter'); // change to track 2
    await expect(page.locator('[data-test="player-1-track-setting"]')).toHaveAttribute('data-test-value', '2');
    await page.keyboard.press('ArrowUp'); // game mode
    await page.keyboard.press('Enter'); // change to pass the mic
    await expect(page.locator('[data-test="game-mode-setting"]')).toHaveAttribute('data-test-value', 'Pass The Mic');
    await page.keyboard.press('ArrowUp'); // difficulty
    await page.keyboard.press('Enter'); // change to hard
    await expect(page.locator('[data-test="difficulty-setting"]')).toHaveAttribute('data-test-value', 'Hard');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    // await page.waitForTimeout(1000);
    await page.keyboard.press('Enter'); // start song

    await page.locator('[data-test="play-next-song-button"]').click({ timeout: 30_000, force: true });
    await expect(page.locator('[data-test="song-e2e-test.json"]')).toBeVisible();
});

test('Filters', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-test="sing-a-song"]').click({ force: true });

    await expect(page.locator('[data-test="song-e2e-test.json"]')).toBeVisible();
    await page.keyboard.type('f'); // Show filters
    await expect(page.locator('[data-test="song-list-filters"]')).toBeVisible();

    await page.keyboard.press('Enter'); // focus search song
    await page.keyboard.type('multitrack');
    await expect(page.locator('[data-test="song-e2e-test-multitrack.json"]')).toBeVisible();
    await expect(page.locator('[data-test="song-e2e-test.json"]')).not.toBeVisible();
    for (let i = 0; i < 10; i++) await page.keyboard.press('Backspace');
    await page.keyboard.press('Enter');

    await page.keyboard.press('ArrowRight'); // language filters
    await page.keyboard.press('Enter'); // english
    await expect(page.locator('[data-test="song-e2e-test-multitrack.json"]')).not.toBeVisible();
    await expect(page.locator('[data-test="song-e2e-test.json"]')).toBeVisible();
    await page.keyboard.press('Enter'); // polish
    await expect(page.locator('[data-test="song-e2e-test-multitrack.json"]')).toBeVisible();
    await expect(page.locator('[data-test="song-e2e-test.json"]')).not.toBeVisible();
    await page.keyboard.press('Enter'); // All

    await page.keyboard.press('ArrowRight'); // duet filters
    await page.keyboard.press('Enter'); // Duet
    await expect(page.locator('[data-test="song-e2e-test-multitrack.json"]')).toBeVisible();
    await expect(page.locator('[data-test="song-e2e-test.json"]')).not.toBeVisible();
    await page.keyboard.press('Enter'); // Solo
    await expect(page.locator('[data-test="song-e2e-test-multitrack.json"]')).not.toBeVisible();
    await expect(page.locator('[data-test="song-e2e-test.json"]')).toBeVisible();
    await page.keyboard.press('Enter'); // All
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-test="song-e2e-test-multitrack.json"]')).toBeVisible();
    await expect(page.locator('[data-test="song-e2e-test.json"]')).toBeVisible();
    // Quick search
    await page.keyboard.type('multitrack');
    await page.keyboard.press('Enter'); // All
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-test="song-e2e-test-multitrack.json"]')).toBeVisible();
    await expect(page.locator('[data-test="song-e2e-test.json"]')).not.toBeVisible();
    await expect(page.locator('[data-test="song-preview"]')).toHaveAttribute('data-song', 'e2e-test-multitrack.json');
});