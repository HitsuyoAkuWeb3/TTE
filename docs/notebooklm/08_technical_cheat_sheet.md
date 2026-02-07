# TTE Technical Cheat Sheet — External Service Reference

Condensed reference for every external service/library TTE uses. Only the APIs and patterns actually used in the codebase are included.

---

## 1. Gemini SDK (`@google/genai`)

### 1.1 SDK Setup

```typescript
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```

**TTE pattern**: The SDK is used **server-side only** in `api/gemini.ts`. The client calls `/api/gemini` which proxies to the SDK. The API key never reaches the browser.

### 1.2 Text Generation

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash-preview-05-20',
  contents: 'prompt string or Content[]',
  config: {
    systemInstruction: 'You are...',
    responseMimeType: 'application/json',
    responseSchema: schema,          // Type.OBJECT / Type.ARRAY
    thinkingConfig: { thinkingBudget: 1024 },
    tools: [{ googleSearch: {} }],   // for conductMvaRadar
  }
});

const text = response.text;           // parsed output
const candidates = response.candidates; // full response
```

**Key TTE details**:
- `systemInstruction`: Injected as plain string (Sovereign Daemon + voice modifier + Cortex)
- `responseMimeType: 'application/json'` + `responseSchema`: Forces structured JSON output
- `thinkingConfig.thinkingBudget`: Integer token count (0 = off, -1 = dynamic, 128–32768 range)
- Google Search tool: Used in `conductMvaRadar` Stage 1 only, then REMOVED in Stage 2

### 1.3 Response Schema (Structured Output)

TTE builds schemas using the SDK's `Type` enum, NOT Zod:

```typescript
import { Type, Schema } from '@google/genai';

