// ============================================================
// WORLD FORGE (SIMULATION CHAMBER) — E2E Test
// ============================================================
// Tests the Tier 5 practice/rehearsal engine that launches from
// the Ritual Dashboard. Verifies:
//   1. Modal launch from dashboard
//   2. Scenario + challenge render after AI call
//   3. Response submission + AI scoring
//   4. Pass/fail flow + exit dismiss
// ============================================================

import { test, expect } from './fixtures';
import { Phase } from '../types';

const SESSION_ID = 'e2e-world-forge-session';
const PROFILE = {
    id: 'prof-001',
    userId: 'test_user',
    name: 'Test Operator',
    industry: 'Enterprise Software',
    strategicGoal: 'Scale consulting practice',
    preferredTone: 'clinical' as const,
};

// ── Reusable state seed ─────────────────────────────────────
// Injects a completed dossier at RITUAL_DASHBOARD phase so the
// World Forge launch button is rendered.
function buildRitualDashboardState() {
    const toolId = 'test-tool-001';
    return {
        id: SESSION_ID,
        userId: 'test_user',
        currentPhase: Phase.RITUAL_DASHBOARD,
        armory: [
            { id: '1', verb: 'Coding', x: 5, y: 5, quadrant: 'Ritual' },
            { id: '2', verb: 'Testing', x: 3, y: 7, quadrant: 'Craft' },
        ],
        candidates: [{
            id: toolId,
            originalVerb: 'Coding',
            plainName: 'Strategic Optimization',
            functionStatement: 'Optimizes strategic outputs for enterprise clients.',
            promise: 'Increases revenue by 40%.',
            antiPitch: 'Not just another consultant.',
            isSovereign: true,
            scores: { unbiddenRequests: 3, frictionlessDoing: 4, resultEvidence: 3, extractionRisk: 1 },
            proofs: { unbidden: 'Client DM proof', result: 'Case study link' },
        }],
        selectedToolId: toolId,
        pilotPlan: '## 7-Day Pilot\n\nDay 1: Onboarding...',
        profile: PROFILE,
        theoryOfValue: {
            fatalWound: 'Fragmented operations causing revenue leakage',
            sacredCow: 'Hourly billing as default pricing model',
            molecularBond: 'Sovereign Integration — only this tool unifies all fragments',
            mvaRadar: {
                shadowBeliefs: ['I am not enough', 'Clients will leave'],
                rawLingo: ['Grind culture', 'Hustle harder'],
            },
            godfatherOffer: {
                name: 'The Sovereign Protocol',
                transformation: 'From fragmented freelancer to integrated authority',
                price: '$15,000',
            },
        },
        finalized: true,
        version: 1,
        xp: 0,
        burnCount: 0,
        chatHistory: [],
        shortTermMemory: [],
        simulationHistory: [],
        lastActiveDate: new Date().toISOString(),
    };
}

/** Inject state into localStorage using the actual keys the App reads */
async function injectState(page: any) {
    const state = buildRitualDashboardState();
    await page.evaluate(({ s, sessionId, profile }: any) => {
        // 1. Session pointer
        localStorage.setItem('tte_session_id', sessionId);
        // 2. Session data (App reads `session_${tteSessionId}`)
        localStorage.setItem(`session_${sessionId}`, JSON.stringify(s));
        // 3. Profile (prevents profile sync from forcing CALIBRATION)
        localStorage.setItem(`profile_${s.userId}`, JSON.stringify(profile));
    }, { s: state, sessionId: SESSION_ID, profile: PROFILE });
}

