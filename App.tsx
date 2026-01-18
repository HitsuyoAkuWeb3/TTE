import React, { useState } from 'react';
import {
  Phase,
  SystemState,
  INITIAL_STATE,
  ArmoryItem,
  Quadrant
} from './types';
import { generatePilotProtocol } from './services/geminiService';
import { apiService } from './services/apiService';
import { db } from './services/instantDb';
import { ProgressBar } from './components/Visuals';

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

export default function App() {
  const { isLoading, user, error } = db.useAuth();
  const { data: profileData } = db.useQuery(user ? { profiles: { $: { where: { userId: user.id } } } } : null);
  const [state, setState] = useState<SystemState>(INITIAL_STATE);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync auth user to state
  React.useEffect(() => {
    if (user) {
      setState(s => ({ ...s, userId: user.id }));
    } else {
      setState(s => ({ ...s, userId: null, profile: null }));
    }
  }, [user]);

  // Sync profile data to state
  React.useEffect(() => {
    if (profileData?.profiles?.length > 0) {
      setState(s => ({ ...s, profile: profileData.profiles[0] }));
    } else if (user && profileData && profileData.profiles.length === 0) {
      // If profile fetch returned empty, and we are not in archive, force calibration
      setState(s => {
        if (s.currentPhase === Phase.ARCHIVE) return s;
        if (s.currentPhase === Phase.CALIBRATION) return s;
        return { ...s, currentPhase: Phase.CALIBRATION };
      });
    }
  }, [profileData, user]);

  const handleCalibrationComplete = async (profile: any) => {
    if (!user) return;
    const profileId = state.profile?.id || crypto.randomUUID();
    await db.transact([
      db.tx.profiles[profileId].update({ ...profile, userId: user.id })
    ]);
    setState(s => ({ ...s, profile: { ...profile, id: profileId }, currentPhase: Phase.INTRO }));
  };

  const handleSave = async (currentState: SystemState) => {
    setIsSaving(true);
    const result = await apiService.submitSession(currentState);
    if (result.success && result.sessionId) {
      console.log("Session saved:", result.sessionId);
      setState(s => ({ ...s, id: result.sessionId }));
    } else {
      console.error("Save failed:", result.error);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-500 animate-pulse">
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
      case Phase.INSTALLATION: return 100;
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
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4">
        <div className="text-[9px] font-mono text-zinc-500 border border-zinc-800 px-2 py-1 bg-black/50">
          NODE: {user.email}
        </div>
        <button
          onClick={() => db.auth.signOut()}
          className="text-[9px] font-mono text-[#FF2A2A] hover:bg-[#FF2A2A] hover:text-black transition-all border border-[#FF2A2A]/50 px-2 py-1 bg-black/50"
        >
          [ TERMINATE_LINK ]
        </button>
        {user && (
          <button
            onClick={() => setState(s => ({ ...s, currentPhase: Phase.CALIBRATION }))}
            className="text-[9px] font-mono text-[#eab308] hover:bg-[#eab308] hover:text-black transition-all border border-[#eab308]/50 px-2 py-1 bg-black/50"
          >
            [ RE-CALIBRATE ]
          </button>
        )}
        {user && state.currentPhase !== Phase.ARCHIVE && (
          <button
            onClick={() => setState(s => ({ ...s, currentPhase: Phase.ARCHIVE }))}
            className="text-[9px] font-mono text-[#00FF41] hover:bg-[#00FF41] hover:text-black transition-all border border-[#00FF41]/50 px-2 py-1 bg-black/50"
          >
            [ DOSSIER_ARCHIVE ]
          </button>
        )}
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
            onBack={() => {
              // If we have a theory of value, we likely just finished synthesis, so back to synthesis
              // If we DON'T have a theory of value (existing user), back should go to tool lock
              if (state.theoryOfValue) {
                setState(s => ({ ...s, currentPhase: Phase.VALUE_SYNTHESIS }));
              } else {
                setState(s => ({ ...s, currentPhase: Phase.TOOL_LOCK }));
              }
            }}
          />
        )}
      </main>

      {user && state.currentPhase !== Phase.ARCHIVE && (
        <footer className="fixed bottom-8 left-0 w-full flex justify-center z-40 pointer-events-none">
          <button
            onClick={() => setState(s => ({ ...s, currentPhase: Phase.ARCHIVE }))}
            className="text-[10px] font-mono text-[#00FF41] hover:bg-[#00FF41] hover:text-black transition-all uppercase tracking-[0.2em] bg-black/80 backdrop-blur-sm px-6 py-3 border border-[#00FF41]/30 hover:border-[#00FF41] rounded-sm pointer-events-auto shadow-[0_0_20px_rgba(0,255,65,0.1)]"
          >
            Access_Existing_Dossiers
          </button>
        </footer>
      )}
    </div>
  );
}