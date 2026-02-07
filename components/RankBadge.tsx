import React, { useState, useEffect } from 'react';
import { getRank, getRankProgress, MythicRank } from '../services/gamification';

// ============================================================
// RANK BADGE — Displays current Mythic Rank with XP progress
// ============================================================

interface RankBadgeProps {
    xp: number;
    compact?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ xp, compact = false }) => {
    const rank = getRank(xp);
    const progress = getRankProgress(xp);
    const [showTooltip, setShowTooltip] = useState(false);

    if (compact) {
        return (
            <span
                className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-mono cursor-default"
                style={{ color: rank.color }}
                title={`${rank.name} — ${xp.toLocaleString()} XP`}
            >
                {rank.glyph} {rank.name}
            </span>
        );
    }

    return (
        <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div
                className="flex items-center gap-2 px-3 py-1.5 border bg-black/80 cursor-default transition-colors"
                style={{ borderColor: `${rank.color}33` }}
            >
                <span className="text-sm" style={{ color: rank.color }}>{rank.glyph}</span>
                <div className="flex flex-col">
                    <span
                        className="text-[9px] uppercase tracking-wider font-mono font-bold"
                        style={{ color: rank.color }}
                    >
                        {rank.name}
                    </span>
                    {/* XP progress micro-bar */}
                    <div className="w-16 h-[2px] bg-zinc-800 mt-0.5">
                        <div
                            className="h-full transition-all duration-700 ease-out"
                            style={{ width: `${progress}%`, backgroundColor: rank.color }}
                        />
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute top-full right-0 mt-1 bg-black border border-zinc-800 shadow-lg p-3 z-50 w-44 animate-fade-in">
                    <div className="text-[9px] text-zinc-500 uppercase font-mono mb-1">Experience</div>
                    <div className="text-sm font-bold font-mono text-white">{xp.toLocaleString()} XP</div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-1">{progress}% to next rank</div>
                </div>
            )}
        </div>
    );
};

// ============================================================
// XP TOAST — Pop-up notification when XP is awarded
// ============================================================

interface XpToastProps {
    amount: number;
    reason: string;
    onDone: () => void;
}

export const XpToast: React.FC<XpToastProps> = ({ amount, reason, onDone }) => {
    useEffect(() => {
        const timer = setTimeout(onDone, 2500);
        return () => clearTimeout(timer);
    }, [onDone]);

    return (
        <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
            <div className="bg-black border border-[#00FF41]/30 px-4 py-3 shadow-[0_0_20px_rgba(0,255,65,0.15)] flex items-center gap-3">
                <span className="text-[#00FF41] font-mono font-black text-sm">+{amount} XP</span>
                <span className="text-zinc-400 font-mono text-[10px] uppercase">{reason}</span>
            </div>
        </div>
    );
};
