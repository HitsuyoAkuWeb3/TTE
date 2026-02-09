import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVernacular } from '../contexts/VernacularContext';
import { Button } from './Visuals';
import { OperatorProfile } from '../types';
import { triangulateAndRefine } from '../services/geminiService';

// ============================================================
// SIGNAL TRIANGULATION — 3-Input Plan Calibration
// ============================================================
// A structured 3-question wizard that replaces open-ended AI chat.
// The user provides exactly 3 signals: Resonance, Distortion, Friction.
// The AI synthesizes all 3 into a single refined plan.
// Hard-capped: no extra questions. This is a calibration, not a chat.
// ============================================================

interface SignalTriangulationProps {
    plan: string;
    clientName?: string;
    profile?: OperatorProfile | null;
    onRefinedPlan: (newPlan: string) => void;
    onClose: () => void;
}

const CHAR_LIMIT = 500;

// Step configuration
const STEPS = [
    { key: 'resonance' as const, icon: '◉' },
    { key: 'distortion' as const, icon: '◎' },
    { key: 'friction' as const, icon: '◈' },
] as const;

type StepKey = typeof STEPS[number]['key'];

export const SignalTriangulation: React.FC<SignalTriangulationProps> = ({
    plan,
    clientName,
    profile,
    onRefinedPlan,
    onClose,
}) => {
    const { v } = useVernacular();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<StepKey, string>>({
        resonance: '',
        distortion: '',
        friction: '',
    });
    const [isSynthesizing, setSynthesizing] = useState(false);
    const [typewriterText, setTypewriterText] = useState('');
    const [typewriterDone, setTypewriterDone] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Current step data
    const currentStepConfig = step < 3 ? STEPS[step] : null;
    const currentKey = currentStepConfig?.key;

    // Vernacular-driven question text
    const getQuestion = (key: StepKey): string => {
        switch (key) {
            case 'resonance': return v.triangulation_q1 || "What part of this plan feels inevitable?";
            case 'distortion': return v.triangulation_q2 || "What part of this plan feels like a job, not a tool?";
            case 'friction': return v.triangulation_q3 || "Why haven't you executed this already?";
        }
    };

    const getLabel = (key: StepKey): string => {
        switch (key) {
            case 'resonance': return v.triangulation_label_1 || "SIGNAL 1: RESONANCE";
            case 'distortion': return v.triangulation_label_2 || "SIGNAL 2: DISTORTION";
            case 'friction': return v.triangulation_label_3 || "SIGNAL 3: FRICTION";
        }
    };

    // Typewriter effect for question reveal
    const fullQuestion = currentKey ? getQuestion(currentKey) : '';

    useEffect(() => {
        if (step >= 3) return;
        setTypewriterText('');
        setTypewriterDone(false);
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setTypewriterText(fullQuestion.slice(0, i));
            if (i >= fullQuestion.length) {
                clearInterval(interval);
                setTypewriterDone(true);
                // Focus textarea after typewriter completes
                setTimeout(() => textareaRef.current?.focus(), 100);
            }
        }, 30);
        return () => clearInterval(interval);
    }, [step, fullQuestion]);

    const handleNext = useCallback(() => {
        if (step < 2) {
            setStep(s => s + 1);
        } else {
            // Step 3 → synthesize
            handleSynthesize();
        }
    }, [step, answers]);

    const handleSynthesize = async () => {
        setStep(3); // Move to synthesis view
        setSynthesizing(true);
        try {
            const refined = await triangulateAndRefine(
                plan,
                answers.resonance,
                answers.distortion,
                answers.friction,
                clientName,
                profile || undefined
            );
            onRefinedPlan(refined);
            onClose();
        } catch (err) {
            console.error('Triangulation failed:', err);
            setSynthesizing(false);
        }
    };

    const currentAnswer = currentKey ? answers[currentKey] : '';
    const canProceed = currentAnswer.trim().length > 0;

    // Progress dots
    const renderProgress = () => (
        <div className="flex items-center gap-2 justify-center mb-8">
            {STEPS.map((s, i) => (
                <React.Fragment key={s.key}>
                    <div className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                        i < step ? 'bg-[#00FF41] border-[#00FF41]' :
                        i === step && step < 3 ? 'bg-[#00FF41]/30 border-[#00FF41] animate-pulse' :
                        'bg-zinc-900 border-zinc-700'
                    }`} />
                    {i < 2 && (
                        <div className={`w-8 h-px transition-all duration-300 ${
                            i < step ? 'bg-[#00FF41]/50' : 'bg-zinc-800'
                        }`} />
                    )}
                </React.Fragment>
            ))}
            {/* Synthesis dot */}
            <div className={`w-8 h-px transition-all duration-300 ${step >= 3 ? 'bg-[#00FF41]/50' : 'bg-zinc-800'}`} />
            <div className={`w-3 h-3 rounded-sm border transition-all duration-300 ${
                step >= 3 ? 'bg-[#00FF41]/30 border-[#00FF41] animate-pulse' : 'bg-zinc-900 border-zinc-700'
            }`} />
        </div>
    );

    return (
        <div className="fixed inset-0 bg-void/90 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-2xl w-full border border-zinc-800 bg-void p-8 shadow-[0_0_100px_rgba(0,255,65,0.03)] relative overflow-hidden">
                {/* Scanline decoration */}
                <div className="absolute top-0 left-0 w-full h-px bg-[#00FF41]/20 animate-scan" />

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-lg font-display font-black tracking-tighter uppercase text-bone">
                            {v.triangulation_title || "PLAN CALIBRATION"}
                        </h2>
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                            {v.triangulation_subtitle || "Signal Triangulation Protocol"}
                        </p>
                    </div>
                    {!isSynthesizing && (
                        <button
                            onClick={onClose}
                            className="text-zinc-600 hover:text-bone transition-colors text-xs font-mono uppercase"
                        >
                            [ Close ]
                        </button>
                    )}
                </div>

                {/* Progress */}
                {renderProgress()}

                {/* Question Phase (Steps 0-2) */}
                {step < 3 && currentKey && (
                    <div className="space-y-6 animate-fade-in" key={step}>
                        {/* Step label */}
                        <div className="flex items-center gap-3">
                            <span className="text-[#00FF41] text-lg">{currentStepConfig?.icon}</span>
                            <span className="text-[10px] font-mono text-[#00FF41]/70 uppercase tracking-widest">
                                {getLabel(currentKey)}
                            </span>
                        </div>

                        {/* Typewriter question */}
                        <div className="font-mono text-bone text-sm leading-relaxed min-h-12">
                            <span className="text-zinc-500 mr-2">&gt;</span>
                            {typewriterText}
                            {!typewriterDone && (
                                <span className="inline-block w-[6px] h-[14px] bg-[#00FF41] ml-0.5 animate-pulse" />
                            )}
                        </div>

                        {/* Input */}
                        {typewriterDone && (
                            <div className="space-y-2 animate-fade-in">
                                <textarea
                                    ref={textareaRef}
                                    value={currentAnswer}
                                    onChange={(e) => {
                                        if (e.target.value.length <= CHAR_LIMIT) {
                                            setAnswers(prev => ({
                                                ...prev,
                                                [currentKey]: e.target.value
                                            }));
                                        }
                                    }}
                                    className="w-full bg-zinc-900/50 border border-zinc-700 focus:border-[#00FF41]/50 p-4 font-mono text-sm text-bone outline-none transition-colors h-28 resize-none"
                                    placeholder={v.triangulation_placeholder || "Type your answer..."}
                                    maxLength={CHAR_LIMIT}
                                />
                                <div className="flex justify-between items-center">
                                    <span className={`text-[9px] font-mono ${
                                        currentAnswer.length > CHAR_LIMIT * 0.9 ? 'text-hazard' : 'text-zinc-600'
                                    }`}>
                                        {currentAnswer.length}/{CHAR_LIMIT}
                                    </span>
                                    <Button
                                        onClick={handleNext}
                                        disabled={!canProceed}
                                        className="px-8 py-2 text-[10px] relative group overflow-hidden"
                                    >
                                        <span className="relative z-10">
                                            {step < 2
                                                ? (v.triangulation_next || "NEXT SIGNAL →")
                                                : (v.triangulation_cta || "COLLAPSE WAVEFORM")
                                            }
                                        </span>
                                        <div className="absolute inset-0 bg-[#00FF41]/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Synthesis Phase (Step 3) */}
                {step >= 3 && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-fade-in">
                        {/* Pulsing indicator */}
                        <div className="relative">
                            <div className="w-4 h-4 bg-[#00FF41] rounded-full animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            <div className="w-3 h-3 bg-[#00FF41] rounded-full relative z-10" />
                        </div>

                        {/* Synthesis terminal readout */}
                        <div className="w-full bg-zinc-900/50 border border-zinc-800 p-4 font-mono text-[10px] text-[#00FF41]/70 space-y-2">
                            <div className="animate-pulse">&gt; TRIANGULATING SIGNALS...</div>
                            <div className="text-zinc-600">&gt; RESONANCE VECTOR LOCKED</div>
                            <div className="text-zinc-600">&gt; DISTORTION MAP COMPILED</div>
                            <div className="text-zinc-600">&gt; FRICTION POINT ISOLATED</div>
                            <div className="animate-pulse mt-2 text-[#00FF41]">&gt; SYNTHESIZING REFINED PROTOCOL...</div>
                        </div>

                        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.3em]">
                            {v.triangulation_synthesizing || "COLLAPSING WAVEFORM"}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 text-[8px] font-mono text-zinc-700 uppercase tracking-[0.4em] text-center">
                    {v.triangulation_footer || "3 SIGNALS • 1 REFINED TRAJECTORY"}
                </div>
            </div>
        </div>
    );
};
