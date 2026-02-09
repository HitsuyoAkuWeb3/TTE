# Master Architectural Brief — TetraTool Engine (v1.0)

## 1. System Architecture (Current State)

### The Stack
-   **Frontend**: React 18, Vite 5, TypeScript 5.
    -   *Design System*: TailwindCSS ([Void-Architect DLS](file:///Users/ramajjohnson/.gemini/antigravity/knowledge/sovereign_ui_ux_framework/artifacts/visual_identity_brutalist.md))
-   **Backend**: Vercel Serverless Functions (`api/`).
-   **Database**: Neon Postgres (via `api/db/_db.ts` connection pool).
-   **Auth**: Clerk (`@clerk/clerk-react`).
-   **AI Core**: Google Gemini 2.0 Flash / 1.5 Pro (via `@google/genai`).

### Core Subsystems

#### A. The Sovereign Daemon (AI)
-   **Path**: [`services/geminiService.ts`](file:///Users/ramajjohnson/TTE/services/geminiService.ts)
-   **Function**: Handles Text Generation, Live API (WebSockets), and TTS.
-   **Security**:
    -   Text Gen: Proxy via `/api/gemini` (Server-side key).
    -   Live API: Direct Client-side (Requires HTTP Referrer Restriction).
-   **Context Injection**: "Sovereign Cortex" — injects user profile, phase, and tone into every prompt.

#### B. The State Machine
-   **Path**: [`App.tsx`](file:///Users/ramajjohnson/TTE/App.tsx) & [`types.ts`](file:///Users/ramajjohnson/TTE/types.ts)
-   **Structure**: Monolithic `SystemState` object.
-   **Persistence**: Dual-write strategy.
    -   **Local**: `localStorage` (Immediate interaction speed).
    -   **Remote**: `api/db/sessions.ts` (Async sync to Postgres JSONB).

#### C. Gamification Engine ("Mythic RPG")
-   **Path**: [`services/gamification.ts`](file:///Users/ramajjohnson/TTE/services/gamification.ts)
-   **Mechanics**:
    -   **XP**: Awarded for micro-actions (Scoring, Compressing tools).
    -   **Ranks**: 7 Tiers (Initiate → Primordial).
    -   **Spiral**: Exponential XP decay/growth for repetitive actions.
    -   **Vernacular**: UI text adapts based on Rank (Plain → Industrial → Mythic).

#### D. Vernacular Engine
-   **Path**: [`contexts/VernacularContext.tsx`](file:///Users/ramajjohnson/TTE/contexts/VernacularContext.tsx)
-   **Function**: Runtime replacement of UI strings based on user setting (e.g., "Log Out" vs "Sever Connection").

---

## 2. Proposed Plan: Tier 5 (World Forge Update)

### Objective
Activate the **Simulation Chamber**, allowing Operators to test their "Sovereign Assets" against AI-simulated archetypes.

### Implementation Status: [PENDING]
See [Implementation Plan](file:///Users/ramajjohnson/.gemini/antigravity/brain/40963913-48a7-4713-a21d-3cdf5ad8fcd3/implementation_plan.md) for detailed steps.

### Missing Components (Gap Analysis)
1.  **Orphaned UI**: [`SimulationChamber.tsx`](file:///Users/ramajjohnson/TTE/components/SimulationChamber.tsx) is not rendered anywhere.
2.  **Persistence Gap**: `SystemState` lacks a `simulationHistory` array to store results.
3.  **Disconnected Feedback**: Passing a simulation does not trigger the 60 XP award defined in `XP_AWARDS`.

### Execution Steps
1.  **Modify State**: Update `SystemState` in `types.ts` to include `SimulationResult[]`.
2.  **UI Integration**: Add entry point in `RitualDashboard.tsx` (only visible when a Tool is "Locked").
3.  **Wire Logic**: Connect `onComplete` in `SimulationChamber` to `awardXp` + prompt `geminiService` for a score.

---

## 3. Critical References

### System Health & Audit
-   [System Audit Report](file:///Users/ramajjohnson/.gemini/antigravity/brain/40963913-48a7-4713-a21d-3cdf5ad8fcd3/system_audit.md) (Status: PASSED with Security Warnings)
-   [Task Checklist](file:///Users/ramajjohnson/.gemini/antigravity/brain/40963913-48a7-4713-a21d-3cdf5ad8fcd3/task.md)

### Key Files for Context
-   **Config**: [`vite.config.ts`](file:///Users/ramajjohnson/TTE/vite.config.ts) (Security Warnings)
-   **AI Models**: [`config/AIModels.ts`](file:///Users/ramajjohnson/TTE/config/AIModels.ts)
-   **Database**: [`api/db/sessions.ts`](file:///Users/ramajjohnson/TTE/api/db/sessions.ts)
