// E2E test file for full user journey

import { test, expect } from './fixtures';

test.describe('Full User Journey', () => {
    test.beforeEach(async ({ page }) => {
        test.slow();
        test.setTimeout(120000);
        // Mock Gemini API calls to avoid cost/latency and ensure determinism
        await page.route('**/api/gemini', async route => {
            const request = route.request();
            const postData = request.postDataJSON();
            const prompt = postData?.contents || '';

            console.log('Mocking Gemini Request:', prompt.substring(0, 50) + '...');

            if (prompt.includes('Classify:')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ 
                        text: JSON.stringify({ x: 5, y: 5, quadrant: 'Ritual' }) 
                    })
                });
            } else if (prompt.includes('STARTER TOOL GENERATOR')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        text: JSON.stringify([
                            { name: 'Strategies', category: 'Structure' },
                            { name: 'Copywriting', category: 'Signal' },
                            { name: 'Logos', category: 'Aesthetic' }
                        ])
                    })
                });
            } else {
                // Default fallback — return valid tool definition shape
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        text: JSON.stringify({
                            plainName: 'Strategic Optimization',
                            functionStatement: 'Optimizes strategic outputs.',
                            promise: 'Increases efficiency.',
                            antiPitch: 'Not just consulting.'
                        })
                    })
                });
            }
        });

        // Mock DB calls — force localStorage fallback
        await page.route('**/api/db/**', async route => {
             await route.fulfill({ status: 500 });
        });
    });

    test('Complete User Journey from Calibration to Value Synthesis', async ({ page }) => {
        // 1. Load App with Test User Bypass
        await page.goto('/?test_user=true');
        
        // Clear persisted state so the test always starts fresh
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        
        // 2. Calibration Phase
        // Wait for calibration form — title varies by vernacular mode
        await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

        await page.fill('input[placeholder="e.g., ARCHITECT 01"]', 'Test Operator');
        await page.fill('input[placeholder="e.g., Enterprise Software / BioTech"]', 'E2E Testing');
        await page.locator('textarea').fill('To verify system integrity.');
        
        // Select Tone
        await page.getByRole('button', { name: /clinical/i }).click();
        
        // Submit — button text varies: "Finalize Calibration" (mythic) / "Save & Continue" (plain)
        await page.getByRole('button', { name: /Finalize|Save/i }).click();

        // 3. Intro Phase — look for the client name input
        await expect(page.locator('input[placeholder="Enter Client/Entity Name"]')).toBeVisible({ timeout: 10000 });
        await page.locator('input[placeholder="Enter Client/Entity Name"]').fill('Test Client');
        // Click start — "Initialize System" (mythic) / "Let's Go" (plain)  
        await page.getByRole('button', { name: /Initialize|Let.*Go/i }).click();

        // 4. Armory Audit Phase — look for the heading containing "1"  
        await expect(page.getByRole('heading', { name: /1/i }).first()).toBeVisible({ timeout: 10000 });
        
        // Add 3 Items (Required for Next)
        const addInput = page.locator('input[placeholder*="Edit copy"]');
        const addButton = page.getByRole('button', { name: 'Add' });

        const items = ['Coding', 'Testing', 'Deploying'];
        for (const item of items) {
            await addInput.fill(item);
            await addButton.click();
            // Wait for item to appear (uppercase in UI)
            await expect(page.getByText(item.toUpperCase())).toBeVisible();
        }

        // Click Proceed — "Proceed to Compression →" (mythic) / "Next Step →" (plain)
        const armoryProceed = page.getByRole('button', { name: /Proceed to Compression|Next Step/i });
        await expect(armoryProceed).toBeEnabled();
        await armoryProceed.click();

        // 5. Tool Compression Phase — Selection view
        // Wait for selection UI to appear (look for "Selected" counter)
        await expect(page.getByText(/Selected/i)).toBeVisible({ timeout: 10000 });

        // Select 3 Candidates (buttons contain verb + quadrant, e.g. "Coding Ritual")
        for (const item of items) {
            await page.getByRole('button', { name: new RegExp(item, 'i') }).click();
        }

        // Click Compress — "Compress into Market Function" (mythic) / "Analyze My Top Skills" (plain)
        await page.getByRole('button', { name: /Compress|Analyze/i }).click();

        // Wait for candidates to render
        await expect(page.getByText(/Candidate 01/i)).toBeVisible({ timeout: 15000 });

        // Click Proceed — "Proceed to Evidence →" (mythic) / "Next Step →" (plain)
        await page.getByRole('button', { name: /Proceed to Evidence|Next Step/i }).click();

        // 6. Evidence Scoring Phase
        // Button: "Done → Pick Your Best Skill" (plain) / "Audit Complete → Lock Tool" (mythic)
        // With all scores at default 0, the button is enabled immediately
        const scoringBtn = page.getByRole('button', { name: /Done|Audit Complete/i });
        await expect(scoringBtn).toBeVisible({ timeout: 10000 });
        await expect(scoringBtn).toBeEnabled();
        await scoringBtn.click();

        // 7. Tool Lock Phase
        // Button: "Pick This Best Skill" (plain) / "Confirm Starting Tool" (mythic)
        const lockBtn = page.getByRole('button', { name: /Pick This|Confirm/i }).first();
        await expect(lockBtn).toBeVisible({ timeout: 10000 });
        await lockBtn.click();

        // 8. Value Synthesis Phase
        await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
        
        console.log('User Journey Complete');
    });
});
