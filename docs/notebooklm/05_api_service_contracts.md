# TTE API & Service Contracts

## 1. Gemini Proxy — `/api/gemini`

**File**: `api/gemini.ts`
**Method**: `POST`
**Purpose**: Server-side proxy for all Gemini text generation. Keeps `GEMINI_API_KEY` off the client.

### Request Body
```typescript
{
  model: string;              // e.g., "gemini-2.5-flash-preview-04-17"
  contents: any;              // Gemini content array
  config?: any;               // Generation config (temperature, etc.)
  systemInstruction?: string; // The Sovereign Daemon persona + Cortex
  thinkingBudget?: number;    // Token budget for thinking models (1k–24k)
}
```

### Response
```typescript
// 200 OK
{ text: string; candidates: any[] }

// 502 Bad Gateway
{ error: string; message: string; shouldFallback: true }
```

### Client-Side Caller
`geminiService.ts` → `callGeminiProxy()` wraps all calls to this endpoint. Uses `apiClient.ts` for HTTP transport.

### Circuit Breaker Pattern
`generateWithFallback()` in `geminiService.ts`:
1. Try primary model (with thinking budget)
2. On failure, retry with fallback model (simpler config)
3. Returns `{ text, candidates }` or throws

### Models Used
- **Primary**: Thinking-capable model (e.g., `gemini-2.5-flash-preview-04-17`)
- **Fallback**: Standard flash model (e.g., `gemini-2.0-flash`)
- **Evidence Verification**: `gemini-2.0-flash` (server-side only)

### Thinking Budgets (Token Limits)
- Classification: ~1,000 tokens
- Analysis: ~4,000 tokens
- Synthesis: ~8,000 tokens
- Theory of Value: ~24,000 tokens

## 2. Evidence Verification — `/api/verify-evidence`

**File**: `api/verify-evidence.ts`
**Method**: `POST`
**Purpose**: Fetches a URL server-side (bypassing CORS) and uses Gemini to verify if the page content supports a claimed piece of evidence.

### Request Body
```typescript
{ url: string; claim: string }
```

### Response
```typescript
{
  verified: boolean;
  confidence: number;   // 0–100
  reason: string;       // One-sentence explanation
}
```

### Process
1. Fetch URL with `AbortSignal.timeout(10000)` (10s)
2. Strip `<script>` and `<style>` blocks (iterative, non-regex to avoid ReDoS)
3. Strip remaining HTML tags
4. Collapse whitespace, cap at 5,000 chars
5. Send to `gemini-2.0-flash` with forensic verification prompt
6. Parse JSON response, return result

### Error Handling
All errors return `200` with `{ verified: false, confidence: 0, reason: "..." }` — never throws to the client.

## 3. Session CRUD — `/api/db/sessions`

**File**: `api/db/sessions.ts`
**Auth**: Requires `x-clerk-user-id` header

### GET — List Sessions
```
GET /api/db/sessions
Headers: { x-clerk-user-id: string }
Response: { sessions: Array<{id, data, version, finalized, created_at, updated_at}> }
```
Returns all sessions for the authenticated user, ordered by `updated_at DESC`.

### POST — Upsert Session
```
POST /api/db/sessions
Headers: { x-clerk-user-id: string }
Body: { id?: string, data: SystemState, version?: number, finalized?: boolean }
Response: { id, version, finalized }
```
Uses PostgreSQL `ON CONFLICT` for idempotent upserts. Auto-generates UUID if no `id` provided.

**CRITICAL**: UUID values must use `::uuid` cast in SQL (Hazard #137).

## 4. Snapshot CRUD — `/api/db/snapshots`

**File**: `api/db/snapshots.ts`
**Auth**: Requires `x-clerk-user-id` header

Stores append-only version snapshots of finalized dossiers. Each snapshot contains:
```typescript
{
  version: number;
  finalizedAt: number;
  state: SystemState;
}
```

## 5. Profile CRUD — `/api/db/profile`

**File**: `api/db/profile.ts`
**Auth**: Requires `x-clerk-user-id` header

Stores the `OperatorProfile`:
```typescript
{
  name: string;
  industry: string;
  strategicGoal: string;
  preferredTone: 'clinical' | 'empathetic' | 'aggressive' | 'minimalist';
}
```

## 6. Cron: Daily Cleanup — `/api/cron/cleanup`

**File**: `api/cron/cleanup.ts`
**Schedule**: `0 3 * * *` (daily at 3 AM UTC, configured in `vercel.json`)
**Auth**: `req.headers.authorization === 'Bearer ${process.env.CRON_SECRET}'`

Cleans up orphaned sessions, expired data, etc.

## 7. Database Schema (Neon Postgres)

**Connection**: `@neondatabase/serverless`, configured via `POSTGRES_URL` env var.

### Tables
```sql
sessions (
  id          UUID PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  data        JSONB NOT NULL,        -- Full SystemState object
  version     INTEGER DEFAULT 1,
  finalized   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
)

snapshots (
  id          UUID PRIMARY KEY,
  session_id  UUID REFERENCES sessions(id),
  version     INTEGER,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)

profiles (
  id          UUID PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
)
```

## 8. Client-Side API Client

**File**: `services/apiClient.ts`
**Purpose**: Centralized HTTP client for all API calls from the React app.

Handles:
- Automatic `x-clerk-user-id` header injection
- JSON serialization/deserialization
- Error handling and retry logic

## 9. Live API (WebSocket) — Client-Side Only

**File**: `services/geminiService.ts` (functions: `connectLiveSession`, `disconnectLiveSession`)
**Purpose**: Real-time voice conversation during the Installation phase.
**NOTE**: This is the ONLY feature that uses the Gemini API key directly on the client (via Vite `define` block). All other AI calls go through the `/api/gemini` proxy.

### Architecture
- WebSocket connection to Gemini Live API
- `AudioWorkletProcessor` captures mic input
- PCM encoding at 16kHz mono for input
- PCM decoding for audio playback output
- Module-level singletons: `inputAudioContext`, `outputAudioContext`, `currentSession`

### Key Functions
- `connectLiveSession()` — Opens WebSocket, registers audio worklet, starts streaming
- `disconnectLiveSession()` — Closes session, releases audio contexts, cleans up nodes
- `decode(base64)` — Base64 → Uint8Array for audio data
- `pcmToAudioBuffer(data, ctx, sampleRate, channels)` — Raw PCM → playable AudioBuffer
- `createPcmData(float32Array)` — Float32 → Int16 PCM → Base64 for sending

## 10. Environment Variables

| Variable                    | Location   | Purpose |
|:----------------------------|:-----------|:--------|
| `GEMINI_API_KEY`            | Server + Client (via `define`) | Gemini SDK auth |
| `POSTGRES_URL`              | Server only | Neon Postgres connection |
| `CLERK_PUBLISHABLE_KEY`     | Client     | Clerk frontend auth |
| `CRON_SECRET`               | Server only | Cron job authorization |

### Vite `define` Block
In `vite.config.ts`, the API key is exposed to the client for Live API (WebSocket) only:
```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

**CAUTION**: Do NOT delete the `define` block during refactoring (Hazard #135). This breaks the entire build.

## 11. Dev Server Configuration

**File**: `vite.config.ts`
- **Port**: `3795`
- **Host**: `localhost`
- **API Proxy**: `/api` → `http://localhost:8000` (for local development with `vercel dev`)
- **Proxy Error Handling**: Returns 503 with helpful message if backend is unavailable
- **Code Coverage**: Istanbul plugin (opt-in via `VITE_COVERAGE=true`)