const schema: Schema = {
  type: Type.OBJECT,
  properties: {
    plainName: { type: Type.STRING },
    scores: {
      type: Type.OBJECT,
      properties: {
        unbiddenRequests: { type: Type.NUMBER },
      }
    },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ['plainName', 'scores']
};
```

**Type enum values**: `Type.STRING`, `Type.NUMBER`, `Type.BOOLEAN`, `Type.OBJECT`, `Type.ARRAY`

**Gotcha**: Using Google Search tool AND responseSchema simultaneously causes empty responses. TTE works around this with a two-stage pattern in `conductMvaRadar` (Stage 1 = search, no schema; Stage 2 = synthesis with schema).

### 1.4 Thinking Config

```typescript
config: {
  thinkingConfig: {
    thinkingBudget: 1024   // token count
    // thinkingBudget: 0   → disable thinking  
    // thinkingBudget: -1  → dynamic (model decides)
  }
}
```

**TTE budgets** (from `config/AIModels.ts`):

| Function | Budget | Notes |
|:---------|:-------|:------|
| `classifyActivity` | 1,024 | Simple axis mapping |
| `generateStarterDeck` | 4,096 | |
| `challengeScore` | 8,000 | |
| `generatePilotProtocol` | 8,000 | |
| `conductMvaRadar` | 16,000 | |
| `synthesizeToolDefinition` | 16,000 | |
| `synthesizeSovereignAuthority` | 24,000 | |
| `generateTheoryOfValue` | 24,000 | Two passes, each 24k |

### 1.5 Live API (WebSocket Audio)

```typescript
const session = await ai.live.connect({
  model: 'gemini-2.5-flash-preview-native-audio-dialog',
  config: {
    responseModalities: [Modality.AUDIO],
    systemInstruction: 'You are...',
    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
  },
  callbacks: {
    onopen: () => {},
    onmessage: (msg) => {
      // msg.serverContent.modelTurn.parts[].inlineData.data = base64 PCM
    },
    onerror: (e) => {},
    onclose: (e) => {}
  }
});

// Send audio input:
session.sendRealtimeInput({
  audio: { data: base64String, mimeType: 'audio/pcm;rate=16000' }
});

// Close:
session.close();
```

**TTE audio pipeline** (in `geminiService.ts`):
- **Input**: `AudioContext` at 16,000 Hz → `AudioWorkletNode('audio-capture-processor')` → PCM → base64 → `sendRealtimeInput()`
- **Output**: base64 PCM from `onmessage` → decode → `Float32Array` → `AudioBufferSourceNode` at 24,000 Hz → `GainNode` → speakers
- **Two separate AudioContexts**: `inputAudioContext` (16kHz) and `outputAudioContext` (24kHz)
- Safari compat: `window.AudioContext || window.webkitAudioContext`

### 1.6 Text-to-Speech (Non-Live)

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash-preview-tts',
  contents: textToSpeak,
  config: {
    responseModalities: [Modality.AUDIO],
    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } }
  }
});

// response.candidates[0].content.parts[0].inlineData → { data: base64, mimeType: 'audio/L16;rate=24000' }
```

**TTE usage**: `generateAudioDossier()` — generates spoken summary of the dossier. Uses direct SDK call (NOT the proxy).

### 1.7 Fallback Pattern

```typescript
// TTE's generateWithFallback() in geminiService.ts:
async function generateWithFallback(request, thinkingBudget?) {
  try {
    // Try primary: gemini-2.5-flash-preview-05-20 WITH thinking
    return await callProxy({ ...request, thinkingBudget });
  } catch (error) {
    // Fallback: gemini-2.0-flash WITHOUT thinking
    return await callProxy({ ...request, model: fallbackModel });
  }
}
```

---

## 2. Clerk (`@clerk/clerk-react`)

### 2.1 Provider Setup

```tsx
// index.tsx
import { ClerkProvider } from '@clerk/clerk-react';

<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  <App />
</ClerkProvider>
```

**Env var**: `VITE_CLERK_PUBLISHABLE_KEY` (client-side, embedded in bundle via Vite `define`)

### 2.2 Hooks Used in TTE

```tsx
// App.tsx
import { useUser, useAuth } from '@clerk/clerk-react';

const { isSignedIn, user, isLoaded } = useUser();
// user.id          → Clerk user ID (used as x-clerk-user-id header)
// user.firstName   → display name
// isLoaded         → false until Clerk initializes (show loading state)

const { getToken } = useAuth();
// getToken()       → JWT for server-side auth (NOT currently used in TTE API routes)
```

### 2.3 Components Used

```tsx
// AuthTerminal.tsx
import { SignIn } from '@clerk/clerk-react';

<SignIn />  // Pre-built sign-in UI component
```

### 2.4 Server-Side Auth Pattern

```typescript
// api/db/sessions.ts — how TTE authenticates API calls:
const userId = req.headers['x-clerk-user-id'] as string;
if (!userId) return res.status(401).json({ error: 'Unauthorized' });
```

**IMPORTANT**: TTE passes `user.id` as a custom header `x-clerk-user-id` from the client. The server trusts this header. There is NO middleware-level JWT verification on Vercel routes currently.

---

## 3. Neon Postgres (`@neondatabase/serverless`)

### 3.1 Connection Setup

```typescript
// api/db/_db.ts
import { neon } from '@neondatabase/serverless';

export function getDb() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error('POSTGRES_URL not configured');
  return neon(url);
}
```

**Env var**: `POSTGRES_URL` (server-side only, Vercel environment)

### 3.2 SQL Template Literals

```typescript
const sql = getDb();

// SELECT with parameter binding (safe from injection):
const rows = await sql`SELECT * FROM sessions WHERE user_id = ${userId}`;

// INSERT with RETURNING:
const [row] = await sql`
  INSERT INTO sessions (id, user_id, state, title)
  VALUES (${id}, ${userId}, ${JSON.stringify(state)}, ${title})
  RETURNING *
`;

// UPDATE:
await sql`
  UPDATE sessions 
  SET state = ${JSON.stringify(state)}, title = ${title}, updated_at = NOW()
  WHERE id = ${sessionId} AND user_id = ${userId}
`;

// DELETE:
await sql`DELETE FROM sessions WHERE id = ${sessionId} AND user_id = ${userId}`;
```

### 3.3 TTE Database Schema

```sql
-- Sessions table (dossier persistence)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,           -- Clerk user ID
  state JSONB NOT NULL,            -- Full SystemState blob
  title TEXT,                      -- Display name
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snapshots table (version history)  
CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (operator identity cache)
CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY,
  profile JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Key Constraints

- **Max request/response size**: 64 MB per HTTP query
- **Connection model**: HTTP (not WebSocket) — each `sql` call is a standalone HTTP request
- **No connection pooling needed**: The Neon serverless driver handles this automatically
- **TypeScript types**: Included in `@neondatabase/serverless` (equivalent to `@types/pg`)

---

## 4. Vercel

### 4.1 Serverless Functions

All files in `api/` are auto-deployed as serverless functions:

```typescript
// api/gemini.ts — Standard handler signature:
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // ... handler logic ...
  return res.status(200).json({ text, candidates });
}
```

**TTE route map**:

| Route | Method | Purpose |
|:------|:-------|:--------|
| `/api/gemini` | POST | Gemini SDK proxy (text generation) |
| `/api/verify-evidence` | POST | URL evidence verification |
| `/api/db/sessions` | GET/POST/PUT/DELETE | Session CRUD |
| `/api/db/snapshots` | GET/POST | Version history |
| `/api/db/profile` | GET/PUT | Operator profile cache |
| `/api/cron/cleanup` | GET (cron) | Expired session cleanup |

### 4.2 Cron Jobs

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/cleanup",
    "schedule": "0 3 * * *"   // 3:00 AM UTC daily
  }]
}
```

