import React, { useState, useEffect } from 'react';
import { ToolCandidate, OperatorProfile, TheoryOfValue } from '../../types';
import { conductMvaRadar, generateTheoryOfValue } from '../../services/geminiService';
import { Button } from '../Visuals';

interface ValueChemistryPhaseProps {
    tool: ToolCandidate;
    profile?: OperatorProfile | null;
    onComplete: (tov: TheoryOfValue) => void;
    onBack: () => void;
}

export const ValueChemistryPhase: React.FC<ValueChemistryPhaseProps> = ({ tool, profile, onComplete, onBack }) => {
    const [status, setStatus] = useState<'IDLE' | 'RADAR_SCANNING' | 'DRAFTING_TOV' | 'REVIEW'>('IDLE');
    const [radarData, setRadarData] = useState<any>(null);
    const [tov, setTov] = useState<TheoryOfValue | null>(null);

    const handleRadarScan = async () => {
        setStatus('RADAR_SCANNING');
        try {
            const data = await conductMvaRadar(tool.plainName, tool.functionStatement, profile || undefined);
            setRadarData(data);
            setStatus('REVIEW');
        } catch (err: any) {
            console.error("[CHEMISTRY_FAILURE]", err);
            alert(`Radar Scan Failed: ${err.message || "System Interference Detected"}. Check terminal logs.`);
            setStatus('IDLE');
        }
    };

    const handleSynthesizeTov = async () => {
        setStatus('DRAFTING_TOV');
        try {
            const finalTov = await generateTheoryOfValue(tool, radarData, profile || undefined);
            setTov(finalTov);
            onComplete(finalTov);
        } catch (err) {
            console.error(err);
            alert("ToV Synthesis Failed.");
            setStatus('REVIEW');
        }
    };

    return (
        <div className="max-w-4xl mx-auto w-full animate-fade-in space-y-8 font-mono">
            <div className="border border-zinc-800 bg-black p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-zinc-800 text-zinc-400 px-3 py-1 text-[10px]">
                    PHASE_02: VALUE_CHEMISTRY
                </div>

                <div className="mb-6">
                    <button onClick={onBack} className="text-xs text-zinc-500 hover:text-white transition-colors">&larr; RETURN_TO_PREVIOUS_PHASE</button>
                </div>

                <h2 className="text-3xl font-black uppercase mb-2">Molecular Synthesis</h2>
                <p className="text-zinc-500 text-sm mb-8">Identify the Root Glitch. Manufacture Certainty.</p>

                {status === 'IDLE' && (
                    <div className="flex flex-col items-center justify-center py-20 border border-zinc-900 border-dashed">
                        <p className="text-zinc-500 mb-6 text-center">Ready to scan the MVA (Minimum Viable Audience) Radar for <br /><span className="text-white">"${tool.plainName}"</span></p>
                        <Button onClick={handleRadarScan}>INITIALIZE_RADAR_SCAN</Button>
                    </div>
                )}

                {status === 'RADAR_SCANNING' && (
                    <div className="py-20 text-center animate-pulse">
                        <p className="text-zinc-400">[ SCANNING_NICHE_FORUMS... ]</p>
                        <p className="text-zinc-600 text-xs mt-2 italic">Extracting Shadow Beliefs & Fatal Wound patterns</p>
                    </div>
                )}

                {status === 'REVIEW' && radarData && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-4 border border-red-900/30 bg-red-950/5">
                                <h4 className="text-[#FF2A2A] text-xs font-bold mb-2 uppercase">THE_FATAL_WOUND</h4>
                                <p className="text-zinc-300 text-sm italic">"{radarData.fatalWound}"</p>
                            </div>
                            <div className="p-4 border border-zinc-800 bg-zinc-900/20">
                                <h4 className="text-zinc-500 text-xs font-bold mb-2 uppercase">THE_SACRED_COW</h4>
                                <p className="text-zinc-400 text-sm">"{radarData.sacredCow}"</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-zinc-500 text-[10px] uppercase mb-3 tracking-widest">Shadow_Belief_Inventory</h4>
                            <div className="grid gap-2">
                                {radarData.shadowBeliefs.map((belief: string, i: number) => (
                                    <div key={i} className="text-xs text-zinc-400 border-l border-zinc-800 pl-3 py-1 bg-zinc-900/10">
                                        {belief}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-900 flex justify-between items-center">
                            <p className="text-[10px] text-zinc-600">Chemistry extracted. Ready for White Paper synthesis.</p>
                            <Button onClick={handleSynthesizeTov} variant="gold">ARCHITECT_THEORY_OF_VALUE</Button>
                        </div>
                    </div>
                )}

                {status === 'DRAFTING_TOV' && (
                    <div className="py-20 text-center animate-pulse">
                        <p className="text-[#eab308]">[ SYNTHESIZING_WHITE_PAPER... ]</p>
                        <p className="text-zinc-600 text-xs mt-2">Binding tool physics to market pain</p>
                    </div>
                )}
            </div>
        </div>
    );
};
