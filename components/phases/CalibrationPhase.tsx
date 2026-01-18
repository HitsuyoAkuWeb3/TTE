import React, { useState } from 'react';
import { Button } from '../Visuals';
import { OperatorProfile } from '../../types';

interface CalibrationPhaseProps {
    initialProfile?: OperatorProfile | null;
    onComplete: (profile: OperatorProfile) => void;
}

export const CalibrationPhase: React.FC<CalibrationPhaseProps> = ({ initialProfile, onComplete }) => {
    const [profile, setProfile] = useState<OperatorProfile>(initialProfile || {
        name: '',
        industry: '',
        strategicGoal: '',
        preferredTone: 'clinical'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (profile.name && profile.industry && profile.strategicGoal) {
            onComplete(profile);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-12 px-6 bg-black border border-zinc-800 shadow-[0_0_50px_rgba(255,255,255,0.02)] relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-900 via-white to-zinc-900 opacity-20"></div>

            <header className="mb-10 text-center">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Neural_Calibration_System</h2>
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] mt-2">Operator Profiling & Identity Ledger</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-mono tracking-widest">Operator Alias</label>
                        <input
                            type="text"
                            required
                            value={profile.name}
                            onChange={(e) => setProfile(s => ({ ...s, name: e.target.value }))}
                            className="w-full bg-zinc-900/50 border border-zinc-800 p-4 font-mono text-sm text-white focus:border-white outline-none transition-all placeholder:text-zinc-700"
                            placeholder="e.g., ARCHITECT_01"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-mono tracking-widest">Domain of Operation</label>
                        <input
                            type="text"
                            required
                            value={profile.industry}
                            onChange={(e) => setProfile(s => ({ ...s, industry: e.target.value }))}
                            className="w-full bg-zinc-900/50 border border-zinc-800 p-4 font-mono text-sm text-white focus:border-white outline-none transition-all placeholder:text-zinc-700"
                            placeholder="e.g., Enterprise Software / BioTech"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-mono tracking-widest">Core Strategic Directive</label>
                        <textarea
                            required
                            value={profile.strategicGoal}
                            onChange={(e) => setProfile(s => ({ ...s, strategicGoal: e.target.value }))}
                            className="w-full bg-zinc-900/50 border border-zinc-800 p-4 font-mono text-sm text-white focus:border-white outline-none transition-all h-24 resize-none placeholder:text-zinc-700"
                            placeholder="e.g., Automate client acquisition pipelines while maintaining high-ticket rarity."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-mono tracking-widest">Architectural Tone</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['clinical', 'empathetic', 'aggressive', 'minimalist'] as const).map((tone) => (
                                <button
                                    key={tone}
                                    type="button"
                                    onClick={() => setProfile(s => ({ ...s, preferredTone: tone }))}
                                    className={`py-3 px-4 text-[10px] font-mono uppercase tracking-widest border transition-all ${profile.preferredTone === tone
                                        ? 'bg-white text-black border-white'
                                        : 'bg-black text-zinc-600 border-zinc-800 hover:border-zinc-400'
                                        }`}
                                >
                                    {tone}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <Button type="submit" className="w-full py-4 text-xs font-bold uppercase tracking-[0.4em]">
                        Finalize Calibration
                    </Button>
                </div>
            </form>

            <footer className="mt-12 text-[8px] font-mono text-zinc-800 uppercase text-center tracking-widest">
                TetraTool // Profile Ledger Locked After Initialization
            </footer>
        </div>
    );
};