### 4.3 Environment Variables

| Variable | Context | Purpose |
|:---------|:--------|:--------|
| `GEMINI_API_KEY` | Server | Gemini SDK authentication |
| `POSTGRES_URL` | Server | Neon database connection |
| `VITE_CLERK_PUBLISHABLE_KEY` | Client | Clerk auth (public) |

**Gotcha**: `VITE_*` prefix makes vars available to the client bundle. NEVER prefix secret keys with `VITE_`.

### 4.4 Local Development Proxy

```typescript
// vite.config.ts — local dev mirrors Vercel's routing:
server: {
  port: 3795,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',  // vercel dev
      changeOrigin: true,
    }
  }
}
```

Run `vercel dev` on port 8000 alongside `npm run dev` on port 3795.

---

## 5. Vite

### 5.1 Key Config

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: { port: 3795 },
    define: {
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(env.VITE_CLERK_PUBLISHABLE_KEY),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') }
    },
    plugins: [
      react(),
      istanbul({ include: 'src/**/*' }),  // Coverage instrumentation
    ]
  };
});
```

### 5.2 Environment Variables

- `loadEnv(mode, '.', '')` — loads from `.env`, `.env.local`, `.env.[mode]`
- Client-side access: `import.meta.env.VITE_*`
- The `define` block explicitly injects `VITE_CLERK_PUBLISHABLE_KEY` into the bundle

### 5.3 Common Gotchas

| Issue | Fix |
|:------|:----|
| Env var undefined in browser | Must have `VITE_` prefix |
| Env var undefined in Vercel functions | Use `process.env.*` (no prefix needed) |
| HMR not working | Check `server.host` is `localhost` |
| Proxy ECONNREFUSED | Run `vercel dev` on port 8000 first |

---

## 6. Tailwind CSS v3

### 6.1 TTE Custom Theme

```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0a0a0a',        // Primary background
        concrete: '#a3a3a3',    // Secondary text
        bone: '#e8e4d9',        // Primary text / accents
        hazard: '#facc15',      // Warning / XP highlights
        spirit: '#a78bfa',      // Purple accent (rare)
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],   // Major headers
        mono: ['JetBrains Mono', 'monospace'],  // Body + code
      },
      boxShadow: {
        brutal: '4px 4px 0px rgba(0,0,0,0.9)',     // Hard shadow
        'brutal-sm': '2px 2px 0px rgba(0,0,0,0.9)',
      },
    }
  }
};
```

### 6.2 Common TTE Utility Patterns

```html
<!-- Background -->
<div className="bg-void">              <!-- #0a0a0a -->
<div className="bg-zinc-900/50">       <!-- Semi-transparent panels -->

<!-- Text -->
<h1 className="font-display text-bone">   <!-- Cinzel serif -->
<p className="font-mono text-concrete">    <!-- JetBrains Mono -->
<span className="text-hazard">             <!-- Yellow accent -->

<!-- Shadows -->
<div className="shadow-brutal">            <!-- Hard comic shadow -->

