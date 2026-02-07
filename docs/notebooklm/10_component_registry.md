# TTE Component Registry

Complete map of every React component, its file, props, internal functions, dependencies, and which phase it belongs to.

---

## Phase Flow (Execution Order)

```
INTRO → ARCHIVE → CALIBRATION → ARMORY_AUDIT → TOOL_COMPRESSION 
     → EVIDENCE_SCORING → TOOL_LOCK → VALUE_SYNTHESIS → INSTALLATION 
     → RITUAL_DASHBOARD
```

All phase transitions are controlled by `App.tsx` via the `state.currentPhase` enum.

---

## App Shell

### `App.tsx` — Application Orchestrator
- **Path**: `/App.tsx` (468 lines)
- **Role**: Root component. Manages `SystemState`, persistence (save/load), and phase routing.
- **Imports**: `useUser`, `useAuth` from Clerk; all phase components
- **Key Internal Functions**:

| Function | Signature | Purpose |
|:---------|:----------|:--------|
| `handleCalibrationComplete` | `(profile: OperatorProfile) → void` | Saves profile, transitions to ARMORY_AUDIT |
| `handleSave` | `(currentState: SystemState) → void` | Persists state to Neon via `/api/db/sessions` |
| `getProgress` | `() → { current: number, total: number }` | Calculates phase progress (0–10) |
| `handleUpdateItem` | `(id, x, y) → void` | Updates ArmoryItem coordinates on the scatter map |
| `getQuadrant` | `(x, y) → Quadrant` | Maps x/y coords to Sandbox/Mischief/Craft/Ritual |

- **State Shape**: `SystemState` (see `types.ts`)

---

## Phase Components

### 1. `IntroPhase.tsx` — Landing / Name Entry
- **Path**: `/components/phases/IntroPhase.tsx` (48 lines)
- **Phase**: `Phase.INTRO`
- **Props**: `{ onStart: (name: string) → void }`
- **Dependencies**: `Button`, `useVernacular`, `VernacularToggle`
- **Vernacular Keys**: `intro_headline_1`, `intro_headline_2`, `intro_headline_3`, `intro_subtitle`, `intro_mode_label`, `intro_input_label`, `intro_placeholder`, `intro_button`, `unknown_subject`
- **Notes**: Contains the mode picker (`VernacularToggle`). Only phase with zero AI calls.

---

### 2. `ArchivePhase.tsx` — Session Management
- **Path**: `/components/phases/ArchivePhase.tsx` (186 lines)
- **Phase**: `Phase.ARCHIVE`
- **Props**:

```typescript
interface ArchivePhaseProps {
  userId: string;
  onSelect: (state: SystemState) → void;
  onNew: () → void;
}
```

- **Dependencies**: `Button`, `useVernacular`, `apiFetch`
- **Internal Interfaces**: `SessionRecord` (id, currentPhase, selectedToolId, candidates, etc.)
- **API Calls**: `GET /api/db/sessions`, `DELETE /api/db/sessions`, `GET /api/db/snapshots`
- **Key Functions**: `getSnapshots(sessionId)` → fetches version history
- **Notes**: Loads previous dossiers. Shows version badges and finalization status.

---

### 3. `CalibrationPhase.tsx` — Operator Profile Setup
- **Path**: `/components/phases/CalibrationPhase.tsx` (95 lines)
- **Phase**: `Phase.CALIBRATION`
- **Props**:

```typescript
interface CalibrationPhaseProps {
  initialProfile?: OperatorProfile | null;
  onComplete: (profile: OperatorProfile) → void;
}
```

- **Dependencies**: `Button`, `useVernacular`
- **Tone Options**: `'default' | 'clinical' | 'aggressive' | 'philosophical' | 'playful'`
- **Vernacular Keys**: `calibration_title`, `calibration_subtitle`, `label_name`, `label_industry`, `label_goal`, `label_tone`, `placeholder_name`, `placeholder_industry`, `placeholder_goal`, `calibration_submit`, `calibration_footer`
- **Notes**: No AI calls. Pure form. Collects name, industry, strategic goal, preferred tone.

---

### 4. `ArmoryAuditPhase.tsx` — Skill Intake + Classification
- **Path**: `/components/phases/ArmoryAuditPhase.tsx` (471 lines) ⚡ LARGEST
- **Phase**: `Phase.ARMORY_AUDIT`
- **Props**:

