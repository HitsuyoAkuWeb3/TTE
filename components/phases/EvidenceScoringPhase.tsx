import React, { useState, useCallback } from 'react';
import { ToolCandidate } from '../../types';
import { Button, SectionHeader } from '../Visuals';
import { challengeScore, ChallengeResult } from '../../services/geminiService';

// ============================================================
// TACTILE SLIDER — The Weight of Truth
// ============================================================
const HEAT_COLORS = [
    'bg-zinc-700',        // 0 — neutral
    'bg-emerald-800',     // 1 — cool
    'bg-emerald-600',     // 2 — warm
    'bg-yellow-500',      // 3 — hot (threshold)
    'bg-orange-500',      // 4 — intense
    'bg-red-600',         // 5 — maximum claim
];

const HEAT_GLOW = [
    '',
    '',
    '',
    'shadow-[0_0_8px_rgba(234,179,8,0.3)]',
    'shadow-[0_0_12px_rgba(249,115,22,0.4)]',
    'shadow-[0_0_16px_rgba(220,38,38,0.5)]',
];

const TactileSlider: React.FC<{
    value: number;
    onChange: (val: number) => void;
    label: string;
    isRisk?: boolean;
}> = ({ value, onChange, label, isRisk }) => {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-xs uppercase text-zinc-500 font-mono tracking-wider">{label}</span>
                <span className={`text-2xl font-mono font-bold transition-colors duration-300 ${value === 0 ? 'text-zinc-600' :
                        isRisk ? (value >= 3 ? 'text-red-500' : 'text-emerald-500') :
                            (value >= 4 ? 'text-red-500' : value >= 3 ? 'text-yellow-500' : 'text-emerald-500')
                    }`}>
                    {value}<span className="text-xs text-zinc-600">/5</span>
                </span>
            </div>
            <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <button
                        key={i}
                        onClick={() => onChange(i)}
                        className={`
              h-10 flex-1 rounded-sm transition-all duration-200
              ${i <= value ? (isRisk ? (i >= 3 ? 'bg-red-600' : 'bg-emerald-600') : HEAT_COLORS[i]) : 'bg-zinc-900 border border-zinc-800'}
              ${i === value ? HEAT_GLOW[i] : ''}
              hover:scale-105 active:scale-95
              ${i <= value ? 'border border-transparent' : ''}
            `}
                        aria-label={`Score ${i}`}
                    >
                        <span className={`text-xs font-mono ${i <= value ? 'text-white' : 'text-zinc-700'}`}>{i}</span>
                    </button>
                ))}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                <span>NONE</span>
                <span>MAXIMUM</span>
            </div>
        </div>
    );
};

