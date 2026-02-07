import React, { useState, useEffect } from 'react';
import { ToolCandidate, TheoryOfValue, OperatorProfile } from '../../types';
import { Button, SectionHeader } from '../Visuals';
import { useVernacular } from '../../contexts/VernacularContext';

// ============================================================
// RITUAL DASHBOARD — Post-Audit Daily Tracking
// ============================================================
// Story 5.1: Ouroboros Loop — Previous session hydration
// Story 5.2: Daily check-in with micro-progress tracking
// ============================================================

interface DailyEntry {
    date: string;
    clientReached: number;
    offersSent: number;
    revenue: number;
    note: string;
    mood: 'focused' | 'scattered' | 'blocked' | 'flow';
}

interface RitualDashboardProps {
    tool: ToolCandidate | null;
    theoryOfValue: TheoryOfValue | null;
    profile: OperatorProfile | null;
    pilotPlan: string | null;
    onBack: () => void;
    onReAudit?: () => void;
}

const MOOD_CONFIG: Record<DailyEntry['mood'], { label: string; color: string; border: string }> = {
    focused: { label: 'FOCUSED', color: 'text-emerald-400', border: 'border-emerald-700' },
    scattered: { label: 'SCATTERED', color: 'text-yellow-400', border: 'border-yellow-700' },
    blocked: { label: 'BLOCKED', color: 'text-red-400', border: 'border-red-700' },
    flow: { label: 'FLOW STATE', color: 'text-cyan-400', border: 'border-cyan-700' },
};

