// ============================================================
// SIMULATION CHAMBER — Practice & Rehearsal Engine
// ============================================================
// The Simulation Chamber spawns scenario-based practice
// challenges that let the operator rehearse critical skills
// in a safe environment before facing real clients.
//
// Each simulation presents:
//   1. A scenario (client objection, competitor claim, etc.)
//   2. The operator crafts a response
//   3. AI grades the response on tactical quality
//   4. XP awarded for successful simulations
// ============================================================

import React, { useState, useCallback } from 'react';
import { OperatorProfile, ToolCandidate, TheoryOfValue } from '../types';
import { generateInterrogationChallenge, scoreInterrogationResponse } from '../services/geminiService';
import { useVernacular } from '../contexts/VernacularContext';

interface SimulationScenario {
    id: string;
    label: string;
    setup: string;
    promptTemplate: string;
}

interface SimulationChamberProps {
    tool: ToolCandidate;
    profile: OperatorProfile;
    theoryOfValue?: TheoryOfValue | null;
    onComplete: (passed: boolean, score: number, transcript?: { challenge: string; response: string }) => void;
    onCancel: () => void;
}

// ── Scenario Library ─────────────────────────────────────────
const SCENARIOS: SimulationScenario[] = [
    {
        id: 'objection-price',
        label: 'Price Objection',
        setup: 'A prospect says: "Your competitor charges half your price. Why should I pay more?"',
        promptTemplate: 'The operator\'s tool is "{toolName}" in the {industry} industry. Their prospect says: "Your competitor charges half your price. Why should I pay more?" Generate ONE sharp scenario follow-up question that forces the operator to articulate value beyond pricing. Max 25 words.',
    },
    {
        id: 'objection-proof',
        label: 'Proof of Results',
        setup: 'A skeptical buyer asks: "Show me data. What specific outcomes have you produced?"',
        promptTemplate: 'The operator uses "{toolName}" for {industry} clients. A skeptical buyer demands: "Show me specific results data." Generate ONE challenge that forces the operator to cite real, verifiable outcomes. Max 25 words.',
    },
    {
        id: 'competitor-claim',
        label: 'Competitor Displacement',
        setup: 'Your prospect already works with a competitor. They say: "We\'re happy with our current provider."',
        promptTemplate: 'The operator\'s tool is "{toolName}". A prospect says: "We\'re happy with our current provider." Generate ONE pointed question forcing the operator to reveal what the competitor CANNOT do. Max 25 words.',
    },
    {
        id: 'scope-creep',
        label: 'Scope Protection',
        setup: 'Mid-project, a client asks for deliverables outside your original agreement.',
        promptTemplate: 'The operator delivers "{toolName}" services. A client asks for out-of-scope work. Generate ONE question that forces the operator to defend their boundaries while preserving the relationship. Max 25 words.',
    },
    {
        id: 'cold-open',
        label: 'Cold Open Pitch',
        setup: 'You have 30 seconds at a networking event. Someone asks: "So, what do you do?"',
        promptTemplate: 'The operator\'s tool is "{toolName}" for the {industry} space. They have 30 seconds to explain what they do. Generate ONE challenge question that demands a non-generic, memorable elevator response. Max 25 words.',
    },
];

