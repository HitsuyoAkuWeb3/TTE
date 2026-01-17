import React, { useState } from 'react';
import { ToolCandidate } from '../../types';
import { generateAudioDossier, pcmToAudioBuffer, validateMarketWithSearch, connectLiveSession, disconnectLiveSession } from '../../services/geminiService';
import { Button } from '../Visuals';
import { SimpleMarkdown } from '../SimpleMarkdown';

export const InstallationPhase: React.FC<{
    tool: ToolCandidate | null,
    plan: string | null,
    onGeneratePlan: () => void,
    onBack: () => void,
    onSave: () => void,
    isGenerating: boolean,
    isSaving: boolean
}> = ({ tool, plan, onGeneratePlan, onBack, onSave, isGenerating, isSaving }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [validating, setValidating] = useState(false);
    const [liveConnected, setLiveConnected] = useState(false);

    if (!tool) return null;

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
                session.sendRealtimeInput([{
                    mimeType: "text/plain",
                    data: btoa(`The user has selected the tool: ${tool.plainName}. Function: ${tool.functionStatement}. Promise: ${tool.promise}. Challenge them on how they will monetize this on Day 1.`)
                }]);
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

            <div className="mt-8 flex justify-center w-full">
                <Button
                    onClick={toggleLiveSession}
                    variant={liveConnected ? "danger" : "secondary"}
                    className={`w-full ${liveConnected ? 'border-red-500 bg-red-900/10 hover:bg-red-900/30' : 'border-green-900 text-green-500 hover:bg-green-900/20'}`}
                >
                    {liveConnected ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            LIVE LINK ACTIVE (CLICK TO DISCONNECT)
                        </span>
                    ) : (
                        "Initialize Live Consultation (Voice Mode)"
                    )}
                </Button>
            </div>
        </div>
    );
};
