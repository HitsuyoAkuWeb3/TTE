import React, { useState, useCallback } from 'react';
import { OperatorProfile, TheoryOfValue, SignalFidelityResult } from '../types';
import { Button } from './Visuals';
import { useVernacular } from '../contexts/VernacularContext';
import { analyzeSignalFidelity } from '../services/geminiService';

// ============================================================
// THE TONE WARDEN — Signal Fidelity Engine
// ============================================================
// Scans draft content against the Operator's locked identity.
// Detects "Signal Drift" and generates Sovereign rewrites.
// Invoked from RitualDashboard as a modal overlay.
// ============================================================

interface ToneWardenProps {
    profile: OperatorProfile;
    theoryOfValue: TheoryOfValue;
    onClose: () => void;
    /** 'advisory' = user-initiated scan, 'intercept' = gate before submission */
    mode?: 'advisory' | 'intercept';
    /** Called in intercept mode with analysis verdict */
    onIntercept?: (verdict: { blocked: boolean; score: number }) => void;
    /** Pre-fill draft text in intercept mode */
    initialDraft?: string;
}

const SEVERITY_STYLES: Record<string, { color: string; border: string }> = {
    high: { color: 'text-red-400', border: 'border-red-800/50' },
    medium: { color: 'text-yellow-400', border: 'border-yellow-800/50' },
    low: { color: 'text-zinc-400', border: 'border-zinc-700' },
};

function getScoreColor(score: number): string {
    if (score < 0) return 'text-zinc-600';
    if (score < 40) return 'text-red-400';
    if (score < 70) return 'text-yellow-400';
    return 'text-emerald-400';
}

function getScoreGlow(score: number): string {
    if (score < 0) return '';
    if (score < 40) return 'shadow-[0_0_20px_rgba(248,113,113,0.3)]';
    if (score < 70) return 'shadow-[0_0_20px_rgba(250,204,21,0.3)]';
    return 'shadow-[0_0_20px_rgba(52,211,153,0.3)]';
}

