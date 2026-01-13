import React, { useState } from 'react';
import { ArmoryItem } from '../../types';
import { classifyActivity } from '../../services/geminiService';
import { Button, Input, SectionHeader, ArmoryMap } from '../Visuals';

// Sovereign Primitives Data Structure
const PRIMITIVES = [
    {
        cat: 'Core Creative', items: [
            { name: 'Narrative Architecture', desc: 'Designs belief systems, not stories. Controls meaning flow.' },
            { name: 'Concept Synthesis', desc: 'Fuses unrelated domains into defensible IP.' },
            { name: 'Pattern Interception', desc: 'Detects shifts before they are named or monetized.' },
            { name: 'Symbol Engineering', desc: 'Compresses complex value into icons, rituals, and signals.' },
            { name: 'Aesthetic Systems', desc: 'Builds recognizable visual coherence, not one-off visuals.' },
            { name: 'Voice Authority', desc: 'Establishes a cognitive fingerprint people recognize instantly.' }
        ]
    },
    {
        cat: 'Media & Expression', items: [
            { name: 'Visual Broadcasting', desc: 'Moves ideas through short-form, long-form, and hybrid video.' },
            { name: 'Sonic Framing', desc: 'Uses audio to anchor emotion, memory, and trust.' },
            { name: 'Experiential Design', desc: 'Creates environments, moments, or journeys people remember.' }
        ]
    },
    {
        cat: 'Systems & Tech', items: [
            { name: 'Tool Bending', desc: 'Repurposes platforms, software, or AI beyond intended use.' },
            { name: 'Creative Automation', desc: 'Turns repeatable thought into systems, not output.' },
            { name: 'AI Orchestration', desc: 'Directs machines as force multipliers, not replacements.' }
        ]
    },
    {
        cat: 'Culture & Signal', items: [
            { name: 'Taste Curation', desc: 'Filters chaos into authority. Decides what matters.' },
            { name: 'Atmosphere Design', desc: 'Creates a felt sense people opt into.' },
            { name: 'Meme Fluency', desc: 'Translates ideas into fast-moving cultural packets.' }
        ]
    },
    {
        cat: 'Strategy & Market', items: [
            { name: 'Frame Control', desc: 'Defines how problems are perceived before solutions appear.' },
            { name: 'Ecosystem Mapping', desc: 'Identifies leverage points inside networks and markets.' },
            { name: 'Audience Transmutation', desc: 'Turns attention into identity, not just followers.' }
        ]
    },
    {
        cat: 'Value & Asset', items: [
            { name: 'Offer Architecture', desc: 'Designs value containers that scale beyond time-for-money.' },
            { name: 'IP Weaponization', desc: 'Turns insight into durable, portable assets.' },
            { name: 'Price Signaling', desc: 'Aligns perception, confidence, and cost without discounting.' }
        ]
    }
];

