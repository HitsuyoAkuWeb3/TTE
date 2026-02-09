// ============================================================
// DAEMON WHISPER — Ambient Pedagogical Coaching Overlay
// ============================================================
// A non-intrusive coaching layer that appears when the Student
// Model detects struggle, drift, or idle states.
// SILENT during flow — never interrupts productive work.
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateWhisper, DaemonWhisperResult } from '../services/geminiService';
import { detectFlowState, FlowState, getTelemetry } from '../services/operatorTelemetry';
import { OperatorProfile, Phase } from '../types';
import { useVernacular } from '../contexts/VernacularContext';

interface DaemonWhisperProps {
    phase: Phase;
    profile?: OperatorProfile | null;
    toolName?: string;
}

/** Polling interval to check flow state (ms) */
const POLL_INTERVAL_MS = 30_000; // Check every 30 seconds

/** Minimum time between whispers to avoid spamming */
const WHISPER_COOLDOWN_MS = 120_000; // 2 minutes between whispers

/** How long a whisper stays visible before fading */
const WHISPER_DISPLAY_MS = 15_000; // 15 seconds

const WHISPER_STYLES: Record<DaemonWhisperResult['type'], { icon: string; color: string; border: string }> = {
    hint: { icon: '◈', color: 'text-cyan-400/60', border: 'border-cyan-800/30' },
    provocation: { icon: '⚡', color: 'text-amber-400/60', border: 'border-amber-800/30' },
    nudge: { icon: '◇', color: 'text-zinc-400/50', border: 'border-zinc-700/30' },
};

export const DaemonWhisper: React.FC<DaemonWhisperProps> = ({ phase, profile, toolName }) => {
    const { mode } = useVernacular();
    const [whisper, setWhisper] = useState<DaemonWhisperResult | null>(null);
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const lastWhisperAt = useRef<number>(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const requestWhisper = useCallback(async (flowState: FlowState) => {
        // Only whisper for non-flow states
        if (flowState === 'flow') return;

        // Respect cooldown
        if (Date.now() - lastWhisperAt.current < WHISPER_COOLDOWN_MS) return;

        try {
            const result = await generateWhisper(phase, flowState, profile, toolName, mode);
            lastWhisperAt.current = Date.now();
            setWhisper(result);
            setVisible(true);
            setDismissed(false);

            // Auto-hide after display duration
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setVisible(false);
            }, WHISPER_DISPLAY_MS);
        } catch {
            // Silent failure — whispers are non-critical
        }
    }, [phase, profile, toolName, mode]);

    // Poll flow state
    useEffect(() => {
        const interval = setInterval(() => {
            const flowState = detectFlowState();
            if (flowState !== 'flow' && !dismissed) {
                requestWhisper(flowState);
            }
        }, POLL_INTERVAL_MS);

        return () => {
            clearInterval(interval);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [requestWhisper, dismissed]);

    // Reset dismissed state when phase changes
    useEffect(() => {
        setDismissed(false);
        setVisible(false);
        setWhisper(null);
    }, [phase]);

    // Also check flow state immediately when telemetry indicates non-flow
    useEffect(() => {
        const telemetry = getTelemetry();
        if (telemetry.flowState !== 'flow' && !dismissed) {
            // Delay initial whisper by 60s to let the user settle in
            const initialDelay = setTimeout(() => {
                const currentState = detectFlowState();
                if (currentState !== 'flow') {
                    requestWhisper(currentState);
                }
            }, 60_000);
            return () => clearTimeout(initialDelay);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    if (!whisper || !visible || dismissed) return null;

    const style = WHISPER_STYLES[whisper.type];

    return (
        <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40
                max-w-md px-5 py-3 
                bg-void/90 backdrop-blur-sm
                border ${style.border} rounded
                transition-all duration-1000 ease-in-out
                animate-fade-in
                cursor-pointer
            `}
            onClick={() => setDismissed(true)}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <span className={`${style.color} text-sm mt-0.5 shrink-0`}>
                    {style.icon}
                </span>
                <p className={`${style.color} text-[11px] font-mono leading-relaxed tracking-wide`}>
                    {whisper.whisper}
                </p>
            </div>
            <div className="text-[8px] text-zinc-700 font-mono mt-1 text-right uppercase tracking-widest">
                daemon whisper · click to dismiss
            </div>
        </div>
    );
};
