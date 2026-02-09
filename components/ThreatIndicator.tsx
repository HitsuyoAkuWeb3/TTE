import React from 'react';
import { getTelemetry, type FlowState } from '../services/operatorTelemetry';
import { useVernacular } from '../contexts/VernacularContext';

// ============================================================
// THREAT LEVEL INDICATOR — The Sovereign Pulse
// ============================================================
// A persistent navbar element that communicates the operator's
// current cognitive state using color psychology:
//   Cyan   (flow)     → Optimal — you're in the zone
//   Amber  (struggle) → Caution — you're grinding
//   Red    (drift)    → Breach  — attention has wandered
//   Dim    (idle)     → Offline — no recent activity
// ============================================================

const FLOW_CONFIG: Record<FlowState, { color: string; bg: string; pulse: boolean }> = {
    flow:     { color: '#00FFFF', bg: 'bg-[#00FFFF]', pulse: true },
    struggle: { color: '#F59E0B', bg: 'bg-[#F59E0B]', pulse: true },
    drift:    { color: '#FF3333', bg: 'bg-[#FF3333]', pulse: false },
    idle:     { color: '#52525B', bg: 'bg-zinc-600',   pulse: false },
};

export const ThreatIndicator: React.FC = () => {
    const { v } = useVernacular();
    const [flowState, setFlowState] = React.useState<FlowState>('idle');

    // Poll telemetry every 3 seconds
    React.useEffect(() => {
        const interval = setInterval(() => {
            const t = getTelemetry();
            setFlowState(t.flowState);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const config = FLOW_CONFIG[flowState];

    // Map state to vernacular label
    const labelMap: Record<FlowState, string> = {
        flow: v.flow_optimal,
        struggle: v.flow_caution,
        drift: v.flow_breach,
        idle: v.flow_offline,
    };
    const label = labelMap[flowState];

    return (
        <div className="relative group/threat" title={`Flow State: ${label}`}>
            {/* The dot */}
            <div
                className={`w-2 h-2 rounded-full ${config.bg} ${config.pulse ? 'animate-pulse-slow' : ''}`}
                style={{ boxShadow: `0 0 6px ${config.color}40` }}
            />

            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50
                px-3 py-1.5 w-max bg-zinc-900 border border-zinc-700
                text-[9px] font-mono text-zinc-400 uppercase tracking-wider
                opacity-0 pointer-events-none group-hover/threat:opacity-100
                transition-opacity duration-200
            ">
                <span style={{ color: config.color }}>●</span> {label}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-0 w-1.5 h-1.5 bg-zinc-900 border-l border-t border-zinc-700 rotate-45" />
            </div>
        </div>
    );
};
