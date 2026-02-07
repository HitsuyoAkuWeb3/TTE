import React, { useState } from 'react';
import { ArmoryItem, ToolCandidate } from '../../types';
import { synthesizeToolDefinition, synthesizeSovereignAuthority, suggestMerge, MergeSuggestion } from '../../services/geminiService';
import { Button, SectionHeader } from '../Visuals';
import { useVernacular } from '../../contexts/VernacularContext';

const ARMORY_HARD_CAP = 15;

export const ToolCompressionPhase: React.FC<{
    armory: ArmoryItem[],
    onSelectCandidates: (candidates: ToolCandidate[]) => void,
    onRemoveItems: (ids: string[]) => void,
    onRenameItem: (id: string, newName: string) => void,
    onNext: () => void,
    onBack: () => void
}> = ({ armory, onSelectCandidates, onRemoveItems, onRenameItem, onNext, onBack }) => {
    const [selections, setSelections] = useState<string[]>([]);
    const [candidates, setCandidates] = useState<ToolCandidate[]>([]);
    const { mode, v } = useVernacular();
    const [analyzing, setAnalyzing] = useState(false);
    const [synthesizingSovereign, setSynthesizingSovereign] = useState(false);

    // Compression algorithm state
    const [mergeSuggestions, setMergeSuggestions] = useState<MergeSuggestion[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);

    const isOverCap = armory.length > ARMORY_HARD_CAP;

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
                scores: { unbiddenRequests: 0, frictionlessDoing: 0, resultEvidence: 0, extractionRisk: 0 },
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

    const handleSuggestMerge = async () => {
        setIsCompressing(true);
        const items = armory.map(a => ({ id: a.id, name: a.verb, quadrant: a.quadrant }));
        const suggestions = await suggestMerge(items);
        setMergeSuggestions(suggestions);
        setIsCompressing(false);
    };

    const handleAcceptMerge = (suggestion: MergeSuggestion) => {
        // Remove all but the first item in the merge group
        const keepId = suggestion.mergeIds[0];
        const removeIds = suggestion.mergeIds.slice(1);

        // Rename the kept item to the suggested name
        onRenameItem(keepId, suggestion.suggestedName);
        // Remove the others
        onRemoveItems(removeIds);

        // Remove this suggestion from the list
        setMergeSuggestions(prev => prev.filter(s => s.suggestedName !== suggestion.suggestedName));
    };

    const handleDismissMerge = (suggestion: MergeSuggestion) => {
        setMergeSuggestions(prev => prev.filter(s => s.suggestedName !== suggestion.suggestedName));
    };

    if (candidates.length > 0) {
        const isSovereign = candidates.length === 1 && candidates[0].isSovereign;

        return (
            <div className="max-w-5xl mx-auto w-full animate-fade-in">
                <SectionHeader
                    title={mode === 'plain' ? `Step 2: Your ${v.tool_plural}` : 'Phase 2: Market Synthesis'}
                    subtitle={mode === 'plain' ? 'We turned your skills into roles you can sell.' : 'The Engine has compressed your skills into commercially viable functions.'}
                    onBack={onBack}
                />
                <div className={`grid grid-cols-1 ${isSovereign ? 'md:grid-cols-1 max-w-2xl mx-auto' : 'md:grid-cols-3'} gap-6`}>
                    {candidates.map((c, idx) => (
                        <div
                            key={c.id}
                            className={`border bg-zinc-900/50 flex flex-col h-full relative group transition-all duration-500
                ${c.isSovereign ? 'border-[#00FF41]/50 shadow-[0_0_30px_rgba(0,255,65,0.1)]' : 'border-zinc-700'}
              `}
                        >
                            <div className={`absolute top-0 right-0 p-2 text-black text-[10px] font-bold uppercase
                  ${c.isSovereign ? 'bg-[#00FF41]' : 'bg-white'}
              `}>
                                {c.isSovereign ? (mode === 'plain' ? 'YOUR TOP SKILL' : 'SOVEREIGN AUTHORITY') : `Candidate 0${idx + 1}`}
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
                    {!isSovereign ? (
                        <Button
                            variant="gold"
                            onClick={handleSovereign}
                            disabled={synthesizingSovereign}
                            className="flex-1 mr-4"
                        >
                            {synthesizingSovereign ? (mode === 'plain' ? 'Combining...' : 'Synthesizing Authority...') : (mode === 'plain' ? 'Combine Into One Top Skill' : 'Refine into One Sovereign Authority')}
                        </Button>
                    ) : <div className="flex-1"></div>}

                    <Button onClick={onNext}>{mode === 'plain' ? 'Next Step →' : 'Proceed to Evidence →'}</Button>
                </div>
            </div>
        );
    }

    // Selection View
    return (
        <div className="max-w-4xl mx-auto w-full animate-fade-in">
            <SectionHeader
                title={mode === 'plain' ? `Step 2: Pick Your Top ${v.tool_plural}` : 'Phase 2: Skill Selection'}
                subtitle={mode === 'plain' ? 'Choose 3 things you do best. We will figure out how to sell them.' : 'Select 3 core activities. The AI will synthesize them into market roles.'}
                onBack={onBack}
            />

            {/* Hard Cap Warning */}
            {isOverCap && (
                <div className="mb-6 p-4 border border-red-800/50 bg-red-900/10 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-mono text-red-400 uppercase">
                            {mode === 'plain' ? `⚠ TOO MANY SKILLS: ${armory.length} (max: ${ARMORY_HARD_CAP})` : `⚠ ARMORY OVERLOADED: ${armory.length} items (cap: ${ARMORY_HARD_CAP})`}
                        </p>
                        <button
                            onClick={handleSuggestMerge}
                            disabled={isCompressing}
                            className="text-[10px] font-mono px-3 py-1.5 border border-yellow-700 text-yellow-500 hover:bg-yellow-900/20 transition-all disabled:opacity-50"
                        >
                            {isCompressing ? '⟳ Analyzing...' : '⚡ AI Merge Suggestions'}
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                        {mode === 'plain'
                            ? `Focus on the 20% of skills that create 80% of your value. Remove or merge until you have ${ARMORY_HARD_CAP} or fewer.`
                            : `The 80/20 rule: your top 20% of skills generate 80% of value. Compress or delete until ≤ ${ARMORY_HARD_CAP}.`
                        }
                    </p>
                </div>
            )}

            {/* AI Merge Suggestions */}
            {mergeSuggestions.length > 0 && (
                <div className="mb-6 space-y-3">
                    <h4 className="text-[10px] uppercase text-yellow-500 font-mono tracking-widest">{mode === 'plain' ? 'Suggested Combinations' : 'Compression Recommendations'}</h4>
                    {mergeSuggestions.map((s) => (
                        <div key={s.suggestedName} className="border border-yellow-800/30 bg-yellow-900/5 p-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {s.mergeNames.map((n, i) => (
                                        <React.Fragment key={n}>
                                            <span className="text-xs font-mono text-zinc-400 px-2 py-0.5 border border-zinc-700">{n}</span>
                                            {i < s.mergeNames.length - 1 && <span className="text-zinc-600">+</span>}
                                        </React.Fragment>
                                    ))}
                                    <span className="text-zinc-500 mx-2">→</span>
                                    <span className="text-xs font-mono font-bold text-yellow-400 px-2 py-0.5 border border-yellow-700">{s.suggestedName}</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 italic">{s.reason}</p>
                                <div className="flex gap-2 mt-1">
                                    <button
                                        onClick={() => handleAcceptMerge(s)}
                                        className="text-[10px] font-mono px-3 py-1 bg-emerald-900/30 border border-emerald-800 text-emerald-400 hover:bg-emerald-800/50 transition-all"
                                    >
                                        Accept Merge
                                    </button>
                                    <button
                                        onClick={() => handleDismissMerge(s)}
                                        className="text-[10px] font-mono px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
                    ) : (mode === 'plain' ? 'Analyze My Top Skills' : 'Compress into Market Function')}
                </Button>
            </div>
            {analyzing && (
                <div className="text-center mt-4 text-xs font-mono text-zinc-500 animate-pulse">
                    {mode === 'plain' ? 'Finding the best way to package your skills...' : 'Applying 32k context reasoning to niche down...'}
                </div>
            )}
        </div>
    );
};
