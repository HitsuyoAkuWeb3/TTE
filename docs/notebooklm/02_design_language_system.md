# Void-Architect Design Language System (DLS)

## 1. Design Philosophy

The TTE uses a **Brutalist Monochrome** aesthetic called "Void-Architect." It prioritizes strategic clarity and "Forensic Weight" over decorative UI. The system feels like a military terminal or diagnostic OS — not a SaaS dashboard.

## 2. Color Palette (Tailwind Tokens)

Defined in `tailwind.config.js` under `theme.extend.colors`:

| Token       | Hex       | Semantic Usage |
|:------------|:----------|:---------------|
| `void`      | `#000000` | Primary background — pitch black |
| `concrete`  | `#121212` | Elevated surfaces, card backgrounds |
| `bone`      | `#F5F5F0` | Primary text, inverted selection background |
| `hazard`    | `#FF3333` | Danger, discard, high extraction risk, errors |
| `spirit`    | `#00FFFF` | Accent, confirmation highlights, forensic indicators |

### Legacy Neon Sub-Palette
```
neon.white:  #ffffff
neon.dim:    #444444
neon.dark:   #0a0a0a
neon.grid:   #1a1a1a
neon.accent: #d4d4d8
```

### Signal Color Rules
- **`hazard` (#FF3333)**: Reserved for "Burn", "Discard", "Danger", and "High Extraction Risk"
- **Signal Green (`#00FF41`)**: Reserved for "Keep", "Confirm", "Success", and "High Forensic Calibre"
- Multi-color decorative palettes are **prohibited** — only B&W + Signal Colors

### Background
The `<body>` uses `#050505` (near-void), NOT pure black, defined in `index.css`.

## 3. Typography

Defined in `tailwind.config.js` under `theme.extend.fontFamily`:

| Token     | Fonts                          | Usage |
|:----------|:-------------------------------|:------|
| `sans`    | `Inter, sans-serif`            | Body text, UI elements |
| `mono`    | `JetBrains Mono, monospace`    | Code, terminal-style labels, data readouts |
| `display` | `Cinzel, Inter, serif`         | Major headers only (phase titles, hero text) |

### Display Font Class
Defined in `index.css`:
```css
.font-display {
  font-family: "Cinzel", "Inter", serif;
  letter-spacing: -0.03em;
}
```

**Rule**: Cinzel is for `<h1>` and `<h2>` headers ONLY. Never use it for body text, buttons, or labels.

## 4. Shadow System (Hard Shadows)

Comic-book-style hard shadows replace all soft/blurred CSS shadows. Defined in `index.css`:

| Class               | Value                                          | Usage |
|:--------------------|:-----------------------------------------------|:------|
| `.shadow-hard`      | `4px 4px 0px 0px rgba(255,255,255,0.08)`       | Default container elevation |
| `.shadow-hard-white`| `4px 4px 0px 0px rgba(255,255,255,1)`          | High-contrast cards |
| `.shadow-hard-hazard`| `4px 4px 0px 0px #ff3333`                     | Danger/warning containers |
| `.shadow-hard-spirit`| `3px 3px 0px 0px #00ffff`                     | Accent/success containers |

**Rule**: Never use Tailwind's default `shadow-lg`, `shadow-xl`, etc. Always use hard shadows.

## 5. Text Selection

Inverted selection is a signature design element. Defined in `index.css`:
```css
::selection {
  background-color: #f5f5f0; /* bone */
  color: #000000;            /* void */
}
```

## 6. Texture Overlays

Three optional overlays for container backgrounds (defined in `index.css`):

| Class              | Effect | Usage |
|:-------------------|:-------|:------|
| `.bg-noise::after` | Fractal noise SVG texture at 3% opacity | Adds subtle grain to dark containers |
| `.bg-grid-overlay` | 40px grid lines at 2% opacity | Gives "blueprint" feel to diagnostic areas |
| `.bg-scanlines`    | Repeating 2px horizontal lines at 1% opacity | Terminal/CRT monitor effect |

## 7. Animations

Defined in `tailwind.config.js` under `theme.extend.animation`:

| Name         | Duration | Usage |
|:-------------|:---------|:------|
| `pulse-slow` | 3s       | Breathing indicators, idle state |
| `scan`       | 2s       | Vertical scan line (translateY loop) |
| `fade-in`    | 0.2s     | Element entry animations |
| `slide-up`   | 0.4s     | Card reveal animations |

Special animation in `index.css`:
- `.animate-shockwave` — Expanding ring pulse (0.6s) for level-up celebrations

## 8. Scrollbar

Custom minimal scrollbar (6px wide, no border-radius):
```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #000000; }
::-webkit-scrollbar-thumb { background: #222; border-radius: 0; }
```

## 9. The Vernacular Engine (Linguistic Layer)

The DLS is not just visual — it includes a **translation layer** that swaps ALL UI text between 3 archetypes.

### Architecture
- **File**: `contexts/VernacularContext.tsx` (~981 lines)
- **Hook**: `const { v, mode, setMode } = useVernacular();`
- **Persistence**: `localStorage` key `tte_vernacular_mode`
- **Interface**: `VernacularDictionary` with 200+ typed keys

### Modes

| Mode         | UI Label    | Emoji | Target User |
|:-------------|:------------|:------|:------------|
| `mythic`     | Architect   | ⚔     | Power users, brand ontologists |
| `industrial` | Strategist  | ⚙     | ROI-focused operators |
| `plain`      | Builder     | 🛠     | First-time users, mainstream |

### Example Key Translations

| Key               | Mythic              | Industrial          | Plain              |
|:-------------------|:--------------------|:--------------------|:-------------------|
| `phase_armory`    | "The Armory"         | "Skill Inventory"   | "Your Skills"      |
| `phase_synthesis` | "The Sovereign Forge"| "Strategy Engine"   | "Your Plan"        |
| `action_lock`     | "Seal the Verdict"   | "Lock Selection"    | "Confirm Choice"   |
| `tool_singular`   | "Sovereign Tool"     | "Core Service"      | "Your Best Skill"  |

### Usage Rules
1. **NEVER hardcode UI strings** — always use `v.key_name`
2. **NEVER use `isPlain` ternaries** — this is a deprecated anti-pattern (Hazard #157)
3. **Dictionary-first**: Add new keys to `VernacularDictionary` interface first, then implement in all 3 dictionaries
4. **Service-level mapping**: For non-React code (e.g., `pdfService.ts`), use a `LABELS[mode]` registry pattern instead of the hook
5. **Export filenames** must also be mode-aware (e.g., `Sovereign_Dossier_*.pdf` vs `Action_Plan_*.pdf`)

### Adding a New Key (Procedure)
1. Add the key to the `VernacularDictionary` interface
2. Add the value to all 3 dictionary objects (`MYTHIC`, `INDUSTRIAL`, `PLAIN`)
3. Use `v.new_key` in the component JSX
4. The TypeScript compiler will enforce that all dictionaries implement the key

## 10. Component Patterns

### Evidence Scoring Visual Heat
- Low scores (0-1): Low-opacity `hazard` red
- High scores (4-5): High-intensity green
- Extraction Risk: Inverse scale (high = intense red)
- The transition is **binary** (green/red) — NO gradient spectrums

### Card States (Armory / Deck of Sparks)
- **Default**: `bg-concrete` with `border-zinc-700`, white mono text
- **KEEP action**: Signal Green border/text (`border-[#00FF41]/40 text-[#00FF41]`)
- **BURN action**: Zinc default → `hover:text-hazard hover:border-hazard/60`
- **Categories**: Text-only monospaced tags (`text-zinc-600`), NO colored borders

### Linguistic Density by Mode
- **Plain (Builder)**: Simpler headlines, more whitespace, lower cognitive load
- **Industrial (Strategist)**: Grid-aligned labels, ROI-focused metadata
- **Mythic (Architect)**: All-caps headers, terminal jargon, high-contrast dividers
