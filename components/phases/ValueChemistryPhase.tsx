import React, { useState } from 'react';
import { ToolCandidate, OperatorProfile, TheoryOfValue } from '../../types';
import { conductMvaRadar, generateTheoryOfValue } from '../../services/geminiService';
import { Button } from '../Visuals';
import { useVernacular } from '../../contexts/VernacularContext';
import { logger } from '../../services/logger';

interface ValueChemistryPhaseProps {
    tool: ToolCandidate;
    profile?: OperatorProfile | null;
    onComplete: (tov: TheoryOfValue) => void;
    onBack: () => void;
}

export const ValueChemistryPhase: React.FC<ValueChemistryPhaseProps> = ({ tool, profile, onComplete, onBack }) => {
    const { v } = useVernacular();
    const [status, setStatus] = useState<'IDLE' | 'RADAR_SCANNING' | 'DRAFTING_TOV' | 'REVIEW'>('IDLE');
    const [radarData, setRadarData] = useState<any>(null);
    const [, setTov] = useState<TheoryOfValue | null>(null);
    const [forgeProgress, setForgeProgress] = useState('');

    const handleRadarScan = async () => {
        setStatus('RADAR_SCANNING');
        try {
            const data = await conductMvaRadar(tool.plainName, tool.functionStatement, profile || undefined);
            setRadarData(data);
            setStatus('REVIEW');
        } catch (err: any) {
            logger.error('CHEMISTRY', 'Value chemistry failure', err);
            alert(`Radar Scan Failed: ${err.message || "System Interference Detected"}. Check terminal logs.`);
            setStatus('IDLE');
        }
    };

    const handleSynthesizeTov = async () => {
        setStatus('DRAFTING_TOV');
        setForgeProgress('Initializing the Forge...');
        try {
            const finalTov = await generateTheoryOfValue(
                tool,
                radarData,
                profile || undefined,
                (stage) => setForgeProgress(stage)
            );
            setTov(finalTov);
            onComplete(finalTov);
        } catch (err) {
            logger.error('CHEMISTRY', 'MVA Radar error', err);
            alert("ToV Synthesis Failed.");
            setStatus('REVIEW');
        }
    };

    return (
        <div className="max-w-4xl mx-auto w-full animate-fade-in space-y-8 font-mono">
            <div className="border border-zinc-800 bg-void p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-zinc-800 text-zinc-400 px-3 py-1 text-[10px]">
                    {v.phase_synthesis.toUpperCase()}
                </div>

                <div className="mb-6">
                    <button onClick={onBack} className="text-xs text-zinc-500 hover:text-bone transition-colors">&larr; {v.synthesis_back}</button>
                </div>

                <h2 className="text-3xl font-display font-black uppercase mb-2">{v.synthesis_title}</h2>
                <p className="text-zinc-500 text-sm mb-8">{v.synthesis_subtitle}</p>

                {status === 'IDLE' && (
                    <div className="flex flex-col items-center justify-center py-20 border border-zinc-900 border-dashed">
                        <p className="text-zinc-500 mb-6 text-center">{v.synthesis_scan_ready} <br /><span className="text-bone">"{tool.plainName}"</span></p>
                        <Button onClick={handleRadarScan}>{v.synthesis_scan_cta}</Button>
                    </div>
                )}

                {status === 'RADAR_SCANNING' && (
                    <div className="py-20 text-center animate-pulse">
                        <p className="text-zinc-400">{v.synthesis_scanning}</p>
                        <p className="text-zinc-600 text-xs mt-2 italic">Finding {v.shadow_beliefs} & {v.fatal_wound} patterns</p>
                    </div>
                )}

                {status === 'REVIEW' && radarData && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-4 border border-red-900/30 bg-red-950/5">
                                <h4 className="text-[#FF2A2A] text-xs font-bold mb-2 uppercase">{v.fatal_wound.toUpperCase()}</h4>
                                <p className="text-zinc-300 text-sm italic">"{radarData.fatalWound}"</p>
                            </div>
                            <div className="p-4 border border-zinc-800 bg-zinc-900/20">
                                <h4 className="text-zinc-500 text-xs font-bold mb-2 uppercase">{v.sacred_cow.toUpperCase()}</h4>
                                <p className="text-zinc-400 text-sm">"{radarData.sacredCow}"</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-zinc-500 text-[10px] uppercase mb-3 tracking-widest">{v.synthesis_shadow_title}</h4>
                            <div className="grid gap-2">
                                {radarData.shadowBeliefs.map((belief: string) => (
                                    <div key={belief} className="text-xs text-zinc-400 border-l border-zinc-800 pl-3 py-1 bg-zinc-900/10">
                                        {belief}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-900 flex justify-between items-center">
                            <p className="text-[10px] text-zinc-600">{v.synthesis_complete}</p>
                            <Button onClick={handleSynthesizeTov} variant="gold">{v.synthesis_build_cta_prefix} {v.theory_of_value.toUpperCase()}</Button>
                        </div>
                    </div>
                )}

                {status === 'DRAFTING_TOV' && (
                    <div className="py-20 text-center space-y-4">
                        <div className="animate-pulse">
                            <p className="text-[#eab308]">{v.synthesis_forging}</p>
                        </div>
                        <p className="text-zinc-400 text-sm font-mono transition-all duration-500">{forgeProgress}</p>
                        <div className="flex justify-center gap-1 mt-4">
                            {['Synthesizing', 'Auditing', 'Refining'].map((step, i) => (
                                <div key={step} className={`h-1 w-16 rounded-full transition-all duration-700 ${forgeProgress.toLowerCase().includes(step.toLowerCase().slice(0, 5))
                                    ? 'bg-yellow-500' : 'bg-zinc-800'
                                    }`} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
