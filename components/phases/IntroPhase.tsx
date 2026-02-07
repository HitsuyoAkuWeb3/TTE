import React from 'react';
import { Button } from '../Visuals';
import { useVernacular, VernacularToggle } from '../../contexts/VernacularContext';

export const IntroPhase: React.FC<{ onStart: (name: string) => void }> = ({ onStart }) => {
    const [name, setName] = React.useState('');
    const { v } = useVernacular();

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-2xl mx-auto px-6">
            <div className="mb-8 relative">
                <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-bone uppercase [text-shadow:4px_4px_0_rgba(0,0,0,0.8)]">
                    {v.intro_headline_1}<br />{v.intro_headline_2}<br />{v.intro_headline_3}
                </h1>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-bone/5 -z-10"></div>
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
                <label htmlFor="intro-name" className="block text-[9px] uppercase text-zinc-600 mb-2 font-mono tracking-widest text-left">
                    {v.intro_input_label}
                </label>
                <input
                    id="intro-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={v.intro_placeholder}
                    className="w-full bg-void border border-zinc-800 p-3 font-mono text-sm text-bone focus:border-bone outline-none transition-all text-center placeholder:text-zinc-700"
                />
            </div>

            <Button onClick={() => onStart(name || v.unknown_subject)}>{v.intro_button}</Button>
        </div>
    );
};
