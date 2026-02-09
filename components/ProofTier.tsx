import React from 'react';
import { useVernacular } from '../contexts/VernacularContext';
import { SystemState } from '../types';

interface ProofTierProps {
    state: SystemState;
}

export const ProofTier: React.FC<ProofTierProps> = ({ state }) => {
    const { v } = useVernacular();

    const calculateProof = () => {
        let score = 0;
        if (state.profile) score += 10;
        if (state.armory.length > 0) score += 15;
        if (state.candidates.length > 0) score += 15;
        // Check if any candidate has ANY score > 0
        if (state.candidates.some(c => Object.values(c.scores).some(s => (s as number) > 0))) score += 15;
        if (state.theoryOfValue) score += 20;
        if (state.pilotPlan) score += 15;
        if (state.finalized) score += 10;
        return score;
    };

    const percentage = calculateProof();

    const getTier = (p: number) => {
        if (p >= 100) return { label: v.tier_artifact, color: 'text-spirit' };
        if (p >= 80) return { label: v.tier_near_final, color: 'text-emerald-400' };
        if (p >= 40) return { label: v.tier_draft, color: 'text-amber-400' };
        return { label: v.tier_seed, color: 'text-zinc-500' };
    };

    const tier = getTier(percentage);

    return (
        <div className="flex flex-col gap-0.5 min-w-[100px] select-none group">
            <div className={`text-[9px] font-mono font-bold uppercase tracking-widest flex justify-between transition-colors duration-500 ${tier.color}`}>
                <span className="opacity-80 group-hover:opacity-100 transition-opacity">{v.tier_label}</span>
                <span className="opacity-80 group-hover:opacity-100 transition-opacity">{Math.round(percentage)}%</span>
            </div>
            
            {/* Segmented Bar */}
            <div className="flex gap-0.5 h-1.5">
                {Array.from({ length: 10 }).map((_, i) => {
                    const threshold = (i + 1) * 10;
                    const filled = percentage >= threshold;
                    const glows = filled && percentage >= 100 ? 'animate-pulse-subtle shadow-[0_0_8px_rgba(56,189,248,0.5)]' : '';
                    
                    const getBgColor = () => {
                         if (!filled) return 'bg-zinc-900 border border-zinc-800';
                         if (percentage >= 100) return 'bg-spirit';
                         if (percentage >= 80) return 'bg-emerald-500';
                         if (percentage >= 40) return 'bg-amber-500';
                         return 'bg-zinc-600';
                    };

                    return (
                        <div 
                            key={i}
                            className={`flex-1 rounded-[1px] transition-all duration-700 ${getBgColor()} ${glows}`}
                        />
                    );
                })}
            </div>
            
            <div className={`text-[8px] font-mono text-center transition-colors duration-500 ${tier.color} opacity-60 group-hover:opacity-100 uppercase tracking-wider`}>
                {tier.label}
            </div>
        </div>
    );
};
