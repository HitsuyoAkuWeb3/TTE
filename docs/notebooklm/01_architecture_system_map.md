# TTE Architecture & System Map

## 1. What Is the TTE?

The **TetraTool Engine** is an "Ontological Compiler" for human competencies. It takes a creator's raw skills ("Lifestyle Noise") and transmutes them into a defensible market position ("Economic Leverage") through a multi-phase diagnostic pipeline.

**The Invariant Mechanism:**
```
Noise (Infinity) → Inventory (Many) → Classification (Four) → Selection (One) → Ritualization (System)
```

## 2. Phase Flow (User Journey)

The app is a linear state machine defined by a `Phase` enum. The user progresses through each phase sequentially:

| Order | Phase Enum         | Component File              | Purpose |
|:------|:-------------------|:----------------------------|:--------|
| 1     | `INTRO`            | `IntroPhase.tsx`            | Welcome screen, mode selection |
| 2     | `ARCHIVE`          | `ArchivePhase.tsx`          | Load/resume previous dossiers from Neon DB |
| 3     | `CALIBRATION`      | `CalibrationPhase.tsx`      | Collect OperatorProfile (name, industry, goal, tone) |
| 4     | `ARMORY_AUDIT`     | `ArmoryAuditPhase.tsx`      | "Deck of Sparks" — user inventories 15+ skills on a 2D axis (Discipline/Discovery × Construction/Disruption) |
| 5     | `TOOL_COMPRESSION` | `ToolCompressionPhase.tsx`  | AI-powered 80/20 compression: merge overlapping skills, keep ≤15 |
| 6     | `EVIDENCE_SCORING`  | `EvidenceScoringPhase.tsx`  | Score each candidate on 4 dimensions (0–5 scale), submit URL proofs |
| 7     | `TOOL_LOCK`        | `ToolLockPhase.tsx`         | Select the single "Sovereign Tool" to build authority around |
| 8     | `VALUE_SYNTHESIS`   | `ValueChemistryPhase.tsx`   | Two-Pass Forge: AI generates Theory of Value, then Devil's Advocate attacks it |
| 9     | `INSTALLATION`     | `InstallationPhase.tsx`     | Final Dossier: download PDF, export calendar, live AI voice session |
| 10    | `RITUAL_DASHBOARD` | `RitualDashboard.tsx`       | Post-completion: daily tracking, gamification, re-audit triggers |

**Special Component:** `Pyre.tsx` — The "Cremation" ceremony for discarding a finalized dossier (destructive reset with ceremony).

## 3. The Data Model

All state lives in a single `SystemState` object (defined in `types.ts`):

```typescript
interface SystemState {
  id?: string;                      // Neon session UUID
  userId: string | null;            // Clerk user ID
  currentPhase: Phase;              // Current position in the pipeline
  armory: ArmoryItem[];             // Raw skill inventory (verb + x/y coords)
  candidates: ToolCandidate[];      // AI-analyzed tool candidates
  selectedToolId: string | null;    // The locked Sovereign Tool
  pilotPlan: string | null;         // AI-generated pilot plan
  clientName?: string;              // For branded exports
  profile?: OperatorProfile | null; // Name, industry, goal, tone
  theoryOfValue?: TheoryOfValue | null; // The full strategic synthesis
  finalized?: boolean;              // Draft-Commit pattern flag
  version?: number;                 // Snapshot version counter
  finalizedAt?: number;             // Timestamp of finalization
  xp: number;                       // Gamification XP
}
```

### Key Sub-Types

**ArmoryItem** — A raw skill plotted on the 2D axis:
- `verb: string` — The action (e.g., "Teaching Python")
- `x: number` — Construction (-10) to Disruption (+10)
- `y: number` — Play/Discovery (-10) to Discipline/Mastery (+10)
- `quadrant: Quadrant` — Sandbox | Mischief | Craft | Ritual

**ToolCandidate** — An AI-refined authority candidate:
- `plainName` — Market-facing name
- `functionStatement` — The "What I do" statement
- `promise` — Outcome/transformation
- `antiPitch` — What it is NOT (differentiation)
- `scores` — Evidence matrix (4 dimensions, 0–5 each)
- `proofs` — URL evidence submissions
- `challengeReceived` — Adversarial prompt survival flag

**TheoryOfValue** — The strategic synthesis output:
- `fatalWound` — The market's existential pain
- `sacredCow` — The industry's unchallenged assumption
- `molecularBond` — The creator's unique mechanism
- `mvaRadar` — Shadow beliefs + raw lingo from market research
- `godfatherOffer` — The irresistible offer (name, transformation, price)

## 4. The Draft-Commit Pattern

State is persisted using an append-only ledger:
1. **Draft State**: The working `SystemState` (mutable, in-memory)
2. **Commit**: When finalized, a `DossierSnapshot` is written with `{ version, finalizedAt, state }`
3. **Versioning**: Each finalization increments the `version` counter
4. **Archive**: Snapshots are stored in Neon Postgres as JSONB

## 5. The AI Layer (Sovereign Cortex)

### Architecture
All AI calls flow through a **server-side proxy** (`/api/gemini`) to keep the API key off the client. The client-side `geminiService.ts` handles:

