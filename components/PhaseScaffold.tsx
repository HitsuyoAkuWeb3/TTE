// ============================================================
// PHASE SCAFFOLD — JIT Knowledge Scaffolding
// ============================================================
// Pre-phase cognitive primer: before the operator enters a
// major phase, this overlay delivers a 3-bullet executive
// summary of what they're about to do, why it matters, and
// what "good" looks like.
//
// Static templates for speed. No AI call needed — these are
// domain-model knowledge baked into the system.
// ============================================================

import React, { useState, useEffect } from 'react';
import { Phase } from '../types';
import { useVernacular } from '../contexts/VernacularContext';

interface PhaseScaffoldProps {
    phase: Phase;
    onProceed: () => void;
}

interface ScaffoldContent {
    title: string;
    bullets: string[];
    successSignal: string;
}

// ── Static Phase Primers ─────────────────────────────────────
// These are domain-model knowledge — the "textbook" content
// that primes the operator's mental model before action.
// Returns null for phases that don't need scaffolding.

const PHASE_SCAFFOLDS: Partial<Record<Phase, ScaffoldContent>> = {
    [Phase.ARMORY_AUDIT]: {
        title: 'ARMORY AUDIT — What Happens Next',
        bullets: [
            'You will list every tool, skill, and credential you use professionally',
            'The system will score each on evidence strength (0-5) and relevance',
            'Weak items get burned. Strong items become sovereign assets.',
        ],
        successSignal: 'A focused armory of 3-5 killer tools with evidence scores ≥ 3',
    },
    [Phase.TOOL_COMPRESSION]: {
        title: 'TOOL COMPRESSION — What Happens Next',
        bullets: [
            'Your armory gets compressed into a single, irreplaceable tool definition',
            'The AI analyzes overlaps, redundancies, and hidden leverage',
            'You must articulate what makes your approach undeniable.',
        ],
        successSignal: 'One tool. One sentence. No competitor can replicate it.',
    },
    [Phase.EVIDENCE_SCORING]: {
        title: 'EVIDENCE SCORING — What Happens Next',
        bullets: [
            'Each claim about your tool will be forensically verified',
            'Scores range from 0 (unsubstantiated) to 5 (data-backed proof)',
            'Inflated scores get flagged. The system demands receipts.',
        ],
        successSignal: 'Every claim rated ≥ 3 with concrete evidence attached',
    },
    [Phase.VALUE_SYNTHESIS]: {
        title: 'VALUE SYNTHESIS — What Happens Next',
        bullets: [
            "Your tool, evidence, and market data fuse into a Theory of Value",
            'This is the strategic document that justifies your pricing',
            "It identifies the client's fatal wound and how you cauterize it.",
        ],
        successSignal: 'A Theory of Value that makes pricing feel inevitable',
    },
    [Phase.INSTALLATION]: {
        title: 'INSTALLATION — What Happens Next',
        bullets: [
            'You will draft a 90-day pilot protocol for a specific client',
            'The protocol names deliverables, timelines, and measurable outcomes',
            'This is the bridge from theory to revenue.',
        ],
        successSignal: 'A signed pilot that proves value in the first 7 days',
    },
};

export const PhaseScaffold: React.FC<PhaseScaffoldProps> = ({ phase, onProceed }) => {
    const { v } = useVernacular();
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState<Set<Phase>>(new Set());

    const scaffold = PHASE_SCAFFOLDS[phase];

    useEffect(() => {
        if (scaffold && !dismissed.has(phase)) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [phase, scaffold, dismissed]);

    if (!visible || !scaffold) return null;

    const handleProceed = () => {
        setDismissed(prev => new Set(prev).add(phase));
        setVisible(false);
        onProceed();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
            <div className="bg-void border border-zinc-700/40 rounded-lg max-w-md w-full p-6 space-y-5">
                {/* Header */}
                <div className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
                    ◇ {v.scaffold_title || scaffold.title}
                </div>

                {/* Bullets */}
                <div className="space-y-3">
                    {scaffold.bullets.map((bullet, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span className="text-zinc-600 font-mono text-xs mt-0.5 shrink-0">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <p className="text-sm text-zinc-300 font-mono leading-relaxed">
                                {bullet}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Success Signal */}
                <div className="bg-emerald-950/10 border border-emerald-800/20 rounded p-3">
                    <div className="text-[9px] font-mono text-emerald-600 uppercase tracking-widest mb-1">
                        {v.scaffold_success_signal || 'WHAT GOOD LOOKS LIKE'}
                    </div>
                    <p className="text-xs font-mono text-emerald-400/80 leading-relaxed">
                        {scaffold.successSignal}
                    </p>
                </div>

                {/* CTA */}
                <button
                    onClick={handleProceed}
                    className="w-full py-3 text-xs font-mono text-zinc-300 uppercase tracking-widest
                        border border-zinc-700/40 rounded hover:border-zinc-600
                        transition-colors bg-zinc-900/30 hover:bg-zinc-900/50"
                >
                    {v.scaffold_proceed || 'I understand. Begin.'}
                </button>
            </div>
        </div>
    );
};