```typescript
{
  items: ArmoryItem[];
  profile: OperatorProfile | null;
  onAddItem: (item: ArmoryItem) → void;
  onUpdateItem: (id, x, y) → void;
  onNext: () → void;
  onBack: () → void;
}
```

- **Dependencies**: `Button`, `Input`, `SectionHeader`, `ArmoryMap`, `useVernacular`, `classifyActivity`, `generateStarterDeck`, `logger`
- **AI Calls**: `classifyActivity()` (per item), `generateStarterDeck()` (batch)
- **Internal Components**: `PrimitiveGroup` (renders category cards for Sovereign Primitives)
- **Data**: `PRIMITIVES[]` — 4 categories × ~6 items each (Structure & Cognition, Signal & Translation, Engine & Systems, Leverage & Value)
- **Key Functions**:
  - `processItem(text, contextDesc?)` — classifies a single activity
  - `handleKeepCard(card)` — accepts a starter deck card
  - `handleDiscardCard(card)` — rejects a starter deck card
- **Notes**: Most complex phase. Two input modes: free-text entry and Deck of Sparks (AI-generated cards). Hard cap: `ARMORY_HARD_CAP = 15` items.

---

### 5. `ToolCompressionPhase.tsx` — 80/20 Compression + Sovereign Synthesis
- **Path**: `/components/phases/ToolCompressionPhase.tsx` (311 lines)
- **Phase**: `Phase.TOOL_COMPRESSION`
- **Props**:

```typescript
{
  armory: ArmoryItem[];
  onSelectCandidates: (candidates: ToolCandidate[]) → void;
  onRemoveItems: (ids: string[]) → void;
  onRenameItem: (id: string, newVerb: string) → void;
  onNext: () → void;
  onBack: () → void;
}
```

- **Dependencies**: `Button`, `SectionHeader`, `useVernacular`, `synthesizeToolDefinition`, `synthesizeSovereignAuthority`, `suggestMerge`
- **AI Calls**: `synthesizeToolDefinition()`, `synthesizeSovereignAuthority()`, `suggestMerge()`
- **Internal Components**: `CandidateResultsView` (renders compressed tool cards)
- **Key Functions**:
  - `toggleSelection(id)` — select/deselect armory items for compression
  - `handleCompress()` — triggers AI synthesis of selected items → ToolCandidate[]
  - `handleSovereign()` — synthesizes a unified "Sovereign Authority" from all candidates
  - `handleSuggestMerge()` / `handleAcceptMerge()` — AI-suggested item merges
- **Notes**: Enforces `ARMORY_HARD_CAP`. Merge suggestions appear as modal cards.

---

### 6. `EvidenceScoringPhase.tsx` — The Crucible
- **Path**: `/components/phases/EvidenceScoringPhase.tsx` (400 lines)
- **Phase**: `Phase.EVIDENCE_SCORING`
- **Props**:

```typescript
{
  candidates: ToolCandidate[];
  onUpdateCandidate: (id: string, updates: Partial<ToolCandidate>) → void;
  onNext: () → void;
  onBack: () → void;
}
```

- **Dependencies**: `Button`, `SectionHeader`, `challengeScore`, `useVernacular`, `verifyEvidence`
- **AI Calls**: `challengeScore()` — adversarial scoring challenge
- **Internal Components**:
  - `TactileSlider` — custom 0–5 score slider with heat glow
  - `ChallengerModal` — adversarial challenge results (accept downgrade / provide evidence / dismiss)
- **Data Constants**: `HEAT_COLORS[]` (6 colors), `HEAT_GLOW[]` (6 glow shadows)
- **Key Functions**:
  - `updateProof(key, val)` — saves evidence text/URL
  - `markChallengeReceived()` — prevents re-challenging
  - `handleAcceptDowngrade(score)` — accepts AI's suggested lower score
  - `getValidationStatus()` — computes verification level progress
- **Notes**: Scores are `unbiddenRequests`, `frictionlessDoing`, `resultEvidence`, `extractionRisk` (all 0–5).

---

### 7. `ToolLockPhase.tsx` — Final Tool Selection
- **Path**: `/components/phases/ToolLockPhase.tsx` (63 lines)
- **Phase**: `Phase.TOOL_LOCK`
- **Props**: `{ candidates: ToolCandidate[], onLock: (id) → void, onBurn: (id) → void, onBack: () → void }`
- **Dependencies**: `Button`, `SectionHeader`, `BurnButton`, `useVernacular`
- **Key Functions**: `getScore(c)` — weighted composite score: `unbidden + frictionless×0.5 + result - risk×0.5`
- **Notes**: Sorts candidates by composite score. Top scorer gets `scale-105` emphasis. Burn triggers `Pyre` ceremony.

