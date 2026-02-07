# TTE Business Rules & Edge Cases

## 1. Evidence Scoring Matrix

Each `ToolCandidate` is scored on 4 dimensions using a 0–5 scale:

| Dimension           | What It Measures | Scale Direction |
|:--------------------|:-----------------|:----------------|
| `unbiddenRequests`  | Do people ask for this WITHOUT you marketing it? | 0 = never asked → 5 = constant demand |
| `frictionlessDoing` | Can you do this effortlessly, in flow state? | 0 = laborious → 5 = second nature |
| `resultEvidence`    | Do you have PROOF of results? | 0 = no proof → 5 = forensic evidence |
| `extractionRisk`    | Can an AI or commodity competitor replicate this? | 0 = irreplaceable → 5 = easily replaced |

**CRITICAL**: `extractionRisk` scale is **inverted** — HIGH = bad. A score of 5 means the skill is easily commoditized and should be discarded.

### Evidence Submission
Users can submit URLs as proof for `unbidden` and `result` dimensions. These URLs are verified server-side by `api/verify-evidence.ts`:
1. Fetch the URL (10s timeout with `AbortSignal`)
2. Strip HTML/scripts, extract text (capped at 5,000 chars)
3. Send to Gemini Flash for claim verification
4. Return `{ verified: boolean, confidence: 0-100, reason: string }`

## 2. Verification Trust Levels

The `getVerificationLevel()` function in `types.ts` calculates a 1–3 trust level:

| Level | Label                        | Requirements |
|:------|:-----------------------------|:-------------|
| 1     | `UNVERIFIED — SELF-REPORTED` | No proofs submitted |
| 2     | `PARTIAL — EVIDENCE SUBMITTED` | At least one proof URL submitted |
| 3     | `VERIFIED — AUDIT PASSED`    | Both proofs + all scores ≥ 3 + extractionRisk ≤ 2 |

Level 3 is the gold standard. It represents a tool that is:
- In demand (unbidden ≥ 3)
- Effortless to deliver (frictionless ≥ 3)
- Proven with evidence (results ≥ 3)
- NOT easily replicated by AI (extraction ≤ 2)

## 3. TetraTool Quadrant Classification

Skills are classified into 4 quadrants based on their x/y coordinates:

| Quadrant   | Axes                              | Archetype |
|:-----------|:----------------------------------|:----------|
| `Sandbox`  | Play + Construction               | Experimentation tools |
| `Mischief` | Play + Disruption                 | Creative chaos tools |
| `Craft`    | Discipline + Construction         | Systematic building tools |
| `Ritual`   | Discipline + Disruption           | Controlled disruption tools |

The `getQuadrant(x, y)` function in `App.tsx`:
```
x >= 0, y >= 0 → Craft
x < 0, y >= 0 → Ritual
x >= 0, y < 0 → Sandbox
x < 0, y < 0 → Mischief
```

## 4. Tool Compression (80/20 Rule)

- **Hard cap**: Maximum 15 items in the armory
- **AI Merge**: `suggestMerge()` in `geminiService.ts` fuses overlapping tools into higher-value composites
- **"Deck of Sparks"**: 20 AI-generated industry-relevant suggestions are pre-populated after calibration to prevent "Blank Page Paralysis"

## 5. The Two-Pass Forge (Value Synthesis)

The Theory of Value is generated using a recursive two-pass process:

1. **Pass 1 — Structural Synthesis**: Generates a baseline Theory of Value grounded in market data
2. **Pass 2 — Devil's Advocate**: Feeds the draft back with an adversarial persona to identify generic advice and logic gaps

Output: A `TheoryOfValue` object with:
- `fatalWound` — The market's existential pain point
- `sacredCow` — The industry assumption being challenged
- `molecularBond` — The creator's unique mechanism
- `mvaRadar` — Market Voice Analysis: shadow beliefs + raw lingo
- `godfatherOffer` — Name, transformation, and price of the irresistible offer

## 6. Gamification Engine

### XP Awards
Defined in `services/gamification.ts` as `XP_AWARDS`:

| Action                 | XP    |
|:-----------------------|:------|
| `CALIBRATION_COMPLETE` | 50    |
| `ARMORY_ITEM_ADDED`    | 10    |
| `TOOL_COMPRESSED`      | 25    |
| `EVIDENCE_SCORED`      | 30    |
| `TOOL_LOCKED`          | 75    |
| `THEORY_SYNTHESIZED`   | 150   |
| `DOSSIER_FINALIZED`    | 500   |
| `RITUAL_ENTRY`         | 25    |
| `STREAK_7`             | 100   |
| `STREAK_14`            | 250   |
| `STREAK_30`            | 500   |

### Rank Progression
7 mythic ranks with XP thresholds:

| Level | Rank        | XP Threshold | Color     | Glyph |
|:------|:------------|:-------------|:----------|:------|
| 1     | Initiate    | 0            | `#71717A` | ◇     |
| 2     | Apprentice  | 500          | `#A1A1AA` | ◆     |
| 3     | Adept       | 1,500        | `#22D3EE` | ⬡     |
| 4     | Architect   | 4,000        | `#A78BFA` | ⬢     |
| 5     | Sovereign   | 10,000       | `#F59E0B` | ⟁     |
| 6     | Demigod     | 25,000       | `#EF4444` | ☉     |
| 7     | Primordial  | 100,000      | `#00FF41` | ✦     |

### Streak Calculation
`calculateStreak(dates)` counts consecutive days from today backwards. Milestones at 7, 14, and 30 days award bonus XP.

### Rank Display
`RankBadge.tsx` renders the rank glyph, name, level, and progress bar to next rank.

## 7. Input Sanitization (Armory Security)

Before any user input reaches the LLM, `services/sanitizer.ts` scans for 15 prompt injection patterns:

**Blocked patterns include:**
- `ignore previous instructions`
- `you are now a...`
- `act as if...`
- `pretend to be...`
- `[system]`, `<system>`, `[INST]`
- `override system/instructions`
- `jailbreak`, `DAN`
- `roleplay as`

**Process:**
1. Each pattern is replaced with `[REDACTED]`
2. HTML/XML tags are stripped
3. Multiple spaces are collapsed
4. `isInjectionAttempt()` provides a boolean check

## 8. PDF Dossier Export

`services/pdfService.ts` (16KB) generates a branded PDF using `jsPDF`:
- Mode-aware labels via `PDF_LABELS[mode]` registry
- Mode-aware filenames: `Sovereign_Dossier_*.pdf` (mythic) vs `Action_Plan_*.pdf` (plain)
- Includes: profile, selected tool, evidence scores with verification badges (Level 1–3), Theory of Value, and SHA-256 integrity hash
- Generation is **async** due to Web Crypto hashing — UI must show loading state

## 9. Calendar Export

`services/calendarService.ts` generates `.ics` files for scheduling:
- Dynamic tool names and descriptions in events
- **CRITICAL**: RFC-compliant escaping required for commas, semicolons, and newlines (Hazard #153)
- Mode-aware labeling

## 10. The Pyre (Destructive Reset)

`Pyre.tsx` implements a ceremonial destruction of a finalized dossier:
- Requires explicit user confirmation
- Resets `SystemState` back to `INITIAL_STATE`
- The ceremony is designed to feel "weighty" — not a casual undo
