// ============================================================
// STUDENT MODEL — Operator Telemetry & Flow State Detection
// ============================================================
// Tracks interaction patterns to detect struggle/flow/drift.
// The Pedagogical Coach and Daemon Whispers consume this data
// to adapt system behavior in real-time.
// ============================================================

import { Phase } from '../types';

// ── Types ────────────────────────────────────────────────────

export type FlowState = 'flow' | 'struggle' | 'drift' | 'idle';

export interface PhaseVisit {
    phase: Phase;
    enteredAt: number;   // timestamp ms
    exitedAt?: number;
    interactions: number; // keystrokes, clicks, submissions
    retries: number;      // re-submissions within the phase
}

export interface OperatorTelemetry {
    sessionStartedAt: string;               // ISO string
    currentPhase: Phase | null;
    currentPhaseEnteredAt: number | null;
    phaseVisits: PhaseVisit[];
    totalInteractions: number;
    flowState: FlowState;
    lastInteractionAt: number;              // timestamp ms
}

// ── Constants ────────────────────────────────────────────────

/** Phase dwell thresholds (ms) */
const STRUGGLE_THRESHOLD_MS = 3 * 60 * 1000;   // 3 min without interaction = struggle
const DRIFT_THRESHOLD_MS = 5 * 60 * 1000;      // 5 min without interaction = drift
const IDLE_THRESHOLD_MS = 10 * 60 * 1000;       // 10 min = idle

/** Retry threshold: more than N retries in a phase = struggle */
const RETRY_STRUGGLE_THRESHOLD = 3;

/** Minimum interactions per minute for flow state */
const FLOW_INTERACTIONS_PER_MIN = 2;

// ── State ────────────────────────────────────────────────────

let _telemetry: OperatorTelemetry = createFreshTelemetry();

function createFreshTelemetry(): OperatorTelemetry {
    return {
        sessionStartedAt: new Date().toISOString(),
        currentPhase: null,
        currentPhaseEnteredAt: null,
        phaseVisits: [],
        totalInteractions: 0,
        flowState: 'idle',
        lastInteractionAt: Date.now(),
    };
}

// ── Public API ───────────────────────────────────────────────

/** Get current telemetry snapshot (read-only) */
export function getTelemetry(): Readonly<OperatorTelemetry> {
    return { ..._telemetry, flowState: detectFlowState() };
}

/** Reset telemetry (e.g., on session start or Dossier Cremation) */
export function resetTelemetry(): void {
    _telemetry = createFreshTelemetry();
}

/** Record entry into a phase */
export function recordPhaseEntry(phase: Phase): void {
    // Close previous phase visit if still open
    if (_telemetry.currentPhase !== null && _telemetry.currentPhaseEnteredAt !== null) {
        const openVisit = _telemetry.phaseVisits.find(
            v => v.phase === _telemetry.currentPhase && !v.exitedAt
        );
        if (openVisit) {
            openVisit.exitedAt = Date.now();
        }
    }

    _telemetry.currentPhase = phase;
    _telemetry.currentPhaseEnteredAt = Date.now();
    _telemetry.lastInteractionAt = Date.now();
    _telemetry.phaseVisits.push({
        phase,
        enteredAt: Date.now(),
        interactions: 0,
        retries: 0,
    });
}

/** Record exit from a phase */
export function recordPhaseExit(phase: Phase): void {
    const openVisit = _telemetry.phaseVisits.find(
        v => v.phase === phase && !v.exitedAt
    );
    if (openVisit) {
        openVisit.exitedAt = Date.now();
    }
    if (_telemetry.currentPhase === phase) {
        _telemetry.currentPhase = null;
        _telemetry.currentPhaseEnteredAt = null;
    }
}

/** Record any user interaction (keystroke, click, submit) */
export function recordInteraction(): void {
    _telemetry.totalInteractions++;
    _telemetry.lastInteractionAt = Date.now();

    // Increment current phase visit interactions
    const currentVisit = _telemetry.phaseVisits.find(
        v => v.phase === _telemetry.currentPhase && !v.exitedAt
    );
    if (currentVisit) {
        currentVisit.interactions++;
    }
}

/** Record a retry/resubmission in the current phase */
export function recordRetry(): void {
    const currentVisit = _telemetry.phaseVisits.find(
        v => v.phase === _telemetry.currentPhase && !v.exitedAt
    );
    if (currentVisit) {
        currentVisit.retries++;
    }
    recordInteraction();
}

/** Get average dwell time for a specific phase (ms) */
export function getAveragePhaseDwell(phase: Phase): number {
    const completedVisits = _telemetry.phaseVisits.filter(
        v => v.phase === phase && v.exitedAt
    );
    if (completedVisits.length === 0) return 0;
    const total = completedVisits.reduce(
        (sum, v) => sum + (v.exitedAt! - v.enteredAt), 0
    );
    return total / completedVisits.length;
}

/** Get total retries for a specific phase */
export function getPhaseRetries(phase: Phase): number {
    return _telemetry.phaseVisits
        .filter(v => v.phase === phase)
        .reduce((sum, v) => sum + v.retries, 0);
}

// ── Flow State Detection ─────────────────────────────────────

/**
 * Detects the operator's current flow state based on:
 * 1. Time since last interaction
 * 2. Retry frequency in current phase
 * 3. Interaction velocity
 */
export function detectFlowState(): FlowState {
    const now = Date.now();
    const silenceMs = now - _telemetry.lastInteractionAt;

    // Idle: long silence
    if (silenceMs >= IDLE_THRESHOLD_MS) return 'idle';

    // Drift: medium silence
    if (silenceMs >= DRIFT_THRESHOLD_MS) return 'drift';

    // Check current phase for struggle signals
    const currentVisit = _telemetry.phaseVisits.find(
        v => v.phase === _telemetry.currentPhase && !v.exitedAt
    );

    if (currentVisit) {
        // Struggle: too many retries
        if (currentVisit.retries >= RETRY_STRUGGLE_THRESHOLD) return 'struggle';

        // Struggle: long dwell with low interaction rate
        const dwellMs = now - currentVisit.enteredAt;
        if (dwellMs >= STRUGGLE_THRESHOLD_MS) {
            const minutesInPhase = dwellMs / (1000 * 60);
            const interactionsPerMin = currentVisit.interactions / Math.max(1, minutesInPhase);
            if (interactionsPerMin < FLOW_INTERACTIONS_PER_MIN) return 'struggle';
        }
    }

    // Flow: active and not struggling
    return 'flow';
}