---

### 8. `InstallationPhase.tsx` — Pilot Protocol + Theory of Value + Finalization
- **Path**: `/components/phases/InstallationPhase.tsx` (311 lines)
- **Phase**: `Phase.VALUE_SYNTHESIS`, `Phase.INSTALLATION`
- **Props**:

```typescript
{
  tool: ToolCandidate | null;
  plan: string | null;
  clientName?: string;
  profile?: OperatorProfile | null;
  theoryOfValue?: TheoryOfValue | null;
  onGeneratePlan: () → void;
  onUpdatePlan: (plan: string) → void;
  onBack: () → void;
  onSave: () → void;
  onRetroactiveAudit: () → void;
  onFinalize: () → void;
  onForkVersion: () → void;
  isGenerating: boolean;
  isSaving: boolean;
  isFinalized: boolean;
  version?: number;
}
```

- **Dependencies**: `Button`, `SectionHeader`, `SimpleMarkdown`, `RefinementTerminal`, `useVernacular`, `generateAudioDossier`, `pdfService`, `calendarService`, `logger`
- **AI Calls**: `generateAudioDossier()` (TTS), plan generation via parent
- **Key Functions**:
  - `handleRefine(feedback)` — refine pilot plan with user feedback
  - `handleTTS()` — generate spoken dossier summary
  - `handleValidation()` — verify evidence URLs
  - `renderTovSummary()` — renders Theory of Value section
  - `renderFinalizeActions()` — finalize/fork/export buttons
- **Exports**: PDF (jsPDF), ICS calendar, audio dossier
- **Notes**: Handles TWO phases (VALUE_SYNTHESIS + INSTALLATION). Theory of Value generation is triggered from App.tsx.

---

### 9. `RitualDashboard.tsx` — Post-Installation Tracking
- **Path**: `/components/phases/RitualDashboard.tsx` (304 lines)
- **Phase**: `Phase.RITUAL_DASHBOARD`
- **Props**:

```typescript
interface RitualDashboardProps {
  tool: ToolCandidate | null;
  theoryOfValue: TheoryOfValue | null;
  profile: OperatorProfile | null;
  pilotPlan: string | null;
  onBack: () → void;
  onReAudit?: () → void;
}
```

- **Dependencies**: `Button`, `SectionHeader`, `useVernacular`
- **Internal Interfaces**: `DailyEntry` (date, clientReached, offersSent, revenue, note, mood)
- **Mood Options**: `'focused' | 'scattered' | 'blocked' | 'flow'`
- **Notes**: Ouroboros Loop — tracks daily micro-progress. Stores entries in local state (not persisted).

---

### 10. `Pyre.tsx` — Tool Retirement Ceremony
- **Path**: `/components/phases/Pyre.tsx` (157 lines)
- **Phase**: N/A (modal overlay, invoked from ToolLockPhase or InstallationPhase)
- **Props**:

```typescript
interface PyreProps {
  tool: ToolCandidate;
  onBurnComplete: (toolId: string) → void;
  onCancel: () → void;
}
```

- **Dependencies**: `useVernacular`
- **Internal Phases**: `'confirm' → 'burning' → 'ashes'`
- **Animation**: 20 particle effects, progress bar 0→100 in 2 seconds, blur + scale transition
- **Notes**: Full-screen overlay with `z-200`. Fire particles use inline styles, not Tailwind.

---

## Shared Components (`Visuals.tsx`)

**Path**: `/components/Visuals.tsx` (318 lines)

| Component | Props | Purpose |
|:----------|:------|:--------|
| `Button` | `{ children, variant?, className?, ...rest }` | Primary/gold/default button with DLS styling |
| `Input` | Standard `<input>` props | DLS-styled text input |
| `SectionHeader` | `{ title, subtitle?, onBack? }` | Phase header with optional back button |
| `ArmoryMap` | `{ items: ArmoryItem[] }` | Interactive 2D scatter chart (Recharts) |
| `CustomBackground` | `{ labels: QuadrantLabels }` | SVG quadrant labels for ArmoryMap |
| `ArmoryTooltipContent` | `{ active, payload }` | Custom Recharts tooltip |
| `ProgressBar` | `{ current, total }` | Phase progress indicator |
| `BurnButton` | `{ onBurn, className? }` | Long-press-to-burn with progress ring |
| `RitualError` | `{ title?, message, onDismiss }` | Error toast component |
| `RitualSuccess` | `{ title, message }` | Success toast component |
| `LoadingRitual` | `{ status? }` | Loading spinner with status text |

