import React, { useEffect, useState } from 'react';
import { useOrg } from '../contexts/OrgContext';
import { apiFetch } from '../services/apiClient';
import { Button } from './Visuals';
import { useVernacular, quadrantLabel } from '../contexts/VernacularContext';

// ============================================================
// ORG DASHBOARD — Org-Scoped Shared Assets Overview
// ============================================================
// Shows shared armory items and dossier sessions for the
// active organization. Only visible when isOrgMode === true.

interface OrgArmoryItem {
    id: string;
    added_by: string;
    verb: string;
    quadrant: string;
    created_at: string;
}

interface OrgSession {
    id: string;
    created_by: string;
    version: number;
    finalized: boolean;
    created_at: string;
    updated_at: string;
}

export const OrgDashboard: React.FC = () => {
    const { orgId, orgName, userRole, canWrite, isAdmin, isLoading } = useOrg();
    const { v } = useVernacular();
    const [armoryItems, setArmoryItems] = useState<OrgArmoryItem[]>([]);
    const [sessions, setSessions] = useState<OrgSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'armory' | 'sessions'>('armory');

    // Fetch org data when orgId changes
    useEffect(() => {
        if (!orgId) return;
        setLoading(true);

        Promise.all([
            apiFetch(`/api/db/org-armory?orgId=${orgId}`).then(r => r.ok ? r.json() : { items: [] }),
            apiFetch(`/api/db/org-sessions?orgId=${orgId}`).then(r => r.ok ? r.json() : { sessions: [] }),
        ])
            .then(([armoryData, sessionData]) => {
                setArmoryItems(armoryData.items || []);
                setSessions(sessionData.sessions || []);
            })
            .catch(() => {
                setArmoryItems([]);
                setSessions([]);
            })
            .finally(() => setLoading(false));
    }, [orgId]);

    if (isLoading || !orgId) return null;

    const tabClass = (tab: string) =>
        `px-4 py-2 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === tab
                ? 'border-bone text-bone'
                : 'border-transparent text-zinc-600 hover:text-zinc-400'
        }`;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="border-b border-zinc-800 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-spirit animate-pulse" />
                    <h2 className="text-3xl font-display font-black tracking-tighter uppercase">
                        {orgName}
                    </h2>
                    {userRole && (
                        <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border ${
                            userRole === 'admin'
                                ? 'border-hazard text-hazard'
                                : userRole === 'member'
                                  ? 'border-spirit text-spirit'
                                  : 'border-zinc-600 text-zinc-500'
                        }`}>
                            {userRole}
                        </span>
                    )}
                </div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">
                    SHARED OPERATIONS CENTER
                </p>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-6 border-b border-zinc-900">
                <button className={tabClass('armory')} onClick={() => setActiveTab('armory')}>
                    SHARED ARMORY ({armoryItems.length})
                </button>
                <button className={tabClass('sessions')} onClick={() => setActiveTab('sessions')}>
                    SHARED DOSSIERS ({sessions.length})
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="py-20 text-center animate-pulse font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                    LOADING ORG DATA...
                </div>
            ) : activeTab === 'armory' ? (
                <div className="space-y-3">
                    {armoryItems.length === 0 ? (
                        <div className="py-16 text-center border-2 border-zinc-700 relative">
                            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-bone" />
                            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-bone" />
                            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-bone" />
                            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-bone" />
                            <p className="font-mono text-[10px] text-zinc-500 uppercase">
                                No shared armory items yet
                            </p>
                            {canWrite && (
                                <p className="font-mono text-[9px] text-zinc-600 mt-2">
                                    Add items from your personal armory to share with the org
                                </p>
                            )}
                        </div>
                    ) : (
                        armoryItems.map(item => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-4 border border-zinc-800 hover:border-zinc-700 transition-colors group"
                            >
                                <div>
                                    <div className="font-bold text-sm uppercase tracking-wider">
                                        {item.verb}
                                    </div>
                                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-1 flex items-center gap-4">
                                        <span>{quadrantLabel(item.quadrant, v)}</span>
                                        <span>by {item.added_by.slice(0, 8)}...</span>
                                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <button
                                        className="opacity-0 group-hover:opacity-100 text-[9px] font-mono text-[#FF2A2A] border border-transparent hover:border-[#FF2A2A]/30 px-2 py-1 transition-all uppercase"
                                        onClick={() => {
                                            apiFetch('/api/db/org-armory', {
                                                method: 'DELETE',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ orgId, itemId: item.id }),
                                            }).then(() => setArmoryItems(prev => prev.filter(i => i.id !== item.id)));
                                        }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.length === 0 ? (
                        <div className="py-16 text-center border-2 border-zinc-700 relative">
                            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-bone" />
                            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-bone" />
                            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-bone" />
                            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-bone" />
                            <p className="font-mono text-[10px] text-zinc-500 uppercase">
                                No shared dossiers yet
                            </p>
                        </div>
                    ) : (
                        sessions.map(session => (
                            <div
                                key={session.id}
                                className="p-5 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-xs font-mono text-zinc-500 mb-1">
                                            ID: {session.id.slice(0, 8)}...
                                        </div>
                                        <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-4 mt-1">
                                            <span>by {session.created_by.slice(0, 8)}...</span>
                                            <span>
                                                {new Date(session.updated_at).toLocaleString()}
                                            </span>
                                            <span className={`px-2 py-0.5 border ${
                                                session.finalized
                                                    ? 'border-emerald-800 text-emerald-400'
                                                    : 'border-yellow-800 text-yellow-500'
                                            }`}>
                                                v{session.version} {session.finalized ? '✓ FINAL' : 'DRAFT'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Stats Footer */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-zinc-900">
                <div className="text-center">
                    <div className="text-2xl font-display font-black">{armoryItems.length}</div>
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Shared Tools</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-display font-black">{sessions.length}</div>
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Shared Dossiers</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-display font-black">{sessions.filter(s => s.finalized).length}</div>
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Finalized</div>
                </div>
            </div>
        </div>
    );
};
