import React from 'react';
import { useVernacular } from '../../contexts/VernacularContext';
import { Button } from '../Visuals';

// Re-defining for now to avoiding circular dependency issues if I import from RitualDashboard before it exports
export interface DailyEntry {
    date: string;
    clientReached: number;
    offersSent: number;
    revenue: number;
    note: string;
    mood: 'focused' | 'scattered' | 'blocked' | 'flow';
}

interface MomiyoseViewProps {
    entries: DailyEntry[];
    onClose: () => void;
    onSeal: () => void;
}

export const MomiyoseView: React.FC<MomiyoseViewProps> = ({ entries, onClose, onSeal }) => {
    const { v } = useVernacular();

    // Stats for the "week" (last 7 entries or literally this week? Let's use last 7 days equivalent)
    // For MVP, just aggregate what's passed (usually recent history).
    const recentEntries = entries.slice(0, 7);
    
    const totalRevenue = recentEntries.reduce((sum, e) => sum + e.revenue, 0);
    const totalClients = recentEntries.reduce((sum, e) => sum + e.clientReached, 0);
    const totalOffers = recentEntries.reduce((sum, e) => sum + e.offersSent, 0);
    const moodCounts = recentEntries.reduce((acc, e) => {
        acc[e.mood] = (acc[e.mood] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const dominantMood = Object.entries(moodCounts).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0]?.[0] || 'N/A';

    return (
        <div className="border border-indigo-500/30 bg-indigo-950/10 p-8 space-y-6 animate-fade-in relative overflow-hidden rounded-sm">
             {/* Background decorative elements */}
             <div className="absolute -top-6 -right-6 p-4 opacity-5 text-9xl font-black text-indigo-500 pointer-events-none select-none">
                MOMIYOSE
             </div>

             <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-indigo-400 uppercase tracking-widest mb-2">{v.momiyose_title}</h2>
                        <p className="text-xs text-indigo-300/60 font-mono tracking-wide">{v.momiyose_subtitle}</p>
                    </div>
                    <div className="text-right">
                         <div className="text-[10px] text-indigo-500/50 uppercase tracking-widest font-mono">Entries Analyzed</div>
                         <div className="text-xl font-mono text-indigo-400">{recentEntries.length}</div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 text-center">
                        <div className="text-xs text-indigo-400/70 uppercase mb-1">Revenue</div>
                        <div className="text-3xl font-black text-indigo-100">${totalRevenue}</div>
                    </div>
                    <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 text-center">
                        <div className="text-xs text-indigo-400/70 uppercase mb-1">Outreach</div>
                        <div className="text-3xl font-black text-indigo-100">{totalClients}</div>
                    </div>
                    <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 text-center">
                        <div className="text-xs text-indigo-400/70 uppercase mb-1">Offers</div>
                        <div className="text-3xl font-black text-indigo-100">{totalOffers}</div>
                    </div>
                    <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 text-center">
                        <div className="text-xs text-indigo-400/70 uppercase mb-1">Dominant Mood</div>
                        <div className="text-xl font-black text-indigo-100 uppercase mt-1.5">{dominantMood}</div>
                    </div>
                </div>

                {/* Synthesis Prompt? Maybe later. For now just actions. */}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-indigo-500/20">
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 text-xs font-mono text-indigo-400 hover:text-indigo-200 uppercase tracking-widest transition-colors"
                    >
                        Cancel
                    </button>
                    <Button 
                        onClick={onSeal} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                    >
                        {v.momiyose_seal_button}
                    </Button>
                </div>
             </div>
        </div>
    );
};
