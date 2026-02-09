import React, { useState } from 'react';
import { ToolCandidate, OperatorProfile, TheoryOfValue, Phase } from '../../types';
import { generateAudioDossier, pcmToAudioBuffer, validateMarketWithSearch } from '../../services/geminiService';
import { Button } from '../Visuals';
import { pdfService } from '../../services/pdfService';
import { downloadRitualCalendar } from '../../services/calendarService';
import { SimpleMarkdown } from '../SimpleMarkdown';
import { SignalTriangulation } from '../SignalTriangulation';
import { useVernacular } from '../../contexts/VernacularContext';
import { logger } from '../../services/logger';

// ── Tooltip Component ────────────────────────────────────
const Tooltip: React.FC<{ text: string; children: React.ReactNode; position?: 'top' | 'bottom' }> = ({ text, children, position = 'top' }) => (
    <div className="relative group/tip inline-block">
        {children}
        <div className={`absolute left-1/2 -translate-x-1/2 z-50
            px-3 py-2 max-w-[260px] w-max
            bg-zinc-900 border border-zinc-700 text-zinc-300
            text-[10px] font-mono leading-relaxed
            opacity-0 pointer-events-none
            group-hover/tip:opacity-100 group-hover/tip:pointer-events-auto
            transition-opacity duration-200
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
        `}>
            {text}
            <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-zinc-700 rotate-45
                ${position === 'top' ? 'top-full -mt-1 border-r border-b' : 'bottom-full -mb-1 border-l border-t'}
            `} />
        </div>
    </div>
);

const MATURATION_DAYS = 7;

export const InstallationPhase: React.FC<{
    tool: ToolCandidate | null,
    plan: string | null,
    clientName?: string,
    profile?: OperatorProfile | null,
    theoryOfValue?: TheoryOfValue | null,
    onGeneratePlan: () => void,
    onUpdatePlan: (newPlan: string) => void,
    onBack: () => void,
    onSave: () => void,
    onArchive?: () => void,
    onRetroactiveAudit?: () => void,
    onFinalize?: () => void,
    onForkVersion?: () => void,
    onNext?: () => void,
    isGenerating: boolean,
    isSaving: boolean,
    isFinalized?: boolean,
    version?: number,
    planCreatedAt?: number,
    lastActiveDate?: string, // ISO date string for decay calculation
}> = ({ tool, plan, clientName, profile, theoryOfValue, onGeneratePlan, onUpdatePlan, onBack, onSave, onArchive, onRetroactiveAudit, onFinalize, onForkVersion, onNext, isGenerating, isSaving, isFinalized, version, planCreatedAt, lastActiveDate }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const { mode, v } = useVernacular();
    const [validating, setValidating] = useState(false);
    const [showTriangulation, setShowTriangulation] = useState(false);
    const [hasBeenRefined, setHasBeenRefined] = useState(false);

    if (!tool) return null;

    // ── Tier 1.3: Quest Card Decay ────────────────────────────
    // Plan staleness tiers: >4h = warning, >24h = stale, >72h = decaying
    const getDecayTier = (): { level: 0 | 1 | 2 | 3; label: string; color: string } => {
        if (!plan || !lastActiveDate) return { level: 0, label: '', color: '' };
        const hoursSinceActive = (Date.now() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60);
        if (hoursSinceActive >= 72) return { level: 3, label: v.decay_decaying, color: 'text-hazard bg-hazard/10 border-hazard/30' };
        if (hoursSinceActive >= 24) return { level: 2, label: v.decay_stale, color: 'text-amber-400 bg-amber-900/10 border-amber-700/30' };
        if (hoursSinceActive >= 4) return { level: 1, label: v.decay_cooling, color: 'text-zinc-400 bg-zinc-800/30 border-zinc-700/30' };
        return { level: 0, label: '', color: '' };
    };
    const decay = getDecayTier();
    const decayClass = decay.level > 0 ? `decay-${decay.level}` : '';

    const handleTTS = async () => {
        if (!plan) return;
        setIsPlaying(true);
        const buffer = await generateAudioDossier(plan.slice(0, 500));
        if (buffer) {
            const ctx = new ((globalThis as any).AudioContext || (globalThis as any).webkitAudioContext)({ sampleRate: 24000 });
            const data = new Uint8Array(buffer);
            const audioBuffer = await pcmToAudioBuffer(data, ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start(0);
            source.onended = () => setIsPlaying(false);
        } else {
            setIsPlaying(false);
        }
    };

    const handleValidation = async () => {
        setValidating(true);
        const urls = await validateMarketWithSearch(tool.plainName);
        if (urls.length > 0) {
            tool.marketValidation = urls;
        }
        setValidating(false);
    };

    const renderTovSummary = () => {
        if (!theoryOfValue) return null;
        return (
            <div className="mb-12 border border-white/20 bg-void p-8 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em] mb-4">{v.tov_summary_label}</div>
                <h3 className="text-3xl font-display font-black mb-6 uppercase tracking-tight">{theoryOfValue.godfatherOffer.name}</h3>
                <div className="grid md:grid-cols-3 gap-8 mb-8 border-y border-zinc-900 py-8">
                    <div>
                        <h4 className="text-[9px] text-zinc-500 uppercase mb-2">{v.molecular_bond}</h4>
                        <p className="text-sm font-mono leading-relaxed">{theoryOfValue.molecularBond}</p>
                    </div>
                    <div>
                        <h4 className="text-[9px] text-zinc-500 uppercase mb-2">{v.fatal_wound}</h4>
                        <p className="text-sm font-mono text-red-500 italic">"{theoryOfValue.fatalWound}"</p>
                    </div>
                    <div>
                        <h4 className="text-[9px] text-zinc-500 uppercase mb-2">Strategic Price</h4>
                        <p className="text-2xl font-black">{theoryOfValue.godfatherOffer.price}</p>
                        <p className="text-[9px] text-zinc-600 uppercase">Value-Based Transform</p>
                    </div>
                </div>
                <div className="p-4 bg-zinc-900/50 border-l border-white font-mono text-xs text-zinc-400">
                    <h4 className="text-bone text-[10px] uppercase mb-2">{v.tov_promise_label}</h4>
                    {theoryOfValue.godfatherOffer.transformation}
                </div>
            </div>
        );
    };

    // ── 7-Day Finalization Gate ────────────────────────
    const getDaysUntilMature = (): number => {
        if (!planCreatedAt) return MATURATION_DAYS;
        const elapsed = Date.now() - planCreatedAt;
        const daysElapsed = elapsed / (1000 * 60 * 60 * 24);
        return Math.max(0, Math.ceil(MATURATION_DAYS - daysElapsed));
    };

    const daysRemaining = getDaysUntilMature();
    const isMature = daysRemaining <= 0;

    const renderFinalizeActions = () => {
        if (isFinalized) {
            return (
                <>
                    <Tooltip text={v.tip_finalize} position="top">
                        <div className="flex items-center gap-2 px-4 py-2 border border-emerald-800 bg-emerald-950/20">
                            <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">
                                ✓ FINALIZED — v{version || 1} • {new Date().toLocaleDateString()}
                            </span>
                        </div>
                    </Tooltip>
                    {onForkVersion && (
                        <Tooltip text={v.tip_fork} position="top">
                            <Button onClick={onForkVersion} variant="secondary" className="w-full md:w-auto">
                                Fork → v{(version || 1) + 1}
                            </Button>
                        </Tooltip>
                    )}
                </>
            );
        }

        const finalizeTooltip = isMature
            ? v.tip_finalize
            : v.tip_finalize_locked.replace('{days}', String(daysRemaining));

        return (
            <>
                {onFinalize && (
                    <Tooltip text={finalizeTooltip} position="top">
                        <Button
                            onClick={isMature ? onFinalize : undefined}
                            disabled={isSaving || !isMature}
                            className={`w-full md:w-auto text-[10px] uppercase tracking-wider ${
                                isMature
                                    ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400 hover:bg-emerald-900/50'
                                    : 'bg-zinc-900/30 border-zinc-700 text-zinc-500 cursor-not-allowed'
                            }`}
                        >
                            {isMature
                                ? v.finalize_dossier
                                : `🔒 ${v.finalize_dossier} (${daysRemaining}d)`}
                        </Button>
                    </Tooltip>
                )}
            </>
        );
    };

    return (
        <div className={`max-w-4xl mx-auto w-full animate-fade-in pb-20 ${decayClass}`}>
            {/* Decay badge */}
            {decay.level > 0 && (
                <div className={`mb-3 px-3 py-1.5 border text-[9px] font-mono uppercase tracking-widest text-center ${decay.color}`}>
                    {v.decay_plan_status}: {decay.label} — {v.decay_last_activity} {Math.round((Date.now() - new Date(lastActiveDate!).getTime()) / (1000 * 60 * 60))}h ago
                </div>
            )}
            <div className={`border p-8 bg-void relative overflow-hidden
            ${tool.isSovereign ? 'border-[#00FF41] shadow-[0_0_20px_rgba(0,255,65,0.1)]' : 'border-white'}
       `}>
                <div className={`absolute top-0 right-0 p-2 text-black font-mono text-xs font-bold
             ${tool.isSovereign ? 'bg-[#00FF41]' : 'bg-white'}
         `}>
                    {tool.isSovereign ? v.dossier_badge_sovereign : v.dossier_badge_official}
                </div>

                {!theoryOfValue && (
                    <div className="absolute top-0 left-0 w-full bg-[#FF2A2A] text-black px-4 py-1.5 flex justify-between items-center z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <span className="animate-pulse underline">{v.alert_critical_gap}</span> :: {v.alert_tov_missing}
                        </span>
                        <button
                            onClick={onRetroactiveAudit}
                            className="bg-void text-[#FF2A2A] text-[9px] font-bold px-3 py-0.5 hover:bg-zinc-900 transition-colors uppercase border border-black"
                        >
                            {v.alert_run_upgrade}
                        </button>
                    </div>
                )}

                <div className="mb-4 flex justify-between items-center">
                    <button onClick={onBack} className="text-xs font-mono text-zinc-500 hover:text-bone">{v.change_tool}</button>
                    {onArchive && (
                        <button onClick={onArchive} className="text-[10px] font-mono text-zinc-600 hover:text-bone border border-zinc-800 hover:border-zinc-600 px-3 py-1 bg-zinc-900/50 uppercase tracking-widest transition-all">
                            {v.archive_button || 'ARCHIVE'}
                        </button>
                    )}
                </div>

                <h2 className="text-4xl font-display font-black uppercase mb-2 wrap-break-word">{tool.plainName}</h2>
                <p className="font-mono text-zinc-400 mb-8 border-b border-zinc-800 pb-4">{tool.functionStatement}</p>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h4 className="text-xs uppercase text-zinc-500 mb-2">{v.proof_ledger_title}</h4>
                        <ul className="text-sm font-mono space-y-2">
                            <li className="flex items-center gap-2">
                                <span className={tool.scores.unbiddenRequests >= 3 ? "text-green-500" : "text-red-500"}>●</span> {v.score_unbidden}
                            </li>
                            <li className="flex items-center gap-2">
                                <span className={tool.scores.frictionlessDoing >= 3 ? "text-green-500" : "text-red-500"}>●</span> {v.score_frictionless}
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs uppercase text-zinc-500 mb-2">{v.market_status_title}</h4>
                        <div className="text-sm font-mono mb-2">
                            {tool.scores.extractionRisk >= 3
                                ? <span className="text-red-500 font-bold bg-red-900/20 px-2 py-1">{v.status_containment}</span>
                                : <span className="text-green-500 font-bold bg-green-900/20 px-2 py-1">{v.status_scalable}</span>
                            }
                        </div>
                        <button
                            onClick={handleValidation}
                            disabled={validating}
                            className="text-[10px] underline text-zinc-400 hover:text-bone"
                        >
                            {validating ? v.market_searching : v.market_run_search}
                        </button>
                        {tool.marketValidation && (
                            <div className="mt-2 space-y-1">
                                {tool.marketValidation.map((u) => (
                                    <a key={u} href={u} target="_blank" className="block text-[10px] text-blue-400 truncate">{u}</a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {plan ? (
                    <div className="animate-fade-in border-t border-zinc-800 pt-6">
                        {renderTovSummary()}

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold uppercase">{v.plan_title}</h3>
                            <Button onClick={handleTTS} disabled={isPlaying} variant="secondary" className="py-1! px-3! text-xs!">
                                {isPlaying ? v.listen_playing : v.listen_idle}
                            </Button>
                        </div>
                        <div className="font-mono text-sm leading-relaxed text-zinc-300 bg-zinc-900/50 p-6 border-l-2 border-white max-h-[500px] overflow-y-auto">
                            <SimpleMarkdown text={plan} />
                        </div>
                        <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end gap-4">
                            <div className="flex flex-wrap gap-3">
                                <Tooltip text={v.tip_download_pdf} position="top">
                                <Button
                                    onClick={async () => {
                                        const state: any = {
                                            candidates: [tool],
                                            selectedToolId: tool.id,
                                            theoryOfValue: theoryOfValue || null,
                                            pilotPlan: plan,
                                            profile: profile || null,
                                            currentPhase: Phase.INSTALLATION,
                                            clientName: clientName || 'Client'
                                        };
                                        if (version) state.version = version;
                                        await pdfService.generateDossierPDF(state, mode);
                                    }}
                                    variant="secondary"
                                >
                                    {v.download_pdf}
                                </Button>
                                </Tooltip>

                                <Tooltip text={v.tip_export_calendar} position="top">
                                <Button
                                    onClick={() => downloadRitualCalendar(tool.plainName)}
                                    variant="secondary"
                                >
                                    {v.export_calendar}
                                </Button>
                                </Tooltip>

                                {renderFinalizeActions()}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 border-t border-zinc-800 border-dashed">
                        <Button onClick={onGeneratePlan} disabled={isGenerating}>
                            {isGenerating ? v.generating_plan : v.generate_plan}
                        </Button>
                    </div>
                )}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {plan && (
                    <>
                        <Tooltip text={v.tip_copy_md} position="bottom">
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(plan);
                                alert("Protocol copied to clipboard (Markdown format).");
                            }}
                            variant="secondary"
                            className="border-zinc-700 text-zinc-400 hover:text-bone hover:border-white w-full"
                        >
                            {v.copy_protocol}
                        </Button>
                        </Tooltip>
                        <Tooltip text={v.tip_iterate} position="bottom">
                        <Button
                            onClick={() => setShowTriangulation(true)}
                            variant="primary"
                            className="w-full"
                        >
                            <span className="animate-slow-blink">
                                {v.triangulation_button || 'CALIBRATE PLAN'}
                            </span>
                        </Button>
                        </Tooltip>
                    </>
                )}
            </div>

            {/* Save Plan — gated behind refinement */}
            {plan && (
                <div className="mt-4 w-full">
                    <Tooltip text={!hasBeenRefined ? 'Calibrate your plan first' : (v.tip_save || 'Save your progress')} position="bottom">
                    <Button
                        onClick={hasBeenRefined ? onSave : undefined}
                        disabled={isSaving || !hasBeenRefined}
                        variant="gold"
                        className={`w-full ${
                            !hasBeenRefined ? 'opacity-40 cursor-not-allowed grayscale' : ''
                        }`}
                    >
                        {!hasBeenRefined ? `🔒 ${isSaving ? v.saving_plan : v.save_plan}` : (isSaving ? v.saving_plan : v.save_plan)}
                    </Button>
                    </Tooltip>
                </div>
            )}

            {/* Proceed to Ritual Dashboard — gated behind refinement */}
            {onNext && plan && (
                <div className="mt-6 pt-6 border-t border-zinc-800">
                    <Tooltip text={!hasBeenRefined ? 'Calibrate your plan before proceeding' : ''} position="bottom">
                    <button
                        onClick={hasBeenRefined ? onNext : undefined}
                        disabled={!hasBeenRefined}
                        className={`w-full py-4 border transition-all group text-center ${
                            hasBeenRefined
                                ? 'border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-500/50'
                                : 'border-zinc-800 bg-zinc-950/20 opacity-40 cursor-not-allowed grayscale'
                        }`}
                    >
                        <div className={`text-[10px] uppercase tracking-widest mb-1 ${
                            hasBeenRefined ? 'text-amber-500/70' : 'text-zinc-600'
                        }`}>
                            {v.ritual_dashboard_title || 'Ritual Dashboard'}
                        </div>
                        <div className={`text-sm font-bold transition-colors ${
                            hasBeenRefined
                                ? 'text-amber-100 group-hover:text-amber-300'
                                : 'text-zinc-600'
                        }`}>
                            {!hasBeenRefined ? '🔒 ' : ''}{v.proceed_to_dashboard || 'Enter the Arena'} →
                        </div>
                    </button>
                    </Tooltip>
                </div>
            )}


            {/* Signal Triangulation Modal */}
            {showTriangulation && plan && (
                <SignalTriangulation
                    plan={plan}
                    clientName={clientName}
                    profile={profile}
                    onRefinedPlan={(newPlan) => {
                        onUpdatePlan(newPlan);
                        setHasBeenRefined(true);
                    }}
                    onClose={() => setShowTriangulation(false)}
                />
            )}
        </div>
    );
};
