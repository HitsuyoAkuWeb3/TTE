import React, { createContext, useContext, useState, ReactNode } from 'react';

// ============================================================
// THE VERNACULAR ENGINE — Cross-Domain Translation Layer
// ============================================================
// The logic remains identical (Input -> Process -> Output).
// The Label Layer shifts based on user archetype.
//
// Setting A (Mythic):     "Toy / Weapon / Ritual"
// Setting B (Industrial): "R&D / Disruptor / SOP"
// ============================================================

export type VernacularMode = 'mythic' | 'industrial';

interface VernacularDictionary {
    // Phase names
    phase_armory: string;
    phase_scoring: string;
    phase_lock: string;
    phase_synthesis: string;
    phase_installation: string;

    // Tool categories (Quadrant labels)
    quadrant_sandbox: string;
    quadrant_mischief: string;
    quadrant_craft: string;
    quadrant_ritual: string;

    // Scoring dimensions
    score_unbidden: string;
    score_frictionless: string;
    score_evidence: string;
    score_extraction: string;

    // Scoring sublabels
    sublabel_unbidden: string;
    sublabel_frictionless: string;
    sublabel_evidence: string;
    sublabel_extraction: string;

    // System language
    tool_singular: string;
    tool_plural: string;
    starting_tool: string;
    locked_tool: string;
    theory_of_value: string;
    godfather_offer: string;
    fatal_wound: string;
    sacred_cow: string;
    molecular_bond: string;
    shadow_beliefs: string;

    // Actions
    action_forge: string;
    action_lock: string;
    action_scan: string;
    action_challenge: string;

    // Status
    status_pass: string;
    status_fail: string;
    status_risk: string;
    status_asset: string;
}

const MYTHIC: VernacularDictionary = {
    phase_armory: 'The Armory',
    phase_scoring: 'The Crucible',
    phase_lock: 'The Verdict',
    phase_synthesis: 'Value Chemistry',
    phase_installation: 'The Installation',

    quadrant_sandbox: 'Sandbox',
    quadrant_mischief: 'Mischief',
    quadrant_craft: 'Craft',
    quadrant_ritual: 'Ritual',

    score_unbidden: 'Unbidden Requests',
    score_frictionless: 'Frictionless Doing',
    score_evidence: 'Result Evidence',
    score_extraction: 'Extraction Risk',

    sublabel_unbidden: 'Do people seek you out for this without prompting?',
    sublabel_frictionless: 'Can you deliver in 30 mins with zero prep?',
    sublabel_evidence: 'Do you have Case Studies or Testimonials?',
    sublabel_extraction: 'If you stop, does it stop?',

    tool_singular: 'Weapon',
    tool_plural: 'Weapons',
    starting_tool: 'Starting Weapon',
    locked_tool: 'Locked Weapon',
    theory_of_value: 'Theory of Value',
    godfather_offer: 'Godfather Offer',
    fatal_wound: 'Fatal Wound',
    sacred_cow: 'Sacred Cow',
    molecular_bond: 'Molecular Bond',
    shadow_beliefs: 'Shadow Beliefs',

    action_forge: 'Forge',
    action_lock: 'Lock',
    action_scan: 'Radar Scan',
    action_challenge: 'Challenge',

    status_pass: 'SOVEREIGN',
    status_fail: 'REJECTED',
    status_risk: 'CONTAINMENT REQ',
    status_asset: 'SCALABLE ASSET',
};

const INDUSTRIAL: VernacularDictionary = {
    phase_armory: 'Asset Inventory',
    phase_scoring: 'Performance Audit',
    phase_lock: 'Selection Report',
    phase_synthesis: 'Market Analysis',
    phase_installation: 'Launch Protocol',

    quadrant_sandbox: 'R&D',
    quadrant_mischief: 'Disruptor',
    quadrant_craft: 'Core Process',
    quadrant_ritual: 'SOP',

    score_unbidden: 'Inbound Demand',
    score_frictionless: 'Execution Speed',
    score_evidence: 'ROI Evidence',
    score_extraction: 'Dependency Risk',

    sublabel_unbidden: 'How often do clients request this service unprompted?',
    sublabel_frictionless: 'Can you execute this deliverable in under 30 minutes?',
    sublabel_evidence: 'Do you have documented case studies or revenue metrics?',
    sublabel_extraction: 'Is this revenue tied to your personal availability?',

    tool_singular: 'Asset',
    tool_plural: 'Assets',
    starting_tool: 'Primary Asset',
    locked_tool: 'Selected Asset',
    theory_of_value: 'Value Proposition',
    godfather_offer: 'Premium Offer',
    fatal_wound: 'Core Problem',
    sacred_cow: 'Market Assumption',
    molecular_bond: 'Competitive Edge',
    shadow_beliefs: 'Market Friction Points',

    action_forge: 'Analyze',
    action_lock: 'Select',
    action_scan: 'Market Scan',
    action_challenge: 'Audit',

    status_pass: 'VALIDATED',
    status_fail: 'INSUFFICIENT DATA',
    status_risk: 'HIGH DEPENDENCY',
    status_asset: 'SCALABLE REVENUE',
};

const DICTIONARIES: Record<VernacularMode, VernacularDictionary> = {
    mythic: MYTHIC,
    industrial: INDUSTRIAL,
};

// ── React Context ──────────────────────────────────────────

interface VernacularContextType {
    mode: VernacularMode;
    setMode: (mode: VernacularMode) => void;
    v: VernacularDictionary;
}

const VernacularContext = createContext<VernacularContextType>({
    mode: 'mythic',
    setMode: () => { },
    v: MYTHIC,
});

export const VernacularProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<VernacularMode>('mythic');

    return (
        <VernacularContext.Provider value={{ mode, setMode, v: DICTIONARIES[mode] }}>
            {children}
        </VernacularContext.Provider>
    );
};

export const useVernacular = () => useContext(VernacularContext);

// ── Convenience Toggle Component ──────────────────────────

export const VernacularToggle: React.FC = () => {
    const { mode, setMode } = useVernacular();

    return (
        <div className="flex items-center gap-2 text-xs font-mono">
            <button
                onClick={() => setMode('mythic')}
                className={`px-3 py-1 border transition-all ${mode === 'mythic'
                        ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10'
                        : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
            >
                ⚔ MYTHIC
            </button>
            <button
                onClick={() => setMode('industrial')}
                className={`px-3 py-1 border transition-all ${mode === 'industrial'
                        ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10'
                        : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
            >
                ⚙ INDUSTRIAL
            </button>
        </div>
    );
};