export const ArmoryAuditPhase: React.FC<{
    items: ArmoryItem[],
    onAddItem: (verb: string, x: number, y: number) => void,
    onUpdateItem: (id: string, x: number, y: number) => void,
    onNext: () => void,
    onBack: () => void
}> = ({ items, onAddItem, onUpdateItem, onNext, onBack }) => {
    const [verb, setVerb] = useState('');
    const [isClassifying, setIsClassifying] = useState(false);
    const [hoveredPrim, setHoveredPrim] = useState<string | null>(null);

    const processItem = async (text: string, contextDesc?: string) => {
        if (!text.trim()) return;
        setIsClassifying(true);
        // If we have a description, pass it to help the AI context
        const query = contextDesc ? `${text}: ${contextDesc}` : text;
        const pos = await classifyActivity(query);
        onAddItem(text, pos.x, pos.y);
        setVerb('');
        setIsClassifying(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        processItem(verb);
    };

    return (
        <div className="max-w-6xl mx-auto w-full animate-fade-in">
            <SectionHeader
                title="Phase 1: Armory Audit"
                subtitle="List every recurring activity. Verbs only. No metaphors."
                onBack={onBack}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {/* Manual Input */}
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={verb}
                            onChange={(e) => setVerb(e.target.value)}
                            placeholder="e.g., Edit copy, Design workflows"
                            disabled={isClassifying}
                        />
                        <Button type="submit" disabled={isClassifying}>
                            {isClassifying ? '...' : 'Add'}
                        </Button>
                    </form>

                    {/* Sovereign Primitives Menu */}
                    <div className="bg-zinc-900/30 p-4 border border-zinc-800 h-[500px] overflow-y-auto">
                        <h3 className="text-xs uppercase text-zinc-500 mb-4 font-mono sticky top-0 bg-black/90 pb-2 z-10 border-b border-zinc-800">
                            Sovereign Primitives (Quick Add)
                        </h3>
                        <div className="space-y-6">
                            {PRIMITIVES.map(group => (
                                <div key={group.cat}>
                                    <h4 className="text-[10px] uppercase text-zinc-600 font-bold mb-2 tracking-widest">{group.cat}</h4>
                                    <div className="grid grid-cols-1 gap-1">
                                        {group.items.map(p => (
                                            <button
                                                key={p.name}
                                                disabled={isClassifying || items.some(i => i.verb === p.name)}
                                                onClick={() => processItem(p.name, p.desc)}
                                                onMouseEnter={() => setHoveredPrim(p.desc)}
                                                onMouseLeave={() => setHoveredPrim(null)}
                                                className="group flex flex-col items-start text-left px-3 py-2 border border-zinc-800 bg-zinc-950 hover:border-zinc-500 hover:bg-zinc-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <span className="text-xs font-mono text-zinc-300 group-hover:text-white uppercase">{p.name}</span>
                                                <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 leading-tight mt-1">
                                                    {p.desc}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* List of Added Items */}
                    <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2 border-t border-zinc-800 pt-4">
                        <h3 className="text-xs uppercase text-zinc-500 font-mono">My Armory ({items.length})</h3>
                        {items.map(item => (
                            <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-white uppercase">{item.verb}</span>
                                    <span className="text-xs font-mono text-zinc-500 uppercase">{item.quadrant}</span>
                                </div>
                                <div className="space-y-6 pt-2">
                                    {/* X-Axis: Construction vs Disruption */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] uppercase text-zinc-500 font-mono">To Build</span>
                                            <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-widest">What is the goal?</span>
                                            <span className="text-[10px] uppercase text-zinc-500 font-mono">To Break</span>
                                        </div>
                                        <input
                                            type="range" min="-10" max="10" step="1"
                                            value={item.x}
                                            onChange={(e) => {
                                                const newX = parseInt(e.target.value);
                                                onUpdateItem(item.id, newX, item.y);
                                            }}
                                            className="w-full accent-white h-1 bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    {/* Y-Axis: Discovery vs Discipline */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] uppercase text-zinc-500 font-mono">Discovery</span>
                                            <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-widest">How does it feel?</span>
                                            <span className="text-[10px] uppercase text-zinc-500 font-mono">Mastery</span>
                                        </div>
                                        <input
                                            type="range" min="-10" max="10" step="1"
                                            value={item.y}
                                            onChange={(e) => {
                                                const newY = parseInt(e.target.value);
                                                onUpdateItem(item.id, item.x, newY);
                                            }}
                                            className="w-full accent-white h-1 bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {items.length === 0 && (
                            <p className="text-zinc-600 italic text-sm">Armory empty. Add at least 3 items to map your arsenal.</p>
                        )}
                    </div>
                </div>

                <div>
                    <ArmoryMap items={items} />
                    <div className="mt-6 p-4 border border-yellow-900/50 bg-yellow-900/10 text-yellow-200 text-sm font-mono">
                        WARNING: Ensure you have items in the <span className="font-bold">RITUAL</span> or <span className="font-bold">CRAFT</span> quadrants.
                        Pure Sandbox items cannot become infrastructure.
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <Button onClick={onNext} disabled={items.length < 3}>
                    Proceed to Compression &rarr;
                </Button>
            </div>
        </div>
    );
};