export const RitualDashboard: React.FC<RitualDashboardProps> = ({
    tool,
    theoryOfValue,
    profile,
    pilotPlan,
    onBack,
    onReAudit
}) => {
    // Load entries from localStorage
    const storageKey = `ritual_${tool?.id || 'default'}`;
    const [entries, setEntries] = useState<DailyEntry[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [showEntry, setShowEntry] = useState(false);
    const { v } = useVernacular();
    const [newEntry, setNewEntry] = useState<DailyEntry>({
        date: new Date().toISOString().split('T')[0],
        clientReached: 0,
        offersSent: 0,
        revenue: 0,
        note: '',
        mood: 'focused',
    });

    // Persist entries
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(entries));
    }, [entries, storageKey]);

    const handleSubmitEntry = () => {
        setEntries(prev => [newEntry, ...prev]);
        setNewEntry({
            date: new Date().toISOString().split('T')[0],
            clientReached: 0,
            offersSent: 0,
            revenue: 0,
            note: '',
            mood: 'focused',
        });
        setShowEntry(false);
    };

    // Compute aggregates
    const totalRevenue = entries.reduce((sum, e) => sum + e.revenue, 0);
    const totalClients = entries.reduce((sum, e) => sum + e.clientReached, 0);
    const totalOffers = entries.reduce((sum, e) => sum + e.offersSent, 0);
    const streak = (() => {
        let s = 0;
        const today = new Date();
        for (let i = 0; i < entries.length; i++) {
            const d = new Date(entries[i].date);
            const expected = new Date(today);
            expected.setDate(expected.getDate() - i);
            if (d.toISOString().split('T')[0] === expected.toISOString().split('T')[0]) {
                s++;
            } else break;
        }
        return s;
    })();

    const hasEntryToday = entries.length > 0 && entries[0].date === new Date().toISOString().split('T')[0];

    // False Positive Detection: 3+ day gap since last entry
    const daysSinceLastEntry = entries.length > 0
        ? Math.floor((Date.now() - new Date(entries[0].date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
    const isFalsePositive = entries.length > 0 && daysSinceLastEntry >= 3 && streak === 0;

    return (
        <div className="max-w-5xl mx-auto w-full animate-fade-in space-y-8 font-mono">
            <SectionHeader
                title={v.ritual_dashboard}
                subtitle={v.ritual_subtitle}
                onBack={onBack}
            />

            {/* Status Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                    <div className="text-2xl font-black text-bone">{streak}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Day Streak</div>
                </div>
                <div className="border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                    <div className="text-2xl font-black text-emerald-400">${totalRevenue.toLocaleString()}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Total Revenue</div>
                </div>
                <div className="border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                    <div className="text-2xl font-black text-bone">{totalClients}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Clients Reached</div>
                </div>
                <div className="border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                    <div className="text-2xl font-black text-bone">{totalOffers}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Offers Sent</div>
                </div>
            </div>

            {/* Sovereign Context */}
            {tool && (
                <div className="border border-[#00FF41]/20 bg-[#00FF41]/5 p-4 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] text-zinc-500 uppercase">{v.ritual_active_weapon}</div>
                        <div className="text-sm font-bold text-bone">{tool.plainName}</div>
                    </div>
                    {theoryOfValue?.godfatherOffer && (
                        <div className="text-right">
                            <div className="text-[10px] text-zinc-500 uppercase">{v.ritual_offer_label}</div>
                            <div className="text-sm text-yellow-400">{theoryOfValue.godfatherOffer.price}</div>
                        </div>
                    )}
                </div>
            )}

            {/* False Positive Warning */}
            {isFalsePositive && (
                <div className="border border-red-800/60 bg-red-950/20 p-5 space-y-3">
                    <div className="text-xs uppercase text-red-400 font-mono tracking-wider">{v.ritual_warning_title}</div>
                    <p className="text-sm text-zinc-400 font-mono leading-relaxed">
                        {v.ritual_warning_detail.replace('{days}', String(daysSinceLastEntry))}
                    </p>
                    {onReAudit && (
                        <button
                            onClick={onReAudit}
                            className="text-[10px] font-mono px-4 py-2 border border-red-700 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all uppercase tracking-wider"
                        >
                            {v.ritual_reaudit_button}
                        </button>
                    )}
                </div>
            )}

            {/* Daily Entry Button or Form */}
            {!hasEntryToday && !showEntry && (
                <button
                    onClick={() => setShowEntry(true)}
                    className="w-full p-6 border border-dashed border-yellow-700/50 bg-yellow-900/5 text-yellow-500 text-sm uppercase tracking-wider hover:border-yellow-500 hover:bg-yellow-900/10 transition-all"
                >
                    {v.ritual_log_button}
                </button>
            )}

            {hasEntryToday && !showEntry && (
                <div className="p-4 border border-emerald-800/30 bg-emerald-900/5 text-center">
                    <span className="text-xs font-mono text-emerald-400 uppercase">{v.ritual_entry_title}</span>
                </div>
            )}

            {showEntry && (
                <div className="border border-yellow-800/30 bg-zinc-900/50 p-6 space-y-4">
                    <h3 className="text-xs uppercase text-yellow-500 tracking-wider">{v.ritual_entry_title} — {newEntry.date}</h3>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="ritual-clients" className="text-[10px] text-zinc-500 uppercase block mb-1">Clients Reached</label>
                            <input
                                id="ritual-clients"
                                type="number"
                                min="0"
                                value={newEntry.clientReached}
                                onChange={(e) => setNewEntry(p => ({ ...p, clientReached: Number.parseInt(e.target.value) || 0 }))}
                                className="w-full bg-zinc-900 border border-zinc-700 p-2 font-mono text-sm text-bone focus:border-yellow-500 outline-none"
                            />
                        </div>
                        <div>
                            <label htmlFor="ritual-offers" className="text-[10px] text-zinc-500 uppercase block mb-1">Offers Sent</label>
                            <input
                                id="ritual-offers"
                                type="number"
                                min="0"
                                value={newEntry.offersSent}
                                onChange={(e) => setNewEntry(p => ({ ...p, offersSent: Number.parseInt(e.target.value) || 0 }))}
                                className="w-full bg-zinc-900 border border-zinc-700 p-2 font-mono text-sm text-bone focus:border-yellow-500 outline-none"
                            />
                        </div>
                        <div>
                            <label htmlFor="ritual-revenue" className="text-[10px] text-zinc-500 uppercase block mb-1">Revenue ($)</label>
                            <input
                                id="ritual-revenue"
                                type="number"
                                min="0"
                                value={newEntry.revenue}
                                onChange={(e) => setNewEntry(p => ({ ...p, revenue: Number.parseInt(e.target.value) || 0 }))}
                                className="w-full bg-zinc-900 border border-zinc-700 p-2 font-mono text-sm text-bone focus:border-yellow-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Mood Selector */}
                    <div>
                        <span className="text-[10px] text-zinc-500 uppercase block mb-2">{v.ritual_mood_label}</span>
                        <div className="grid grid-cols-4 gap-2">
                            {(Object.keys(MOOD_CONFIG) as DailyEntry['mood'][]).map(mood => (
                                <button
                                    key={mood}
                                    type="button"
                                    onClick={() => setNewEntry(p => ({ ...p, mood }))}
                                    className={`py-2 text-[10px] uppercase border transition-all ${newEntry.mood === mood
                                        ? `${MOOD_CONFIG[mood].color} ${MOOD_CONFIG[mood].border} bg-zinc-800`
                                        : 'text-zinc-600 border-zinc-800 hover:border-zinc-600'
                                        }`}
                                >
                                    {MOOD_CONFIG[mood].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label htmlFor="ritual-notes" className="text-[10px] text-zinc-500 uppercase block mb-1">{v.ritual_notes_label}</label>
                        <textarea
                            id="ritual-notes"
                            value={newEntry.note}
                            onChange={(e) => setNewEntry(p => ({ ...p, note: e.target.value }))}
                            className="w-full bg-zinc-900 border border-zinc-700 p-3 font-mono text-sm text-bone focus:border-yellow-500 outline-none h-20 resize-none"
                            placeholder="What happened today? What did you learn?"
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowEntry(false)}
                            className="text-[10px] font-mono px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all"
                        >
                            Cancel
                        </button>
                        <Button onClick={handleSubmitEntry}>{v.ritual_commit}</Button>
                    </div>
                </div>
            )}

            {/* Entry History */}
            {entries.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest">{v.ritual_history_title} ({entries.length} entries)</h3>
                    {entries.slice(0, 14).map((entry, i) => (
                        <div key={entry.date + i} className="border border-zinc-800 bg-zinc-900/30 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-zinc-500 font-mono w-24">{entry.date}</span>
                                <span className={`text-[10px] uppercase ${MOOD_CONFIG[entry.mood]?.color || 'text-zinc-400'}`}>
                                    {MOOD_CONFIG[entry.mood]?.label || entry.mood}
                                </span>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className="text-xs text-zinc-400">{entry.clientReached} contacted</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-zinc-400">{entry.offersSent} offers</span>
                                </div>
                                <div className="text-right min-w-[80px]">
                                    <span className={`text-xs font-bold ${entry.revenue > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                        ${entry.revenue.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
