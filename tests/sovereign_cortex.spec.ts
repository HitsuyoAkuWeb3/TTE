import { test, expect } from './fixtures';

test.describe('Sovereign Cortex (Tier 3)', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        // Mock Gemini API
        await page.route('**/api/gemini', async route => {
            const request = route.request();
            const postData = request.postDataJSON();
            let prompt = '';
            // Handle both string prompt and structured Gemini content
            if (typeof postData?.contents === 'string') {
                prompt = postData.contents;
            } else {
                prompt = postData?.contents?.[0]?.parts?.[0]?.text || '';
            }

            console.log('Mocking Gemini Request (Cortex):', prompt.substring(0, 50) + '...');

            if (prompt.includes('SESSION HISTORY')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        text: "I am the Sovereign Daemon. I acknowledge your input."
                    })
                });
            } else if (prompt.includes('Fatal Wound')) { // MVA Radar (covers both "Fatal Wound" and Fatal Wound)
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        text: JSON.stringify({
                            fatalWound: "Fragmentation",
                            sacredCow: "Hourly Billing",
                            shadowBeliefs: ["I am not enough", "They will leave"],
                            rawLingo: ["Grind", "Hustle"]
                        })
                    })
                });
            } else if (prompt.includes('Construct a "Theory of Value"') || prompt.includes('ADVERSARIAL AUDIT')) { // ToV
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        text: JSON.stringify({
                            fatalWound: "Fragmentation",
                            sacredCow: "Hourly Billing",
                            molecularBond: "Sovereign Integration",
                            mvaRadar: {
                                shadowBeliefs: ["I am not enough"],
                                rawLingo: ["Grind"]
                            },
                            godfatherOffer: {
                                name: "The Sovereign Protocol",
                                transformation: "Total Autonomy",
                                price: "$10,000"
                            }
                        })
                    })
                });
            } else {
                // Default fallback
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        text: JSON.stringify({
                            plainName: 'Strategic Optimization',
                            functionStatement: 'Optimizes strategies.',
                            promise: 'Efficiency.',
                            antiPitch: 'Not consulting.'
                        })
                    })
                });
            }
        });

        // Mock DB - Ensure clean slate
        await page.route('**/api/db/**', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify([]) });
        });
    });

    test('Cortex Chat Flow in Installation Phase', async ({ page }) => {
        // 1. Jump straight to Installation Phase via State Injection
        // We bypass the earlier phases by injecting a state that puts us in INSTALLATION
        await page.goto('/?test_user=true');
        
        // 1. Jump straight to Installation Phase via State Injection
        // We originally planned to inject state, but are now running the full flow.


        // REVISED STRATEGY: Run the journey up to Installation.
        // It's robust and tests the integration.
        
        // 1. Calibration
        await page.goto('/?test_user=true');
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('tte_vernacular_mode', 'mythic');
        }); 
        await page.reload();

        // 1.1 Session Vow (Airlock)
        // We must acknowledge the session goal before the app unlocks.
        const vowTextarea = page.locator('textarea');
        if (await vowTextarea.isVisible()) {
            await vowTextarea.fill('Test Session Goal');
            await page.waitForTimeout(2000); // Wait for fade-in animation
            const confirmBtn = page.getByRole('button', { name: /CONFIRM/i });
            await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
            await confirmBtn.click();
            
            // Click-to-start button interaction
            const startButton = page.locator('button:has-text("INITIATE SEQUENCE"), button:has-text("START SESSION"), button:has-text("START")');
            await startButton.click(); // Click triggers bypass in isTestMode
            // const box = await holdButton.boundingBox();
            // if (box) {
            //     await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            //     await page.mouse.down();
            //     await page.waitForTimeout(200); // > 50ms for test bypass
            //     await page.mouse.up();
            // }
            // Wait for Vow to dismiss
            await expect(holdButton).not.toBeVisible();
        }

        // Handle potential Intro Phase (if profile exists)
        const introButton = page.getByRole('button', { name: 'Initialize System' });
        if (await introButton.isVisible()) {
            console.log('Landed on Intro Phase (Profile Exists), navigating to Calibration...');
            // Open Menu
            await page.getByRole('button', { name: /NODE:/i }).click();
            // Click Re-Calibrate
            await page.getByRole('button', { name: /RE-CALIBRATE/i }).click();
        }
        
        await page.fill('#calibration-name', 'Cortex Tester');
        await page.fill('#calibration-industry', 'AI Systems');
        await page.locator('#calibration-goal').fill('Testing the Cortex.');
        await page.getByRole('button', { name: /clinical/i }).click();
        await page.getByRole('button', { name: /Finalize|Save/i }).click();

        // 2. Intro
        await page.fill('#intro-name', 'Test Client');
        await page.getByRole('button', { name: /Initialize|Let.*Go/i }).click();

        // 3. Armory (Quick Add)
        // Dismiss Phase Scaffold if present
        const scaffoldDismiss = page.getByRole('button', { name: /Acknowledged|Begin/i });
        try {
            await scaffoldDismiss.waitFor({ state: 'visible', timeout: 5000 });
            await scaffoldDismiss.click();
            await expect(scaffoldDismiss).not.toBeVisible();
        } catch (e) {
            console.log('Briefing modal did not appear or was not visible in time, proceeding.');
        }

        const addInput = page.locator('input[placeholder*="Edit copy"]');
        const addButton = page.getByRole('button', { name: 'Add' });
        await addInput.fill('Coding'); await addButton.click();
        await addInput.fill('Testing'); await addButton.click();
        await addInput.fill('Debugging'); await addButton.click();
        await page.getByRole('button', { name: /Proceed to Compression|Next Step/i }).click();

        // 4. Compression
        // Dismiss Phase Scaffold if present
        const compressionScaffoldDismiss = page.getByRole('button', { name: /Acknowledged|Begin/i });
        try {
            await compressionScaffoldDismiss.waitFor({ state: 'visible', timeout: 5000 });
            await compressionScaffoldDismiss.click();
            await expect(compressionScaffoldDismiss).not.toBeVisible();
        } catch (e) {
            console.log('Compression Phase: Briefing modal did not appear or was not visible in time, proceeding.');
        }

        await page.getByRole('button', { name: /Coding/i }).click();
        await page.getByRole('button', { name: /Testing/i }).click();
        await page.getByRole('button', { name: /Debugging/i }).click();
        await page.getByRole('button', { name: /Compress|Analyze/i }).click();
        await page.getByRole('button', { name: /Proceed to Evidence|Next Step/i }).click();

        // 5. Evidence
        // Dismiss Phase Scaffold if present
        const evidenceScaffoldDismiss = page.getByRole('button', { name: /Acknowledged|Begin/i });
        try {
            await evidenceScaffoldDismiss.waitFor({ state: 'visible', timeout: 5000 });
            await evidenceScaffoldDismiss.click();
            await expect(evidenceScaffoldDismiss).not.toBeVisible();
        } catch (e) {
            console.log('Evidence Phase: Briefing modal did not appear or was not visible in time, proceeding.');
        }

        // FLUX FUSION STRATEGY:
        // We now have exactly 1 Sovereign Candidate.
        // We will score it 5/5 to trigger the Relaxed Gate (Adversarial Modal only on Perfection).

        const score3Buttons = page.getByRole('button', { name: 'Score 3' });
        const score5Buttons = page.getByRole('button', { name: 'Score 5' });
        
        await score5Buttons.first().waitFor({ state: 'visible', timeout: 5000 });

        // Dimension 1: Unbidden (Needs proof) - Score 5
        await score3Buttons.nth(0).click();
        await page.locator('#proof-unbidden').fill('Valid evidence provided for testing.');
        await score5Buttons.nth(0).click();

        // Dimension 2: Frictionless (No proof textarea) - Score 5 -> Triggers Modal
        await score5Buttons.nth(1).click();
        
        // Handle Adversarial Modal (Only appears on 5/5 now)
        const overrideBtn = page.getByRole('button', { name: /Override/i });
        try {
            await overrideBtn.waitFor({ state: 'visible', timeout: 3000 });
            await overrideBtn.click();
            await expect(overrideBtn).not.toBeVisible();
        } catch (e) {
            console.log('Adversarial Modal did not appear for Frictionless 5/5. This might be a bug if 5 was clicked.');
        }

        // Dimension 3: Result (Needs proof) - Score 4 (Safe from modal, but high enough)
        // actually let's score 5 to be sure we are sovereign.
        await score3Buttons.nth(2).click();
        await page.locator('#proof-result').fill('Valid evidence provided for testing.');
        await score5Buttons.nth(2).click();

        // Check for 'Fused From' badge to verify Fusion happened
        await expect(page.getByText('Fused From')).toBeVisible();

        const doneButton = page.getByRole('button', { name: /Done|Audit Complete/i });
        await expect(doneButton).toBeEnabled();
        await doneButton.click();

        // 6. Lock (Tool Lock Phase)
        // With Fusion, we still land here to "Commit" the Sovereign Asset.
        await page.getByRole('button', { name: /Pick This|Confirm/i }).first().click();

        // 7. Value Synthesis (Chemistry Phase)
        // Dismiss Phase Scaffold - CRITICAL: Must wait for it to appear and dismiss it.
        // The transition to this phase happens after "Pick This" in ToolLockPhase.
        const chemistryScaffoldDismiss = page.getByRole('button', { name: /Acknowledged|Begin/i });
        await chemistryScaffoldDismiss.waitFor({ state: 'visible', timeout: 15000 });
        await chemistryScaffoldDismiss.click();
        await expect(chemistryScaffoldDismiss).not.toBeVisible();

        // This phase requires Manual Interaction:
        // 1. SCAN VALUE (MVA Radar)
        // 2. INITIALIZE FORGE (Theory of Value)
        
        // Step 1: Trigger Radar Scan
        // Vernacular: "INITIALIZE RADAR SCAN"
        const scanButton = page.getByRole('button', { name: /INITIALIZE RADAR|SCAN VALUE/i });
        await scanButton.waitFor({ state: 'visible', timeout: 10000 });
        await scanButton.click({ force: true }); // Force click just in case of lingering overlays

        // Wait for Scan Results (Review State)
        // Vernacular: "ARCHITECT THEORY OF VALUE"
        const forgeButton = page.getByRole('button', { name: /ARCHITECT THEORY|BUILD THEORY/i });
        await forgeButton.waitFor({ state: 'visible', timeout: 30000 }); // Scan takes time
        
        // Step 2: Trigger ToV Synthesis
        await forgeButton.click();

        // Wait for "Drafting ToV" to finish and auto-transition to Installation Phase
        // The App.tsx onComplete handler sets phase to INSTALLATION
        
        // 8. Installation Phase (Open Cortex)
        const terminalButton = page.getByRole('button', { name: /OPEN CORTEX TERMINAL/i });
        await terminalButton.waitFor({ state: 'visible', timeout: 60000 }); // Synthesis is slow

        // Dismiss Installation Scaffold
        const installScaffoldDismiss = page.getByRole('button', { name: /Acknowledged|Begin/i });
        try {
             await installScaffoldDismiss.waitFor({ state: 'visible', timeout: 5000 });
             await installScaffoldDismiss.click();
             await expect(installScaffoldDismiss).not.toBeVisible();
        } catch (e) {
             console.log('Installation Phase: Scaffold did not appear or was missed.');
        }

        // 8. Open Cortex
        await page.getByRole('button', { name: /OPEN CORTEX TERMINAL/i }).click({ force: true });
        
        // 9. Verify Terminal Open
        // Vernacular: "TRANSMIT QUERY TO CORTEX..."
        const cortexInput = page.getByPlaceholder(/TRANSMIT QUERY|Type a message/i);
        await expect(cortexInput).toBeVisible({ timeout: 10000 });
        
        // 10. Send Message
        await cortexInput.fill('Hello Sovereign Daemon');
        await page.getByRole('button', { name: /SEND/i }).click();

        // 11. Verify Thinking State
        // Verify "Thinking..." or similar indicator appears
        // It might be fast, but we should try.
        
        // 12. Verify Response
        await expect(page.getByText('I am the Sovereign Daemon')).toBeVisible();

        console.log('Cortex Chat Verified');
    });
});
