import React, { useState } from 'react';
import { useVernacular } from '../contexts/VernacularContext';

// ============================================================
// RESURRECTION SCREEN — The Return Protocol
// ============================================================
// Shown when the operator has been absent for > 30 days.
// The interface locks entirely — only a single input field
// remains. The operator must state their intent to return
// before the workspace unlocks.
//
// This isn't punishment. It's engineering. The system expects
// failure and has already engineered the recovery.
// ============================================================

interface ResurrectionScreenProps {
    daysAbsent: number;
    onResurrect: (statement: string) => void;
}

export const ResurrectionScreen: React.FC<ResurrectionScreenProps> = ({
    daysAbsent,
    onResurrect,
}) => {
    const { v } = useVernacular();
    const [statement, setStatement] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [phase, setPhase] = useState<'intro' | 'input' | 'ignite'>('intro');

    // Intro sequence
    React.useEffect(() => {
        const t = setTimeout(() => setPhase('input'), 2000);
        return () => clearTimeout(t);
    }, []);

    const handleSubmit = () => {
        if (!statement.trim() || statement.trim().length < 3) return;
        setIsSubmitting(true);
        setPhase('ignite');
        setTimeout(() => onResurrect(statement.trim()), 1200);
    };

    return (
        <div className="fixed inset-0 z-999 bg-void flex items-center justify-center">
            {/* Scan line overlay */}
            <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-30" />

            {/* Border frame — crimson */}
            <div className="absolute inset-6 border border-hazard/20 pointer-events-none" />

            <div className={`max-w-lg w-full px-8 text-center space-y-10 transition-opacity duration-1000 ${phase === 'ignite' ? 'opacity-0' : 'opacity-100'}`}>

                {/* Status */}
                <div className="space-y-2 animate-fade-in">
                    <div className="text-[9px] font-mono text-hazard/60 uppercase tracking-[0.5em]">
                        {v.resurrection_alert}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em]">
                        {v.resurrection_inactive_label.replace('{days}', daysAbsent.toString())}
                    </div>
                </div>

                {/* System locked message */}
                <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <div className="text-[10px] font-mono text-zinc-500 leading-relaxed whitespace-pre-line">
                        {v.resurrection_message}
                    </div>
                </div>

                {/* Input field — the only control */}
                {phase !== 'intro' && (
                    <div className="space-y-6 animate-fade-in">
                        <input
                            type="text"
                            value={statement}
                            onChange={(e) => setStatement(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder={v.resurrection_placeholder}
                            className="w-full bg-transparent border-b border-zinc-800 focus:border-hazard/50 text-bone font-mono text-sm text-center py-3 outline-none transition-colors placeholder:text-zinc-700"
                            autoFocus
                            disabled={isSubmitting}
                        />

                        {statement.trim().length >= 3 && (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="border border-hazard/40 hover:border-hazard text-hazard/80 hover:text-hazard font-mono text-[10px] uppercase tracking-[0.3em] px-8 py-3 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? v.resurrection_reactivating : v.resurrection_initiate}
                            </button>
                        )}
                    </div>
                )}

                {/* Bottom status */}
                <div className="text-[8px] font-mono text-zinc-800 uppercase tracking-[0.4em]">
                    {v.resurrection_protocol_active}
                </div>
            </div>
        </div>
    );
};
