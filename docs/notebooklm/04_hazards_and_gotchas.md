# TTE Known Hazards & Anti-Patterns

This document contains critical developer hazards, known gotchas, and anti-patterns specific to the TTE codebase. Consult this before making changes to prevent repeating past mistakes.

## CRITICAL: Code Editing Hazards

### H149 — Multi-Chunk Brace Paradox
**Trigger**: Editing a large file (like `App.tsx`) with `multi_replace_file_content` using non-contiguous chunks.
**Failure**: Missing or orphaned closing braces cause a cascading syntax error, often reported at the END of the file.
**Rule**: Always verify opening/closing brace count after automated edits. Chunks must start and end at logical block boundaries.

### H150 — Trailing Closure Desync
**Trigger**: Adding logic to the end of a function or component via automated editing.
**Failure**: Omitting the closing `};` or `})` in the replacement chunk.
**Rule**: Always include trailing closures in replacement content. Use the line *after* the edit as a context anchor.

### H125 — Fragmented Code Mutilation
**Trigger**: `replace_file_content` with incorrect line ranges or incomplete code blocks.
**Failure**: Orphaned logic, missing imports, or multiple closing braces. Total build failure.
**Rule**: For destructive refactors, replace the ENTIRE function/class, not internal lines. Always `npm run build` immediately after.

### H135 — The `define` Block Deletion
**Trigger**: Removing API keys from `vite.config.ts` during a refactor.
**Failure**: Entire `define: {}` object is accidentally deleted, breaking the Vite dev server with cryptic "Unexpected token" errors.
**Rule**: When editing the `define` block, always include both opening and closing braces in replacement chunks.

## CRITICAL: Vernacular Anti-Patterns

### H154 — Partial Hook Injection
**Trigger**: Refactoring a component to use `useVernacular()` — adding `v.key` usages but forgetting the hook initialization.
**Failure**: `Cannot find name 'v'` / `Cannot find name 'mode'`.
**Rule**: Every component using `v.xxx` MUST have `const { mode, v } = useVernacular();` in the function body.

### H155 — Vernacular Key Mismatch
**Trigger**: Adding a key to one dictionary but not all three.
**Failure**: `Property 'some_key' does not exist on type 'VernacularDictionary'`.
**Rule**: Interface first → then ALL 3 dictionaries (MYTHIC, INDUSTRIAL, PLAIN). Use compiler errors as a checklist.

### H157 — The `isPlain` Anti-Pattern [RESOLVED]
**Status**: Eliminated in P2 DRY Refactor (Feb 2026).
**What**: Using `const isPlain = mode === 'plain'` to toggle strings. Creates a binary choice that breaks for 4+ archetypes.
**Rule**: Use `v.key` dictionary lookups ONLY. Zero ternaries in JSX.

### H156 — Ternary Bloat in Multi-Mode JSX
**What**: Inline `mode === 'plain' ? '...' : '...'` ternaries making JSX unreadable.
**Rule**: All divergent strings go in the `VernacularDictionary`. Components should be mode-agnostic.

## CRITICAL: Security Hazards

### H138 — Anonymous Header Leak (Clerk)
**What**: Relying on `x-clerk-user-id` header without server-side verification.
**Risk**: Header can be spoofed. Attacker accesses other users' dossiers.
**Rule**: Always verify identity via official Clerk middleware (`getAuth(req)`), not by trusting client-set headers.

### Prompt Injection (Sanitizer)
The `sanitizer.ts` service blocks 15 regex patterns. But it's defense-in-depth — the Sovereign Daemon persona in `geminiService.ts` also refuses off-topic instructions.

## HIGH: State & Cache Hazards

### H139 — Cortex Cache Hash Drift
**What**: Stale LLM context because the cache hash doesn't include all deterministic inputs.
**Rule**: The `computeCortexHash()` function must capture ALL relevant fields (profile, dossier version, selected tool).

### H148 — Clerk Callback State Desync
**What**: Passing unstable function references (like `awardXp`) to child components causes unnecessary re-renders.
**Rule**: Wrap all callback props in `useCallback()` to stabilize references.

### H152 — Async PDF Race
**What**: PDF generation is async (SHA-256 hash). User can navigate away or double-trigger.
**Rule**: Always use `isGeneratingPdf` loading state to disable the download button during generation.

## HIGH: API & Deployment Hazards

### H136 — Backend-Only Dependency
**Note**: `@vercel/postgres` is deprecated (Feb 2026). Use `@neondatabase/serverless` instead.

### H137 — Neon UUID Casting
**What**: `invalid input syntax for type uuid` when inserting UUIDs.
**Rule**: Always append `::uuid` to UUID placeholders in SQL template literals.

### H140 — Vercel Cron Authorization
**What**: Cron routes are public URLs by default.
**Rule**: Check `req.headers.authorization === 'Bearer ${process.env.CRON_SECRET}'`.

### H142 — Double Timeout Paradox
**What**: `AbortSignal.timeout` set longer than Vercel function timeout → ungraceful kill.
**Rule**: Set `AbortSignal.timeout` at least 5s shorter than the Vercel function timeout.

### H144 — Vercel Build Auto-Detection
**Rule**: Leave Build & Development Settings at "Auto-detect" unless strictly necessary.

### H145 — Vercel Env Var Redeploy
**What**: New env vars don't take effect until redeployment.
**Rule**: Always redeploy after adding/updating env vars.

## MEDIUM: AI & Content Hazards

### H158 — Linguistic Framing Desync (AI vs UI)
**What**: UI says "Your Plan" (Plain mode) but AI responds with "I have architected your Sovereign Dossier."
**Rule**: Pass `VernacularMode` to AI service calls. Adjust system prompt per mode.

### H159 — PDF Export Jargon Leak
**What**: PDF exports use Mythic jargon regardless of user's mode.
**Rule**: Pass `mode` parameter from the component call-site into `pdfService`. Use `PDF_LABELS[mode]` registry.

### H160 — Call-Site Mode Propagation
**What**: Service function has `mode` param with a default, but caller forgets to pass the current mode.
**Rule**: During development, REMOVE default values to force the compiler to flag every call-site.

### H141 — Evidence Strip Content Clutter
**What**: HTML entities (`&nbsp;`, `&amp;`) survive tag stripping, wasting LLM tokens.
**Rule**: Decode entities and aggressively collapse whitespace before injection.

### H153 — .ics Content Escape
**What**: Unescaped commas/semicolons/newlines break calendar imports.
**Rule**: Use `.replace(/\n/g, '\\n')` on all dynamic fields in ICS templates.

## Migration Notes

### InstantDB → Clerk + Neon (Phase C-D)
- Auth: Migrated from InstantDB's built-in auth to Clerk
- DB: Migrated from InstantDB to Neon Postgres
- E2E Tests: All selectors updated from InstantDB login UI to Clerk `<SignIn />` (H143)
- Session Strategy: Clerk-aware smoke tests that verify app integrity without full auth bypass (H151)

### Obsidian → Web (Historical)
The TTE originated as an Obsidian plugin. Legacy hazards (H1–H134) reference Obsidian-specific patterns (Modal types, Svelte 5, vault listeners). These are no longer relevant to the web app but document the migration history.
