import React, { useState } from 'react';
import { ToolCandidate } from '../../types';
import { Button, SectionHeader } from '../Visuals';

export const EvidenceScoringPhase: React.FC<{
    candidates: ToolCandidate[],
    onUpdateCandidate: (candidates: ToolCandidate[]) => void,
    onNext: () => void,
    onBack: () => void
}> = ({ candidates, onUpdateCandidate, onNext, onBack }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const activeCandidate = candidates[activeIndex];

    const updateScore = (key: keyof ToolCandidate['scores'], val: boolean) => {
        const updated = candidates.map((c, i) => {
            if (i === activeIndex) {
                return {
                    ...c,
                    scores: {
                        ...c.scores,
                        [key]: val
                    }
                };
            }
            return c;
        });
        onUpdateCandidate(updated);
    };

    const updateProof = (key: keyof ToolCandidate['proofs'], val: string) => {
        const updated = candidates.map((c, i) => {
            if (i === activeIndex) {
                return {
                    ...c,
                    proofs: {
                        ...c.proofs,
                        [key]: val
                    }
                };
            }
            return c;
        });
        onUpdateCandidate(updated);
    };

    const getValidationStatus = () => {
        console.log('--- VALIDATING CANDIDATES ---');
        for (const c of candidates) {
            const hasUnbiddenScore = c.scores.unbiddenRequests;
            const hasUnbiddenProof = !!c.proofs.unbidden && c.proofs.unbidden.length > 0;

            const hasResultScore = c.scores.resultEvidence;
            const hasResultProof = !!c.proofs.result && c.proofs.result.length > 0;

            console.log(`Candidate ${c.plainName}:`, {
                unbiddenScore: hasUnbiddenScore,
                unbiddenProof: c.proofs.unbidden,
                resultScore: hasResultScore,
                resultProof: c.proofs.result
            });

            if (hasUnbiddenScore && !hasUnbiddenProof) {
                return { valid: false, reason: `Missing Evidence: Unbidden Requests for ${c.plainName}` };
            }
            if (hasResultScore && !hasResultProof) {
                return { valid: false, reason: `Missing Evidence: Results for ${c.plainName}` };
            }
        }
        return { valid: true };
    };

    const status = getValidationStatus();
    const isComplete = status.valid;
    console.error('[DEBUG] Validation Status (Error Level for Visibility):', status);

    return (
        <div className="max-w-3xl mx-auto w-full animate-fade-in">
            <SectionHeader
                title="Phase 3: Evidence Gates"
                subtitle="Binary Proof. No receipts = No progression."
                onBack={onBack}
            />

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

            <div className="space-y-8">
                <div className="border border-zinc-800 p-6">
                    <h3 className="text-xl font-bold mb-4 text-white">1. Unbidden Requests</h3>
                    <p className="text-zinc-400 mb-4 text-sm">Do you have 3 DMs/Emails asking for this specifically?</p>
                    <div className="flex gap-4 mb-4">
                        <Button
                            variant={activeCandidate.scores.unbiddenRequests ? 'primary' : 'secondary'}
                            onClick={() => updateScore('unbiddenRequests', true)}
                        >Yes</Button>
                        <Button
                            variant={!activeCandidate.scores.unbiddenRequests ? 'primary' : 'secondary'}
                            onClick={() => updateScore('unbiddenRequests', false)}
                        >No</Button>
                    </div>
                    {activeCandidate.scores.unbiddenRequests && (
                        <div className="animate-fade-in">
                            <label className="block text-xs uppercase text-zinc-500 mb-1">Paste Evidence</label>
                            <textarea
                                className="w-full bg-zinc-900 border border-zinc-700 text-white p-2 font-mono text-sm h-20"
                                placeholder="Paste the DM content here..."
                                value={activeCandidate.proofs.unbidden || ''}
                                onChange={(e) => updateProof('unbidden', e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="border border-zinc-800 p-6">
                    <h3 className="text-xl font-bold mb-4 text-white">2. Frictionless Doing</h3>
                    <p className="text-zinc-400 mb-4 text-sm">Can you deliver the <b>{activeCandidate.promise}</b> in 30 mins with zero prep?</p>
                    <div className="flex gap-4">
                        <Button
                            variant={activeCandidate.scores.frictionlessDoing ? 'primary' : 'secondary'}
                            onClick={() => updateScore('frictionlessDoing', true)}
                        >Yes</Button>
                        <Button
                            variant={!activeCandidate.scores.frictionlessDoing ? 'primary' : 'secondary'}
                            onClick={() => updateScore('frictionlessDoing', false)}
                        >No</Button>
                    </div>
                </div>

                <div className="border border-zinc-800 p-6">
                    <h3 className="text-xl font-bold mb-4 text-white">3. Result Evidence</h3>
                    <p className="text-zinc-400 mb-4 text-sm">Do you have a Case Study or Testimonial?</p>
                    <div className="flex gap-4 mb-4">
                        <Button
                            variant={activeCandidate.scores.resultEvidence ? 'primary' : 'secondary'}
                            onClick={() => updateScore('resultEvidence', true)}
                        >Yes</Button>
                        <Button
                            variant={!activeCandidate.scores.resultEvidence ? 'primary' : 'secondary'}
                            onClick={() => updateScore('resultEvidence', false)}
                        >No</Button>
                    </div>
                    {activeCandidate.scores.resultEvidence && (
                        <div className="animate-fade-in">
                            <label className="block text-xs uppercase text-zinc-500 mb-1">Paste Evidence</label>
                            <textarea
                                className="w-full bg-zinc-900 border border-zinc-700 text-white p-2 font-mono text-sm h-20"
                                placeholder="Paste the testimonial or metric..."
                                value={activeCandidate.proofs.result || ''}
                                onChange={(e) => updateProof('result', e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="border border-red-900/30 p-6 bg-red-900/5">
                    <h3 className="text-xl font-bold mb-4 text-red-400">4. Extraction Risk</h3>
                    <p className="text-zinc-400 mb-4 text-sm">Is this a job or an asset? If you stop, does it stop?</p>
                    <div className="flex gap-4">
                        <Button
                            variant={activeCandidate.scores.extractionRisk ? 'danger' : 'secondary'}
                            onClick={() => updateScore('extractionRisk', true)}
                        >Yes (Job)</Button>
                        <Button
                            variant={!activeCandidate.scores.extractionRisk ? 'primary' : 'secondary'}
                            onClick={() => updateScore('extractionRisk', false)}
                        >No (Asset)</Button>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-col items-end gap-2">
                {!isComplete && status.reason && (
                    <span className="text-xs text-red-500 font-bold bg-white/10 p-2 rounded">{status.reason}</span>
                )}
                <Button onClick={onNext} disabled={false}>[DEBUG MODE] Audit Completion &rarr;</Button>
            </div>
        </div>
    );
};
