import React, { useState } from 'react';
import { ArmoryItem, ToolCandidate } from '../../types';
import { synthesizeToolDefinition, synthesizeSovereignAuthority } from '../../services/geminiService';
import { Button, SectionHeader } from '../Visuals';

export const ToolCompressionPhase: React.FC<{
    armory: ArmoryItem[],
    onSelectCandidates: (candidates: ToolCandidate[]) => void,
    onNext: () => void,
    onBack: () => void
}> = ({ armory, onSelectCandidates, onNext, onBack }) => {
    const [selections, setSelections] = useState<string[]>([]);
    const [candidates, setCandidates] = useState<ToolCandidate[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [synthesizingSovereign, setSynthesizingSovereign] = useState(false);

    const toggleSelection = (id: string) => {
        if (selections.includes(id)) {
            setSelections(s => s.filter(x => x !== id));
        } else {
            if (selections.length < 3) {
                setSelections(s => [...s, id]);
            }
        }
    };

    const handleCompress = async () => {
        setAnalyzing(true);
        const newCandidates: ToolCandidate[] = [];

        // gemini-3-pro-preview (Thinking) processes each item deeply
        for (const id of selections) {
            const item = armory.find(i => i.id === id);
            if (!item) continue;

            const analysis = await synthesizeToolDefinition(item.verb, item.quadrant);

            newCandidates.push({
                id: item.id,
                originalVerb: item.verb,
                plainName: analysis.plainName,
                functionStatement: analysis.functionStatement,
                promise: analysis.promise,
                antiPitch: analysis.antiPitch,
                scores: { unbiddenRequests: false, frictionlessDoing: false, resultEvidence: false, extractionRisk: false },
                proofs: {}
            });
        }

        setCandidates(newCandidates);
        onSelectCandidates(newCandidates);
        setAnalyzing(false);
    };

    const handleSovereign = async () => {
        setSynthesizingSovereign(true);
        const sovereign = await synthesizeSovereignAuthority(candidates);
        const result = [sovereign];
        setCandidates(result);
        onSelectCandidates(result);
        setSynthesizingSovereign(false);
    }

    if (candidates.length > 0) {
        // Check if we already have a single Sovereign candidate
        const isSovereign = candidates.length === 1 && candidates[0].isSovereign;

        return (
            <div className="max-w-5xl mx-auto w-full animate-fade-in">
                <SectionHeader
                    title="Phase 2: Market Synthesis"
                    subtitle="The Engine has compressed your skills into commercially viable functions."
                    onBack={onBack}
                />
                <div className={`grid grid-cols-1 ${isSovereign ? 'md:grid-cols-1 max-w-2xl mx-auto' : 'md:grid-cols-3'} gap-6`}>
                    {candidates.map((c, idx) => (
                        <div
                            key={c.id}
                            className={`border bg-zinc-900/50 flex flex-col h-full relative group transition-all duration-500
                ${c.isSovereign ? 'border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]' : 'border-zinc-700'}
              `}
                        >
                            <div className={`absolute top-0 right-0 p-2 text-black text-[10px] font-bold uppercase
                  ${c.isSovereign ? 'bg-yellow-500' : 'bg-white'}
              `}>
                                {c.isSovereign ? 'SOVEREIGN AUTHORITY' : `Candidate 0${idx + 1}`}
                            </div>
                            <div className="p-6 flex-grow">
                                <div className="text-zinc-500 font-mono text-xs mb-2 uppercase">{c.originalVerb}</div>
                                <h3 className="text-2xl font-black mb-4 text-white uppercase break-words">{c.plainName}</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Function</label>
                                        <p className="text-sm font-mono text-zinc-300">{c.functionStatement}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">The Promise</label>
                                        <p className="text-sm font-mono text-zinc-300">{c.promise}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-red-500/70 uppercase font-bold block mb-1">Anti-Pitch</label>
                                        <p className="text-sm font-mono text-zinc-400 italic">"{c.antiPitch}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex justify-between items-center border-t border-zinc-800 pt-6">
                    {/* Option to refine into Sovereign if we haven't already */}
                    {!isSovereign ? (
                        <Button
                            variant="gold"
                            onClick={handleSovereign}
                            disabled={synthesizingSovereign}
                            className="flex-1 mr-4"
                        >
                            {synthesizingSovereign ? 'Synthesizing Authority...' : 'Refine into One Sovereign Authority'}
                        </Button>
                    ) : <div className="flex-1"></div>}

                    <Button onClick={onNext}>Proceed to Evidence &rarr;</Button>
                </div>
            </div>
        );
    }

    // Selection View
    return (
        <div className="max-w-4xl mx-auto w-full animate-fade-in">
            <SectionHeader
                title="Phase 2: Skill Selection"
                subtitle="Select 3 core activities. The AI will synthesize them into market roles."
                onBack={onBack}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {armory.map(item => (
                    <button
                        key={item.id}
                        onClick={() => toggleSelection(item.id)}
                        className={`p-4 border text-left transition-all ${selections.includes(item.id)
                                ? 'border-white bg-white text-black'
                                : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                            }`}
                    >
                        <div className="font-bold text-sm mb-1">{item.verb}</div>
                        <div className="text-[10px] font-mono opacity-60">{item.quadrant}</div>
                    </button>
                ))}
            </div>

            <div className="flex justify-end gap-4 items-center">
                <span className="font-mono text-zinc-500 text-sm">{selections.length} / 3 Selected</span>
                <Button
                    disabled={selections.length !== 3 || analyzing}
                    onClick={handleCompress}
                >
                    {analyzing ? (
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            Synthesizing Market Function...
                        </span>
                    ) : 'Compress into Market Function'}
                </Button>
            </div>
            {analyzing && (
                <div className="text-center mt-4 text-xs font-mono text-zinc-500 animate-pulse">
                    Applying 32k context reasoning to niche down...
                </div>
            )}
        </div>
    );
};
