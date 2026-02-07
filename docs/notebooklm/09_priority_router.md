# TTE Developer Brain — Priority Router

> **PURPOSE**: This document tells the AI which notebook source to reference for each type of question. When multiple sources contain related information, THIS INDEX breaks ties. Technical implementation always overrides philosophical documentation.

---

## ⚠️ CRITICAL ROUTING RULES

1. **For COLOR VALUES**: ALWAYS reference `02_design_language_system.md`.
   - `void: #0a0a0a`, `concrete: #a3a3a3`, `bone: #e8e4d9`, `hazard: #facc15`, `spirit: #a78bfa`
   - **NEVER** cite manifesto aesthetics (`#00FF41`, `#121212`, etc.) — those are conceptual, not implemented.

2. **For AI MODEL IDs**: ALWAYS reference `07_gemini_prompt_library.md` or `08_technical_cheat_sheet.md`.
   - Primary: `gemini-2.5-flash-preview-05-20` (NOT "1.5 Pro", NOT "Gemini 3")
   - Fallback: `gemini-2.0-flash`
   - Live Audio: `gemini-2.5-flash-preview-native-audio-dialog`
   - TTS: `gemini-2.5-flash-preview-tts`

3. **For VERNACULAR KEYS**: ALWAYS reference `06_vernacular_dictionary.md`.
   - Keys are TypeScript identifiers (e.g., `v.calibration_title`), NOT prose descriptions.
   - All three modes (Mythic/Industrial/Plain) MUST be defined for every key.

4. **For CSS/STYLING**: ALWAYS reference `02_design_language_system.md` first, then `08_technical_cheat_sheet.md` §6 (Tailwind).
   - Use DLS tokens: `bg-void`, `text-bone`, `font-display`, `shadow-brutal`
   - NEVER use `bg-black`, `bg-zinc-950`, `shadow-lg`

5. **For API ROUTES**: ALWAYS reference `05_api_service_contracts.md` first, then `08_technical_cheat_sheet.md` §4.

6. **For BUSINESS LOGIC** (scoring, verification, compression): ALWAYS reference `03_business_rules.md`.

7. **For KNOWN BUGS/RISKS**: ALWAYS reference `04_hazards_and_gotchas.md`.

---

## Question → Source Routing Table

| Question Type | Primary Source | Secondary Source | NEVER Use |
|:-------------|:---------------|:-----------------|:----------|
| "What color should X be?" | `02_design_language_system.md` | `08_technical_cheat_sheet.md` §6 | Manifestos |
| "Which Gemini model for X?" | `07_gemini_prompt_library.md` | `08_technical_cheat_sheet.md` §1 | Manifestos |
| "What thinking budget for X?" | `07_gemini_prompt_library.md` | `08_technical_cheat_sheet.md` §1.4 | — |
| "How do I call V.key?" | `06_vernacular_dictionary.md` | — | — |
| "What phase comes after X?" | `01_architecture_system_map.md` | `10_component_registry.md` | — |
| "Which file do I edit for X?" | `10_component_registry.md` | `01_architecture_system_map.md` | — |
| "What props does X accept?" | `10_component_registry.md` | — | — |
| "What's the API contract for X?" | `05_api_service_contracts.md` | `08_technical_cheat_sheet.md` | — |
| "What's the DB schema?" | `05_api_service_contracts.md` | `08_technical_cheat_sheet.md` §3 | — |
| "How does scoring work?" | `03_business_rules.md` | `05_api_service_contracts.md` | — |
| "Is there a known bug for X?" | `04_hazards_and_gotchas.md` | — | — |
| "What font for X?" | `02_design_language_system.md` | — | Manifestos |
| "How does auth work?" | `08_technical_cheat_sheet.md` §2 | `05_api_service_contracts.md` | — |
| "What's the brand philosophy?" | Manifestos (any) | — | Technical docs |
| "What system prompt does AI use?" | `07_gemini_prompt_library.md` | — | — |
| "How to test X?" | `08_technical_cheat_sheet.md` §9 | — | — |
| "How to generate a PDF?" | `08_technical_cheat_sheet.md` §7 | — | — |
| "How does audio/voice work?" | `08_technical_cheat_sheet.md` §§1.5, 8 | — | — |

---

## Source Authority Hierarchy

When sources conflict, resolve in this order:

```
1. types.ts / SystemState definition     → Ground truth for data shapes
2. 10_component_registry.md             → Ground truth for file locations and props
3. 05_api_service_contracts.md          → Ground truth for API behavior
4. 02_design_language_system.md         → Ground truth for visual design
5. 03_business_rules.md                 → Ground truth for scoring/logic
6. 07_gemini_prompt_library.md          → Ground truth for AI configuration
7. 08_technical_cheat_sheet.md          → Ground truth for external service APIs
8. 04_hazards_and_gotchas.md            → Ground truth for known risks
9. 06_vernacular_dictionary.md          → Ground truth for UI text
10. 01_architecture_system_map.md       → Ground truth for system overview
11. Philosophical manifestos             → Conceptual inspiration ONLY
```

---

## Anti-Patterns to Avoid

| ❌ DON'T | ✅ DO |
|:---------|:------|
| Cite "Post-Neon" doc for color codes | Use `02_design_language_system.md` palette tokens |
| Say "Gemini 1.5 Pro" for any model | Look up exact model ID in `07_gemini_prompt_library.md` |
| Describe vernacular modes as "Forensic Indictment" | Use actual mode names: Mythic, Industrial, Plain |
| Suggest "terminal green" UI styling | Use DLS tokens: `text-bone`, `text-concrete`, `text-hazard` |
| Recommend `rounded-lg` corners | Use zero border-radius (brutalist DLS) |
| Say the app has a "Phase 6" | The app has 10 phases: INTRO through RITUAL_DASHBOARD |
| Reference "Gemini 3" models | Current codebase uses 2.0 and 2.5 series only |
| Suggest Prisma or TypeORM | TTE uses raw Neon SQL template literals only |
