import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/apiService';
import { SystemState } from '../../types';
import { Button } from '../Visuals';

interface ArchivePhaseProps {
    userId: string;
    onSelect: (state: SystemState) => void;
    onNew: () => void;
}

export const ArchivePhase: React.FC<ArchivePhaseProps> = ({ userId, onSelect, onNew }) => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const data = await apiService.getResults(userId);
                setSessions(data.sessions || []);
            } catch (err) {
                console.error("Failed to fetch archive:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, [userId]);

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex justify-between items-end border-b border-zinc-800 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase">Dossier_Archive</h1>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] mt-2">Accessing Persistent Protocol Nodes</p>
                </div>
                <Button onClick={onNew} className="px-8 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                    Initialize New Protocol
                </Button>
            </div>

            {loading ? (
                <div className="py-20 text-center animate-pulse font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                    Decrypting Archive Files...
                </div>
            ) : sessions.length === 0 ? (
                <div className="py-20 border border-dashed border-zinc-800 text-center rounded-sm">
                    <p className="font-mono text-[10px] text-zinc-500 uppercase">No existing dossiers found in vault.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {sessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).map((session) => (
                        <div
                            key={session.id}
                            onClick={() => onSelect(session)}
                            className="group border border-zinc-800 p-6 bg-black hover:border-white transition-all cursor-pointer flex justify-between items-center"
                        >
                            <div>
                                <div className="text-xs font-mono text-zinc-500 mb-1">ID: {session.id.slice(0, 8)}...</div>
                                <div className="text-lg font-bold group-hover:italic transition-all">
                                    {session.selectedToolId ? `PROTOCOL: ${session.candidates?.find((c: any) => c.id === session.selectedToolId)?.plainName || 'UNNAMED'}` : 'INCOMPLETE_DRAFT'}
                                </div>
                                <div className="text-[9px] font-mono text-zinc-600 uppercase mt-2 tracking-widest flex items-center gap-4">
                                    <span>Phase: {session.currentPhase}</span>
                                    {session.clientName && <span className="text-zinc-400 bg-white/5 px-2 py-0.5 border border-zinc-800">SUBJECT: {session.clientName}</span>}
                                    <span>Modified: {session.updatedAt ? new Date(session.updatedAt).toLocaleString() : 'UNKNOWN'}</span>
                                </div>
                            </div>
                            <div className="text-zinc-800 group-hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="text-[9px] font-mono text-zinc-700 uppercase p-4 border-t border-zinc-900 mt-20">
                End of File List // All records are encrypted at rest
            </div>
        </div>
    );
};
