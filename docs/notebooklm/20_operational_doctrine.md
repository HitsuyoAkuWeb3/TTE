# TTE Operational Doctrine (v1.0)

## 1. The Prime Directive: "Data Sovereignty First"
All features must prioritize specific, reliable data structures over "magical" AI guessing.
*   **Rule**: Never ask the AI to "figure out" the state. Feed it the state.
*   **Pattern**: `SystemState` is the single source of truth. If it's not in `state`, it doesn't exist.

## 2. State Management Strategy (The Dual-Write)
We use a "Hot/Cold" persistence layer.
*   **Hot (Sync)**: `localStorage` updates immediately on every keystroke/action. Used for UI reactivity.
*   **Cold (Async)**: `api/db/sessions` updates on critical checkpoints (Phase Complete, Save Button).
*   **Decision Matrix**:
    *   *Is it a keystroke?* -> `setState` (React) + `localStorage`.
    *   *Is it a milestone?* -> `handleSave()` (Postgres).

## 3. The Vernacular Protocol (Gempei)
The UI must speak three dialects. Never hardcode English.
*   **Mythic (The Architect)**: Esoteric, grand, spiritual. *("The Void Stares Back")*
*   **Industrial (The Strategist)**: Clean, efficient, corporate. *("System Status: Optimal")*
*   **Plain (The Builder)**: Simple, direct, no-nonsense. *("Log Out")*
*   **Implementation**:
    *   ❌ `Check Status`
    *   ✅ `{v.action_check_status}`

## 4. AI Interaction Patterns (The Cortex)
*   **Thinking Budgets**:
    *   Simple classification: 4k tokens.
    *   Deep synthesis (Radar/Forge): 16k+ tokens.
*   **Context Injection**:
    *   Always inject `SystemState` (Cortex) into the system prompt.
    *   Never trust the AI to remember previous turns without explicit history injection.

## 5. Component Construction Pattern (Void-Architect DLS)
*   **Container**: `min-h-screen bg-void text-bone font-mono`
*   **Card**: `bg-concrete border border-zinc-800 shadow-hard p-6`
*   **Input**: `bg-void border-zinc-700 focus:border-spirit`
*   **Button**:
    *   Primary: `bg-bone text-void hover:bg-spirit`
    *   Sovereign: `bg-void border-gold text-gold hover:bg-gold hover:text-void`

## 6. The "World Forge" Mandate (Tier 5)
*   **Isolation**: Simulations run in a sandbox. They do not mutate the `Armory`.
*   **Persistence**: Results are append-only logs (`simulationHistory`).
*   **Gamification**: XP is the bridge. Passing a sim *must* have tangible value (XP/Rank).