// ============================================================
// ADVERSARIAL CHALLENGER MODAL
// ============================================================
const ChallengerModal: React.FC<{
    result: ChallengeResult;
    onAcceptDowngrade: (score: number) => void;
    onProvideEvidence: () => void;
    onDismiss: () => void;
}> = ({ result, onAcceptDowngrade, onProvideEvidence, onDismiss }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-950 border border-red-900/50 max-w-lg w-full p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-900/30 border border-red-700 flex items-center justify-center">
                        <span className="text-red-500 text-lg">⚠</span>
                    </div>
                    <h3 className="text-lg font-mono font-bold text-red-400 uppercase tracking-wider">
                        Adversarial Audit
                    </h3>
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed font-mono">
                    {result.challenge}
                </p>

                <div className="border-t border-zinc-800 pt-4 space-y-3">
                    <Button
                        variant="danger"
                        onClick={() => onAcceptDowngrade(result.suggestedScore)}
                    >
                        Accept Downgrade to {result.suggestedScore}/5
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onProvideEvidence}
                    >
                        Provide Evidence Instead
                    </Button>
                    <button
                        onClick={onDismiss}
                        className="w-full text-xs text-zinc-600 hover:text-zinc-400 font-mono py-2 transition-colors"
                    >
                        Override — I stand by this score
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// EVIDENCE SCORING PHASE — The Crucible
// ============================================================
export const EvidenceScoringPhase: React.FC<{
    candidates: ToolCandidate[],
    onUpdateCandidate: (candidates: ToolCandidate[]) => void,
    onNext: () => void,
    onBack: () => void
}> = ({ candidates, onUpdateCandidate, onNext, onBack }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);
    const [challengeContext, setChallengeContext] = useState<{ key: string; dimension: string } | null>(null);
    const [isChallengingScore, setIsChallengingScore] = useState(false);

    const activeCandidate = candidates[activeIndex];

    const updateScore = useCallback((key: keyof ToolCandidate['scores'], val: number) => {
        const updated = candidates.map((c, i) => {
            if (i === activeIndex) {
                return {
                    ...c,
                    scores: { ...c.scores, [key]: val }
                };
            }
            return c;
        });
        onUpdateCandidate(updated);
    }, [candidates, activeIndex, onUpdateCandidate]);

    const updateProof = (key: keyof ToolCandidate['proofs'], val: string) => {
        const updated = candidates.map((c, i) => {
            if (i === activeIndex) {
                return {
                    ...c,
                    proofs: { ...c.proofs, [key]: val }
                };
            }
            return c;
        });
        onUpdateCandidate(updated);
    };

    const markChallengeReceived = () => {
        const updated = candidates.map((c, i) => {
            if (i === activeIndex) {
                return { ...c, challengeReceived: true };
            }
            return c;
        });
        onUpdateCandidate(updated);
    };

    // Adversarial trigger: fires on first high score without evidence, once per candidate
    const handleScoreChange = useCallback(async (
        key: keyof ToolCandidate['scores'],
        dimension: string,
        val: number,
        evidenceKey?: keyof ToolCandidate['proofs']
    ) => {
        updateScore(key, val);

        // Only challenge once per candidate, only on high scores with no evidence
        const evidence = evidenceKey ? activeCandidate.proofs[evidenceKey] : undefined;
        const shouldChallenge = val >= 4
            && (!evidence || evidence.length < 10)
            && !activeCandidate.challengeReceived;

        if (shouldChallenge) {
            setIsChallengingScore(true);
            setChallengeContext({ key, dimension });

            try {
                const result = await challengeScore(
                    activeCandidate.plainName,
                    dimension,
                    val,
                    evidence
                );

                if (!result.isJustified) {
                    setChallengeResult(result);
                    markChallengeReceived();
                }
            } catch (e) {
                console.error('[CHALLENGER] Error:', e);
            } finally {
                setIsChallengingScore(false);
            }
        }
    }, [activeCandidate, updateScore]);

    const handleAcceptDowngrade = (score: number) => {
        if (challengeContext) {
            updateScore(challengeContext.key as keyof ToolCandidate['scores'], score);
        }
        setChallengeResult(null);
        setChallengeContext(null);
    };

    const getValidationStatus = () => {
        for (const c of candidates) {
            const hasHighUnbidden = c.scores.unbiddenRequests >= 3;
            const hasUnbiddenProof = !!c.proofs.unbidden && c.proofs.unbidden.length > 0;

            const hasHighResult = c.scores.resultEvidence >= 3;
            const hasResultProof = !!c.proofs.result && c.proofs.result.length > 0;

            if (hasHighUnbidden && !hasUnbiddenProof) {
                return { valid: false, reason: `Missing Evidence: Unbidden Requests for ${c.plainName} (scored ${c.scores.unbiddenRequests}/5)` };
            }
            if (hasHighResult && !hasResultProof) {
                return { valid: false, reason: `Missing Evidence: Results for ${c.plainName} (scored ${c.scores.resultEvidence}/5)` };
            }
        }
        return { valid: true };
    };

    const status = getValidationStatus();
    const isComplete = status.valid;

    return (
        <div className="max-w-3xl mx-auto w-full animate-fade-in">
            <SectionHeader
                title="Phase 3: The Crucible"
                subtitle="Evidence Gates. High claims require high proof."
                onBack={onBack}
            />

            {/* Adversarial Challenger Modal */}
            {challengeResult && (
                <ChallengerModal
                    result={challengeResult}
                    onAcceptDowngrade={handleAcceptDowngrade}
                    onProvideEvidence={() => {
                        setChallengeResult(null);
                        setChallengeContext(null);
                    }}
                    onDismiss={() => {
                        setChallengeResult(null);
                        setChallengeContext(null);
                    }}
                />
            )}

            {/* Candidate Tabs */}
            <div className="flex gap-2 mb-8 border-b border-zinc-800 overflow-x-auto">
                {candidates.map((c, i) => (
                    <button
                        key={c.id}
                        onClick={() => setActiveIndex(i)}
                        className={`px-4 py-2 font-mono text-sm border-b-2 transition-colors whitespace-nowrap ${i === activeIndex
                            ? (c.isSovereign ? 'border-yellow-500 text-yellow-500' : 'border-white text-white')
                            : 'border-transparent text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        {c.plainName}
                    </button>
                ))}
            </div>

            {/* Challenging indicator */}
            {isChallengingScore && (
                <div className="mb-6 p-3 border border-red-900/30 bg-red-900/5 animate-pulse">
                    <span className="text-xs font-mono text-red-400 uppercase tracking-wider">
                        ⚡ Adversarial Auditor scanning your claim...
                    </span>
                </div>
            )}

            <div className="space-y-8">
                {/* Dimension 1: Unbidden Requests */}
                <div className="border border-zinc-800 p-6">
                    <h3 className="text-lg font-bold mb-2 text-white">1. Unbidden Requests</h3>
                    <p className="text-zinc-400 mb-6 text-sm">How often do people seek you out for this without prompting?</p>
                    <TactileSlider
                        value={activeCandidate.scores.unbiddenRequests}
                        onChange={(val) => handleScoreChange('unbiddenRequests', 'Unbidden Requests', val, 'unbidden')}
                        label="INBOUND DEMAND"
                    />
                    {activeCandidate.scores.unbiddenRequests >= 3 && (
                        <div className="mt-4 animate-fade-in">
                            <label className="block text-xs uppercase text-zinc-500 mb-1 font-mono">Evidence Required — Paste DMs, Emails, or Requests</label>
                            <textarea
                                className="w-full bg-zinc-900 border border-zinc-700 text-white p-3 font-mono text-sm h-20 focus:border-yellow-500 focus:outline-none transition-colors"
                                placeholder="Paste the DM content, email, or request here..."
                                value={activeCandidate.proofs.unbidden || ''}
                                onChange={(e) => updateProof('unbidden', e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Dimension 2: Frictionless Doing */}
                <div className="border border-zinc-800 p-6">
                    <h3 className="text-lg font-bold mb-2 text-white">2. Frictionless Doing</h3>
                    <p className="text-zinc-400 mb-6 text-sm">
                        Can you deliver <b className="text-zinc-200">{activeCandidate.promise}</b> in 30 mins with zero prep?
                    </p>
                    <TactileSlider
                        value={activeCandidate.scores.frictionlessDoing}
                        onChange={(val) => handleScoreChange('frictionlessDoing', 'Frictionless Doing', val)}
                        label="EXECUTION SPEED"
                    />
                </div>

                {/* Dimension 3: Result Evidence */}
                <div className="border border-zinc-800 p-6">
                    <h3 className="text-lg font-bold mb-2 text-white">3. Result Evidence</h3>
                    <p className="text-zinc-400 mb-6 text-sm">Do you have Case Studies, Testimonials, or Quantified Metrics?</p>
                    <TactileSlider
                        value={activeCandidate.scores.resultEvidence}
                        onChange={(val) => handleScoreChange('resultEvidence', 'Result Evidence', val, 'result')}
                        label="PROOF OF IMPACT"
                    />
                    {activeCandidate.scores.resultEvidence >= 3 && (
                        <div className="mt-4 animate-fade-in">
                            <label className="block text-xs uppercase text-zinc-500 mb-1 font-mono">Evidence Required — Paste Testimonial or Metric</label>
                            <textarea
                                className="w-full bg-zinc-900 border border-zinc-700 text-white p-3 font-mono text-sm h-20 focus:border-yellow-500 focus:outline-none transition-colors"
                                placeholder="Paste the testimonial, case study URL, or metric..."
                                value={activeCandidate.proofs.result || ''}
                                onChange={(e) => updateProof('result', e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Dimension 4: Extraction Risk */}
                <div className="border border-red-900/30 p-6 bg-red-900/5">
                    <h3 className="text-lg font-bold mb-2 text-red-400">4. Extraction Risk</h3>
                    <p className="text-zinc-400 mb-6 text-sm">Is this a job or an asset? If you stop, does it stop?</p>
                    <TactileSlider
                        value={activeCandidate.scores.extractionRisk}
                        onChange={(val) => updateScore('extractionRisk', val)}
                        label="DEPENDENCY LEVEL"
                        isRisk={true}
                    />
                    <p className="text-[10px] font-mono text-zinc-600 mt-2">
                        HIGH = You ARE the product (job). LOW = The product works without you (asset).
                    </p>
                </div>
            </div>

            <div className="mt-8 flex flex-col items-end gap-2">
                {!isComplete && status.reason && (
                    <span className="text-xs text-red-500 font-bold bg-red-900/10 border border-red-900/30 p-2 font-mono">
                        {status.reason}
                    </span>
                )}
                <Button onClick={onNext} disabled={!isComplete}>
                    Audit Complete → Lock Tool
                </Button>
            </div>
        </div>
    );
};
