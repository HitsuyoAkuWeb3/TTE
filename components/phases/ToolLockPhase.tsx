import React from 'react';
import { ToolCandidate } from '../../types';
import { Button, SectionHeader, BurnButton } from '../Visuals';
import { useVernacular } from '../../contexts/VernacularContext';

export const ToolLockPhase: React.FC<{
    candidates: ToolCandidate[],
    onLock: (id: string) => void,
    onBurn: (id: string) => void,
    onBack: () => void
}> = ({ candidates, onLock, onBurn, onBack }) => {
    const { v } = useVernacular();

    const getScore = (c: ToolCandidate) => {
        let score = 0;
        score += c.scores.unbiddenRequests;
        score += Math.round(c.scores.frictionlessDoing * 0.5);
        score += c.scores.resultEvidence;
        score -= Math.round(c.scores.extractionRisk * 0.5);
        return Math.max(0, score);
    };

    const sorted = [...candidates].sort((a, b) => getScore(b) - getScore(a));

    return (
        <div className="max-w-4xl mx-auto w-full animate-fade-in text-center">
            <SectionHeader
                title={`${v.lock_phase_prefix} ${v.phase_lock}`}
                onBack={onBack}
            />

            <div className={`grid grid-cols-1 ${candidates.length === 1 ? 'max-w-xl mx-auto' : 'md:grid-cols-3'} gap-6 mb-12`}>
                {sorted.map((c, i) => (
                    <div
                        key={c.id}
                        className={`border p-6 flex flex-col transition-all relative group
                ${i === 0 ? 'border-bone bg-zinc-900 transform scale-105 shadow-hard' : 'border-zinc-800 opacity-70 hover:opacity-100'}
                ${c.isSovereign ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : ''}
            `}
                    >
                        <h3 className="text-xl font-display font-bold mb-2 break-words">{c.plainName}</h3>
                        <div className="text-4xl font-mono mb-4">{getScore(c)} <span className="text-sm text-zinc-500">{v.label_pts}</span></div>
                        <p className="text-xs text-zinc-400 mb-6 flex-1">{c.functionStatement}</p>
                        
                        <div className="space-y-3">
                            {i === 0 && (
                                <Button onClick={() => onLock(c.id)} variant={c.isSovereign ? 'gold' : 'primary'}>
                                    {`${v.lock_confirm} ${v.starting_tool}`}
                                </Button>
                            )}
                            
                            {/* Burn Button (Target for elimination) */}
                            <div className="flex justify-center pt-2 border-t border-zinc-800/50">
                                <BurnButton onBurn={() => onBurn(c.id)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
