export interface ModelConfig {
    id: string;
    temperature?: number;
    timeout?: number;
}

/**
 * Centralized AI Model Registry.
 * All model IDs live here. If Google deprecates an endpoint,
 * fix it in ONE file, not twenty.
 */
export const AI_MODELS = {
    // Text & Reasoning Models
    text: {
        primary: {
            id: 'gemini-2.5-flash-preview-05-20', // Current stable preview
            timeout: 15000
        },
        fallback: {
            id: 'gemini-2.0-flash', // Stable, fast, cheap
            timeout: 30000
        },
    },
    // Voice/Audio Models
    audio: {
        primary: {
            id: 'gemini-2.5-flash-preview-native-audio-dialog', // Native audio dialog
        },
        voiceName: 'Kore'
    },
    // TTS Model
    tts: {
        primary: {
            id: 'gemini-2.5-flash-preview-tts',
        }
    }
};

/**
 * Thinking budgets per function complexity.
 * Thinking is a CONFIG FLAG on the preview model, NOT a separate model.
 * Higher budgets = deeper reasoning = slower + more expensive.
 */
export const THINKING_BUDGETS = {
    classification: 1024,       // classifyActivity — simple axis mapping
    toolSynthesis: 16000,       // synthesizeToolDefinition — Prism Protocol reasoning
    sovereignSynthesis: 24000,  // synthesizeSovereignAuthority — multi-tool fusion
    theoryOfValue: 24000,       // generateTheoryOfValue — crown jewel
    mvaRadar: 16000,            // conductMvaRadar synthesis pass
    challengeScore: 8000,       // adversarial score validation
    starterDeck: 4096,          // generateStarterDeck — archetype-based suggestions
    pilotProtocol: 8000,        // generatePilotProtocol
};
