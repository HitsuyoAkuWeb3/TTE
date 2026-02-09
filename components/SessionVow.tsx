import React, { useState, useRef, useCallback } from 'react';
import { useVernacular } from '../contexts/VernacularContext';

// ============================================================
// SESSION VOW — The Airlock
// ============================================================
// A full-screen intent overlay shown on each session start.
// The operator must acknowledge their strategic goal before
// the workspace unlocks. This isn't a modal — it's a ceremony.
// ============================================================

interface SessionVowProps {
    strategicGoal?: string;
    operatorName?: string;
    onAcknowledge: (goal: string) => void;
}

export const SessionVow: React.FC<SessionVowProps> = ({
    strategicGoal,
    operatorName,
    onAcknowledge,
}) => {
    const { v } = useVernacular();
    const [holdProgress, setHoldProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const [editableGoal, setEditableGoal] = useState(strategicGoal || '');
    const [isEditing, setIsEditing] = useState(!strategicGoal);
    const [ignited, setIgnited] = useState(false);
    const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isTestMode = typeof window !== 'undefined' && window.location.href.includes('test_user=true');
    console.log('[SessionVow] isTestMode:', isTestMode, 'URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
    const HOLD_DURATION_MS = isTestMode ? 50 : 3000;
    const TICK_MS = 16;

    // ── Power-on animation state ──
    const [borderPhase, setBorderPhase] = useState(0);
    React.useEffect(() => {
        const t1 = setTimeout(() => setBorderPhase(1), 200);  // top
        const t2 = setTimeout(() => setBorderPhase(2), 500);  // right
        const t3 = setTimeout(() => setBorderPhase(3), 800);  // bottom
        const t4 = setTimeout(() => setBorderPhase(4), 1100); // left — full frame
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }, []);

    const startFill = useCallback(() => {
        if (!editableGoal.trim() || isHolding) return;
        setIsHolding(true);
        setHoldProgress(0);
        let elapsed = 0;
        holdTimerRef.current = setInterval(() => {
            elapsed += TICK_MS;
            const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
            setHoldProgress(pct);
            if (pct >= 100) {
                if (holdTimerRef.current) clearInterval(holdTimerRef.current);
                setIgnited(true);
                setTimeout(() => onAcknowledge(editableGoal.trim()), 600);
            }
        }, TICK_MS);
    }, [editableGoal, onAcknowledge, isHolding]);

    const cancelFill = useCallback(() => {
        setIsHolding(false);
        setHoldProgress(0);
        if (holdTimerRef.current) {
            clearInterval(holdTimerRef.current);
            holdTimerRef.current = null;
        }
    }, []);

    return (
        <div className={`fixed inset-0 z-999 bg-void flex items-center justify-center transition-opacity duration-500 ${ignited ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {/* Grid ignition border */}
            <div className="absolute inset-4 pointer-events-none">
                <div className={`absolute top-0 left-0 h-px bg-spirit/40 transition-all duration-500 ease-out ${borderPhase >= 1 ? 'w-full' : 'w-0'}`} />
                <div className={`absolute top-0 right-0 w-px bg-spirit/40 transition-all duration-500 ease-out ${borderPhase >= 2 ? 'h-full' : 'h-0'}`} />
                <div className={`absolute bottom-0 right-0 h-px bg-spirit/40 transition-all duration-500 ease-out ${borderPhase >= 3 ? 'w-full' : 'w-0'}`} style={{ direction: 'rtl' }} />
                <div className={`absolute bottom-0 left-0 w-px bg-spirit/40 transition-all duration-500 ease-out ${borderPhase >= 4 ? 'h-full' : 'h-0'}`} style={{ transformOrigin: 'bottom' }} />
            </div>

            <div className="max-w-2xl w-full px-8 text-center space-y-12">
                {/* System status */}
                <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.4em] animate-fade-in">
                    {v.session_vow_title}
                </div>

                {/* Greeting */}
                {operatorName && (
                    <div className="text-sm font-mono text-zinc-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        {v.session_vow_operator_label}: <span className="text-bone">{operatorName.toUpperCase()}</span>
                    </div>
                )}

                {/* The Vow */}
                <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.3em]">
                        {isEditing ? v.session_vow_define_directive : v.session_vow_directive_label}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            <textarea
                                value={editableGoal}
                                onChange={(e) => setEditableGoal(e.target.value)}
                                placeholder={v.session_vow_placeholder}
                                className="w-full bg-transparent border border-zinc-800 focus:border-spirit/50 text-bone font-display text-lg text-center px-6 py-4 outline-none resize-none transition-colors placeholder:text-zinc-700"
                                rows={2}
                                maxLength={200}
                                autoFocus
                            />
                            {editableGoal.trim() && (
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="text-[10px] font-mono text-spirit hover:text-bone transition-colors uppercase tracking-widest"
                                >
                                    {v.session_vow_confirm}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="font-display text-xl md:text-2xl text-bone leading-relaxed tracking-wide">
                                "{editableGoal}"
                            </p>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-[9px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest"
                            >
                                {v.session_vow_edit}
                            </button>
                        </div>
                    )}
                </div>

                {/* Hold-to-acknowledge button */}
                {!isEditing && editableGoal.trim() && (
                    <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.9s' }}>
                        <button
                        onClick={() => {
                            if (isTestMode) {
                                console.log('SessionVow: Test Mode Click Bypass');
                                setIgnited(true);
                                setTimeout(() => onAcknowledge(editableGoal.trim()), 100);
                            } else {
                                startFill();
                            }
                        }}
                        disabled={isHolding}
                        className="relative overflow-hidden border border-zinc-700 hover:border-spirit/40 text-bone font-mono text-[11px] uppercase tracking-[0.3em] px-12 py-4 transition-all duration-200 select-none cursor-pointer disabled:cursor-default"
                    >
                        {/* Progress fill */}
                        <div
                            className="absolute inset-0 bg-spirit/15 transition-none"
                            style={{ width: `${holdProgress}%` }}
                        />
                        <span className="relative z-10">
                            {isHolding ? v.session_vow_initializing : v.session_vow_hold}
                        </span>
                    </button>

                        {/* Progress ring indicator */}
                        <div className="flex justify-center">
                            <svg width="24" height="24" className="transform -rotate-90">
                                <circle
                                    cx="12" cy="12" r="10"
                                    stroke="#27272a" strokeWidth="1.5" fill="none"
                                />
                                <circle
                                    cx="12" cy="12" r="10"
                                    stroke="#00FFFF" strokeWidth="1.5" fill="none"
                                    strokeDasharray={`${2 * Math.PI * 10}`}
                                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - holdProgress / 100)}`}
                                    className="transition-none"
                                />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Bottom status */}
                <div className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.4em] animate-fade-in" style={{ animationDelay: '1.2s' }}>
                    {v.system_name || 'TETRATOOL ENGINE'} v2.0
                </div>
            </div>
        </div>
    );
};
