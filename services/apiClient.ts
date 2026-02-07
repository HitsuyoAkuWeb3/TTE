/**
 * apiClient.ts — Circuit-breaker wrapper around fetch for /api/* calls.
 *
 * When the backend is unreachable, this prevents thousands of ECONNREFUSED
 * proxy errors by short-circuiting requests for a cooldown period.
 *
 * States:
 *   CLOSED   → requests pass through normally
 *   OPEN     → requests are rejected locally (no network hit) for COOLDOWN_MS
 *   HALF_OPEN → one probe request is allowed; success closes, failure re-opens
 */

const COOLDOWN_MS = 30_000; // 30 seconds

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

let circuitState: CircuitState = 'CLOSED';
let openedAt = 0;

function trip() {
  circuitState = 'OPEN';
  openedAt = Date.now();
  console.warn(`[apiClient] Circuit OPEN — backend unreachable. Suppressing requests for ${COOLDOWN_MS / 1000}s.`);
}

function close() {
  circuitState = 'CLOSED';
  openedAt = 0;
}

function isConnectionError(err: unknown): boolean {
  if (err instanceof TypeError && err.message.includes('fetch')) return true;
  if (err instanceof DOMException && err.name === 'AbortError') return false;
  // Generic network failures from the proxy 503
  return err instanceof TypeError;
}

/**
 * Drop-in replacement for `fetch()` with circuit-breaker protection.
 * Same signature as the global `fetch`.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  // --- Check circuit state ---
  if (circuitState === 'OPEN') {
    const elapsed = Date.now() - openedAt;
    if (elapsed < COOLDOWN_MS) {
      // Still in cooldown — reject locally
      return new Response(
        JSON.stringify({ error: 'Backend unavailable (circuit open)' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      );
    }
    // Cooldown expired → allow one probe
    circuitState = 'HALF_OPEN';
  }

  // --- Attempt the request ---
  try {
    const res = await fetch(input, init);

    // A 503 from our own Vite proxy error handler means backend is down
    if (res.status === 503) {
      trip();
      return res;
    }

    // Success (or any non-503 server error) → close the circuit
    if (circuitState === 'HALF_OPEN') close();
    return res;
  } catch (err) {
    if (isConnectionError(err)) {
      trip();
      return new Response(
        JSON.stringify({ error: 'Backend unavailable' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      );
    }
    throw err; // re-throw non-network errors (e.g. AbortError)
  }
}
