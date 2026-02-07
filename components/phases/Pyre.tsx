import React, { useState, useEffect, useCallback } from 'react';
import { ToolCandidate } from '../../types';
import { useVernacular } from '../../contexts/VernacularContext';

// ============================================================
// THE PYRE — Tool Retirement Ceremony
// ============================================================

interface PyreProps {
    tool: ToolCandidate;
    onBurnComplete: (toolId: string) => void;
    onCancel: () => void;
}

export const Pyre: React.FC<PyreProps> = ({ tool, onBurnComplete, onCancel }) => {
    const [phase, setPhase] = useState<'confirm' | 'burning' | 'ashes'>('confirm');
    const [burnProgress, setBurnProgress] = useState(0);
    const [confirmText, setConfirmText] = useState('');
    const { v } = useVernacular();

    const isConfirmed = confirmText.trim().toLowerCase() === tool.plainName.trim().toLowerCase();

    useEffect(() => {
        if (phase !== 'burning') return;
        const interval = setInterval(() => {
            setBurnProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setPhase('ashes');
                    return 100;
                }
                return p + 2;
            });
        }, 40);
        return () => clearInterval(interval);
    }, [phase]);

    useEffect(() => {
        if (phase === 'ashes') {
            const timer = setTimeout(() => onBurnComplete(tool.id), 1500);
            return () => clearTimeout(timer);
        }
    }, [phase, tool.id, onBurnComplete]);

    const handleIgnite = useCallback(() => {
        if (!isConfirmed) return;
        setPhase('burning');
    }, [isConfirmed]);

    if (phase === 'confirm') {
        return (
            <div
                className="fixed inset-0 z-200 flex items-center justify-center animate-fade-in transition-colors duration-300"
                style={{
                    backgroundColor: confirmText.length > 0 && !isConfirmed
                        ? 'rgba(127, 29, 29, 0.15)'
                        : 'rgba(0, 0, 0, 0.9)',
                }}
            >
                <div className="max-w-md w-full mx-4 border border-red-900/50 bg-void p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="text-3xl">🔥</div>
                        <h2 className="text-sm uppercase tracking-[0.3em] text-red-400 font-mono font-bold">
                            {v.pyre_title}
                        </h2>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                            {v.pyre_subtitle}
                        </p>
                    </div>

                    <div className="border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                        <div className="text-[10px] text-zinc-500 uppercase mb-1">{v.pyre_target_label}</div>
                        <div className="text-lg font-bold text-bone font-mono">{tool.plainName}</div>
                        <div className="text-xs text-zinc-400 mt-1 italic">"{tool.functionStatement}"</div>
                    </div>

                    <p className="text-xs text-zinc-400 font-mono leading-relaxed text-center">
                        {v.pyre_description}
                    </p>

                    {/* Typed Confirmation */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block text-center">
                            {v.pyre_confirm_prompt}
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={tool.plainName}
                            className="w-full bg-zinc-900 border text-sm font-mono text-bone px-4 py-3 text-center tracking-wider transition-colors duration-200 outline-none"
                            style={{
                                borderColor: isConfirmed ? '#EF4444' : '#27272a',
                            }}
                            autoFocus
                        />
                        {confirmText.length > 0 && !isConfirmed && (
                            <div className="text-[8px] font-mono text-hazard text-center uppercase tracking-widest">
                                {v.pyre_confirm_mismatch}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 text-[10px] font-mono uppercase tracking-wider border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-all"
                        >
                            {v.pyre_cancel}
                        </button>
                        <button
                            onClick={handleIgnite}
                            disabled={!isConfirmed}
                            className={`flex-1 py-3 text-[10px] font-mono uppercase tracking-wider border transition-all ${
                                isConfirmed
                                    ? 'border-red-800 text-red-400 hover:bg-red-900/20 hover:text-red-300 hover:border-red-600 cursor-pointer'
                                    : 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                            }`}
                        >
                            {v.pyre_ignite}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'burning') {
        return (
            <div className="fixed inset-0 z-200 bg-void flex items-center justify-center">
                <div className="text-center space-y-8">
                    <div
                        className="text-2xl font-mono font-bold transition-all duration-300"
                        style={{
                            color: `rgb(${255}, ${Math.max(0, 100 - burnProgress)}, ${Math.max(0, 50 - burnProgress / 2)})`,
                            opacity: Math.max(0.1, 1 - burnProgress / 120),
                            filter: `blur(${burnProgress / 25}px)`,
                            transform: `scale(${1 + burnProgress / 200})`,
                        }}
                    >
                        {tool.plainName}
                    </div>

                    <div className="relative h-32 w-64 mx-auto overflow-hidden">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div
                                key={`particle-${i}`}
                                className="absolute rounded-full animate-pulse"
                                style={{
                                    width: `${4 + Math.random() * 8}px`,
                                    height: `${4 + Math.random() * 8}px`,
                                    backgroundColor: ['#FF4500', '#FF6B35', '#FFD700', '#FF2A2A'][i % 4],
                                    left: `${20 + Math.random() * 60}%`,
                                    bottom: `${Math.random() * burnProgress}%`,
                                    opacity: Math.random() * 0.8 + 0.2,
                                    animationDuration: `${0.3 + Math.random() * 0.7}s`,
                                    boxShadow: `0 0 ${6 + Math.random() * 10}px currentColor`,
                                }}
                            />
                        ))}
                    </div>

                    <div className="w-64 mx-auto">
                        <div className="h-[2px] bg-zinc-900">
                            <div
                                className="h-full transition-all duration-100"
                                style={{
                                    width: `${burnProgress}%`,
                                    background: 'linear-gradient(90deg, #FF4500, #FFD700, #FF2A2A)',
                                }}
                            />
                        </div>
                        <div className="text-[9px] text-zinc-600 font-mono mt-2 uppercase tracking-widest">
                            {v.pyre_progress_label}... {burnProgress}%
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-200 bg-void flex items-center justify-center animate-fade-in">
            <div className="text-center space-y-4">
                <div className="text-4xl opacity-30">🪦</div>
                <div className="text-xs font-mono text-zinc-600 uppercase tracking-[0.3em]">
                    {tool.plainName}
                </div>
                <div className="text-[10px] font-mono text-zinc-700 tracking-wider">
                    {v.pyre_complete}
                </div>
            </div>
        </div>
    );
};
