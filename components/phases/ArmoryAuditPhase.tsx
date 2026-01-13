import React, { useState } from 'react';
import { ArmoryItem } from '../../types';
import { classifyActivity } from '../../services/geminiService';
import { Button, Input, SectionHeader, ArmoryMap } from '../Visuals';

const PRESETS = [
    "Writing Code", "Designing UI", "Sales Calls", "Debugging",
    "Writing Copy", "Project Management", "Creating Content",
    "Financial Planning", "Public Speaking", "Team Leadership",
    "Researching", "Editing Video", "Customer Support", "Data Analysis"
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

    const processItem = async (text: string) => {
        if (!text.trim()) return;
        setIsClassifying(true);
        // Uses gemini-2.5-flash-lite for speed
        const pos = await classifyActivity(text);
        onAddItem(text, pos.x, pos.y);
        setVerb('');
        setIsClassifying(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        processItem(verb);
    };

    return (
        <div className="max-w-4xl mx-auto w-full animate-fade-in">
            <SectionHeader
                title="Phase 1: Armory Audit"
                subtitle="List every recurring activity. Verbs only. No metaphors."
                onBack={onBack}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
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

                    <div className="bg-zinc-900/30 p-4 border border-zinc-800">
                        <p className="text-xs uppercase text-zinc-500 mb-3 font-mono">Quick Add (Analysis Paralysis Breakers)</p>
                        <div className="flex flex-wrap gap-2">
                            {PRESETS.map(preset => (
                                <button
                                    key={preset}
                                    disabled={isClassifying || items.some(i => i.verb === preset)}
                                    onClick={() => processItem(preset)}
                                    className="text-[10px] uppercase font-mono px-2 py-1 border border-zinc-700 bg-zinc-900 hover:border-zinc-400 hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
                        {items.map(item => (
                            <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-white uppercase">{item.verb}</span>
                                    <span className="text-xs font-mono text-zinc-500 uppercase">{item.quadrant}</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-500 w-12 text-right">CONST</span>
                                        <input
                                            type="range" min="-10" max="10" step="1"
                                            value={item.x}
                                            onChange={(e) => {
                                                const newX = parseInt(e.target.value);
                                                onUpdateItem(item.id, newX, item.y);
                                            }}
                                            className="w-full accent-white h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-[10px] text-zinc-500 w-12">DISRUPT</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-500 w-12 text-right">PLAY</span>
                                        <input
                                            type="range" min="-10" max="10" step="1"
                                            value={item.y}
                                            onChange={(e) => {
                                                const newY = parseInt(e.target.value);
                                                onUpdateItem(item.id, item.x, newY);
                                            }}
                                            className="w-full accent-white h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-[10px] text-zinc-500 w-12">DISCIPL</span>
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
