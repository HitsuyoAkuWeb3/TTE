import React, { useState, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { apiFetch, setTokenGetter } from './services/apiClient';
import {
  Phase,
  SystemState,
  INITIAL_STATE,
  ArmoryItem,
  Quadrant,
  DossierSnapshot,
  ToolCandidate,
  OperatorProfile,
  SimulationResult
} from './types';
import { generatePilotProtocol, updateCortex, updateVernacularMode } from './services/geminiService';
import { logger } from './services/logger';
import { ProgressBar } from './components/Visuals';
import { CortexTerminal } from './components/CortexTerminal';
import { RankBadge, XpToast } from './components/RankBadge';
import { RankCeremony } from './components/RankCeremony';
import { XP_AWARDS, getRank, getSpiralBurnXp, MythicRank } from './services/gamification';
import { recordPhaseEntry, resetTelemetry } from './services/operatorTelemetry';
import { useVernacular } from './contexts/VernacularContext';

// Tier 1: Citadel Hardening
import { SessionVow } from './components/SessionVow';
import { ThreatIndicator } from './components/ThreatIndicator';
import { ResurrectionScreen } from './components/ResurrectionScreen';
import { ProofTier } from './components/ProofTier';

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
import { DaemonWhisper } from './components/DaemonWhisper';
import { InterrogationModal } from './components/InterrogationModal';
import { PhaseScaffold } from './components/PhaseScaffold';
import { OrgSwitcherPanel } from './components/OrgSwitcher';
import { OrgDashboard } from './components/OrgDashboard';
import { useOrg } from './contexts/OrgContext';


export default function App() {
  const { isLoaded: clerkLoaded, user: clerkUser } = useUser();
  const { signOut, getToken } = useAuth();

  // DEV BYPASS: Allow E2E tests to simulate a logged-in user without Clerk keys
  const isBypass = import.meta.env.DEV && globalThis.window !== undefined && new URLSearchParams(globalThis.location.search).get('test_user') === 'true';

  // Register Clerk's getToken with the API client for automatic JWT injection.
  // In bypass mode, Clerk has no active session so getToken() hangs — use a no-op instead.
  React.useEffect(() => {
    if (isBypass) {
      setTokenGetter(async () => null);
    } else {
      setTokenGetter(() => getToken());
    }
  }, [getToken, isBypass]);

  const user = React.useMemo(() => {
    if (isBypass) return { id: 'test_user', email: 'test@sovereign.local' };
    if (clerkUser) return { id: clerkUser.id, email: clerkUser.primaryEmailAddress?.emailAddress };
    return null;
  }, [isBypass, clerkUser]);




  const [state, setState] = useState<SystemState>(INITIAL_STATE);

  // DEV BYPASS: Auto-hydration for E2E testing
  React.useEffect(() => {
    if (isBypass) {
      // Auto-acknowledge Vow
      setSessionAcknowledgedAt(Date.now());
      
      // Attempt to hydrate session
      try {
        const tteSessionId = localStorage.getItem('tte_session_id');
        if (tteSessionId) {
          const saved = localStorage.getItem(`session_${tteSessionId}`);
          if (saved) {
            const loaded = JSON.parse(saved);
            // Verify ownership (or allow if it matches the bypass user)
            if (loaded.userId === 'test_user') {
                logger.info('DEV', `Hydrating bypass session: ${tteSessionId}`);
                setState(loaded);
            }
          }
        }
      } catch (e) {
        logger.error('DEV', 'Failed to hydrate bypass session', e);
      }
    }
  }, [isBypass]);

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [xpToast, setXpToast] = useState<{ amount: number; reason: string } | null>(null);
  const [pyreTarget, setPyreTarget] = useState<ToolCandidate | null>(null);
  const [ceremonyRank, setCeremonyRank] = useState<MythicRank | null>(null);
  const [prevRankLevel, setPrevRankLevel] = useState(() => getRank(INITIAL_STATE.xp).level);
  const [interrogation, setInterrogation] = useState<{ phase: Phase; context: Record<string, string> } | null>(null);
  const { mode, v } = useVernacular();
  const { isOrgMode } = useOrg();
  const [showOrgDashboard, setShowOrgDashboard] = useState(false);

  // Tier 1.1: Session Vow — gate workspace behind intent acknowledgement
  const [sessionAcknowledgedAt, setSessionAcknowledgedAt] = useState<number | null>(null);

  // XP award helper — updates state + shows toast
  const awardXp = useCallback((amount: number, reason: string) => {
    setState(s => ({ ...s, xp: s.xp + amount }));
    setXpToast({ amount, reason });
  }, []);

  // Detect rank-up and trigger ceremony
  React.useEffect(() => {
    const currentRank = getRank(state.xp);
    if (currentRank.level > prevRankLevel) {
      setCeremonyRank(currentRank);
    }
    setPrevRankLevel(currentRank.level);
  }, [state.xp, prevRankLevel]);

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

  // Keep AI prompt language in sync with the vernacular mode
  React.useEffect(() => {
    updateVernacularMode(mode);
  }, [mode]);

  // Sync profile data from Postgres API (falls back to localStorage for dev)
  React.useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await apiFetch('/api/db/profile');
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

  // Streamlined Entry: auto-route returning users with saved tools to Archive
  React.useEffect(() => {
    if (!user) return;
    (async () => {
      let hasSavedSessions = false;
      // Check API first
      try {
        const res = await apiFetch('/api/db/sessions');
        if (res.ok) {
          const { sessions } = await res.json();
          if (sessions?.length > 0) hasSavedSessions = true;
        }
      } catch { /* API unavailable */ }
      // Fallback: check localStorage
      if (!hasSavedSessions) {
        try {
          const indexKey = `sessions_index_${user.id}`;
          const index: string[] = JSON.parse(localStorage.getItem(indexKey) || '[]');
          if (index.length > 0) hasSavedSessions = true;
        } catch { /* localStorage unavailable */ }
      }
      // If they have saved tools and are still on INTRO, redirect to Archive
      if (hasSavedSessions) {
        setState(s => s.currentPhase === Phase.INTRO ? { ...s, currentPhase: Phase.ARCHIVE } : s);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Tier 1.4: Resurrection Protocol — lock interface after 30 days of inactivity
  const RESURRECTION_THRESHOLD_DAYS = 30;
  // Signal Fidelity Degradation: force re-calibration after 7 days
  const SIGNAL_FIDELITY_THRESHOLD_DAYS = 7;
  const [daysAbsent, setDaysAbsent] = React.useState(0);
  React.useEffect(() => {
    if (!state.lastActiveDate || state.accessDegraded) return;
    const lastActive = new Date(state.lastActiveDate).getTime();
    const now = Date.now();
    const daysSinceActive = (now - lastActive) / (1000 * 60 * 60 * 24);
    setDaysAbsent(Math.floor(daysSinceActive));
    if (daysSinceActive >= RESURRECTION_THRESHOLD_DAYS) {
      // 30+ days → full lockout (Resurrection Protocol)
      setState(s => ({ ...s, accessDegraded: true }));
    } else if (daysSinceActive >= SIGNAL_FIDELITY_THRESHOLD_DAYS) {
      // 7+ days → force re-calibration
      setState(s => ({ ...s, accessDegraded: true, currentPhase: Phase.CALIBRATION }));
    }
  }, [state.lastActiveDate, state.accessDegraded]);

  // Student Model: track phase transitions for telemetry
  React.useEffect(() => {
    recordPhaseEntry(state.currentPhase);
  }, [state.currentPhase]);

  // Draft caching: auto-save when entering the Ritual Dashboard
  React.useEffect(() => {
    if (state.currentPhase === Phase.RITUAL_DASHBOARD && state.id && user) {
      handleSave(state);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentPhase]);

  // Activity heartbeat: update lastActiveDate on phase transitions
  const touchActivity = useCallback(() => {
    setState(s => ({ ...s, lastActiveDate: new Date().toISOString(), accessDegraded: false }));
  }, []);

  const handleCalibrationComplete = async (profile: OperatorProfile) => {
    if (!user) return;
    const profileId = state.profile?.id || crypto.randomUUID();
    const fullProfile = { ...profile, id: profileId, userId: user.id };
    // Save to Postgres API + localStorage fallback
    try {
      await apiFetch('/api/db/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: fullProfile }),
      });
    } catch { /* API unavailable */ }
    localStorage.setItem(`profile_${user.id}`, JSON.stringify(fullProfile));
    setState(s => ({ ...s, profile: fullProfile, currentPhase: Phase.INTRO }));
    awardXp(XP_AWARDS.CALIBRATION_COMPLETE, v.xp_calibration);
    touchActivity(); // Re-calibration resets degradation
  };

  // Dossier Cremation — P3 Phoenix Loop: full identity reset
  const handleCremate = useCallback(() => {
    // Award Phoenix XP BEFORE reset (so toast shows)
    awardXp(XP_AWARDS.PHOENIX_REBORN, v.xp_phoenix_reborn);
    // Clear persisted profile
    if (user) {
      try { localStorage.removeItem(`profile_${user.id}`); } catch { /* */ }
    }
    // Reset to INITIAL_STATE, preserving only auth
    resetTelemetry(); // Clean telemetry for the reborn identity
    setState(s => ({
      ...INITIAL_STATE,
      userId: s.userId,
      xp: s.xp + XP_AWARDS.PHOENIX_REBORN, // preserve XP earned in final award
      lastActiveDate: new Date().toISOString(),
    }));
  }, [awardXp, user, v.xp_phoenix_reborn]);

  const handleSave = async (currentState: SystemState) => {
    setIsSaving(true);
    if (!user) {
      logger.error('SAVE', 'No authenticated user');
      setIsSaving(false);
      return;
    }

    const sessionId = currentState.id || crypto.randomUUID();
    logger.info('SAVE', `Processing session save: ${sessionId} for user: ${user.id}`);

    try {
      const saveData = {
        ...currentState,
        id: sessionId,
        userId: user.id,
        updatedAt: Date.now()
      };
      // Save to Postgres API
      try {
        await apiFetch('/api/db/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      logger.info('SAVE', 'Save successful');
      setState(s => ({ ...s, id: sessionId }));
    } catch (err: any) {
      logger.error('SAVE', 'Save failed:', err.message);
    }
    setIsSaving(false);
  };

  // Tier 5: World Forge Persistence
  const handleSaveSimulation = (result: SimulationResult) => {
    // Optimistic update
    const newState = {
        ...state,
        simulationHistory: [...(state.simulationHistory || []), result]
    };
    setState(newState);
    handleSave(newState);
  };

  if ((!clerkLoaded && !isBypass)) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <CortexTerminal phase="intro" />
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen bg-void text-bone"><AuthTerminal /></div>;
  }

  // Tier 1.4: Resurrection Protocol — full lockout for 30+ day absence
  if (state.accessDegraded && daysAbsent >= RESURRECTION_THRESHOLD_DAYS) {
    return (
      <ResurrectionScreen
        daysAbsent={daysAbsent}
        onResurrect={(statement) => {
          setState(s => ({
            ...s,
            accessDegraded: false,
            lastActiveDate: new Date().toISOString(),
            sessionGoal: statement,
          }));
          awardXp(XP_AWARDS.PHOENIX_REBORN, 'Resurrection Protocol — returned from the void');
          setSessionAcknowledgedAt(Date.now());
        }}
      />
    );
  }

  // Tier 1.1: Session Vow — airlock before workspace
  if (!sessionAcknowledgedAt) {
    return (
      <SessionVow
        strategicGoal={state.sessionGoal || state.profile?.strategicGoal}
        operatorName={state.profile?.name || user.email}
        onAcknowledge={(goal) => {
          setState(s => ({ ...s, sessionGoal: goal }));
          setSessionAcknowledgedAt(Date.now());
          touchActivity();
        }}
      />
    );
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
    <div className="min-h-screen bg-void text-bone selection:bg-white selection:text-black">
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[9px] font-mono text-zinc-400 border border-zinc-800 px-3 py-1.5 bg-void/80 hover:bg-zinc-900 transition-colors flex items-center gap-2 uppercase tracking-wider"
          >
            NODE: {user.email}
            <span className={`transform transition-transform text-[8px] ${isMenuOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {isMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-void border border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.8)] flex flex-col animate-fade-in z-50">
              {user && state.currentPhase !== Phase.ARCHIVE && (
                <button
                  onClick={() => {
                    setState(s => ({ ...s, currentPhase: Phase.ARCHIVE }));
                    setIsMenuOpen(false);
                  }}
                  className="text-left px-4 py-3 text-[10px] font-mono text-zinc-300 hover:text-bone hover:bg-zinc-900 transition-colors border-b border-zinc-900 uppercase tracking-widest"
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
                  className="text-left px-4 py-3 text-[10px] font-mono text-zinc-300 hover:text-bone hover:bg-zinc-900 transition-colors border-b border-zinc-900 uppercase tracking-widest"
                >
                  {v.menu_calibrate}
                </button>
              )}

              {user && isOrgMode && (
                <button
                  onClick={() => {
                    setShowOrgDashboard(true);
                    setIsMenuOpen(false);
                  }}
                  className="text-left px-4 py-3 text-[10px] font-mono text-spirit hover:text-bone hover:bg-zinc-900 transition-colors border-b border-zinc-900 uppercase tracking-widest"
                >
                  ◆ ORG DASHBOARD
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
        <OrgSwitcherPanel />
        <ThreatIndicator />
        <ProofTier state={state} />
        <RankBadge xp={state.xp} />
      </div>

      <ProgressBar current={getProgress()} total={100} />

      <main className="container mx-auto px-4 py-16 md:py-24">
        {showOrgDashboard && isOrgMode ? (
          <div>
            <button
              onClick={() => setShowOrgDashboard(false)}
              className="mb-8 text-[10px] font-mono text-zinc-500 hover:text-bone border border-zinc-800 px-3 py-1.5 transition-colors uppercase tracking-wider"
            >
              ← BACK TO SESSION
            </button>
            <OrgDashboard />
          </div>
        ) : (
          <>
        {state.currentPhase === Phase.INTRO && (
          <IntroPhase onStart={(name) => setState(s => ({ ...s, clientName: name, currentPhase: Phase.ARMORY_AUDIT }))} />
        )}

        {state.currentPhase === Phase.ARCHIVE && user && (
          <ArchivePhase
            userId={user.id}
            onSelect={(loadedState) => {
              // If the tool has a completed plan, route directly to the Dashboard
              const targetPhase = (loadedState.pilotPlan && loadedState.selectedToolId)
                ? Phase.RITUAL_DASHBOARD
                : loadedState.currentPhase;
              setState({ ...loadedState, userId: user.id, profile: state.profile, currentPhase: targetPhase });
            }}
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
              awardXp(XP_AWARDS.ARMORY_ITEM_ADDED, v.xp_armory_item);
            }}
            onUpdateItem={handleUpdateItem}
            onNext={() => setState(s => ({ ...s, currentPhase: Phase.TOOL_COMPRESSION }))}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.INTRO }))}
          />
        )}

        {state.currentPhase === Phase.TOOL_COMPRESSION && (
          <ToolCompressionPhase
            armory={state.armory}
            onSelectCandidates={(candidates) => {
              setState(s => ({ ...s, candidates }));
              candidates.forEach(() => awardXp(XP_AWARDS.TOOL_COMPRESSED, v.xp_compressed));
            }}
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
            onNext={() => {
              state.candidates.forEach(() => awardXp(XP_AWARDS.EVIDENCE_SCORED, v.xp_scored));
              setState(s => ({ ...s, currentPhase: Phase.TOOL_LOCK }));
            }}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.TOOL_COMPRESSION }))}
          />
        )}

        {state.currentPhase === Phase.TOOL_LOCK && (
          <ToolLockPhase
            candidates={state.candidates}
            onLock={(id) => {
              setState(s => ({ ...s, selectedToolId: id, currentPhase: Phase.VALUE_SYNTHESIS }));
              awardXp(XP_AWARDS.TOOL_LOCKED, v.xp_locked);
            }}
            onBurn={(id) => setState(s => ({ ...s, candidates: s.candidates.filter(c => c.id !== id) }))}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.EVIDENCE_SCORING }))}
          />
        )}

        {state.currentPhase === Phase.VALUE_SYNTHESIS && state.selectedToolId && (
          <ValueChemistryPhase
            tool={state.candidates.find(c => c.id === state.selectedToolId)!}
            profile={state.profile}
            onComplete={(tov) => {
              setState(s => ({ ...s, theoryOfValue: tov, currentPhase: Phase.INSTALLATION }));
              awardXp(XP_AWARDS.THEORY_SYNTHESIZED, v.xp_theory);
            }}
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
            planCreatedAt={state.planCreatedAt}
            lastActiveDate={state.lastActiveDate}
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
                const newState = {
                  ...state,
                  pilotPlan: plan,
                  planCreatedAt: state.planCreatedAt || Date.now(),
                };
                setState(newState);
                // Draft caching: auto-save after plan generation
                handleSave(newState);
              }
              setIsGeneratingPlan(false);
            }}
            onUpdatePlan={(newPlan) => {
              const updated = { ...state, pilotPlan: newPlan };
              setState(s => ({ ...s, pilotPlan: newPlan }));
              // Draft caching: auto-save after AI refinement
              handleSave(updated);
            }}
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
            onNext={() => setState(s => ({ ...s, currentPhase: Phase.RITUAL_DASHBOARD }))}
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
            onAwardXp={awardXp}
            onCremate={handleCremate}
            onSaveSimulation={handleSaveSimulation}
          />
        )}
        </>
        )}
      </main>

      {user && state.currentPhase === Phase.INTRO && (
        <footer className="fixed bottom-8 left-0 w-full flex justify-center z-40 pointer-events-none">
          <button
            onClick={() => setState(s => ({ ...s, currentPhase: Phase.ARCHIVE }))}
            className="text-[10px] font-mono text-[#00FF41] hover:bg-[#00FF41] hover:text-black transition-all uppercase tracking-[0.2em] bg-void px-6 py-3 border border-[#00FF41]/30 hover:border-[#00FF41] rounded-sm pointer-events-auto shadow-[0_0_20px_rgba(0,255,65,0.1)]"
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
            const spiralXp = getSpiralBurnXp(state.burnCount);
            setState(s => ({
              ...s,
              candidates: s.candidates.filter(c => c.id !== toolId),
              selectedToolId: s.selectedToolId === toolId ? null : s.selectedToolId,
              burnCount: s.burnCount + 1,
            }));
            setPyreTarget(null);
            awardXp(spiralXp, v.xp_burned);
          }}
          onCancel={() => setPyreTarget(null)}
        />
      )}
      {/* Rank Ceremony */}
      {ceremonyRank && (
        <RankCeremony
          rank={ceremonyRank}
          xp={state.xp}
          onDismiss={() => setCeremonyRank(null)}
        />
      )}

      {/* Phase Scaffold — JIT Knowledge Primer */}
      {state.currentPhase && (
        <PhaseScaffold
          phase={state.currentPhase}
          onProceed={() => { /* scaffold dismissed, phase continues */ }}
        />
      )}

      {/* Daemon Whisper — Ambient Coaching Overlay */}
      <DaemonWhisper
        phase={state.currentPhase}
        profile={state.profile}
        toolName={state.candidates.find(c => c.id === state.selectedToolId)?.plainName}
      />

      {/* Active Interrogation Modal */}
      {interrogation && state.profile && (
        <InterrogationModal
          phase={interrogation.phase}
          profile={state.profile}
          context={interrogation.context}
          onPass={() => {
            const isPerfect = true; // Will be refined when scoring data flows back
            awardXp(
              isPerfect ? XP_AWARDS.INTERROGATION_PERFECT : XP_AWARDS.INTERROGATION_PASSED,
              v.xp_interrogation
            );
            setInterrogation(null);
          }}
          onDismiss={() => setInterrogation(null)}
        />
      )}
    </div>
  );
}