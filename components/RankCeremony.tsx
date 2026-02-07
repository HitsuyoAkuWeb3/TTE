import React, { useEffect, useState } from 'react';
import { MythicRank, getRankProgress, RANKS } from '../services/gamification';
import { useVernacular } from '../contexts/VernacularContext';

// ============================================================
// RANK CEREMONY — Full-screen overlay when user reaches a new rank
// ============================================================

interface RankCeremonyProps {
    rank: MythicRank;
    xp: number;
    onDismiss: () => void;
}

export const RankCeremony: React.FC<RankCeremonyProps> = ({ rank, xp, onDismiss }) => {
    const { v } = useVernacular();
    const progress = getRankProgress(xp);
    const nextRank = RANKS.find(r => r.level === rank.level + 1);
    const [phase, setPhase] = useState<'enter' | 'glyph' | 'details' | 'ready'>('enter');

    // Staged reveal animation
    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase('glyph'), 400),
            setTimeout(() => setPhase('details'), 1200),
            setTimeout(() => setPhase('ready'), 2200),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
        >
            {/* Radial pulse behind glyph */}
            <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                    background: `radial-gradient(circle at center, ${rank.color}15 0%, transparent 60%)`,
                }}
            />

            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
                {/* Overline */}
                <div
                    className={`text-[9px] uppercase tracking-[0.5em] font-mono mb-8 transition-all duration-700 ${
                        phase !== 'enter' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ color: rank.color }}
                >
                    {v.ceremony_overline}
                </div>

                {/* Giant Glyph */}
                <div
                    className={`text-8xl md:text-9xl mb-6 transition-all duration-1000 ${
                        phase !== 'enter' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    }`}
                    style={{
                        color: rank.color,
                        textShadow: `0 0 60px ${rank.color}66, 0 0 120px ${rank.color}33`,
                        filter: phase === 'glyph' ? `drop-shadow(0 0 40px ${rank.color})` : 'none',
                    }}
                >
                    {rank.glyph}
                </div>

                {/* Rank Name */}
                <h2
                    className={`font-display text-4xl md:text-5xl uppercase tracking-wider mb-3 transition-all duration-700 ${
                        ['details', 'ready'].includes(phase) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ color: rank.color }}
                >
                    {rank.name}
                </h2>

                {/* Level indicator */}
                <div
                    className={`text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-8 transition-all duration-700 ${
                        ['details', 'ready'].includes(phase) ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    {v.ceremony_level} {rank.level} — {xp.toLocaleString()} XP
                </div>

                {/* Progress to next rank */}
                {nextRank && (
                    <div
                        className={`w-full max-w-xs mb-8 transition-all duration-700 ${
                            phase === 'ready' ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <div className="flex justify-between text-[8px] font-mono text-zinc-600 uppercase mb-1">
                            <span>{rank.name}</span>
                            <span>{nextRank.name}</span>
                        </div>
                        <div className="w-full h-[2px] bg-zinc-800">
                            <div
                                className="h-full transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%`, backgroundColor: rank.color }}
                            />
                        </div>
                    </div>
                )}

                {/* Dismiss */}
                <button
                    onClick={onDismiss}
                    className={`text-[10px] font-mono uppercase tracking-[0.3em] px-6 py-3 border transition-all duration-700 ${
                        phase === 'ready'
                            ? 'opacity-100 translate-y-0 cursor-pointer'
                            : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                    style={{
                        color: rank.color,
                        borderColor: `${rank.color}44`,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = rank.color;
                        e.currentTarget.style.backgroundColor = `${rank.color}11`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${rank.color}44`;
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    {v.ceremony_dismiss}
                </button>
            </div>
        </div>
    );
};
