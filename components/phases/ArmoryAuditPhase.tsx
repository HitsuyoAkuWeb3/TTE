import React, { useState } from 'react';
import { ArmoryItem } from '../../types';
import { classifyActivity } from '../../services/geminiService';
import { Button, Input, SectionHeader, ArmoryMap } from '../Visuals';

// Sovereign Primitives Data Structure (Polymath Merge v2026)
const PRIMITIVES = [
    {
        cat: 'Structure & Cognition',
        desc: 'How you synthesize information and organize reality.',
        items: [
            { name: 'Narrative Architecture', desc: 'Designs belief systems, not stories. Controls meaning flow.' },
            { name: 'Systems Modeling', desc: 'Abstracts reality into controllable components and feedback loops.' },
            { name: 'Concept Synthesis', desc: 'Fuses unrelated domains into defensible IP.' },
            { name: 'Computational Thinking', desc: 'Breaks problems into executable logic, human or machine.' },
            { name: 'Pattern Interception', desc: 'Detects shifts before they are named or monetized.' },
            { name: 'Frame Control', desc: 'Defines how problems are perceived before solutions appear.' }
        ]
    },
    {
        cat: 'Signal & Translation',
        desc: 'How you package ideas for transmission to others.',
        items: [
            { name: 'Visual Broadcasting', desc: 'Moves ideas through short-form, long-form, and hybrid video.' },
            { name: 'Technical Translation', desc: 'Converts complex systems into usable mental models.' },
            { name: 'Voice Authority', desc: 'Establishes a cognitive fingerprint people recognize instantly.' },
            { name: 'Data Sensemaking', desc: 'Turns raw data into directional insight, not dashboards.' },
            { name: 'Symbol Engineering', desc: 'Compresses complex value into icons, rituals, and signals.' },
            { name: 'Meme Fluency', desc: 'Translates ideas into fast-moving cultural packets.' }
        ]
    },
    {
        cat: 'Engine & Systems',
        desc: 'How you build the machine that does the work.',
        items: [
            { name: 'Creative Automation', desc: 'Turns repeatable thought into systems, not output.' },
            { name: 'Algorithmic Design', desc: 'Encodes decision-making into repeatable processes.' },
            { name: 'Tool Bending', desc: 'Repurposes platforms, software, or AI beyond intended use.' },
            { name: 'Infrastructure Thinking', desc: 'Builds foundations others can scale on top of.' },
            { name: 'Failure Analysis', desc: 'Extracts signal from breakdowns, edge cases, and bugs.' },
            { name: 'AI Orchestration', desc: 'Directs machines as force multipliers, not replacements.' }
        ]
    },
    {
        cat: 'Experience & Aesthetics',
        desc: 'How the work feels to the end user.',
        items: [
            { name: 'Aesthetic Systems', desc: 'Builds recognizable visual coherence, not one-off visuals.' },
            { name: 'Sonic Framing', desc: 'Uses audio to anchor emotion, memory, and trust.' },
            { name: 'Experiential Design', desc: 'Creates environments, moments, or journeys people remember.' },
            { name: 'Atmosphere Design', desc: 'Creates a felt sense people opt into.' },
            { name: 'Taste Curation', desc: 'Filters chaos into authority. Decides what matters.' }
        ]
    },
    {
        cat: 'Leverage & Value',
        desc: 'How you capture value and scale impact.',
        items: [
            { name: 'Constraint Optimization', desc: 'Finds maximum output under real-world limits.' },
            { name: 'Simulation & Forecasting', desc: 'Tests futures before paying for them.' },
            { name: 'Ecosystem Mapping', desc: 'Identifies leverage points inside networks and markets.' },
            { name: 'Offer Architecture', desc: 'Designs value containers that scale beyond time-for-money.' },
            { name: 'IP Weaponization', desc: 'Turns insight into durable, portable assets.' },
            { name: 'Price Signaling', desc: 'Aligns perception, confidence, and cost without discounting.' },
            { name: 'Audience Transmutation', desc: 'Turns attention into identity, not just followers.' }
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
                    <div className="bg-zinc-900/30 p-4 border border-zinc-800 h-[600px] overflow-y-auto relative">
                        {/* Removed sticky from main title to cleaner flow with sub-headers */}
                        <h3 className="text-xs uppercase text-zinc-500 mb-4 font-mono pb-2 border-b border-zinc-800">
                            Sovereign Primitives (Quick Add)
                        </h3>
                        <div className="space-y-6">
                            {PRIMITIVES.map(group => (
                                <div key={group.cat} className="group/cat">
                                    <div className="mb-2 sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-zinc-800/50 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-[10px] uppercase text-zinc-400 font-bold tracking-widest cursor-help group-hover/cat:text-white transition-colors">
                                                {group.cat}
                                            </h4>
                                            <span className="text-[10px] text-zinc-600 opacity-0 group-hover/cat:opacity-100 transition-opacity">?</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 italic max-h-0 overflow-hidden group-hover/cat:max-h-12 transition-all duration-300 ease-in-out pl-1 border-l border-zinc-700 mt-1">
                                            {group.desc}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1 px-1">
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
                </div>

                <div>
                    <ArmoryMap items={items} />
                    <div className="mt-6 p-4 border border-yellow-900/50 bg-yellow-900/10 text-yellow-200 text-sm font-mono mb-8">
                        WARNING: Ensure you have items in the <span className="font-bold">RITUAL</span> or <span className="font-bold">CRAFT</span> quadrants.
                        Pure Sandbox items cannot become infrastructure.
                    </div>

                    {/* List of Added Items - Moved Here */}
                    <div className="space-y-4 pr-2 border-t border-zinc-800 pt-4">
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
            </div>

            <div className="mt-8 flex justify-end">
                <Button onClick={onNext} disabled={items.length < 3}>
                    Proceed to Compression &rarr;
                </Button>
            </div>
        </div>
    );
};