test.describe('World Forge (Tier 5)', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(60000);

        // ── Mock Gemini proxy route ──────────────────────────
        await page.route('**/api/gemini', async route => {
            const postData = route.request().postDataJSON();
            let prompt = '';
            if (typeof postData?.contents === 'string') {
                prompt = postData.contents;
            } else {
                prompt = postData?.contents?.[0]?.parts?.[0]?.text || '';
            }

            console.log('Mocking Gemini PROXY:', prompt.substring(0, 60) + '...');

            // Challenge generation
            if (prompt.includes('Generate ONE')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        text: 'Why should a client pay you $15,000 when they can hire three freelancers for the same price?',
                    }),
                });
            }
            // Response scoring
            else if (prompt.includes('Specificity') || prompt.includes('Transfer')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        text: JSON.stringify({
                            specificity: 4,
                            transfer: 4,
                            feedback: 'Strong tactical framing with concrete differentiation.',
                        }),
                    }),
                });
            }
            // Default fallback
            else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ text: JSON.stringify({ plainName: 'Fallback' }) }),
                });
            }
        });

        // ── Mock Gemini SDK direct calls (when VITE_GEMINI_API_KEY is set) ──
        // The Google AI SDK calls generativelanguage.googleapis.com directly,
        // bypassing our /api/gemini proxy entirely.
        await page.route('**/generativelanguage.googleapis.com/**', async route => {
            const postData = route.request().postDataJSON?.() || {};
            let prompt = '';
            try {
                prompt = postData?.contents?.[0]?.parts?.[0]?.text || '';
            } catch { /* */ }

            console.log('Mocking Gemini SDK:', prompt.substring(0, 60) + '...');

            // Challenge generation
            if (prompt.includes('Generate ONE')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        candidates: [{
                            content: {
                                parts: [{ text: 'Why should a client pay you $15,000 when they can hire three freelancers for the same price?' }],
                                role: 'model',
                            },
                        }],
                    }),
                });
            }
            // Response scoring
            else if (prompt.includes('Specificity') || prompt.includes('Transfer')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        candidates: [{
                            content: {
                                parts: [{ text: JSON.stringify({
                                    specificity: 4,
                                    transfer: 4,
                                    feedback: 'Strong tactical framing with concrete differentiation.',
                                }) }],
                                role: 'model',
                            },
                        }],
                    }),
                });
            }
            // Default fallback
            else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        candidates: [{
                            content: {
                                parts: [{ text: JSON.stringify({ plainName: 'Fallback' }) }],
                                role: 'model',
                            },
                        }],
                    }),
                });
            }
        });

        // ── Mock DB (return profile to prevent CALIBRATION redirect) ────
        await page.route('**/api/db/profile', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: PROFILE }),
            });
        });
        await page.route('**/api/db/**', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify([]) });
        });
    });

    test('World Forge — launch, respond, and pass simulation', async ({ page }) => {

        // 1. Navigate + inject state at Ritual Dashboard phase
        await page.goto('/?test_user=true');
        await page.waitForLoadState('networkidle');

        // Inject session state + profile into localStorage
        await injectState(page);

        // Reload to pick up injected state
        await page.reload();
        await page.waitForLoadState('networkidle');

        // 2. Verify we're on the Ritual Dashboard
        await expect(page.getByText('Strategic Optimization')).toBeVisible({ timeout: 15000 });

        // Dismiss any overlay modals (PhaseScaffold, RankCeremony)
        for (const pattern of [
            /Acknowledged|Begin|Got it|Ready/i,    // PhaseScaffold
            /ACKNOWLEDGE|PROCEED|CONTINUE/i,        // RankCeremony
        ]) {
            try {
                const btn = page.getByRole('button', { name: pattern });
                await btn.waitFor({ state: 'visible', timeout: 3000 });
                await btn.click();
                await expect(btn).not.toBeVisible({ timeout: 3000 });
            } catch { /* overlay not present */ }
        }

        // 3. Click World Forge launch button
        // v.simulation_start_btn: 'Start Practice' (plain), 'START SIMULATION' (industrial), 'ENGAGE SIMULATION' (mythic)
        const forgeButton = page.getByText(/Start Practice|START SIMULATION|ENGAGE SIMULATION/i);
        await expect(forgeButton).toBeVisible({ timeout: 5000 });
        await forgeButton.click();

        // 4. Verify Simulation Chamber modal opens (header has ⧫ prefix)
        await expect(page.getByText(/⧫ Practice Round|⧫ PRACTICE SIMULATION|⧫ COMBAT SIMULATION/i)).toBeVisible({ timeout: 10000 });

        // 5. Wait for scenario + challenge to render (AI call resolves)
        await expect(page.getByText(/Situation|ADVERSARY ARCHETYPE|SCENARIO ARCHETYPE|Scenario/i)).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Challenge')).toBeVisible({ timeout: 10000 });
        // Verify the mocked challenge text appeared (use specific text to avoid strict mode collision with offer price)
        await expect(page.getByText(/Why should a client pay you/)).toBeVisible({ timeout: 5000 });

        // 6. Type a response in the textarea (must be ≥10 chars to enable Submit)
        const responseField = page.locator('textarea');
        await responseField.fill('Because I deliver integrated strategic optimization that three freelancers cannot coordinate. My sovereign authority produces 40% revenue lift within 90 days.');

        // 7. Click Submit
        const submitBtn = page.getByRole('button', { name: /Submit/i });
        await expect(submitBtn).toBeEnabled();
        await submitBtn.click();

        // 8. Verify scoring results render
        // The mock returns specificity: 4, transfer: 4 → both ≥ 3 = PASS
        await expect(page.getByText('Tactical:')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('4/5').first()).toBeVisible();
        // Verify feedback text
        await expect(page.getByText(/Strong tactical framing/i)).toBeVisible();

        // 9. Verify pass button (v.simulation_pass_msg across modes + fallback)
        const completeBtn = page.getByRole('button', { name: /You Did It|PASSED|VICTORY|Simulation Complete/i });
        await expect(completeBtn).toBeVisible({ timeout: 5000 });

        // 10. Click to dismiss
        await completeBtn.click();

        // Modal should close — verify we're back on the dashboard
        await expect(page.getByText('Strategic Optimization')).toBeVisible({ timeout: 5000 });
        console.log('World Forge — Pass Flow Complete ✓');
    });

    test('World Forge — exit dismisses modal', async ({ page }) => {
        // 1. Navigate + inject state
        await page.goto('/?test_user=true');
        await page.waitForLoadState('networkidle');
        await injectState(page);
        await page.reload();
        await page.waitForLoadState('networkidle');

        // 2. Wait for dashboard + launch forge
        await expect(page.getByText('Strategic Optimization')).toBeVisible({ timeout: 15000 });

        // Dismiss any overlay modals
        for (const pattern of [
            /Acknowledged|Begin|Got it|Ready/i,
            /ACKNOWLEDGE|PROCEED|CONTINUE/i,
        ]) {
            try {
                const btn = page.getByRole('button', { name: pattern });
                await btn.waitFor({ state: 'visible', timeout: 3000 });
                await btn.click();
                await expect(btn).not.toBeVisible({ timeout: 3000 });
            } catch { /* overlay not present */ }
        }
        const forgeButton = page.getByText(/Start Practice|START SIMULATION|ENGAGE SIMULATION/i);
        await forgeButton.click();

        // 3. Wait for modal (header has ⧫ prefix)
        await expect(page.getByText(/⧫ Practice Round|⧫ PRACTICE SIMULATION|⧫ COMBAT SIMULATION/i)).toBeVisible({ timeout: 10000 });

        // 4. Click Exit
        // v.simulation_exit: 'Exit' (plain/industrial), 'Disengage' (mythic)
        const exitBtn = page.getByRole('button', { name: /Exit|Disengage/i });
        await expect(exitBtn).toBeVisible();
        await exitBtn.click();

        // 5. Modal should be dismissed — back on dashboard
        await expect(page.getByText('Strategic Optimization')).toBeVisible({ timeout: 5000 });
        // Simulation modal header should be gone
        await expect(page.getByText(/⧫ Practice Round|⧫ PRACTICE SIMULATION|⧫ COMBAT SIMULATION/i)).not.toBeVisible();
        console.log('World Forge — Exit Flow Complete ✓');
    });
});
