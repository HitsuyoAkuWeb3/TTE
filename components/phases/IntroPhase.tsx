import React from 'react';
import { Button } from '../Visuals';

export const IntroPhase: React.FC<{ onStart: (name: string) => void }> = ({ onStart }) => {
    const [name, setName] = React.useState('');

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-2xl mx-auto px-6">
            <div className="mb-8 relative">
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 uppercase">
                    Tetra<br />Tool<br />Engine
                </h1>
                <div className="absolute inset-0 bg-white/5 blur-3xl -z-10 rounded-full"></div>
            </div>
            <p className="font-mono text-zinc-400 mb-8 max-w-lg leading-relaxed">
                POST-NEON DIAGNOSTIC ENGINE v2.0<br />
                <span className="text-zinc-600">--------------------------------</span><br />
                Identify, validate, and install your unextractable Starting Tool.
                This is not a quiz. It is an architecture protocol.
            </p>

            <div className="mb-8 w-full max-w-xs">
                <label className="block text-[9px] uppercase text-zinc-600 mb-2 font-mono tracking-widest text-left">Subject Identification [Entity Name]</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Client/Entity Name"
                    className="w-full bg-black border border-zinc-800 p-3 font-mono text-sm text-white focus:border-white outline-none transition-all text-center placeholder:text-zinc-700"
                />
            </div>

            <Button onClick={() => onStart(name || 'Unknown Subject')}>Initialize System</Button>
        </div>
    );
};