1. **The Sovereign Daemon** — A persistent persona injected as `systemInstruction`. It is a "clinical, adversarial auditor" that rejects commodity jargon.
2. **Voice Modifiers** — `DAEMON_VOICES` map (`clinical | aggressive | empathetic | minimalist`) appended to the persona based on `OperatorProfile.preferredTone`.
3. **The Cortex** — A compressed context block (`buildCortex()`) serializing current session state. Uses hash-based caching (`sessionStorage`) to avoid unnecessary rebuilds.
4. **Circuit Breaker** — `generateWithFallback()` tries the primary model first, falls back to a simpler model with thinking config adjustments on failure.

### Key AI Functions in `geminiService.ts` (1,119 lines)
- `classifyActivity(verb)` — Place a skill on the 2D axis
- `analyzeCandidate(verb, armory)` — Generate ToolCandidate from a raw verb
- `suggestMerge(items)` — AI-powered skill fusion for 80/20 compression
- `generateTheoryOfValue(state)` — Two-pass synthesis (draft + adversarial)
- `connectLiveSession()` / `disconnectLiveSession()` — WebSocket-based Live API for real-time voice interaction in Installation phase

### Live API (Voice)
The Installation phase includes a WebSocket connection to Gemini's Live API for real-time audio conversation. Uses:
- `AudioWorkletProcessor` for mic capture
- PCM encoding/decoding for raw audio data
- `InputAudioContext` / `OutputAudioContext` managed as module-level singletons

## 6. Authentication & Multi-Tenancy

- **Provider**: Clerk (`@clerk/clerk-react`)
- **Client**: `useUser()` and `useAuth()` hooks in `App.tsx`
- **Server**: `x-clerk-user-id` header on API requests (see Hazard #138 for security note)
- **Gating**: `AuthTerminal.tsx` wraps Clerk's `<SignIn />` component with branded UI

## 7. Persistence Layer

- **Database**: Neon Postgres (`@neondatabase/serverless`)
- **Connection**: `getDb()` helper in `api/db/_db.ts` reads `POSTGRES_URL` from env
- **Tables**:
  - `sessions` — Dossier state (JSONB), version, finalized flag, timestamps
  - `snapshots` — Append-only version history
  - `profiles` — Operator profiles
- **CRUD Routes**:
  - `GET /api/db/sessions` — List user sessions
  - `POST /api/db/sessions` — Upsert session (uses `ON CONFLICT` for idempotency)
  - `POST /api/db/snapshots` — Save snapshot
  - `GET /api/db/profile` / `POST /api/db/profile` — Profile CRUD

## 8. Deployment

- **Platform**: Vercel (Vite + Serverless Functions)
- **Dev Server**: `localhost:3795` with proxy to `localhost:8000` for API routes
- **Cron**: Daily cleanup at 3 AM UTC (`/api/cron/cleanup`)
- **Build Config**: Auto-detect (no manual overrides in Vercel dashboard)
- **Key Env Vars**: `GEMINI_API_KEY`, `POSTGRES_URL`, `CLERK_PUBLISHABLE_KEY`, `CRON_SECRET`

## 9. File Tree Summary

```
TTE/
├── App.tsx                          # Root component, state machine, phase routing
├── types.ts                         # All TypeScript interfaces & enums
├── index.tsx                        # React entry point
├── index.html                       # HTML shell
├── index.css                        # Void-Architect DLS globals
├── tailwind.config.js               # Palette tokens, fonts, animations
├── vite.config.ts                   # Dev server, proxy, code coverage
├── vercel.json                      # Cron jobs
├── contexts/
│   └── VernacularContext.tsx         # Vernacular Engine (3-mode translation)
├── services/
│   ├── geminiService.ts             # AI orchestration (1,119 lines)
│   ├── pdfService.ts                # Dossier PDF generation (jsPDF)
│   ├── calendarService.ts           # .ics calendar export
│   ├── gamification.ts              # XP, Ranks, Streaks
│   ├── sanitizer.ts                 # Prompt injection defense
│   ├── apiClient.ts                 # HTTP client for API routes
│   └── logger.ts                    # Structured logging
├── api/
│   ├── gemini.ts                    # Gemini proxy (server-side)
│   ├── verify-evidence.ts           # URL evidence verification
│   ├── db/
│   │   ├── _db.ts                   # Neon connection helper
│   │   ├── sessions.ts              # Session CRUD
│   │   ├── snapshots.ts             # Snapshot CRUD
│   │   └── profile.ts               # Profile CRUD
│   └── cron/
│       └── cleanup.ts               # Daily cleanup job
├── components/
│   ├── AuthTerminal.tsx             # Clerk-branded login gate
│   ├── RankBadge.tsx                # Gamification rank display
│   ├── RefinementTerminal.tsx       # In-phase AI refinement UI
│   ├── SimpleMarkdown.tsx           # Markdown renderer
│   ├── Visuals.tsx                  # Shared visual components
│   └── phases/                      # 11 phase components (see table above)
└── tests/
    ├── user_journey.spec.ts         # Playwright E2E suite
    └── fixtures.ts                  # Test fixtures & helpers
```
