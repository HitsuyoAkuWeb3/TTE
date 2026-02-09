import React, { useState } from 'react';
import { ArmoryItem, ToolCandidate } from '../../types';
import { synthesizeToolDefinition, synthesizeSovereignAuthority, suggestMerge, MergeSuggestion } from '../../services/geminiService';
import { Button, SectionHeader } from '../Visuals';
import { useVernacular, quadrantLabel, type VernacularDictionary } from '../../contexts/VernacularContext';

const ARMORY_HARD_CAP = 15;

// ── HELPERS ─────────────────────────────────────────────
const getCandidateBadge = (isSovereign: boolean | undefined, v: VernacularDictionary, idx: number): string => {
    if (isSovereign) return v.compression_sovereign_badge;
    return `Candidate 0${idx + 1}`;
};

const getSovereignButtonText = (synthesizing: boolean, v: VernacularDictionary): string => {
    if (synthesizing) return v.compression_sovereign_synthesizing;
    return v.compression_sovereign_button;
};

const getCompressButtonText = (analyzing: boolean, v: VernacularDictionary): React.ReactNode => {
    if (analyzing) {
        return (
            <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>Synthesizing Market Function...</span>
            </span>
        );
    }
    return v.compression_compress_button;
};

// ── CANDIDATE RESULTS VIEW ──────────────────────────────
const CandidateResultsView: React.FC<{
    candidates: ToolCandidate[];
    v: VernacularDictionary;
    onNext: () => void;
    onBack: () => void;
}> = ({ candidates, v, onNext, onBack }) => {
    // With Flux Fusion, we always have 1 Sovereign candidate here
    const sovereign = candidates[0];

    return (
        <div className="max-w-4xl mx-auto w-full animate-fade-in">
            <SectionHeader
                title={`${v.phase_label} 2: ${v.compression_result_title}`}
                subtitle={v.chimera_result_subtitle || 'Sovereign Authority Synthesized'}
                onBack={onBack}
            />
            
            {/* Sovereign Card */}
            <div className="border border-[#00FF41]/50 bg-zinc-900/50 shadow-[0_0_30px_rgba(0,255,65,0.1)] relative p-8 mb-8">
                 <div className="absolute top-0 right-0 p-2 bg-[#00FF41] text-black text-[10px] font-bold uppercase">
                    {v.compression_sovereign_badge}
                </div>
                
                <h3 className="text-3xl font-display font-black mb-2 text-white uppercase text-center">{sovereign.plainName}</h3>
                <p className="text-center text-[#00FF41] font-mono text-sm mb-8">{sovereign.functionStatement}</p>

                <div className="grid md:grid-cols-2 gap-8">
                     <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">{v.candidate_promise}</span>
                        <p className="text-sm font-mono text-zinc-300">{sovereign.promise}</p>
                    </div>
                    <div>
                        <span className="text-[10px] text-red-500/70 uppercase font-bold block mb-1">{v.candidate_antipitch}</span>
                        <p className="text-sm font-mono text-zinc-400 italic">"{sovereign.antiPitch}"</p>
                    </div>
                </div>

                {/* Constituents */}
                {sovereign.constituents && (
                    <div className="mt-8 pt-6 border-t border-zinc-800">
                        <span className="text-[10px] text-zinc-600 uppercase font-bold block mb-3 text-center tracking-widest">{v.chimera_fused_from || 'Fused From'}</span>
                        <div className="flex flex-wrap justify-center gap-2">
                            {sovereign.constituents.map((c, i) => (
                                <span key={i} className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 border border-zinc-800">
                                    {c.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chimera Bond — the molecular logic */}
                {sovereign.chimeraBond && (
                    <div className="mt-6 pt-6 border-t border-zinc-800">
                        <span className="text-[10px] text-[#00FF41]/60 uppercase font-bold block mb-2 text-center tracking-widest">{v.chimera_bond_label || 'Molecular Bond'}</span>
                        <p className="text-sm font-mono text-zinc-300 text-center italic">"{sovereign.chimeraBond}"</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <Button onClick={onNext} variant="gold" className="w-full md:w-auto px-12">
                    {v.compression_proceed}
                </Button>
            </div>
        </div>
    );
};

// ── MAIN COMPONENT ──────────────────────────────────────
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
    const { v } = useVernacular();
    const [analyzing, setAnalyzing] = useState(false);
    const [synthesizingSovereign, setSynthesizingSovereign] = useState(false);

    // Compression algorithm state
    const [mergeSuggestions, setMergeSuggestions] = useState<MergeSuggestion[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);

    const isOverCap = armory.length > ARMORY_HARD_CAP;

    const toggleSelection = (id: string) => {
        if (selections.includes(id)) {
            setSelections(s => s.filter(x => x !== id));
        } else if (selections.length < 4) {
            setSelections(s => [...s, id]);
        }
    };

    const handleCompress = async () => {
        setAnalyzing(true);
        const intermediateCandidates: ToolCandidate[] = [];

        // 1. Synthesize the 3 individual definitions (Hidden from user final view)
        for (const id of selections) {
            const item = armory.find(i => i.id === id);
            if (!item) continue;

            const analysis = await synthesizeToolDefinition(item.verb, item.quadrant);

            intermediateCandidates.push({
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

        // 2. Immediately Fuse into Sovereign Authority
        const sovereign = await synthesizeSovereignAuthority(intermediateCandidates);
        
        // 3. Attach constituents for provenance
        sovereign.constituents = intermediateCandidates.map(c => ({
            name: c.plainName,
            function: c.functionStatement
        }));

        // 4. Set the single result
        const result = [sovereign];
        setCandidates(result);
        onSelectCandidates(result);
        setAnalyzing(false);
    };

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
        return (
            <CandidateResultsView
                candidates={candidates}
                v={v}
                onNext={onNext}
                onBack={onBack}
            />
        );
    }

    // Selection View
    return (
        <div className="max-w-4xl mx-auto w-full animate-fade-in">
            <SectionHeader
                title={`${v.phase_label} 2: ${v.compression_select_title}`}
                subtitle={v.compression_select_subtitle}
                onBack={onBack}
            />

            {/* Hard Cap Warning */}
            {isOverCap && (
                <div className="mb-6 p-4 border border-red-800/50 bg-red-900/10 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-mono text-red-400 uppercase">
                            {v.compression_cap_warning}: {armory.length} (max: {ARMORY_HARD_CAP})
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
                        {v.compression_cap_explainer.replace('{cap}', String(ARMORY_HARD_CAP))}
                    </p>
                </div>
            )}

            {/* AI Merge Suggestions */}
            {mergeSuggestions.length > 0 && (
                <div className="mb-6 space-y-3">
                    <h4 className="text-[10px] uppercase text-yellow-500 font-mono tracking-widest">{v.compression_merge_header}</h4>
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
                        <div className="text-[10px] font-mono opacity-60">{quadrantLabel(item.quadrant, v)}</div>
                    </button>
                ))}
            </div>

            <div className="flex justify-end gap-4 items-center">
                <span className="font-mono text-zinc-500 text-sm">{v.chimera_count ? v.chimera_count.replace('{n}', String(selections.length)) : `${selections.length} / 4 Selected`}</span>
                <Button
                    disabled={selections.length !== 4 || analyzing}
                    onClick={handleCompress}
                >
                    {getCompressButtonText(analyzing, v)}
                </Button>
            </div>
            {analyzing && (
                <div className="text-center mt-4 text-xs font-mono text-zinc-500 animate-pulse">
                    {v.compression_analyzing_hint}
                </div>
            )}
        </div>
    );
};
