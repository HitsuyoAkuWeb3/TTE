import React, { useState } from 'react';
import { ToolCandidate, OperatorProfile, TheoryOfValue } from '../../types';
import { generateAudioDossier, pcmToAudioBuffer, validateMarketWithSearch, connectLiveSession, disconnectLiveSession, refinePilotProtocol } from '../../services/geminiService';
import { Button } from '../Visuals';
import { SimpleMarkdown } from '../SimpleMarkdown';
import { RefinementTerminal } from '../RefinementTerminal';

export const InstallationPhase: React.FC<{
    tool: ToolCandidate | null,
    plan: string | null,
    clientName?: string,
    profile?: OperatorProfile | null,
    theoryOfValue?: TheoryOfValue | null,
    onGeneratePlan: () => void,
    onUpdatePlan: (newPlan: string) => void,
    onBack: () => void,
    onSave: () => void,
    onRetroactiveAudit?: () => void,
    isGenerating: boolean,
    isSaving: boolean
}> = ({ tool, plan, clientName, profile, theoryOfValue, onGeneratePlan, onUpdatePlan, onBack, onSave, onRetroactiveAudit, isGenerating, isSaving }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [validating, setValidating] = useState(false);
    const [liveConnected, setLiveConnected] = useState(false);
    const [showRefiner, setShowRefiner] = useState(false);
    const [isRefining, setIsRefining] = useState(false);

    if (!tool) return null;

    const handleRefine = async (feedback: string) => {
        if (!plan) return;
        setIsRefining(true);
        try {
            const newPlan = await refinePilotProtocol(plan, feedback, clientName, profile || undefined);
            onUpdatePlan(newPlan);
            setShowRefiner(false);
        } catch (err) {
            console.error("Refinement error", err);
            alert("Protocol synthesis failed.");
        } finally {
            setIsRefining(false);
        }
    };

    const handleTTS = async () => {
        if (!plan) return;
        setIsPlaying(true);
        const buffer = await generateAudioDossier(plan.slice(0, 500)); // Limit for preview
        if (buffer) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const data = new Uint8Array(buffer);
            const audioBuffer = await pcmToAudioBuffer(data, ctx, 24000, 1);

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start(0);
            source.onended = () => setIsPlaying(false);
        } else {
            setIsPlaying(false);
        }
    };

    const handleValidation = async () => {
        setValidating(true);
        const urls = await validateMarketWithSearch(tool.plainName);
        if (urls.length > 0) {
            // Just a simple alert or state update for now
            tool.marketValidation = urls;
        }
        setValidating(false);
    }

    const toggleLiveSession = async () => {
        if (liveConnected) {
            await disconnectLiveSession();
            setLiveConnected(false);
        } else {
            try {
                const session = await connectLiveSession();
                // Send context
                session.sendRealtimeInput({
                    media: {
                        mimeType: "text/plain",
                        data: btoa(`The user has selected the tool: ${tool.plainName}. Function: ${tool.functionStatement}. Promise: ${tool.promise}. Challenge them on how they will monetize this on Day 1.`)
                    }
                });
                setLiveConnected(true);
            } catch (e) {
                console.error("Live Error", e);
                alert("Microphone access required for Live API.");
            }
        }
    }

    return (
        <div className="max-w-4xl mx-auto w-full animate-fade-in pb-20">
            <div className={`border p-8 bg-black relative overflow-hidden
           ${tool.isSovereign ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'border-white'}
       `}>
                <div className={`absolute top-0 right-0 p-2 text-black font-mono text-xs font-bold
             ${tool.isSovereign ? 'bg-yellow-500' : 'bg-white'}
         `}>
                    {tool.isSovereign ? 'SOVEREIGN DOSSIER' : 'OFFICIAL DOSSIER'}
                </div>

                {!theoryOfValue && (
                    <div className="absolute top-0 left-0 w-full bg-[#FF2A2A] text-black px-4 py-1.5 flex justify-between items-center z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <span className="animate-pulse underline">CRITICAL_GAP</span> :: THEORY_OF_VALUE_NOT_DETECTED
                        </span>
                        <button
                            onClick={onRetroactiveAudit}
                            className="bg-black text-[#FF2A2A] text-[9px] font-bold px-3 py-0.5 hover:bg-zinc-900 transition-colors uppercase border border-black"
                        >
                            RUN_FORENSIC_UPGRADE
                        </button>
                    </div>
                )}

                <div className="mb-4">
                    <button onClick={onBack} className="text-xs font-mono text-zinc-500 hover:text-white">&larr; CHANGE TOOL</button>
                </div>

                <h2 className="text-4xl font-black uppercase mb-2 break-words">{tool.plainName}</h2>
                <p className="font-mono text-zinc-400 mb-8 border-b border-zinc-800 pb-4">{tool.functionStatement}</p>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h4 className="text-xs uppercase text-zinc-500 mb-2">Proof Ledger</h4>
                        <ul className="text-sm font-mono space-y-2">
                            <li className="flex items-center gap-2">
                                <span className={tool.scores.unbiddenRequests ? "text-green-500" : "text-red-500"}>●</span> Unbidden Demand
                            </li>
                            <li className="flex items-center gap-2">
                                <span className={tool.scores.frictionlessDoing ? "text-green-500" : "text-red-500"}>●</span> Frictionless
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs uppercase text-zinc-500 mb-2">Market Status</h4>
                        <div className="text-sm font-mono mb-2">
                            {tool.scores.extractionRisk
                                ? <span className="text-red-500 font-bold bg-red-900/20 px-2 py-1">CONTAINMENT REQ</span>
                                : <span className="text-green-500 font-bold bg-green-900/20 px-2 py-1">SCALABLE ASSET</span>
                            }
                        </div>
                        <button
                            onClick={handleValidation}
                            disabled={validating}
                            className="text-[10px] underline text-zinc-400 hover:text-white"
                        >
                            {validating ? 'Searching Grounding...' : 'Run Market Search Check'}
                        </button>
                        {tool.marketValidation && (
                            <div className="mt-2 space-y-1">
                                {tool.marketValidation.map((u, i) => (
                                    <a key={i} href={u} target="_blank" className="block text-[10px] text-blue-400 truncate">{u}</a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {!plan ? (
                    <div className="text-center py-12 border-t border-zinc-800 border-dashed">
                        <Button onClick={onGeneratePlan} disabled={isGenerating}>
                            {isGenerating ? 'Architecting Pilot...' : 'Generate 7-Day Pilot Protocol'}
                        </Button>
                    </div>
                ) : (
                    <div className="animate-fade-in border-t border-zinc-800 pt-6">
                        {theoryOfValue && (
                            <div className="mb-12 border border-white/20 bg-zinc-950 p-8 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em] mb-4">Forensic_Theory_of_Value_v.1</div>
                                <h3 className="text-3xl font-black mb-6 uppercase tracking-tight">{theoryOfValue.godfatherOffer.name}</h3>

                                <div className="grid md:grid-cols-3 gap-8 mb-8 border-y border-zinc-900 py-8">
                                    <div>
                                        <h4 className="text-[9px] text-zinc-500 uppercase mb-2">Molecular_Bond</h4>
                                        <p className="text-sm font-mono leading-relaxed">{theoryOfValue.molecularBond}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[9px] text-zinc-500 uppercase mb-2">Fatal_Wound_Audit</h4>
                                        <p className="text-sm font-mono text-red-500 italic">"{theoryOfValue.fatalWound}"</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[9px] text-zinc-500 uppercase mb-2">Strategic_Price</h4>
                                        <p className="text-2xl font-black">{theoryOfValue.godfatherOffer.price}</p>
                                        <p className="text-[9px] text-zinc-600 uppercase">Value-Based Transform</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-zinc-900/50 border-l border-white font-mono text-xs text-zinc-400">
                                    <h4 className="text-white text-[10px] uppercase mb-2">The_Magick_Pill_Promise</h4>
                                    {theoryOfValue.godfatherOffer.transformation}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold uppercase">7-Day Installation Protocol</h3>
                            <Button onClick={handleTTS} disabled={isPlaying} variant="secondary" className="!py-1 !px-3 !text-xs">
                                {isPlaying ? 'Broadcasting...' : 'Listen to Protocol'}
                            </Button>
                        </div>
                        <div className="font-mono text-sm leading-relaxed text-zinc-300 bg-zinc-900/50 p-6 border-l-2 border-white max-h-[500px] overflow-y-auto">
                            <SimpleMarkdown text={plan} />
                        </div>
                        <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end">
                            <Button
                                onClick={onSave}
                                disabled={isSaving}
                                variant="gold"
                                className="w-full md:w-auto"
                            >
                                {isSaving ? 'Synching with Neural Link...' : 'Commit Protocol to System'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {plan && (
                    <Button
                        onClick={() => setShowRefiner(true)}
                        variant="secondary"
                        className="border-zinc-700 text-zinc-400 hover:text-white hover:border-white"
                    >
                        ITERATE_PROTOCOL [ AI_REFINEMENT ]
                    </Button>
                )}
                <Button
                    disabled
                    variant="danger"
                    className="border-[#FF2A2A]/20 text-[#FF2A2A]/40 cursor-not-allowed opacity-50 grayscale"
                >
                    Initialize Live Consultation (Coming Feature)
                </Button>
            </div>

            {showRefiner && (
                <RefinementTerminal
                    onRefine={handleRefine}
                    isRefining={isRefining}
                    onClose={() => setShowRefiner(false)}
                />
            )}
        </div>
    );
};
