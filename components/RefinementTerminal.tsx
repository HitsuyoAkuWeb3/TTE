import React, { useState } from 'react';
import { Button } from './Visuals';
import { useVernacular } from '../contexts/VernacularContext';

interface RefinementTerminalProps {
    onRefine: (feedback: string) => void;
    isRefining: boolean;
    onClose: () => void;
}

export const RefinementTerminal: React.FC<RefinementTerminalProps> = ({ onRefine, isRefining, onClose }) => {
    const [feedback, setFeedback] = useState('');
    const { v } = useVernacular();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (feedback.trim()) {
            onRefine(feedback);
            setFeedback('');
        }
    };

    return (
        <div className="fixed inset-0 bg-void/80 z-50 flex items-center justify-center p-4">
            <div className="max-w-xl w-full border border-zinc-800 bg-void p-8 shadow-[0_0_100px_rgba(255,255,255,0.05)] relative overflow-hidden">
                {/* Scanline decoration */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20 animate-scan"></div>

                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-xl font-display font-black tracking-tighter uppercase">{v.refine_title}</h2>
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1">{v.refine_subtitle}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-600 hover:text-bone transition-colors text-xs font-mono uppercase">[ Close ]</button>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 p-4 font-mono text-[10px] text-zinc-400 mb-6 h-32 overflow-y-auto">
                    <div className="text-zinc-600 mb-2">{v.refine_log_label}</div>
                    <div>{v.refine_log_waiting}</div>
                    {isRefining && <div className="text-bone animate-pulse mt-2">{v.refine_log_processing}</div>}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="refine-feedback" className="block text-[10px] uppercase text-zinc-500 mb-2 font-mono">{v.refine_input_label}</label>
                        <textarea
                            id="refine-feedback"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-zinc-700 p-4 font-mono text-sm text-bone focus:border-white outline-none transition-colors h-24 resize-none"
                            placeholder="e.g., 'Make Day 3 more aggressive on sales', 'Add a focus on LinkedIn outreach'..."
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full py-4 relative group overflow-hidden"
                        disabled={isRefining || !feedback.trim()}
                    >
                        <span className="relative z-10">{isRefining ? v.refine_cta_processing : v.refine_cta}</span>
                        <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                    </Button>
                </form>

                <div className="mt-8 text-[8px] font-mono text-zinc-700 uppercase tracking-[0.4em] text-center">
                    {v.refine_footer}
                </div>
            </div>
        </div>
    );
};
