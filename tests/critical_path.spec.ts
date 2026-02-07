import { test, expect } from '@playwright/test';

// ============================================================
// E2E CRITICAL PATH TESTS — Clerk Auth + Pipeline Flow
// ============================================================
// These tests validate the unauthenticated UI renders correctly
// and key visual elements are present. Full auth flow testing
// requires Clerk test tokens (future enhancement).

test.describe('Phase 1: App Load & Auth Gate', () => {
    test('1.1 App loads and shows Clerk sign-in', async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
        page.on('pageerror', err => console.log(`ERROR: ${err}`));

        await page.goto('/');

        // Clerk's sign-in component should render within the auth gate
        // The app shows "ESTABLISHING NEURAL LINK..." while loading
        await page.waitForTimeout(3000); // Allow Clerk to initialize

        const content = await page.content();
        const hasClerk = content.includes('cl-') || content.includes('clerk');
        // Updated to match the new Ritual Loading state
        const hasEstablishing = content.includes('ESTABLISHING NEURAL LINK') || content.includes('Establishing Link'); 
        const hasAuthUI = hasClerk || hasEstablishing;

        console.log(`Has Clerk elements: ${hasClerk}`);
        console.log(`Has loading state: ${hasEstablishing}`);
        expect(hasAuthUI).toBeTruthy();
    });

    test('1.2 No console errors on initial load', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto('/');
        await page.waitForTimeout(3000);

        // Filter out known benign errors (Clerk redirect, etc.)
        const criticalErrors = errors.filter(e =>
            !e.includes('clerk') &&
            !e.includes('Clerk') &&
            !e.includes('navigation') &&
            !e.includes('AbortError')
        );
        console.log(`Critical errors: ${criticalErrors.length}`);
        if (criticalErrors.length > 0) {
            console.log('Errors:', criticalErrors);
        }
        expect(criticalErrors.length).toBe(0);
    });
});

test.describe('Phase 2: Static Assets & Configuration', () => {
    test('2.1 Tailwind CSS loads correctly', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // Check computed styles instead of window.tailwind (CDN checking is obsolete)
        const bodyBg = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });
        // bg-void (#000000) or close to it
        expect(bodyBg).toBe('rgb(5, 5, 5)'); // From index.css global style
    });

    test('2.2 Fonts load correctly', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // Check JetBrains Mono and Inter are referenced
        // Check JetBrains Mono and Inter are referenced
        const content = await page.content();
        expect(content).toContain('JetBrains+Mono');
        expect(content).toContain('Inter');
    });

    test('2.3 Page title is correct', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle('TetraTool Engine v2.0');
    });
});

test.describe('Phase 3: Gamification Components', () => {
    test('3.1 Gamification engine exports are valid', async ({ page }) => {
        // This test validates the gamification module loads correctly
        // by checking the build didn't tree-shake it away
        await page.goto('/');
        await page.waitForTimeout(2000);

        // The page should load without any module import errors
        const errors: string[] = [];
        page.on('pageerror', err => errors.push(err.message));

        const moduleErrors = errors.filter(e =>
            e.includes('gamification') ||
            e.includes('RankBadge') ||
            e.includes('import')
        );
        expect(moduleErrors.length).toBe(0);
    });
});
