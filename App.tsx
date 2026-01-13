import React, { useState } from 'react';
import {
  Phase,
  SystemState,
  INITIAL_STATE,
  ArmoryItem,
  Quadrant
} from './types';
import { generatePilotProtocol } from './services/geminiService';
import { ProgressBar } from './components/Visuals';

// Phase Components
import { IntroPhase } from './components/phases/IntroPhase';
import { ArmoryAuditPhase } from './components/phases/ArmoryAuditPhase';
import { ToolCompressionPhase } from './components/phases/ToolCompressionPhase';
import { EvidenceScoringPhase } from './components/phases/EvidenceScoringPhase';
import { ToolLockPhase } from './components/phases/ToolLockPhase';
import { InstallationPhase } from './components/phases/InstallationPhase';

export default function App() {
  const [state, setState] = useState<SystemState>(INITIAL_STATE);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const getProgress = () => {
    switch (state.currentPhase) {
      case Phase.INTRO: return 0;
      case Phase.ARMORY_AUDIT: return 20;
      case Phase.TOOL_COMPRESSION: return 40;
      case Phase.EVIDENCE_SCORING: return 60;
      case Phase.TOOL_LOCK: return 80;
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
      <ProgressBar current={getProgress()} total={100} />

      <main className="container mx-auto px-4 py-16 md:py-24">
        {state.currentPhase === Phase.INTRO && (
          <IntroPhase onStart={() => setState(s => ({ ...s, currentPhase: Phase.ARMORY_AUDIT }))} />
        )}

        {state.currentPhase === Phase.ARMORY_AUDIT && (
          <ArmoryAuditPhase
            items={state.armory}
            onAddItem={(verb, x, y) => {
              const newItem: ArmoryItem = {
                id: Math.random().toString(36).substr(2, 9),
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
            onLock={(id) => setState(s => ({ ...s, selectedToolId: id, currentPhase: Phase.INSTALLATION }))}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.EVIDENCE_SCORING }))}
          />
        )}

        {state.currentPhase === Phase.INSTALLATION && state.selectedToolId && (
          <InstallationPhase
            tool={state.candidates.find(c => c.id === state.selectedToolId) || null}
            plan={state.pilotPlan}
            isGenerating={isGeneratingPlan}
            onGeneratePlan={async () => {
              setIsGeneratingPlan(true);
              const tool = state.candidates.find(c => c.id === state.selectedToolId);
              if (tool) {
                const plan = await generatePilotProtocol(tool.plainName, tool.functionStatement);
                setState(s => ({ ...s, pilotPlan: plan }));
              }
              setIsGeneratingPlan(false);
            }}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.TOOL_LOCK }))}
          />
        )}
      </main>
    </div>
  );
}