// ============================================================
// ACTIVE INTERROGATION — Post-Phase Socratic Challenge
// ============================================================
// Fires after major phase completions to force elaboration
// and transfer. The system asks contextual questions that
// require the operator to APPLY knowledge, not just recall it.
//
// Scoring:
//   Specificity (0-5): How concrete and measurable is the answer?
//   Transfer (0-5):    Does the answer connect to real projects?
//   Both ≥ 3 = PASS → XP award + proceed
//   Either < 3 = FAIL → re-prompt with Socratic hint
// ============================================================

import React, { useState, useCallback } from 'react';
import { generateInterrogationChallenge, scoreInterrogationResponse, InterrogationScore } from '../services/geminiService';
import { OperatorProfile, Phase } from '../types';
import { useVernacular } from '../contexts/VernacularContext';


interface InterrogationModalProps {
    phase: Phase;
    profile: OperatorProfile;
    /** Dynamic context injected per-phase */
    context: Record<string, string>;
    onPass: () => void;
    onDismiss: () => void;
}

// Phase-specific challenge prompts
const PHASE_CHALLENGES: Partial<Record<Phase, string>> = {
    [Phase.TOOL_COMPRESSION]: 'The operator just compressed their tools. Their top tool is "{toolName}". A prospective client says "We already have someone who does that." Generate ONE sharp challenge question that forces the operator to articulate their unique differentiation. Max 30 words.',
    [Phase.EVIDENCE_SCORING]: 'The operator just scored their evidence. They rated "{dimension}" a {score}/5. Generate ONE question that demands they prove this score with a specific, verifiable example from their work. Max 30 words.',
    [Phase.VALUE_SYNTHESIS]: 'The operator just synthesized their Theory of Value. Their fatal wound is "{fatalWound}". Generate ONE question that forces them to explain exactly how their tool cauterizes this wound. Max 30 words.',
    [Phase.INSTALLATION]: 'The operator just drafted a pilot protocol for "{clientName}". Generate ONE question about what specific outcome the client should see in the first 7 days. Max 30 words.',
};



export const InterrogationModal: React.FC<InterrogationModalProps> = ({
    phase,
    profile,
    context,
    onPass,
    onDismiss,
}) => {
    const { v } = useVernacular();
    const [question, setQuestion] = useState<string | null>(null);
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState<InterrogationScore | null>(null);
    const [loading, setLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);

    const MAX_ATTEMPTS = 3;
    const PASS_THRESHOLD = 3;

    // Generate the challenge question
    const generateChallenge = useCallback(async () => {
        const template = PHASE_CHALLENGES[phase];
        if (!template) {
            onDismiss(); // No challenge for this phase
            return;
        }

        // Interpolate context into template
        let prompt = template;
        Object.entries(context).forEach(([key, val]) => {
            prompt = prompt.replace(`{${key}}`, val);
        });

        setLoading(true);
        const challengeText = await generateInterrogationChallenge(prompt, profile.preferredTone);
        setQuestion(challengeText);
        setLoading(false);
    }, [phase, context, profile, onDismiss]);

    // Score the operator's response
    const scoreResponse = useCallback(async () => {
        if (!answer.trim() || !question) return;

        setLoading(true);
        const scored = await scoreInterrogationResponse(question, answer, profile.preferredTone);
        setResult(scored);
        setAttempts(prev => prev + 1);
        setLoading(false);
    }, [answer, question, profile]);

    const isPassing = result && result.specificity >= PASS_THRESHOLD && result.transfer >= PASS_THRESHOLD;
    const canRetry = attempts < MAX_ATTEMPTS && result && !isPassing;

    // Auto-generate challenge on mount
    React.useEffect(() => {
        generateChallenge();
    }, [generateChallenge]);

    if (loading && !question) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                <div className="text-cyan-400 font-mono text-sm animate-pulse">
                    ◈ Generating challenge...
                </div>
            </div>
        );
    }

    if (!question) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-void border border-cyan-800/40 rounded-lg max-w-lg w-full p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
                        ◈ {v.interrogation_title || 'ACTIVE INTERROGATION'}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-600 uppercase">
                        {attempts}/{MAX_ATTEMPTS}
                    </div>
                </div>

                {/* Challenge Question */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4">
                    <p className="text-sm font-mono text-zinc-300 leading-relaxed">
                        {question}
                    </p>
                </div>

                {/* Answer Input */}
                {!isPassing && (
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder={v.interrogation_placeholder || 'Respond with specifics — names, numbers, outcomes...'}
                        className="w-full bg-zinc-900/30 border border-zinc-700 rounded p-4 text-sm font-mono text-zinc-300 placeholder-zinc-700 resize-none h-28 focus:outline-none focus:border-cyan-700 transition-colors"
                        disabled={loading}
                    />
                )}

                {/* Scoring Result */}
                {result && (
                    <div className={`border rounded p-4 space-y-2 ${
                        isPassing 
                            ? 'border-emerald-700/40 bg-emerald-950/10'
                            : 'border-amber-700/40 bg-amber-950/10'
                    }`}>
                        <div className="flex gap-6 text-xs font-mono">
                            <div>
                                <span className="text-zinc-500">Specificity: </span>
                                <span className={result.specificity >= PASS_THRESHOLD ? 'text-emerald-400' : 'text-amber-400'}>
                                    {result.specificity}/5
                                </span>
                            </div>
                            <div>
                                <span className="text-zinc-500">Transfer: </span>
                                <span className={result.transfer >= PASS_THRESHOLD ? 'text-emerald-400' : 'text-amber-400'}>
                                    {result.transfer}/5
                                </span>
                            </div>
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                            {result.feedback}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    {/* Skip after max attempts */}
                    {(attempts >= MAX_ATTEMPTS && !isPassing) && (
                        <button
                            onClick={onDismiss}
                            className="px-4 py-2 text-xs font-mono text-zinc-500 border border-zinc-800 rounded hover:border-zinc-700 transition-colors"
                        >
                            Skip
                        </button>
                    )}

                    {canRetry && (
                        <button
                            onClick={() => { setResult(null); setAnswer(''); }}
                            className="px-4 py-2 text-xs font-mono text-amber-400 border border-amber-800/40 rounded hover:border-amber-700 transition-colors"
                        >
                            Retry
                        </button>
                    )}

                    {isPassing ? (
                        <button
                            onClick={onPass}
                            className="px-4 py-2 text-xs font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-700/40 rounded hover:border-emerald-600 transition-colors"
                        >
                            ✓ Proceed (+{v.interrogation_xp || '40'} XP)
                        </button>
                    ) : !result && (
                        <button
                            onClick={scoreResponse}
                            disabled={loading || answer.trim().length < 10}
                            className={`px-4 py-2 text-xs font-mono rounded transition-colors ${
                                loading || answer.trim().length < 10
                                    ? 'text-zinc-700 border border-zinc-800 cursor-not-allowed'
                                    : 'text-cyan-400 border border-cyan-800/40 hover:border-cyan-700'
                            }`}
                        >
                            {loading ? 'Analyzing...' : 'Submit'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
