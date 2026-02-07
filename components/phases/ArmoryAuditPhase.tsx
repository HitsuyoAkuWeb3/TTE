import React, { useState, useEffect } from 'react';
import { ArmoryItem, OperatorProfile } from '../../types';
import { classifyActivity, generateStarterDeck, StarterCard } from '../../services/geminiService';
import { Button, Input, SectionHeader, ArmoryMap } from '../Visuals';
import { useVernacular } from '../../contexts/VernacularContext';
import { logger } from '../../services/logger';

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

// Monochrome — no category coloring
const getCategoryStyle = (_cat: string) => 'border-zinc-700';

const PrimitiveGroup: React.FC<{
    group: typeof PRIMITIVES[0],
    isClassifying: boolean,
    items: ArmoryItem[],
    onProcess: (name: string, desc: string) => void
}> = ({ group, isClassifying, items, onProcess }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="group/cat border-b border-zinc-800/50 last:border-0">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left bg-void px-4 py-3 hover:bg-zinc-900 transition-colors flex items-center justify-between group-hover/cat:text-bone"
            >
                <div className="flex flex-col gap-1 pr-4">
                    <div className="flex items-center gap-2">
                        <h4 className="text-[10px] uppercase text-zinc-400 font-bold tracking-widest group-hover/cat:text-bone transition-colors">
                            {group.cat}
                        </h4>
                    </div>
                    <p className={`text-[10px] text-zinc-500 italic transition-all duration-300 ease-in-out pl-1 border-l border-zinc-800 group-hover/cat:border-zinc-600 group-hover/cat:text-zinc-400`}>
                        {group.desc}
                    </p>
                </div>
                <div className={`transform transition-transform duration-200 text-zinc-500 ${isOpen ? 'rotate-180 text-bone' : ''}`}>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-zinc-900/10 ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-1 gap-1 px-2 py-2">
                    {group.items.map(p => (
                        <button
                            key={p.name}
                            type="button"
                            disabled={isClassifying || items.some(i => i.verb === p.name)}
                            onClick={() => onProcess(p.name, p.desc)}
                            className="group/item flex flex-col items-start text-left px-3 py-3 border border-zinc-800 bg-void/50 hover:border-zinc-500 hover:bg-zinc-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-sm"
                        >
                            <span className="text-xs font-mono text-zinc-300 group-hover/item:text-bone uppercase">{p.name}</span>
                            <span className="text-[10px] text-zinc-500 group-hover/item:text-zinc-300 leading-tight mt-1.5 block">
                                {p.desc}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const ArmoryAuditPhase: React.FC<{
    items: ArmoryItem[],
    profile?: OperatorProfile | null,
    onAddItem: (verb: string, x: number, y: number) => void,
    onUpdateItem: (id: string, x: number, y: number) => void,
    onNext: () => void,
    onBack: () => void
}> = ({ items, profile, onAddItem, onUpdateItem, onNext, onBack }) => {
    const { v } = useVernacular();
    const [verb, setVerb] = useState('');
    const [isClassifying, setIsClassifying] = useState(false);
    const [viewMode, setViewMode] = useState<'spatial' | 'terminal'>('spatial');

    // Deck of Sparks state
    const [starterDeck, setStarterDeck] = useState<StarterCard[]>([]);
    const [isDeckLoading, setIsDeckLoading] = useState(false);
    const [isDeckDismissed, setIsDeckDismissed] = useState(false);
    const generationRef = React.useRef(false);

    // Generate starter deck on mount if armory is empty and profile exists
    useEffect(() => {
        // Prevent double-firing or regeneration if already attempted
        if (generationRef.current) return;

        if (profile && items.length === 0 && !isDeckDismissed && starterDeck.length === 0) {
            generationRef.current = true;
            setIsDeckLoading(true);
            generateStarterDeck(profile.industry, profile.preferredTone)
                .then(cards => setStarterDeck(cards))
                .catch(err => {
                    logger.error('DECK', 'Failed to generate deck:', err);
                    generationRef.current = false; // Allow retry on error? Or keep blocked? 
                    // Keeping blocked to prevent loops is safer for "flashing" issues.
                    // But if it fails, user gets nothing. 
                    // optimizing for stability first.
                })
                .finally(() => setIsDeckLoading(false));
        }
    }, [profile]);

    const processItem = async (text: string, contextDesc?: string) => {
        if (!text.trim()) return;
        setIsClassifying(true);
        const query = contextDesc ? `${text}: ${contextDesc}` : text;
        const pos = await classifyActivity(query);
        onAddItem(text, pos.x, pos.y);
        setVerb('');
        setIsClassifying(false);
    };

    const handleKeepCard = async (card: StarterCard) => {
        // Remove from deck and add to armory via classification
        setStarterDeck(prev => prev.filter(c => c.name !== card.name));
        await processItem(card.name);
    };

    const handleDiscardCard = (card: StarterCard) => {
        setStarterDeck(prev => prev.filter(c => c.name !== card.name));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        processItem(verb);
    };

    return (
        <div className="max-w-6xl mx-auto w-full animate-fade-in">
            <SectionHeader
                title={`${v.phase_label} 1: ${v.phase_armory}`}
                subtitle={v.armory_subtitle}
                onBack={onBack}
            />

            {/* View Mode Toggle */}
            <div className="flex justify-end mb-2">
                <div className="flex border border-zinc-800">
                    <button
                        onClick={() => setViewMode('spatial')}
                        className={`px-3 py-1 text-[10px] font-mono uppercase transition-all ${viewMode === 'spatial'
                            ? 'bg-white text-black'
                            : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        {v.armory_view_spatial}
                    </button>
                    <button
                        onClick={() => setViewMode('terminal')}
                        className={`px-3 py-1 text-[10px] font-mono uppercase transition-all ${viewMode === 'terminal'
                            ? 'bg-white text-black'
                            : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        {v.armory_view_terminal}
                    </button>
                </div>
            </div>

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

                    {/* Deck of Sparks */}
                    {isDeckLoading && (
                        <div className="p-4 border border-zinc-700 bg-zinc-900/50 animate-pulse">
                            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                ⚡ Generating Starter Deck for {profile?.industry}...
                            </span>
                        </div>
                    )}

                    {starterDeck.length > 0 && !isDeckDismissed && (
                        <div className="border border-zinc-700 bg-void p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs uppercase text-zinc-400 font-mono tracking-wider">
                                    DECK OF SPARKS — KEEP OR DISCARD
                                </h3>
                                <button
                                    onClick={() => setIsDeckDismissed(true)}
                                    className="text-[10px] text-zinc-600 hover:text-zinc-400 font-mono transition-colors"
                                >
                                    Dismiss All
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                                {starterDeck.map((card, i) => (
                                    <div
                                        key={card.name}
                                        className={`border bg-void p-3 flex flex-col gap-2 animate-fade-in ${getCategoryStyle(card.category)}`}
                                        style={{ animationDelay: `${i * 50}ms` }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-mono text-bone">{card.name}</span>
                                            <span className="text-[8px] font-mono uppercase text-zinc-600">{card.category}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleKeepCard(card)}
                                                disabled={isClassifying}
                                                className="flex-1 text-[10px] font-mono py-1 bg-void border border-[#00FF41]/40 text-[#00FF41] hover:border-[#00FF41] hover:bg-[#00FF41]/10 transition-all disabled:opacity-50"
                                            >
                                                KEEP
                                            </button>
                                            <button
                                                onClick={() => handleDiscardCard(card)}
                                                className="flex-1 text-[10px] font-mono py-1 bg-void border border-zinc-800 text-zinc-500 hover:text-[#FF0000] hover:border-[#FF0000]/60 transition-all"
                                            >
                                                BURN
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sovereign Primitives Menu */}
                    <div className="bg-[#121212] border-2 border-zinc-700 h-[850px] overflow-y-auto relative flex flex-col">
                        <div className="p-4 border-b border-zinc-800 bg-void sticky top-0 z-20">
                            <h3 className="text-xs uppercase text-zinc-500 font-mono">
                                Sovereign Primitives (Quick Add)
                            </h3>
                            <p className="text-[10px] text-zinc-500 mt-1">
                                Click a category to reveal verified primitives.
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {PRIMITIVES.map(group => (
                                <PrimitiveGroup
                                    key={group.cat}
                                    group={group}
                                    isClassifying={isClassifying}
                                    items={items}
                                    onProcess={processItem}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {viewMode === 'spatial' ? (
                    <div className="h-[850px] flex flex-col relative">
                        <div className="flex-none">
                            <ArmoryMap items={items} />
                            <div className="mt-6 p-4 border border-[#00FF41]/50 bg-[#00FF41]/10 text-[#00FF41] text-sm font-mono mb-4">
                                WARNING: Ensure you have items in the <span className="font-bold">RITUAL</span> or <span className="font-bold">CRAFT</span> quadrants.
                            </div>
                        </div>

                        {/* Scrollable List */}
                        <div className="space-y-4 pr-2 border-t border-zinc-800 pt-4 flex-1 overflow-y-auto min-h-0">
                            <h3 className="text-xs uppercase text-zinc-500 font-mono">{v.armory_list_title} ({items.length})</h3>
                            {items.map(item => (
                                <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-bone uppercase">{item.verb}</span>
                                        <span className="text-xs font-mono text-zinc-500 uppercase">{item.quadrant}</span>
                                    </div>
                                    <div className="space-y-6 pt-2">
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
                                                    const newX = Number.parseInt(e.target.value);
                                                    onUpdateItem(item.id, newX, item.y);
                                                }}
                                                className="w-full accent-white h-1 bg-zinc-800 appearance-none cursor-pointer"
                                            />
                                        </div>

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
                                                    const newY = Number.parseInt(e.target.value);
                                                    onUpdateItem(item.id, item.x, newY);
                                                }}
                                                className="w-full accent-white h-1 bg-zinc-800 appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {items.length === 0 && (
                                <p className="text-zinc-500 italic text-sm">{v.armory_empty_spatial}</p>
                            )}
                        </div>

                        {/* Pinned Proceed Button */}
                        <div className="flex-none pt-4 bg-void border-t border-zinc-800 mt-auto sticky bottom-0">
                            <Button onClick={onNext} disabled={items.length < 3} className="w-full">
                                Proceed to Compression &rarr;
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* TERMINAL AUDIT MODE — High-density data grid */
                    <div className="h-[850px] flex flex-col">
                        <div className="flex-1 overflow-y-auto border border-zinc-800 bg-void">
                            <table className="w-full font-mono text-xs">
                                <thead className="bg-zinc-900 sticky top-0 z-10">
                                    <tr className="border-b border-zinc-700">
                                        <th className="text-left text-[10px] text-zinc-500 uppercase p-3 w-8">#</th>
                                        <th className="text-left text-[10px] text-zinc-500 uppercase p-3">VERB</th>
                                        <th className="text-center text-[10px] text-zinc-500 uppercase p-3 w-16">X</th>
                                        <th className="text-center text-[10px] text-zinc-500 uppercase p-3 w-16">Y</th>
                                        <th className="text-left text-[10px] text-zinc-500 uppercase p-3 w-24">QUADRANT</th>
                                        <th className="text-center text-[10px] text-zinc-500 uppercase p-3 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={item.id} className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors">
                                            <td className="p-3 text-zinc-600">{i + 1}</td>
                                            <td className="p-3 text-bone font-bold uppercase">{item.verb}</td>
                                            <td className="p-3 text-center">
                                                <input
                                                    type="number" min="-10" max="10"
                                                    value={item.x}
                                                    onChange={(e) => onUpdateItem(item.id, Number.parseInt(e.target.value) || 0, item.y)}
                                                    className="w-12 bg-zinc-900 border border-zinc-700 text-center text-bone p-1 font-mono text-xs focus:border-white outline-none"
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <input
                                                    type="number" min="-10" max="10"
                                                    value={item.y}
                                                    onChange={(e) => onUpdateItem(item.id, item.x, Number.parseInt(e.target.value) || 0)}
                                                    className="w-12 bg-zinc-900 border border-zinc-700 text-center text-bone p-1 font-mono text-xs focus:border-white outline-none"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <span className={`text-[10px] uppercase ${item.quadrant === 'Ritual' || item.quadrant === 'Craft'
                                                    ? 'text-[#00FF41]'
                                                    : 'text-zinc-500'
                                                    }`}>{item.quadrant}</span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => onUpdateItem(item.id, item.x, item.y)}
                                                    className="text-zinc-700 hover:text-red-500 transition-colors text-xs"
                                                    title="Re-classify"
                                                >
                                                    ↻
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-zinc-600 italic">
                                                {v.armory_empty_terminal}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Status bar */}
                        <div className="flex-none bg-zinc-900 border border-zinc-800 border-t-0 p-2 flex justify-between items-center">
                            <span className="text-[10px] text-zinc-500 font-mono">
                                {items.length} {v.armory_status_label} | {items.filter(i => i.quadrant === 'Ritual' || i.quadrant === 'Craft').length} in {v.quadrant_ritual}/{v.quadrant_craft}
                            </span>
                            <span className="text-[10px] text-zinc-600 font-mono">TAB to navigate | ENTER to add</span>
                        </div>

                        {/* Proceed */}
                        <div className="flex-none pt-4">
                            <Button onClick={onNext} disabled={items.length < 3} className="w-full">
                                {v.armory_proceed}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

