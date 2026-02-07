import { test, expect } from '@playwright/test';

test.describe('Phase 1: Authentication & Calibration', () => {
    test('1.1 Magic Link Authentication UI', async ({ page }) => {
        // Debugging listeners
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));
        page.on('requestfailed', req => console.log(`REQUEST FAILED: ${req.url()} - ${req.failure()?.errorText}`));
        page.on('dialog', async dialog => {
            console.log(`DIALOG APPEARED: ${dialog.message()}`);
            await dialog.dismiss();
        });

        // Navigate to the defined baseURL (http://localhost:3795)
        await page.goto('/');

        // Initial load often takes longer due to InstantDB auth check
        try {
            await expect(page.getByText('NEURAL_VAULT / AUTH')).toBeVisible({ timeout: 15000 });
        } catch (e) {
            console.log("TIMEOUT! Dumping page content:");
            console.log(await page.content());
            throw e;
        }
        await expect(page.getByText('Awaiting Verification Handshake')).toBeVisible();
        await expect(page.getByText('Input Identity [Email]')).toBeVisible();

        // Enter email and verify magic link delivery (UI interaction only)
        // Use a dynamic email to avoid "inactive user" errors
        const uniqueId = Date.now().toString().slice(-6);
        const testEmail = `test_operator_${uniqueId}@example.com`;

        await page.fill('input[type="email"]', testEmail);
        await page.click('button:has-text("INITIATE MAGIC LINK")');

        // Confirm UI indicates magic link sent
        // Based on code: "Verification Key Dispatched" and "CHECK [ email ]"
        // Increased timeout to 10s just in case network is slow
        await expect(page.getByText('Verification Key Dispatched')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(`CHECK [ ${testEmail} ]`)).toBeVisible();

        console.log('Test paused: Cannot retrieve magic code from email to proceed to next phases automatically.');
    });
});
