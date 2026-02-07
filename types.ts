export enum Phase {
  INTRO = 'INTRO',
  ARCHIVE = 'ARCHIVE',
  CALIBRATION = 'CALIBRATION',
  ARMORY_AUDIT = 'ARMORY_AUDIT',
  TOOL_COMPRESSION = 'TOOL_COMPRESSION',
  EVIDENCE_SCORING = 'EVIDENCE_SCORING',
  TOOL_LOCK = 'TOOL_LOCK',
  VALUE_SYNTHESIS = 'VALUE_SYNTHESIS',
  INSTALLATION = 'INSTALLATION',
  RITUAL_DASHBOARD = 'RITUAL_DASHBOARD',
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
    unbiddenRequests: number;    // 0-5 scale
    frictionlessDoing: number;   // 0-5 scale
    resultEvidence: number;      // 0-5 scale
    extractionRisk: number;      // 0-5 scale (HIGH = bad)
  };
  proofs: {
    unbidden?: string; // Text or mock file name
    result?: string;
  };
  challengeReceived?: boolean; // Prevents repeated adversarial prompts
}

// Verification Level: measures "Proof of Work" integrity
// Level 1: Self-Reported (no proofs submitted)
// Level 2: Partially Verified (some proofs, or scores without challenge survival)
// Level 3: System-Verified (all proofs + scores ≥3 + challenge survived)
export const getVerificationLevel = (c: ToolCandidate): 1 | 2 | 3 => {
  const hasUnbiddenProof = !!c.proofs.unbidden && c.proofs.unbidden.length > 0;
  const hasResultProof = !!c.proofs.result && c.proofs.result.length > 0;
  const allScoresAboveThreshold =
    c.scores.unbiddenRequests >= 3 &&
    c.scores.frictionlessDoing >= 3 &&
    c.scores.resultEvidence >= 3 &&
    c.scores.extractionRisk <= 2;

  if (hasUnbiddenProof && hasResultProof && allScoresAboveThreshold) return 3;
  if (hasUnbiddenProof || hasResultProof) return 2;
  return 1;
};

export const VERIFICATION_LABELS: Record<1 | 2 | 3, string> = {
  1: 'UNVERIFIED — SELF-REPORTED',
  2: 'PARTIAL — EVIDENCE SUBMITTED',
  3: 'VERIFIED — AUDIT PASSED',
};

export interface OperatorProfile {
  name: string;
  industry: string;
  strategicGoal: string;
  preferredTone: 'clinical' | 'empathetic' | 'aggressive' | 'minimalist';
}

export interface TheoryOfValue {
  fatalWound: string;
  sacredCow: string;
  molecularBond: string;
  mvaRadar: {
    shadowBeliefs: string[];
    rawLingo: string[];
  };
  godfatherOffer: {
    name: string;
    transformation: string;
    price: string;
  };
}

export interface SystemState {
  id?: string;
  userId: string | null;
  currentPhase: Phase;
  armory: ArmoryItem[];
  candidates: ToolCandidate[];
  selectedToolId: string | null;
  pilotPlan: string | null;
  clientName?: string;
  profile?: OperatorProfile | null;
  theoryOfValue?: TheoryOfValue | null;
  // Draft-Commit Pattern
  finalized?: boolean;
  version?: number;
  finalizedAt?: number;
  // Gamification
  xp: number;
}

// Append-only snapshot for version history
export interface DossierSnapshot {
  version: number;
  finalizedAt: number;
  state: SystemState;
}

export interface AIAnalysisResult {
  plainName: string;
  functionStatement: string;
  promise: string;
  antiPitch: string;
}

export const INITIAL_STATE: SystemState = {
  currentPhase: Phase.INTRO,
  userId: null,
  armory: [],
  candidates: [],
  selectedToolId: null,
  pilotPlan: null,
  theoryOfValue: null,
  finalized: false,
  version: 0,
  xp: 0,
};