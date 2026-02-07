import React from 'react';
import { Button } from '../Visuals';
import { useVernacular, VernacularToggle } from '../../contexts/VernacularContext';

export const IntroPhase: React.FC<{ onStart: (name: string) => void }> = ({ onStart }) => {
    const [name, setName] = React.useState('');
    const { v } = useVernacular();

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-2xl mx-auto px-6">
            <div className="mb-8 relative">
                <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-bone to-zinc-600 uppercase">
                    {v.intro_headline_1}<br />{v.intro_headline_2}<br />{v.intro_headline_3}
                </h1>
                <div className="absolute inset-0 bg-white/5 blur-3xl -z-10 rounded-full"></div>
            </div>

            <p className="font-mono text-zinc-400 mb-6 max-w-lg leading-relaxed whitespace-pre-line">
                {v.intro_subtitle}
            </p>

            {/* Mode Picker */}
            <div className="mb-8 space-y-2">
                <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
                    {v.intro_mode_label}
                </div>
                <VernacularToggle />
            </div>

            <div className="mb-8 w-full max-w-xs">
                <label className="block text-[9px] uppercase text-zinc-600 mb-2 font-mono tracking-widest text-left">
                    {v.intro_input_label}
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={v.intro_placeholder}
                    className="w-full bg-void border border-zinc-800 p-3 font-mono text-sm text-bone focus:border-bone outline-none transition-all text-center placeholder:text-zinc-700"
                />
            </div>

            <Button onClick={() => onStart(name || 'Unknown Subject')}>{v.intro_button}</Button>
        </div>
    );
};
