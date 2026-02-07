import React, { useState } from 'react';
import { OperatorProfile } from '../../types';
import { Button } from '../Visuals';
import { useVernacular } from '../../contexts/VernacularContext';

interface CalibrationPhaseProps {
    initialProfile?: OperatorProfile | null;
    onComplete: (profile: OperatorProfile) => void;
}

export const CalibrationPhase: React.FC<CalibrationPhaseProps> = ({ initialProfile, onComplete }) => {
    const { v } = useVernacular();

    const [profile, setProfile] = useState<OperatorProfile>(initialProfile || {
        name: '',
        industry: '',
        strategicGoal: '',
        preferredTone: 'default',
    });

    const tones = ['default', 'clinical', 'aggressive', 'philosophical', 'playful'] as const;

    return (
        <div className="max-w-lg mx-auto px-4">
            <div className="mb-12 text-center">
                <h2 className="text-2xl font-display font-black uppercase tracking-tighter">{v.calibration_title}</h2>
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] mt-2">{v.calibration_subtitle}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onComplete(profile); }} className="space-y-6">
                <div>
                    <div>
                        <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-mono tracking-widest">{v.label_name}</label>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                            className="w-full bg-zinc-900/50 border border-zinc-700 text-white p-3 font-mono focus:outline-none focus:border-white transition-colors"
                            placeholder={v.placeholder_name}
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-mono tracking-widest">{v.label_industry}</label>
                    <input
                        type="text"
                        value={profile.industry}
                        onChange={(e) => setProfile(p => ({ ...p, industry: e.target.value }))}
                        className="w-full bg-zinc-900/50 border border-zinc-700 text-white p-3 font-mono focus:outline-none focus:border-white transition-colors"
                        placeholder={v.placeholder_industry}
                        required
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-mono tracking-widest">{v.label_goal}</label>
                    <textarea
                        value={profile.strategicGoal}
                        onChange={(e) => setProfile(p => ({ ...p, strategicGoal: e.target.value }))}
                        className="w-full bg-zinc-900/50 border border-zinc-700 text-white p-3 font-mono focus:outline-none focus:border-white transition-colors h-20 resize-none"
                        placeholder={v.placeholder_goal}
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-mono tracking-widest">{v.label_tone}</label>
                    <div className="grid grid-cols-5 gap-2">
                        {tones.map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setProfile(p => ({ ...p, preferredTone: t }))}
                                className={`py-2 text-[10px] font-mono uppercase border transition-all ${profile.preferredTone === t
                                    ? 'border-white text-white bg-white/10'
                                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                <Button type="submit" className="w-full py-4" disabled={!profile.name || !profile.industry}>
                    {v.calibration_submit}
                </Button>
            </form>
            <div className="mt-8 text-center text-[8px] font-mono text-zinc-700 uppercase tracking-[0.3em]">
                {v.calibration_footer}
            </div>
        </div>
    );
};
