import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVernacular } from '../contexts/VernacularContext';

// ============================================================
// CORTEX TERMINAL — Streaming Thought Signatures
// ============================================================
// Replaces static LoadingRitual spinner with a typewriter terminal
// that streams pseudo-process lines during AI thinking.
// Gives the illusion of active reasoning rather than a frozen screen.

interface CortexTerminalProps {
    phase?: string;
    /** Optional custom status lines; falls back to phase-based defaults */
    lines?: string[];
}

/** Phase-specific "thought signatures" */
const PHASE_SIGNATURES: Record<string, string[]> = {
    intro: [
        '> INITIALIZING IDENTITY MATRIX...',
        '> SCANNING SOVEREIGN PROFILE...',
        '> CALIBRATING FREQUENCY VECTOR...',
    ],
    audit: [
        '> ANALYZING SOVEREIGN VECTORS...',
        '> CROSS-REFERENCING MARKET SIGNALS...',
        '> DETECTING SHADOW BELIEFS...',
        '> COMPRESSING ONTOLOGICAL DATA...',
    ],
    scoring: [
        '> RUNNING EVIDENCE VALIDATOR...',
        '> SCORING CLAIM DENSITY...',
        '> CHECKING FORENSIC INTEGRITY...',
    ],
    pilot: [
        '> GENERATING PILOT SEQUENCE...',
        '> MAPPING 7-DAY TRAJECTORY...',
        '> ENCODING RITUAL INSTRUCTIONS...',
    ],
    refinement: [
        '> PROCESSING FIELD FEEDBACK...',
        '> RECALIBRATING PILOT VECTOR...',
        '> COMPILING REFINED SEQUENCE...',
    ],
    default: [
        '> ESTABLISHING NEURAL LINK...',
        '> PROCESSING SOVEREIGN DATA...',
        '> COMPILING RESPONSE MATRIX...',
        '> RENDERING THOUGHT SIGNATURE...',
    ],
};

export const CortexTerminal: React.FC<CortexTerminalProps> = ({ phase, lines: customLines }) => {
    const { v } = useVernacular();
    const [visibleLines, setVisibleLines] = useState<string[]>([]);
    const [currentCharIdx, setCurrentCharIdx] = useState(0);
    const [currentLineIdx, setCurrentLineIdx] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const allLines = customLines || PHASE_SIGNATURES[phase || 'default'] || PHASE_SIGNATURES.default;

    // Typewriter effect: reveal one character at a time per line
    useEffect(() => {
        if (currentLineIdx >= allLines.length) {
            // All lines typed — loop back with a pause
            const loopTimer = setTimeout(() => {
                setVisibleLines([]);
                setCurrentLineIdx(0);
                setCurrentCharIdx(0);
            }, 2000);
            return () => clearTimeout(loopTimer);
        }

        const line = allLines[currentLineIdx];
        if (currentCharIdx < line.length) {
            const charTimer = setTimeout(() => {
                setVisibleLines(prev => {
                    const updated = [...prev];
                    updated[currentLineIdx] = line.slice(0, currentCharIdx + 1);
                    return updated;
                });
                setCurrentCharIdx(c => c + 1);
            }, 25 + Math.random() * 35); // Jittered typing speed
            return () => clearTimeout(charTimer);
        }
        // Line complete — move to next after a delay
        const lineTimer = setTimeout(() => {
            setCurrentLineIdx(l => l + 1);
            setCurrentCharIdx(0);
        }, 400 + Math.random() * 300);
        return () => clearTimeout(lineTimer);

    }, [currentLineIdx, currentCharIdx, allLines]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [visibleLines]);

    return (
        <div className="flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
            {/* Pulsing indicator */}
            <div className="relative">
                <div className="w-3 h-3 bg-[#00FF41] rounded-full animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <div className="w-2 h-2 bg-[#00FF41] rounded-full relative z-10" />
            </div>

            {/* Terminal window */}
            <div
                ref={containerRef}
                className="w-full bg-zinc-900/50 border border-zinc-800 p-4 font-mono text-[10px] text-[#00FF41] h-32 overflow-y-auto relative"
            >
                {/* Scanline overlay */}
                <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,65,0.03)_2px,rgba(0,255,65,0.03)_4px)]" />

                {visibleLines.map((line, i) => (
                    <div key={`cortex-line-${i}`} className="leading-relaxed">
                        {line}
                        {i === currentLineIdx && (
                            <span className="inline-block w-[6px] h-[10px] bg-[#00FF41] ml-px animate-pulse" />
                        )}
                    </div>
                ))}

                {/* Show cursor on empty state */}
                {visibleLines.length === 0 && (
                    <div className="text-zinc-600">
                        {'>'} <span className="inline-block w-[6px] h-[10px] bg-[#00FF41]/50 animate-pulse" />
                    </div>
                )}
            </div>

            {/* Status label */}
            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.3em]">
                {v.cortex_status || 'PROCESSING'}
            </div>
        </div>
    );
};