export const SimulationChamber: React.FC<SimulationChamberProps> = ({
    tool,
    profile,
    theoryOfValue,
    onComplete,
    onCancel,
}) => {
    const toolName = tool.plainName;
    const { v } = useVernacular();
    const [scenario, setScenario] = useState<SimulationScenario | null>(null);
    const [challenge, setChallenge] = useState<string | null>(null);
    const [response, setResponse] = useState('');
    const [score, setScore] = useState<{ specificity: number; transfer: number; feedback: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const PASS_THRESHOLD = 3;

    // Sanitize inputs to prevent prompt injection (H127)
    const sanitize = (str: string) => str.replace(/[{}]/g, '').trim().slice(0, 50);

    // Pick a random scenario and generate the challenge
    const startSimulation = useCallback(async () => {
        const picked = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
        setScenario(picked);
        setResponse('');
        setScore(null);
        setLoading(true);

        const safeTool = sanitize(toolName);
        const safeIndustry = sanitize(profile.industry || 'professional services');

        const prompt = picked.promptTemplate
            .replace('{toolName}', safeTool)
            .replace('{industry}', safeIndustry);

        const text = await generateInterrogationChallenge(prompt, profile.preferredTone);
        setChallenge(text);
        setLoading(false);
    }, [toolName, profile]);

    // Score operator's response
    const submitResponse = useCallback(async () => {
        if (!challenge || !response.trim()) return;
        setLoading(true);
        const result = await scoreInterrogationResponse(challenge, response, profile.preferredTone);
        setScore(result);
        setLoading(false);
        // Note: onComplete is triggered by the user clicking the pass button,
        // not automatically here. This prevents the parent from unmounting
        // the component before the operator can review their score.
    }, [challenge, response, profile]);

    // Auto-start on mount
    React.useEffect(() => {
        startSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isPassing = score && score.specificity >= PASS_THRESHOLD && score.transfer >= PASS_THRESHOLD;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
            <div className="bg-void border border-amber-800/30 rounded-lg max-w-lg w-full p-6 space-y-5 shadow-hard">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="text-sm font-display text-amber-400 uppercase tracking-widest font-bold">
                        ⧫ {v.simulation_title || 'SIMULATION CHAMBER'}
                    </div>
                    {scenario && (
                        <div className="text-[9px] font-mono text-zinc-600 uppercase">
                            {scenario.label}
                        </div>
                    )}
                </div>

                {/* Loading state */}
                {loading && !challenge && (
                    <div className="text-center py-8">
                        <span className="text-amber-400/60 font-mono text-sm animate-pulse">
                            {v.simulation_start_btn ? `${v.simulation_start_btn}...` : 'Generating scenario...'}
                        </span>
                    </div>
                )}

                {/* Scenario Setup */}
                {scenario && challenge && (
                    <>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4">
                            <p className="text-xs font-mono text-zinc-500 mb-2 uppercase">{v.simulation_archetype_label || 'Scenario'}</p>
                            <p className="text-sm font-mono text-zinc-300 leading-relaxed">
                                {scenario.setup}
                            </p>
                        </div>

                        {/* Challenge */}
                        <div className="bg-amber-950/10 border border-amber-800/20 rounded p-4">
                            <p className="text-xs font-mono text-amber-600 mb-2 uppercase">Challenge</p>
                            <p className="text-sm font-mono text-amber-300/80 leading-relaxed">
                                {challenge}
                            </p>
                        </div>

                        {/* Response Input */}
                        {!isPassing && (
                            <textarea
                                value={response}
                                onChange={e => setResponse(e.target.value)}
                                placeholder={v.simulation_placeholder || 'Craft your response — be specific, tactical, and concrete...'}
                                className="w-full bg-zinc-900/30 border border-zinc-700 rounded p-4 text-sm font-mono text-zinc-300 placeholder-zinc-700 resize-none h-28 focus:outline-none focus:border-amber-700 transition-colors"
                                disabled={loading}
                            />
                        )}

                        {/* Score Display */}
                        {score && (
                            <div className={`border rounded p-4 space-y-2 ${
                                isPassing
                                    ? 'border-emerald-700/40 bg-emerald-950/10'
                                    : 'border-red-700/40 bg-red-950/10'
                            }`}>
                                <div className="text-[10px] font-mono uppercase tracking-wider mb-2 opacity-70">
                                    {v.simulation_score_label || 'PERFORMANCE SCORE'}
                                </div>
                                <div className="flex gap-6 text-xs font-mono">
                                    <div>
                                        <span className="text-zinc-500">Tactical: </span>
                                        <span className={score.specificity >= PASS_THRESHOLD ? 'text-emerald-400' : 'text-red-400'}>
                                            {score.specificity}/5
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500">Authority: </span>
                                        <span className={score.transfer >= PASS_THRESHOLD ? 'text-emerald-400' : 'text-red-400'}>
                                            {score.transfer}/5
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                                    {score.feedback}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 text-xs font-mono text-zinc-500 border border-zinc-800 rounded hover:border-zinc-700 transition-colors"
                            >
                                {v.simulation_exit || 'Exit'}
                            </button>

                            {isPassing ? (
                                <button
                                    onClick={() => onComplete(true, (score?.specificity || 0) + (score?.transfer || 0), { challenge: challenge || '', response })}
                                    className="px-4 py-2 text-xs font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-700/40 rounded hover:border-emerald-600 transition-colors"
                                >
                                    ✓ {v.simulation_pass_msg || 'Simulation Complete'}
                                </button>
                            ) : score ? (
                                <button
                                    onClick={() => { setScore(null); setResponse(''); }}
                                    className="px-4 py-2 text-xs font-mono text-amber-400 border border-amber-800/40 rounded hover:border-amber-700 transition-colors"
                                >
                                    {v.simulation_fail_msg || 'Retry'}
                                </button>
                            ) : (
                                <button
                                    onClick={submitResponse}
                                    disabled={loading || response.trim().length < 10}
                                    className={`px-4 py-2 text-xs font-mono rounded transition-colors ${
                                        loading || response.trim().length < 10
                                            ? 'text-zinc-700 border border-zinc-800 cursor-not-allowed'
                                            : 'text-amber-400 border border-amber-800/40 hover:border-amber-700'
                                    }`}
                                >
                                    {loading ? 'Analyzing...' : 'Submit'}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
