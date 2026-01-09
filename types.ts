export enum Phase {
  INTRO = 'INTRO',
  ARMORY_AUDIT = 'ARMORY_AUDIT',
  TOOL_COMPRESSION = 'TOOL_COMPRESSION',
  EVIDENCE_SCORING = 'EVIDENCE_SCORING',
  TOOL_LOCK = 'TOOL_LOCK',
  INSTALLATION = 'INSTALLATION',
}

export enum Quadrant {
  SANDBOX = 'Sandbox', // Play + Construction
  MISCHIEF = 'Mischief', // Play + Disruption
  CRAFT = 'Craft', // Discipline + Construction
  RITUAL = 'Ritual', // Discipline + Disruption
}

export interface ArmoryItem {
  id: string;
  verb: string;
  x: number; // -10 (Construction) to 10 (Disruption)
  y: number; // -10 (Play/Discovery) to 10 (Discipline/Mastery)
  quadrant: Quadrant;
}

export interface ToolCandidate {
  id: string;
  originalVerb: string;
  plainName: string; // The "Market Function" Name
  functionStatement: string; // The "What I do"
  promise: string; // The Outcome
  antiPitch: string; // What it is NOT (Differentiation)
  isSovereign?: boolean; // If this is a synthesized authority
  marketValidation?: string[]; // URLs from search grounding
  scores: {
    unbiddenRequests: boolean;
    frictionlessDoing: boolean;
    resultEvidence: boolean;
    extractionRisk: boolean; // TRUE means High Risk (Bad)
  };
  proofs: {
    unbidden?: string; // Text or mock file name
    result?: string;
  };
}

export interface SystemState {
  currentPhase: Phase;
  armory: ArmoryItem[];
  candidates: ToolCandidate[];
  selectedToolId: string | null;
  pilotPlan: string | null;
}

export interface AIAnalysisResult {
  plainName: string;
  functionStatement: string;
  promise: string;
  antiPitch: string;
}

export const INITIAL_STATE: SystemState = {
  currentPhase: Phase.INTRO,
  armory: [],
  candidates: [],
  selectedToolId: null,
  pilotPlan: null,
};