**Button variants**: `'primary'` (bone bg), `'gold'` (yellow glow for Sovereign), default (zinc border)

---

## Utility Components

### `SimpleMarkdown.tsx` — Markdown Renderer
- **Path**: `/components/SimpleMarkdown.tsx` (57 lines)
- **Props**: `{ content: string, className? }`
- **Notes**: Renders markdown as HTML. Used in InstallationPhase for pilot plan display.

### `RefinementTerminal.tsx` — AI Refinement Chat
- **Path**: `/components/RefinementTerminal.tsx` (93 lines)
- **Props**: `{ onSubmit: (feedback: string) → void, isProcessing: boolean }`
- **Notes**: Terminal-style input for refining AI outputs. Used in InstallationPhase.

### `RankBadge.tsx` — XP/Rank Display
- **Path**: `/components/RankBadge.tsx` (114 lines)
- **Notes**: Displays current rank and XP progress. Uses gamification service.

### `AuthTerminal.tsx` — Clerk Auth Wrapper
- **Path**: `/components/AuthTerminal.tsx` (53 lines)
- **Notes**: Wraps `<SignIn />` from Clerk with DLS-styled container.

---

## Services Layer

| Service | Path | Size | Purpose |
|:--------|:-----|:-----|:--------|
| `geminiService.ts` | `/services/` | 37,967 bytes | ALL Gemini AI calls, Live API audio, TTS |
| `pdfService.ts` | `/services/` | 16,039 bytes | PDF dossier generation (jsPDF + autoTable) |
| `calendarService.ts` | `/services/` | 4,346 bytes | ICS calendar export for pilot protocol |
| `gamification.ts` | `/services/` | 2,784 bytes | XP calculation, rank thresholds, level logic |
| `apiClient.ts` | `/services/` | 2,550 bytes | `apiFetch()` wrapper with auth headers |
| `sanitizer.ts` | `/services/` | 1,839 bytes | Prompt injection defense (regex patterns) |
| `logger.ts` | `/services/` | 1,551 bytes | Structured logging utility |

---

## Contexts

| Context | Path | Size | Purpose |
|:--------|:-----|:-----|:--------|
| `VernacularContext.tsx` | `/contexts/` | 38,878 bytes | Vernacular Engine: 226 keys × 3 modes |

**Exports**: `useVernacular()` → `{ v, mode, setMode }`, `VernacularToggle` component

---

## Type Definitions (`types.ts`)

| Type | Key Fields |
|:-----|:-----------|
| `Phase` (enum) | `INTRO`, `ARCHIVE`, `CALIBRATION`, `ARMORY_AUDIT`, `TOOL_COMPRESSION`, `EVIDENCE_SCORING`, `TOOL_LOCK`, `VALUE_SYNTHESIS`, `INSTALLATION`, `RITUAL_DASHBOARD` |
| `Quadrant` (enum) | `SANDBOX`, `MISCHIEF`, `CRAFT`, `RITUAL` |
| `ArmoryItem` | `id`, `verb`, `x` (-10→10), `y` (-10→10), `quadrant` |
| `ToolCandidate` | `id`, `originalVerb`, `plainName`, `functionStatement`, `promise`, `antiPitch`, `isSovereign?`, `scores` (4 dims, 0–5), `proofs`, `challengeReceived?` |
| `OperatorProfile` | `name`, `industry`, `strategicGoal`, `preferredTone` |
| `TheoryOfValue` | `fatalWound`, `sacredCow`, `molecularBond`, `mvaRadar` { shadowBeliefs, rawLingo }, `godfatherOffer` { name, transformation, price } |
| `SystemState` | `id?`, `userId`, `currentPhase`, `armory[]`, `candidates[]`, `selectedToolId`, `pilotPlan`, `profile?`, `theoryOfValue?`, `finalized?`, `version?`, `xp` |
| `DossierSnapshot` | `version`, `finalizedAt`, `state` |
| `INITIAL_STATE` | Default SystemState with Phase.INTRO, empty arrays, xp: 0 |