<!-- Selection -->
::selection { background: #0a0a0a; color: #e8e4d9; }  /* Inverted */
```

### 6.3 DLS Rules

- **NEVER** use `bg-black` → use `bg-void`
- **NEVER** use `bg-zinc-950` → use `bg-void`
- **NEVER** use soft shadows (`shadow-lg`) → use `shadow-brutal`
- **ALWAYS** use `font-display` for `<h1>`, `<h2>` headers
- **ALWAYS** use `font-mono` for body text and UI labels

---

## 7. jsPDF + jspdf-autotable

### 7.1 TTE Usage (`services/pdfService.ts`)

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const doc = new jsPDF();           // A4 portrait by default
const pageWidth = doc.internal.pageSize.width;  // 210mm

// Text:
doc.setFont("courier", "bold");
doc.setFontSize(12);
doc.setTextColor(0);              // 0 = black, [r,g,b] = color
doc.text("Hello", 20, 30);       // x, y in mm from top-left

// Lines:
doc.setDrawColor(40);
doc.setLineWidth(0.3);
doc.line(20, 40, 190, 40);       // x1, y1, x2, y2

// Filled rectangles:
doc.setFillColor(0, 0, 0);
doc.rect(0, 0, pageWidth, 8, 'F');

// Page management:
doc.addPage();
doc.getNumberOfPages();
doc.setPage(i);                   // Switch to page i

// Text wrapping:
const lines = doc.splitTextToSize(longText, maxWidth);
doc.text(lines, x, y);

// Save:
doc.save('filename.pdf');
```

### 7.2 AutoTable

```typescript
autoTable(doc, {
  startY: currentY,
  head: [['COL1', 'COL2', 'COL3']],
  body: [['val1', 'val2', 'val3']],
  theme: 'grid',                    // or 'plain'
  styles: { font: 'courier', fontSize: 8, cellPadding: 4 },
  headStyles: { fillColor: [0,0,0], textColor: [255,255,255] },
  columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
  margin: { left: 20 },
  didParseCell: (data) => {
    // Conditional cell styling
    if (data.section === 'body' && data.column.index === 3) {
      data.cell.styles.textColor = [34, 197, 94]; // green
    }
  }
});

// Get final Y position after table:
currentY = (doc as any).lastAutoTable.finalY + 12;
```

### 7.3 SHA-256 Proof of Work

```typescript
const encoder = new TextEncoder();
const data = encoder.encode(JSON.stringify(stateObject));
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
```

---

## 8. Web Audio API

### 8.1 TTE Audio Pipeline

```typescript
// Input capture (microphone → PCM → base64):
const inputCtx = new AudioContext({ sampleRate: 16000 });
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
await inputCtx.audioWorklet.addModule('/audio-capture-processor.js');
const source = inputCtx.createMediaStreamSource(stream);
const worklet = new AudioWorkletNode(inputCtx, 'audio-capture-processor');
source.connect(worklet);
// worklet.port.onmessage → Float32Array → convert to Int16 → base64

// Output playback (base64 → PCM → speakers):
const outputCtx = new AudioContext({ sampleRate: 24000 });
const gainNode = outputCtx.createGain();
gainNode.connect(outputCtx.destination);

// For each audio chunk from Live API:
const pcmData = atob(base64String);  // decode base64
const float32 = new Float32Array(pcmData.length / 2);
// ... convert Int16 to Float32 ...
const buffer = outputCtx.createBuffer(1, float32.length, 24000);
buffer.getChannelData(0).set(float32);
const source = outputCtx.createBufferSource();
source.buffer = buffer;
source.connect(gainNode);
source.start(nextStartTime);
nextStartTime += buffer.duration;
```

### 8.2 Key Constants

| Parameter | Value | Why |
|:----------|:------|:----|
| Input sample rate | 16,000 Hz | Gemini Live API requirement for speech input |
| Output sample rate | 24,000 Hz | Gemini Live API output format |
| Input encoding | Int16 PCM | Gemini `audio/pcm;rate=16000` |
| Output encoding | Float32 PCM | Web Audio API buffer format |

### 8.3 Safari Compatibility

```typescript
const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
const ctx = new AudioCtx({ sampleRate: 24000 });
```

---

## 9. Playwright

### 9.1 TTE Test Setup

```typescript
// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('app loads without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.goto('http://localhost:3795');
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});
```

### 9.2 Key Patterns for TTE

```typescript
// Wait for Clerk to load:
await page.waitForSelector('[data-clerk-loaded]', { timeout: 10000 });

// Check for React render:
await page.waitForSelector('#root > *', { timeout: 5000 });

// Screenshot on failure:
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    await page.screenshot({ path: `test-results/${testInfo.title}.png` });
  }
});
```

### 9.3 Config

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3795',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 3795,
    reuseExistingServer: true,
  }
});
```

---

## 10. Calendar Export (`services/calendarService.ts`)

### 10.1 ICS Format

```typescript
// TTE generates .ics files for the 7-Day Pilot Protocol:
const icsContent = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//TetraTool Engine//EN',
  'BEGIN:VEVENT',
  `DTSTART:${formatDate(date)}`,      // YYYYMMDD format
  `DTEND:${formatDate(nextDay)}`,
  `SUMMARY:${dayTitle}`,
  `DESCRIPTION:${escapedDescription}`,
  'END:VEVENT',
  'END:VCALENDAR'
].join('\r\n');

// Download:
const blob = new Blob([icsContent], { type: 'text/calendar' });
const url = URL.createObjectURL(blob);
// trigger download via <a> tag
```

### 10.2 ICS Escaping Rules

- Newlines: Replace `\n` with `\\n`
- Commas and semicolons: Escape with backslash
- Line length: Max 75 chars, fold with `\r\n ` (CRLF + space)
