import React, { useEffect, useState } from 'react';
import { SystemState, DossierSnapshot } from '../../types';
import { Button } from '../Visuals';
import { useVernacular } from '../../contexts/VernacularContext';
import { apiFetch } from '../../services/apiClient';

interface ArchivePhaseProps {
    userId: string;
    onSelect: (state: SystemState) => void;
    onNew: () => void;
}

export const ArchivePhase: React.FC<ArchivePhaseProps> = ({ userId, onSelect, onNew }) => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { v } = useVernacular();

    // Load sessions from Postgres API (falls back to localStorage for dev)
    useEffect(() => {
        (async () => {
            // Try API first
            try {
                const res = await apiFetch('/api/db/sessions', { headers: { 'x-clerk-user-id': userId } });
                if (res.ok) {
                    const { sessions: apiSessions } = await res.json();
                    if (apiSessions?.length > 0) {
                        setSessions(apiSessions.map((s: any) => ({ ...s.data, id: s.id })));
                        setLoading(false);
                        return;
                    }
                }
            } catch { /* API unavailable */ }
            // Fallback to localStorage
            try {
                const indexKey = `sessions_index_${userId}`;
                const index: string[] = JSON.parse(localStorage.getItem(indexKey) || '[]');
                const loaded = index
                    .map(id => {
                        try { return JSON.parse(localStorage.getItem(`session_${id}`) || 'null'); }
                        catch { return null; }
                    })
                    .filter(Boolean);
                setSessions(loaded);
            } catch { /* localStorage unavailable */ }
            setLoading(false);
        })();
    }, [userId]);

    const getSnapshots = (sessionId: string): DossierSnapshot[] => {
        try {
            return JSON.parse(localStorage.getItem(`dossier_history_${sessionId}`) || '[]');
        } catch { return []; }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="py-20 text-center animate-pulse font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                    {v.archive_loading}
                </div>
            );
        }

        if (sessions.length === 0) {
            return (
                <div className="relative py-20 border-2 border-zinc-700 text-center">
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-bone"></div>
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-bone"></div>
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-bone"></div>
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-bone"></div>
                    <p className="font-mono text-[10px] text-zinc-500 uppercase">{v.archive_empty}</p>
                </div>
            );
        }

        return (
            <div className="grid gap-4">
                {sessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).map((session) => {
                    const snapshots = getSnapshots(session.id);
                    const isExpanded = expandedId === session.id;

                    return (
                        <div key={session.id} className="border border-zinc-800 bg-void shadow-hard">
                            <button
                                type="button"
                                onClick={() => onSelect(session)}
                                className="group p-6 hover:border-white transition-all cursor-pointer flex justify-between items-center w-full text-left"
                            >
                                <div>
                                    <div className="text-xs font-mono text-zinc-500 mb-1">ID: {session.id.slice(0, 8)}...</div>
                                    <div className="text-lg font-bold group-hover:italic transition-all">
                                        {session.selectedToolId ? `PROTOCOL: ${session.candidates?.find((c: any) => c.id === session.selectedToolId)?.plainName || 'UNNAMED'}` : 'INCOMPLETE DRAFT'}
                                    </div>
                                    <div className="text-[9px] font-mono text-zinc-600 uppercase mt-2 tracking-widest flex items-center gap-4">
                                        <span>Phase: {session.currentPhase}</span>
                                        {session.clientName && <span className="text-zinc-400 bg-white/5 px-2 py-0.5 border border-zinc-800">{v.archive_subject_label}: {session.clientName}</span>}
                                        <span>Modified: {session.updatedAt ? new Date(session.updatedAt).toLocaleString() : 'UNKNOWN'}</span>
                                        {session.version > 0 && (
                                            <span className={`px-2 py-0.5 border ${session.finalized ? 'border-emerald-800 text-emerald-400' : 'border-yellow-800 text-yellow-500'}`}>
                                                v{session.version} {session.finalized ? '✓ FINAL' : 'DRAFT'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-zinc-800 group-hover:text-bone transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </button>

                            {/* Version History Toggle */}
                            {snapshots.length > 0 && (
                                <div className="border-t border-zinc-900">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : session.id); }}
                                        className="w-full text-left px-6 py-2 text-[10px] font-mono text-zinc-600 hover:text-zinc-400 uppercase tracking-wider transition-colors"
                                    >
                                        {isExpanded ? '▼' : '▶'} Version History ({snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''})
                                    </button>

                                    {isExpanded && (
                                        <div className="px-6 pb-4 space-y-2">
                                            {snapshots.map((snap) => (
                                                <div
                                                    key={snap.version}
                                                    className="flex items-center justify-between p-3 border border-zinc-900 hover:border-zinc-700 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs font-mono text-emerald-400 font-bold">v{snap.version}</span>
                                                        <span className="text-[10px] font-mono text-zinc-500">
                                                            {new Date(snap.finalizedAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onSelect(snap.state); }}
                                                        className="text-[10px] font-mono text-zinc-500 hover:text-bone border border-zinc-800 hover:border-zinc-600 px-3 py-1 transition-all uppercase"
                                                    >
                                                        Load v{snap.version}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex justify-between items-end border-b border-zinc-800 pb-8">
                <div>
                    <h1 className="text-4xl font-display font-black tracking-tighter uppercase">{v.archive_title}</h1>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] mt-2">{v.archive_subtitle}</p>
                </div>
                <Button onClick={onNew} className="px-8 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                    {v.archive_new_button}
                </Button>
            </div>

            {renderContent()}

            <div className="text-[9px] font-mono text-zinc-700 uppercase p-4 border-t border-zinc-900 mt-20">
                {v.archive_footer}
            </div>
        </div>
    );
};
