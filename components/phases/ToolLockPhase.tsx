import React from 'react';
import { ToolCandidate } from '../../types';
import { Button, SectionHeader } from '../Visuals';

export const ToolLockPhase: React.FC<{
    candidates: ToolCandidate[],
    onLock: (id: string) => void,
    onBack: () => void
}> = ({ candidates, onLock, onBack }) => {
    const getScore = (c: ToolCandidate) => {
        let score = 0;
        if (c.scores.unbiddenRequests) score += 2;
        if (c.scores.frictionlessDoing) score += 1;
        if (c.scores.resultEvidence) score += 2;
        if (c.scores.extractionRisk) score -= 1;
        return score;
    };

    const sorted = [...candidates].sort((a, b) => getScore(b) - getScore(a));

    return (
        <div className="max-w-4xl mx-auto w-full animate-fade-in text-center">
            <SectionHeader title="Phase 4: The Verdict" onBack={onBack} />

            <div className={`grid grid-cols-1 ${candidates.length === 1 ? 'max-w-xl mx-auto' : 'md:grid-cols-3'} gap-6 mb-12`}>
                {sorted.map((c, i) => (
                    <div
                        key={c.id}
                        className={`border p-6 flex flex-col transition-all
                ${i === 0 ? 'border-white bg-zinc-900 transform scale-105' : 'border-zinc-800 opacity-50'}
                ${c.isSovereign ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : ''}
            `}
                    >
                        <h3 className="text-xl font-bold mb-2 break-words">{c.plainName}</h3>
                        <div className="text-4xl font-mono mb-4">{getScore(c)} <span className="text-sm text-zinc-500">PTS</span></div>
                        <p className="text-xs text-zinc-400 mb-6">{c.functionStatement}</p>
                        {i === 0 && (
                            <Button onClick={() => onLock(c.id)} variant={c.isSovereign ? 'gold' : 'primary'}>
                                Confirm Starting Tool
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