export const ToneWarden: React.FC<ToneWardenProps> = ({
    profile, theoryOfValue, onClose, mode = 'advisory', onIntercept, initialDraft = ''
}) => {
    const [draft, setDraft] = useState(initialDraft);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<SignalFidelityResult | null>(null);
    const [copied, setCopied] = useState(false);
    const { v } = useVernacular();

    const isIntercept = mode === 'intercept';
    const isBlocked = isIntercept && result !== null && result.fidelityScore < 70;

    const handleAnalyze = useCallback(async () => {
        if (!draft.trim() || isAnalyzing) return;
        setIsAnalyzing(true);
        setResult(null);
        try {
            const analysis = await analyzeSignalFidelity(draft, profile, theoryOfValue);
            setResult(analysis);
            if (isIntercept && onIntercept) {
                onIntercept({ blocked: analysis.fidelityScore < 70, score: analysis.fidelityScore });
            }
        } catch (err) {
            console.error('[TONE WARDEN] UI error:', err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [draft, profile, theoryOfValue, isAnalyzing, isIntercept, onIntercept]);

    const handleCopy = useCallback(async () => {
        if (!result?.sovereignRewrite) return;
        try {
            await navigator.clipboard.writeText(result.sovereignRewrite);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback: select the text
            const el = document.getElementById('warden-rewrite');
            if (el) {
                const range = document.createRange();
                range.selectNodeContents(el);
                window.getSelection()?.removeAllRanges();
                window.getSelection()?.addRange(range);
            }
        }
    }, [result]);

    return (
        <div className="fixed inset-0 bg-void/90 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-2xl w-full border border-zinc-800 bg-void p-8 shadow-brutal relative overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Scanline decoration */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20 animate-scan"></div>

                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-xl font-display font-black tracking-tighter uppercase">{v.warden_title}</h2>
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1">{v.warden_subtitle}</p>
                    </div>
                    <button onClick={onClose} className={`text-zinc-600 hover:text-bone transition-colors text-xs font-mono uppercase ${
                        isBlocked ? 'opacity-30 cursor-not-allowed' : ''
                    }`} disabled={isBlocked}>[ Close ]</button>
                </div>

                {/* Draft Input */}
                <div className="mb-6">
                    <label htmlFor="warden-draft" className="block text-[10px] uppercase text-zinc-500 mb-2 font-mono">{v.warden_input_label}</label>
                    <textarea
                        id="warden-draft"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-700 p-4 font-mono text-sm text-bone focus:border-white outline-none transition-colors h-32 resize-none"
                        placeholder={v.warden_input_placeholder}
                        disabled={isAnalyzing}
                    />
                </div>

                {/* Analyze / Intercept Result */}
                {isBlocked ? (
                    <div className="mb-6 p-4 border border-red-800 bg-red-900/10 space-y-2">
                        <div className="text-xs font-mono text-red-400 uppercase tracking-wider font-bold">
                            {v.warden_intercept_blocked}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono">
                            {v.warden_intercept_warning}
                        </p>
                    </div>
                ) : (
                    <Button
                        onClick={handleAnalyze}
                        className="w-full py-4 relative group overflow-hidden mb-6"
                        disabled={isAnalyzing || !draft.trim()}
                    >
                        <span className="relative z-10">{isAnalyzing ? v.warden_analyzing : v.warden_analyze_cta}</span>
                        <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                    </Button>
                )}

                {/* Results */}
                {result && (
                    <div className="space-y-6 animate-fade-in">

                        {/* Fidelity Score */}
                        <div className={`border border-zinc-800 bg-zinc-900/50 p-6 text-center ${getScoreGlow(result.fidelityScore)}`}>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{v.warden_score_label}</div>
                            <div className={`text-5xl font-black font-display ${getScoreColor(result.fidelityScore)}`}>
                                {result.fidelityScore < 0 ? '—' : result.fidelityScore}
                            </div>
                            <div className="text-[9px] text-zinc-600 uppercase mt-2 font-mono tracking-widest">
                                {result.fidelityScore < 0 && 'ANALYSIS ERROR'}
                                {result.fidelityScore >= 0 && result.fidelityScore < 40 && 'COMMODITY DRIFT — TOTAL SIGNAL LOSS'}
                                {result.fidelityScore >= 40 && result.fidelityScore < 70 && 'PARTIAL SIGNAL — DRIFT DETECTED'}
                                {result.fidelityScore >= 70 && result.fidelityScore < 90 && 'STRONG SIGNAL — MINOR DRIFT'}
                                {result.fidelityScore >= 90 && 'SOVEREIGN LOCK — SIGNAL INTEGRITY CONFIRMED'}
                            </div>
                        </div>

                        {/* Drift Items */}
                        {result.driftItems.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-[10px] text-red-400 uppercase tracking-widest font-mono">{v.warden_drift_label} ({result.driftItems.length})</div>
                                {result.driftItems.map((item, i) => {
                                    const styles = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.low;
                                    return (
                                        <div key={`drift-${i}`} className={`border ${styles.border} bg-zinc-900/30 p-3 flex items-start gap-3`}>
                                            <span className={`text-[10px] uppercase font-mono font-bold ${styles.color} shrink-0 w-16`}>
                                                {item.severity}
                                            </span>
                                            <div>
                                                <span className="text-sm text-bone font-mono">"{item.phrase}"</span>
                                                <p className="text-[11px] text-zinc-400 mt-1">{item.reason}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Sovereign Rewrite */}
                        <div className="border border-spirit/20 bg-spirit/5 p-5 space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="text-[10px] text-spirit uppercase tracking-widest font-mono">{v.warden_rewrite_label}</div>
                                <button
                                    onClick={handleCopy}
                                    className="text-[10px] font-mono px-3 py-1 border border-spirit/30 text-spirit hover:bg-spirit/10 transition-all uppercase tracking-wider"
                                >
                                    {copied ? '✓ COPIED' : v.warden_copy_cta}
                                </button>
                            </div>
                            <div id="warden-rewrite" className="text-sm text-bone font-mono leading-relaxed whitespace-pre-wrap">
                                {result.sovereignRewrite}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 text-[8px] font-mono text-zinc-700 uppercase tracking-[0.4em] text-center">
                    SIGNAL FIDELITY ENGINE v1.0
                </div>
            </div>
        </div>
    );
};
