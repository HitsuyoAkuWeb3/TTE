import React, { useState, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import {
  Phase,
  SystemState,
  INITIAL_STATE,
  ArmoryItem,
  Quadrant,
  DossierSnapshot
} from './types';
import { generatePilotProtocol, updateCortex } from './services/geminiService';
import { ProgressBar } from './components/Visuals';
import { RankBadge, XpToast } from './components/RankBadge';
import { XP_AWARDS } from './services/gamification';
import { useVernacular } from './contexts/VernacularContext';

// Phase Components
import { IntroPhase } from './components/phases/IntroPhase';
import { ArmoryAuditPhase } from './components/phases/ArmoryAuditPhase';
import { ToolCompressionPhase } from './components/phases/ToolCompressionPhase';
import { EvidenceScoringPhase } from './components/phases/EvidenceScoringPhase';
import { ToolLockPhase } from './components/phases/ToolLockPhase';
import { ValueChemistryPhase } from './components/phases/ValueChemistryPhase';
import { InstallationPhase } from './components/phases/InstallationPhase';
import { AuthTerminal } from './components/AuthTerminal';
import { ArchivePhase } from './components/phases/ArchivePhase';
import { CalibrationPhase } from './components/phases/CalibrationPhase';
import { RitualDashboard } from './components/phases/RitualDashboard';
import { Pyre } from './components/phases/Pyre';
import { ToolCandidate } from './types';

export default function App() {
  const { isLoaded: clerkLoaded, user: clerkUser } = useUser();
  const { signOut } = useAuth();
  const isLoading = !clerkLoaded;
  const user = clerkUser ? { id: clerkUser.id, email: clerkUser.primaryEmailAddress?.emailAddress } : null;
  const [state, setState] = useState<SystemState>(INITIAL_STATE);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [xpToast, setXpToast] = useState<{ amount: number; reason: string } | null>(null);
  const [pyreTarget, setPyreTarget] = useState<ToolCandidate | null>(null);
  const { mode, v } = useVernacular();

  // XP award helper — updates state + shows toast
  const awardXp = useCallback((amount: number, reason: string) => {
    setState(s => ({ ...s, xp: s.xp + amount }));
    setXpToast({ amount, reason });
  }, []);

  // Sync auth user to state
  React.useEffect(() => {
    if (user) {
      setState(s => ({ ...s, userId: user.id }));
    } else {
      setState(s => ({ ...s, userId: null, profile: null }));
    }
  }, [user]);

  // Keep the AI Cortex in sync with the current session state
  React.useEffect(() => {
    updateCortex(state);
  }, [state]);

  // Sync profile data from Postgres API (falls back to localStorage for dev)
  React.useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch('/api/db/profile', { headers: { 'x-clerk-user-id': user.id } });
        if (res.ok) {
          const profile = await res.json();
          setState(s => ({ ...s, profile: profile.data || profile }));
          return;
        }
      } catch { /* API unavailable — try localStorage */ }
      try {
        const stored = localStorage.getItem(`profile_${user.id}`);
        if (stored) {
          setState(s => ({ ...s, profile: JSON.parse(stored) }));
          return;
        }
      } catch { /* localStorage unavailable */ }
      // No profile found — force calibration
      setState(s => {
        if (s.currentPhase === Phase.ARCHIVE) return s;
        if (s.currentPhase === Phase.CALIBRATION) return s;
        return { ...s, currentPhase: Phase.CALIBRATION };
      });
    })();
  }, [user]);

  const handleCalibrationComplete = async (profile: any) => {
    if (!user) return;
    const profileId = state.profile?.id || crypto.randomUUID();
    const fullProfile = { ...profile, id: profileId, userId: user.id };
    // Save to Postgres API + localStorage fallback
    try {
      await fetch('/api/db/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-clerk-user-id': user.id },
        body: JSON.stringify({ data: fullProfile }),
      });
    } catch { /* API unavailable */ }
    localStorage.setItem(`profile_${user.id}`, JSON.stringify(fullProfile));
    setState(s => ({ ...s, profile: fullProfile, currentPhase: Phase.INTRO }));
    awardXp(XP_AWARDS.CALIBRATION_COMPLETE, v.xp_calibration);
  };

  const handleSave = async (currentState: SystemState) => {
    setIsSaving(true);
    if (!user) {
      console.error("Save failed: No authenticated user");
      setIsSaving(false);
      return;
    }

    const sessionId = currentState.id || crypto.randomUUID();
    console.log(`Processing session save: ${sessionId} for user: ${user.id}`);

    try {
      const saveData = {
        ...currentState,
        id: sessionId,
        userId: user.id,
        updatedAt: Date.now()
      };
      // Save to Postgres API
      try {
        await fetch('/api/db/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-clerk-user-id': user.id },
          body: JSON.stringify({
            id: sessionId,
            data: saveData,
            version: currentState.version || 1,
            finalized: currentState.finalized || false,
          }),
        });
      } catch { /* API unavailable — localStorage only */ }
      // Also save to localStorage as fallback
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(saveData));
      const indexKey = `sessions_index_${user.id}`;
      const index: string[] = JSON.parse(localStorage.getItem(indexKey) || '[]');
      if (!index.includes(sessionId)) {
        index.push(sessionId);
        localStorage.setItem(indexKey, JSON.stringify(index));
      }
      console.log("Save Successful");
      setState(s => ({ ...s, id: sessionId }));
    } catch (err: any) {
      console.error("Save Failed:", err.message);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-400 animate-pulse">
        Establishing Link...
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen bg-zinc-950 text-white"><AuthTerminal /></div>;
  }

  const getProgress = () => {
    switch (state.currentPhase) {
      case Phase.INTRO: return 0;
      case Phase.ARCHIVE: return 0;
      case Phase.CALIBRATION: return 5;
      case Phase.ARMORY_AUDIT: return 20;
      case Phase.TOOL_COMPRESSION: return 40;
      case Phase.EVIDENCE_SCORING: return 60;
      case Phase.TOOL_LOCK: return 75;
      case Phase.VALUE_SYNTHESIS: return 90;
      case Phase.INSTALLATION: return 95;
      case Phase.RITUAL_DASHBOARD: return 100;
      default: return 0;
    }
  };

  const handleUpdateItem = (id: string, x: number, y: number) => {
    setState(s => ({
      ...s,
      armory: s.armory.map(i => i.id === id ? { ...i, x, y, quadrant: getQuadrant(x, y) } : i)
    }));
  };

  const getQuadrant = (x: number, y: number): Quadrant => {
    if (x > 0 && y > 0) return Quadrant.RITUAL;
    if (x > 0 && y <= 0) return Quadrant.MISCHIEF;
    if (x <= 0 && y > 0) return Quadrant.CRAFT;
    return Quadrant.SANDBOX;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-white selection:text-black">
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[9px] font-mono text-zinc-400 border border-zinc-800 px-3 py-1.5 bg-black/80 hover:bg-zinc-900 transition-colors flex items-center gap-2 uppercase tracking-wider"
          >
            NODE: {user.email}
            <span className={`transform transition-transform text-[8px] ${isMenuOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {isMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-black border border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col animate-fade-in z-50">
              {user && state.currentPhase !== Phase.ARCHIVE && (
                <button
                  onClick={() => {
                    setState(s => ({ ...s, currentPhase: Phase.ARCHIVE }));
                    setIsMenuOpen(false);
                  }}
                  className="text-left px-4 py-3 text-[10px] font-mono text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors border-b border-zinc-900 uppercase tracking-widest"
                >
                  {v.menu_archive}
                </button>
              )}

              {user && (
                <button
                  onClick={() => {
                    setState(s => ({ ...s, currentPhase: Phase.CALIBRATION }));
                    setIsMenuOpen(false);
                  }}
                  className="text-left px-4 py-3 text-[10px] font-mono text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors border-b border-zinc-900 uppercase tracking-widest"
                >
                  {v.menu_calibrate}
                </button>
              )}

              <button
                onClick={() => {
                  signOut();
                  setIsMenuOpen(false);
                }}
                className="text-left px-4 py-3 text-[10px] font-mono text-[#FF2A2A] hover:bg-[#FF2A2A]/5 hover:text-[#ff4d4d] transition-colors uppercase tracking-widest"
              >
                {v.menu_logout}
              </button>
            </div>
          )}
        </div>
        <RankBadge xp={state.xp} />
      </div>

      <ProgressBar current={getProgress()} total={100} />

      <main className="container mx-auto px-4 py-16 md:py-24">
        {state.currentPhase === Phase.INTRO && (
          <IntroPhase onStart={(name) => setState(s => ({ ...s, clientName: name, currentPhase: Phase.ARMORY_AUDIT }))} />
        )}

        {state.currentPhase === Phase.ARCHIVE && user && (
          <ArchivePhase
            userId={user.id}
            onSelect={(loadedState) => setState({ ...loadedState, userId: user.id, profile: state.profile })}
            onNew={() => setState({ ...INITIAL_STATE, userId: user.id, profile: state.profile, currentPhase: Phase.INTRO })}
          />
        )}

        {state.currentPhase === Phase.CALIBRATION && (
          <CalibrationPhase
            initialProfile={state.profile}
            onComplete={handleCalibrationComplete}
          />
        )}

        {state.currentPhase === Phase.ARMORY_AUDIT && (
          <ArmoryAuditPhase
            items={state.armory}
            profile={state.profile}
            onAddItem={(verb, x, y) => {
              const newItem: ArmoryItem = {
                id: crypto.randomUUID(),
                verb,
                x: x,
                y: y,
                quadrant: getQuadrant(x, y)
              };
              setState(s => ({ ...s, armory: [...s.armory, newItem] }));
            }}
            onUpdateItem={handleUpdateItem}
            onNext={() => setState(s => ({ ...s, currentPhase: Phase.TOOL_COMPRESSION }))}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.INTRO }))}
          />
        )}

        {state.currentPhase === Phase.TOOL_COMPRESSION && (
          <ToolCompressionPhase
            armory={state.armory}
            onSelectCandidates={(candidates) => setState(s => ({ ...s, candidates }))}
            onRemoveItems={(ids) => setState(s => ({
              ...s,
              armory: s.armory.filter(a => !ids.includes(a.id))
            }))}
            onRenameItem={(id, newName) => setState(s => ({
              ...s,
              armory: s.armory.map(a => a.id === id ? { ...a, verb: newName } : a)
            }))}
            onNext={() => setState(s => ({ ...s, currentPhase: Phase.EVIDENCE_SCORING }))}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.ARMORY_AUDIT }))}
          />
        )}

        {state.currentPhase === Phase.EVIDENCE_SCORING && (
          <EvidenceScoringPhase
            candidates={state.candidates}
            onUpdateCandidate={(candidates) => setState(s => ({ ...s, candidates }))}
            onNext={() => setState(s => ({ ...s, currentPhase: Phase.TOOL_LOCK }))}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.TOOL_COMPRESSION }))}
          />
        )}

        {state.currentPhase === Phase.TOOL_LOCK && (
          <ToolLockPhase
            candidates={state.candidates}
            onLock={(id) => setState(s => ({ ...s, selectedToolId: id, currentPhase: Phase.VALUE_SYNTHESIS }))}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.EVIDENCE_SCORING }))}
          />
        )}

        {state.currentPhase === Phase.VALUE_SYNTHESIS && state.selectedToolId && (
          <ValueChemistryPhase
            tool={state.candidates.find(c => c.id === state.selectedToolId)!}
            profile={state.profile}
            onComplete={(tov) => setState(s => ({ ...s, theoryOfValue: tov, currentPhase: Phase.INSTALLATION }))}
            onBack={() => {
              if (state.pilotPlan) {
                setState(s => ({ ...s, currentPhase: Phase.INSTALLATION }));
              } else {
                setState(s => ({ ...s, currentPhase: Phase.TOOL_LOCK }));
              }
            }}
          />
        )}

        {state.currentPhase === Phase.INSTALLATION && state.selectedToolId && (
          <InstallationPhase
            tool={state.candidates.find(c => c.id === state.selectedToolId) || null}
            plan={state.pilotPlan}
            clientName={state.clientName}
            profile={state.profile}
            theoryOfValue={state.theoryOfValue}
            isGenerating={isGeneratingPlan}
            isSaving={isSaving}
            isFinalized={state.finalized}
            version={state.version}
            onGeneratePlan={async () => {
              setIsGeneratingPlan(true);
              const tool = state.candidates.find(c => c.id === state.selectedToolId);
              if (tool) {
                const plan = await generatePilotProtocol(
                  tool.plainName,
                  tool.functionStatement,
                  state.clientName,
                  state.profile || undefined
                );
                const newState = { ...state, pilotPlan: plan };
                setState(newState);
              }
              setIsGeneratingPlan(false);
            }}
            onUpdatePlan={(newPlan) => setState(s => ({ ...s, pilotPlan: newPlan }))}
            onSave={() => handleSave(state)}
            onRetroactiveAudit={() => setState(s => ({ ...s, currentPhase: Phase.VALUE_SYNTHESIS }))}
            onFinalize={() => {
              const newVersion = (state.version || 0) + 1;
              const snapshot: DossierSnapshot = {
                version: newVersion,
                finalizedAt: Date.now(),
                state: { ...state, finalized: true, version: newVersion, finalizedAt: Date.now() }
              };
              // Append snapshot to localStorage history
              const historyKey = `dossier_history_${state.id || 'draft'}`;
              const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
              existing.push(snapshot);
              localStorage.setItem(historyKey, JSON.stringify(existing));
              // Lock state
              setState(s => ({ ...s, finalized: true, version: newVersion, finalizedAt: Date.now() }));
              handleSave({ ...state, finalized: true, version: newVersion, finalizedAt: Date.now() });
              awardXp(XP_AWARDS.DOSSIER_FINALIZED, v.xp_finalized);
            }}
            onForkVersion={() => {
              const nextVersion = (state.version || 1) + 1;
              setState(s => ({ ...s, finalized: false, version: nextVersion, finalizedAt: undefined }));
            }}
            onBack={() => {
              if (state.theoryOfValue) {
                setState(s => ({ ...s, currentPhase: Phase.VALUE_SYNTHESIS }));
              } else {
                setState(s => ({ ...s, currentPhase: Phase.TOOL_LOCK }));
              }
            }}
          />
        )}

        {state.currentPhase === Phase.RITUAL_DASHBOARD && (
          <RitualDashboard
            tool={state.candidates.find(c => c.id === state.selectedToolId) || null}
            theoryOfValue={state.theoryOfValue}
            profile={state.profile}
            pilotPlan={state.pilotPlan}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.INSTALLATION }))}
            onReAudit={() => setState(s => ({ ...s, currentPhase: Phase.ARMORY_AUDIT }))}
          />
        )}
      </main>

      {user && state.currentPhase === Phase.INTRO && (
        <footer className="fixed bottom-8 left-0 w-full flex justify-center z-40 pointer-events-none">
          <button
            onClick={() => setState(s => ({ ...s, currentPhase: Phase.ARCHIVE }))}
            className="text-[10px] font-mono text-[#00FF41] hover:bg-[#00FF41] hover:text-black transition-all uppercase tracking-[0.2em] bg-black/80 backdrop-blur-sm px-6 py-3 border border-[#00FF41]/30 hover:border-[#00FF41] rounded-sm pointer-events-auto shadow-[0_0_20px_rgba(0,255,65,0.1)]"
          >
            {v.footer_archive_link}
          </button>
        </footer>
      )}

      {/* XP Toast */}
      {xpToast && (
        <XpToast
          amount={xpToast.amount}
          reason={xpToast.reason}
          onDone={() => setXpToast(null)}
        />
      )}

      {/* The Pyre — Tool Retirement Ceremony */}
      {pyreTarget && (
        <Pyre
          tool={pyreTarget}
          onBurnComplete={(toolId) => {
            setState(s => ({
              ...s,
              candidates: s.candidates.filter(c => c.id !== toolId),
              selectedToolId: s.selectedToolId === toolId ? null : s.selectedToolId,
            }));
            setPyreTarget(null);
            awardXp(100, v.xp_burned);
          }}
          onCancel={() => setPyreTarget(null)}
        />
      )}
    </div>
  );
}