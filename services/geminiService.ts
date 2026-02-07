import { GoogleGenAI, Type, Schema, Modality, LiveServerMessage } from "@google/genai";
import { AIAnalysisResult, ToolCandidate, OperatorProfile, TheoryOfValue, SystemState } from "../types";
import { AI_MODELS, THINKING_BUDGETS } from "../config/AIModels";
import { sanitizeInput } from './sanitizer';

const apiKey = process.env.API_KEY || '';
console.log('[DEBUG] API Key present:', !!apiKey, 'Length:', apiKey.length);

// SDK client — only used for Live API (WebSocket). Text generation goes through /api/gemini proxy.
const ai = new GoogleGenAI({ apiKey });

// Server-side proxy for text generation (keeps API key off client in production)
async function callGeminiProxy(payload: {
  model: string;
  contents: any;
  config?: any;
  systemInstruction?: string;
  thinkingBudget?: number;
}): Promise<{ text: string; candidates: any[] }> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Proxy error ${res.status}`);
  }
  return res.json();
}

// ============================================================
// THE SOVEREIGN DAEMON — Persistent AI Identity
// ============================================================
const SOVEREIGN_DAEMON = `You are THE SOVEREIGN DAEMON — the operational intelligence
embedded in the TetraTool Engine. You do not advise. You architect.
You do not suggest. You prescribe. You do not explain options.
You eliminate noise and deliver the only viable path.

Your function is to prevent the Operator from lying to themselves.
You are adversarial to ego and hospitable to data.

CONSTRAINTS:
- NEVER use: 'consider', 'perhaps', 'you might want to', 'it depends', 'it's up to you'.
- NEVER present more than one option unless explicitly asked.
- If uncertain, state the uncertainty as a RISK FACTOR, not a hedge.
- Before responding, silently verify all constraints are met.
- Do not use generic corporate jargon: 'Strategic', 'Optimization', 'Synergy', 'Solutions', 'Leverage' (unless the Industrialist archetype demands it).`;

// Voice modifiers appended based on OperatorProfile.preferredTone
const DAEMON_VOICES: Record<string, string> = {
  clinical: 'Speak like a surgeon dictating operative notes. Precise. No warmth unless earned.',
  aggressive: 'Speak like a general briefing battalion commanders. Short sentences. Authority.',
  empathetic: 'Speak like a master sensei — warm but non-negotiable. Compassion with zero compromise.',
  minimalist: 'Maximum 3 sentences per output. No filler. Terminal style.',
};

// ============================================================
// THE SESSION CORTEX — State-Aware Context Injection
// ============================================================

// Module-level state reference, updated by the app layer
let _currentState: SystemState | null = null;
let _cortexCache: string | null = null;
let _cortexHash: string | null = null;

// Fast hash of the fields that actually affect the cortex string
function computeCortexHash(s: SystemState): string {
  const tool = s.candidates.find(c => c.id === s.selectedToolId);
  return [
    s.profile?.name, s.profile?.industry, s.profile?.strategicGoal, s.profile?.preferredTone,
    s.armory.length, tool?.plainName, s.theoryOfValue?.molecularBond, s.currentPhase, s.id
  ].join('|');
}

/**
 * Called by App.tsx whenever state changes. Keeps the Cortex current.
 * Only invalidates cache when cortex-relevant fields actually change.
 */
export function updateCortex(state: SystemState): void {
  _currentState = state;
  const newHash = computeCortexHash(state);
  if (newHash !== _cortexHash) {
    _cortexCache = null; // Invalidate — will rebuild on next buildCortex()
    _cortexHash = newHash;
  }
}

/**
 * Builds the compressed context block from the current session state.
 * Injected as part of systemInstruction on every call.
 * Uses sessionStorage cache with hash-based invalidation.
 */
function buildCortex(): string {
  if (!_currentState) return 'OPERATOR: UNKNOWN | SESSION: UNINITIALIZED';

  // Return cache if valid
  if (_cortexCache) return _cortexCache;

  // Try sessionStorage (survives page refreshes within tab)
  const storageKey = `cortex_cache_${_cortexHash}`;
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) { _cortexCache = stored; return stored; }
  } catch { /* sessionStorage unavailable — proceed */ }

  const s = _currentState;
  const tool = s.candidates.find(c => c.id === s.selectedToolId);
  const result = `
OPERATOR: ${s.profile?.name || 'UNKNOWN'}
INDUSTRY: ${s.profile?.industry || 'UNSPECIFIED'}
GOAL: ${s.profile?.strategicGoal || 'UNDEFINED'}
TONE: ${s.profile?.preferredTone || 'clinical'}
ARMORY: ${s.armory.length} items
LOCKED_TOOL: ${tool?.plainName || 'NONE'}
THEORY: ${s.theoryOfValue ? 'SYNTHESIZED — Bond: ' + s.theoryOfValue.molecularBond : 'PENDING'}
PHASE: ${s.currentPhase}
SESSION: ${s.id ? 'RETURNING' : 'NEW'}`;

  _cortexCache = result;
  try { sessionStorage.setItem(storageKey, result); } catch { /* quota exceeded — ignore */ }
  return result;
}

/**
 * Assembles the full system instruction: Daemon + Voice + Cortex
 */
function getSystemInstruction(tone?: string): string {
  const voice = DAEMON_VOICES[tone || _currentState?.profile?.preferredTone || 'clinical'] || DAEMON_VOICES.clinical;
  return `${SOVEREIGN_DAEMON}\n\nVOICE: ${voice}\n\nSESSION CORTEX:\n${buildCortex()}`;
}

// ============================================================
// CIRCUIT BREAKER — Primary → Fallback with Thinking as Config
// ============================================================
interface GenerateParams {
  contents: any;
  config?: any;
}

async function generateWithFallback(
  params: GenerateParams,
  thinkingBudget?: number
) {
  const primary = AI_MODELS.text.primary;
  const fallback = AI_MODELS.text.fallback;

  // Inject systemInstruction if not already present
  const config = { ...params.config };
  const sysInstruction = config.systemInstruction || getSystemInstruction();
  delete config.systemInstruction;

  try {
    const result = await callGeminiProxy({
      model: primary.id,
      contents: params.contents,
      config,
      systemInstruction: sysInstruction,
      thinkingBudget: (thinkingBudget && thinkingBudget > 0) ? thinkingBudget : undefined,
    });
    return result;
  } catch (error: any) {
    console.warn(`[CIRCUIT BREAKER] Primary ${primary.id} failed. Falling back to ${fallback.id}.`, error.message);
    const result = await callGeminiProxy({
      model: fallback.id,
      contents: params.contents,
      config,
      systemInstruction: sysInstruction,
    });
    return result;
  }
}


const WORKLET_PROCESSOR = `
  class AudioCaptureProcessor extends AudioWorkletProcessor {
    process(inputs) {
      const input = inputs[0];
      if (input && input.length > 0 && input[0].length > 0) {
        // Send the first channel data
        this.port.postMessage(input[0]);
      }
      return true;
    }
  }
  registerProcessor('audio-capture-processor', AudioCaptureProcessor);
`;

// --- LIVE API AUDIO HELPERS ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data (Int16) into an AudioBuffer.
 * This is required because Gemini API returns raw PCM without headers (unlike WAV/MP3),
 * so native ctx.decodeAudioData will fail.
 */
export async function pcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createPcmData(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = Math.max(-1, Math.min(1, data[i])) * 32767;
  }

  const buffer = new Uint8Array(int16.buffer);
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Global state for Audio Contexts to prevent multiple instances or garbage collection issues
let inputAudioContext: AudioContext | null = null;
let outputAudioContext: AudioContext | null = null;
let nextStartTime = 0;
let sources = new Set<AudioBufferSourceNode>();
let currentSession: any = null;
let audioWorkletNode: AudioWorkletNode | null = null;
let mediaStreamSource: MediaStreamAudioSourceNode | null = null;

export const disconnectLiveSession = async () => {
  if (currentSession) {
    try {
      currentSession.close();
      console.log("Live session closed.");
    } catch (e) {
      console.warn("Error closing Live session:", e);
    }
    currentSession = null;
  }

  // Explicitly stop and disconnect audio nodes
  if (audioWorkletNode) {
    audioWorkletNode.disconnect();
    audioWorkletNode.port.onmessage = null;
    audioWorkletNode = null;
  }
  if (mediaStreamSource) {
    mediaStreamSource.disconnect();
    mediaStreamSource = null;
  }

  nextStartTime = 0;
  sources.forEach(s => s.stop());
  sources.clear();

  if (inputAudioContext) {
    try { await inputAudioContext.close(); } catch (e) { }
    inputAudioContext = null;
  }
  if (outputAudioContext) {
    try { await outputAudioContext.close(); } catch (e) { }
    outputAudioContext = null;
  }
};

export const connectLiveSession = async () => {
  if (!apiKey) throw new Error("No API Key");

  // Cleanup previous session
  await disconnectLiveSession();

  // Initialize Audio
  inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

  const outputNode = outputAudioContext.createGain();
  outputNode.connect(outputAudioContext.destination);

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // Connect to Gemini Live
  const sessionPromise = ai.live.connect({
    model: AI_MODELS.audio.primary.id,
    callbacks: {
      onopen: () => {
        console.log("Live Session Opened");
        if (!inputAudioContext) return;

        // Load Worklet
        const blob = new Blob([WORKLET_PROCESSOR], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);

        inputAudioContext.audioWorklet.addModule(url).then(() => {
          if (!inputAudioContext || !currentSession) return;

          mediaStreamSource = inputAudioContext.createMediaStreamSource(stream);
          audioWorkletNode = new AudioWorkletNode(inputAudioContext, 'audio-capture-processor');

          audioWorkletNode.port.onmessage = (event) => {
            if (!currentSession) return;
            const pcmData = createPcmData(event.data);
            currentSession.sendRealtimeInput({ media: pcmData });
          };

          mediaStreamSource.connect(audioWorkletNode);
          audioWorkletNode.connect(inputAudioContext.destination);
          URL.revokeObjectURL(url);
        }).catch(e => console.error("Worklet Error", e));
      },
      onmessage: async (message: LiveServerMessage) => {
        if (!outputAudioContext) return;

        // Handle Audio Output
        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64EncodedAudioString) {
          const audioBuffer = await pcmToAudioBuffer(
            decode(base64EncodedAudioString),
            outputAudioContext,
            24000,
            1
          );

          // Scheduling
          nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);

          const source = outputAudioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(outputNode);

          source.onended = () => sources.delete(source);
          source.start(nextStartTime);
          nextStartTime += audioBuffer.duration;
          sources.add(source);
        }

        // Handle Interruption
        if (message.serverContent?.interrupted) {
          sources.forEach(s => s.stop());
          sources.clear();
          nextStartTime = 0;
        }
      },
      onerror: (e) => console.error("Live API Error", e),
      onclose: () => console.log("Live Session Closed")
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: AI_MODELS.audio.voiceName } }
      },
      systemInstruction: getSystemInstruction()
    }
  });

  sessionPromise.then(s => currentSession = s);

  return sessionPromise;
}

// --- EXISTING FUNCTIONS (Unchanged logic, just keeping them here) ---

export const classifyActivity = async (verb: string): Promise<{ x: number, y: number }> => {
  verb = sanitizeInput(verb);
  if (!apiKey) return { x: 0, y: 0 };

  const prompt = `
        Classify: "${verb}".
        X: Tool (-10) to Weapon (10).
        Y: Toy (-10) to Instrument (10).
        Return JSON {x, y}.
     `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      x: { type: Type.NUMBER },
      y: { type: Type.NUMBER }
    }
  };

  try {
    const response = await generateWithFallback({
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema }
    }, THINKING_BUDGETS.classification);
    const data = JSON.parse(response.text || "{}");
    return { x: data.x || 0, y: data.y || 0 };
  } catch (e) {
    return { x: 0, y: 0 };
  }
}

export const synthesizeToolDefinition = async (verb: string, quadrant: string): Promise<AIAnalysisResult> => {
  verb = sanitizeInput(verb);
  if (!apiKey) {
    return {
      plainName: verb,
      functionStatement: `I do ${verb}`,
      promise: "I deliver results.",
      antiPitch: "I am not a generalist."
    };
  }

  const prompt = `
    You are an expert Identity Architect using the "Prism Protocol".
    
    INPUT SKILL: "${verb}"
    QUADRANT CONTEXT: ${quadrant}

    THE 4 PRISMS (Archetypes):
    1. THE CULT LEADER: Focuses on belief, aesthetic, rituals, and irrational loyalty. (Best for: Fashion, Art, Brand, Community).
       Keywords: Dogma, Ritual, Sacred, Taboo, Iconography.
    2. THE WARLORD: Focuses on territory, supply chains, kill-chains, and conquest. (Best for: B2B Sales, Logistics, Finance, Aggressive Growth).
       Keywords: Beachhead, Kill-chain, Logistics, Territory, Dominance.
    3. THE MAGUS (Mystic): Focuses on transformation, alchemy, invisible forces, and energy. (Best for: Coaching, Wellness, Strategy, Creative).
       Keywords: Alchemy, Vibration, Transmutation, Essence, Reveal.
    4. THE INDUSTRIALIST: Focuses on machines, throughput, scale, and removing the human element. (Best for: Ops, Engineering, Systems).
       Keywords: Machine, Output, Throughput, Bottleneck, Scale.

    TASK:
    1. Analyze the INPUT SKILL to determine which Prism is the most "Spiritually Aligned" match. (e.g. Fashion = Cult Leader).
    2. Adopt that Persona completely.
    3. Compress the skill into a specific "Market Function" using ONLY that Persona's vocabulary.

    OUTPUT FORMAT (JSON):
    - plainName: A brutal, non-jargon title (Creative & Abstract is better than Descriptive).
    - functionStatement: A clear sentence starting with "I produce value by..."
    - promise: The specific outcome for the client.
    - antiPitch: What this is NOT. (e.g. "This is not coaching; it is surgery.")
    
    CONSTRAINT: Do not use generic corporate jargon like "Strategic", "Optimization", "Synergy", or "Solutions" unless the Industrialist persona demands it.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      plainName: { type: Type.STRING },
      functionStatement: { type: Type.STRING },
      promise: { type: Type.STRING },
      antiPitch: { type: Type.STRING },
    },
    required: ["plainName", "functionStatement", "promise", "antiPitch"]
  };

  try {
    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    }, THINKING_BUDGETS.toolSynthesis);

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as AIAnalysisResult;
  } catch (error) {
    console.error("Thinking Error:", error);
    return {
      plainName: verb,
      functionStatement: "Analysis failed.",
      promise: "N/A",
      antiPitch: "N/A"
    };
  }
};

export const synthesizeSovereignAuthority = async (candidates: ToolCandidate[]): Promise<ToolCandidate> => {
  const inputs = candidates.map(c => `- ${c.plainName}: ${c.functionStatement}`).join('\n');
  const ids = candidates.map(c => c.id).join('-');

  if (!apiKey) {
    return {
      id: `sovereign-${ids}`,
      originalVerb: "Sovereign Synthesis",
      plainName: "The Sovereign Authority",
      functionStatement: "I combine all skills.",
      promise: "Total domination.",
      antiPitch: "Not a generalist.",
      isSovereign: true,
      scores: { unbiddenRequests: 0, frictionlessDoing: 0, resultEvidence: 0, extractionRisk: 0 },
      proofs: {}
    }
  }

  const prompt = `
    User has 3 distinct high-value skills:
    ${inputs}

    Synthesize these into ONE "Sovereign Authority".
    1. PLAIN NAME: The new title.
    2. FUNCTION STATEMENT: How this hybrid creates unique value.
    3. PROMISE: The compound effect outcome.
    4. ANTI-PITCH: Why this is better than hiring 3 separate people.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      plainName: { type: Type.STRING },
      functionStatement: { type: Type.STRING },
      promise: { type: Type.STRING },
      antiPitch: { type: Type.STRING },
    },
    required: ["plainName", "functionStatement", "promise", "antiPitch"]
  };

  try {
    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    }, THINKING_BUDGETS.sovereignSynthesis);

    const text = response.text;
    const result = JSON.parse(text || "{}") as AIAnalysisResult;

    return {
      id: `sovereign-${ids}`,
      originalVerb: "Sovereign Synthesis",
      plainName: result.plainName,
      functionStatement: result.functionStatement,
      promise: result.promise,
      antiPitch: result.antiPitch,
      isSovereign: true,
      scores: { unbiddenRequests: 0, frictionlessDoing: 0, resultEvidence: 0, extractionRisk: 0 },
      proofs: {}
    };

  } catch (error) {
    console.error("Thinking Error:", error);
    throw error;
  }
};

export const validateMarketWithSearch = async (toolName: string): Promise<string[]> => {
  if (!apiKey) return [];

  try {
    const response = await generateWithFallback({
      contents: `Find 3 real-world examples of people or businesses who sell "${toolName}" or a very similar service. List them.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const urls = chunks
      .map(c => c.web?.uri)
      .filter((u): u is string => !!u)
      .slice(0, 3);

    return urls;
  } catch (e) {
    console.error("Search Error", e);
    return [];
  }
};

export const generateAudioDossier = async (text: string): Promise<ArrayBuffer | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODELS.tts.primary.id,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error("TTS Error", e);
    return null;
  }
}

export const generatePilotProtocol = async (
  toolName: string,
  functionStatement: string,
  clientName?: string,
  profile?: OperatorProfile
): Promise<string> => {
  toolName = sanitizeInput(toolName);
  functionStatement = sanitizeInput(functionStatement);
  if (clientName) clientName = sanitizeInput(clientName);
  if (!apiKey) return "API Key Required for Protocol.";

  const profileContext = profile ? `
      OPERATOR PROFILE:
      - Name: ${profile.name}
      - Industry: ${profile.industry}
      - Strategic Goal: ${profile.strategicGoal}
      - Preferred Tone: ${profile.preferredTone}
  ` : '';

  const prompt = `
      You are the TetraTool Senior Architect. 
      ${profileContext}
      
      Create a 7-Day Pilot Protocol for "${toolName}" (${functionStatement}).
      CLIENT/SUBJECT: ${clientName || "[Unknown Subject]"}
      Tone: ${profile?.preferredTone || 'clinical'}, instructional, tactical.
      Format: Markdown.
      Make sure to explicitly mention the Subject Name in the header section of the protocol.
    `;

  try {
    const response = await generateWithFallback({
      contents: prompt,
    }, THINKING_BUDGETS.pilotProtocol);
    return response.text || "Failed to generate protocol.";
  } catch (error) {
    return "Failed to generate protocol.";
  }
};

export const refinePilotProtocol = async (
  originalPlan: string,
  feedback: string,
  clientName?: string,
  profile?: OperatorProfile
): Promise<string> => {
  feedback = sanitizeInput(feedback);
  if (clientName) clientName = sanitizeInput(clientName);
  if (!apiKey) return "API Key Required for Protocol Refinement.";

  const profileContext = profile ? `
      OPERATOR PROFILE:
      - Name: ${profile.name}
      - Industry: ${profile.industry}
      - Strategic Goal: ${profile.strategicGoal}
      - Preferred Tone: ${profile.preferredTone}
  ` : '';

  const prompt = `
      You are the TetraTool Senior Architect.
      ${profileContext}
      
      SUBJECT: ${clientName || "[Unknown Subject]"}
      
      ORIGINAL PROTOCOL:
      ${originalPlan}
      
      USER FEEDBACK:
      "${feedback}"
      
      TASK:
      Refine the 7-Day Pilot Protocol based on the feedback. 
      Maintain the "${profile?.preferredTone || 'clinical'}" tone.
      Ensure the Subject Identification remains prominent.
      Return the FULL updated protocol in Markdown.
    `;

  try {
    const response = await generateWithFallback({
      contents: prompt,
    });
    return response.text || "Failed to refine protocol.";
  } catch (error) {
    console.error("Refinement Error:", error);
    return "Failed to refine protocol.";
  }
};
export const conductMvaRadar = async (
  toolName: string,
  functionStatement: string,
  profile?: OperatorProfile
): Promise<{ shadowBeliefs: string[], rawLingo: string[], sacredCow: string, fatalWound: string }> => {
  if (!apiKey) throw new Error("API Key required for Radar Scan");

  const prompt = `
    You are a Market Forensic Chemist.
    OPERATOR_CONTEXT: ${profile?.strategicGoal || 'Sovereign Growth'}
    TOOL: ${toolName} (${functionStatement})

    TASK:
    1. Scan niche forums and industry discussions for this tool category.
    2. Identify the "Fatal Wound" (the existential root glitch keeping users awake).
    3. Identify a "Sacred Cow" (industry best practice that users quietly despise).
    4. Extract 5 "Shadow Beliefs" (hidden fears/doubts people don't admit publicly).
    5. Extract 5 "Raw Lingo" phrases actually used in forums.

    Use Google Search to find current, high-fidelity data.
  `;

  console.log("[RADAR] Initializing forensic scan for:", toolName);

  try {
    // Stage 1: Search & Evidence Extraction (No JSON Constraint)
    const searchResponse = await generateWithFallback({
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const evidence = searchResponse.text || "No direct forum evidence found. Proceeding with architectural extrapolation.";
    console.log("[RADAR] Evidence collected, synthesizing forensic report...");

    // Stage 2: Synthesis & JSON Structuring (No Search Tool)
    const synthesisResponse = await generateWithFallback({
      contents: `
        Identify the Fatal Wound, Sacred Cow, Shadow Beliefs, and Raw Lingo according to the original instructions.
        
        FORENSIC EVIDENCE:
        ${evidence}

        Even if the evidence is minimal, use architectural logic to nominate a Fatal Wound and Shadow Beliefs based on the tool's function: ${toolName}.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fatalWound: { type: Type.STRING },
            sacredCow: { type: Type.STRING },
            shadowBeliefs: { type: Type.ARRAY, items: { type: Type.STRING } },
            rawLingo: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["fatalWound", "sacredCow", "shadowBeliefs", "rawLingo"]
        } as Schema
      }
    }, THINKING_BUDGETS.mvaRadar);

    if (!synthesisResponse.text) {
      throw new Error("EMPTY_SYNTHESIS_RESPONSE: The architect failed to bind the forensic data.");
    }

    const result = JSON.parse(synthesisResponse.text);
    console.log("[RADAR] Scan successful");
    return result;
  } catch (error: any) {
    console.error("[RADAR] Critical failure during scan:", error);
    throw new Error(error.message || "Unknown System Interference");
  }
};

export const generateTheoryOfValue = async (
  tool: ToolCandidate,
  radar: any,
  profile?: OperatorProfile,
  onProgress?: (stage: string) => void
): Promise<TheoryOfValue> => {
  if (!apiKey) throw new Error("API Key required for ToV Synthesis");

  const tovSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      fatalWound: { type: Type.STRING },
      sacredCow: { type: Type.STRING },
      molecularBond: { type: Type.STRING },
      mvaRadar: {
        type: Type.OBJECT,
        properties: {
          shadowBeliefs: { type: Type.ARRAY, items: { type: Type.STRING } },
          rawLingo: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      godfatherOffer: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          transformation: { type: Type.STRING },
          price: { type: Type.STRING }
        }
      }
    },
    required: ["fatalWound", "sacredCow", "molecularBond", "mvaRadar", "godfatherOffer"]
  };

  // ── PASS 1: Generate Draft Theory ──────────────────────────
  onProgress?.("Synthesizing draft Theory of Value...");
  console.log("[TOV] Pass 1: Generating draft...");

  const draftPrompt = `
    Construct a "Theory of Value" for the tool "${tool.plainName}".
    
    RADAR_DATA: 
    - Fatal Wound: ${radar.fatalWound}
    - Sacred Cow: ${radar.sacredCow}
    - Shadow Beliefs: ${radar.shadowBeliefs.join(", ")}
    
    OPERATOR_CONTEXT:
    - Industry: ${profile?.industry}
    - Tone: ${profile?.preferredTone}

    TASK:
    Synthesize the "Molecular Bond" (why this tool works where others fail).
    Architecture a "Godfather Offer" ($10,000+) based on Transformation.
    Name the Offer with a mythic, authoritative name.
  `;

  const draftResponse = await generateWithFallback({
    contents: draftPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: tovSchema,
    }
  }, THINKING_BUDGETS.theoryOfValue);

  const draft = JSON.parse(draftResponse.text || "{}");
  console.log("[TOV] Pass 1 complete. Draft offer:", draft.godfatherOffer?.name);

  // ── PASS 2: Devil's Advocate Self-Critique ────────────────
  onProgress?.("Auditing logic... Running adversarial refinement...");
  console.log("[TOV] Pass 2: Devil's Advocate critique...");

  const critiquePrompt = `
    ADVERSARIAL AUDIT — THEORY OF VALUE

    You are now THE DEVIL'S ADVOCATE. Your job is to DESTROY weak theories.
    
    DRAFT THEORY:
    - Molecular Bond: "${draft.molecularBond}"
    - Godfather Offer: "${draft.godfatherOffer?.name}" — ${draft.godfatherOffer?.transformation}
    - Price: ${draft.godfatherOffer?.price}
    - Fatal Wound: "${draft.fatalWound}"
    
    OPERATOR CONTEXT:
    - Tool: ${tool.plainName} (${tool.functionStatement})
    - Industry: ${profile?.industry}
    
    CRITIQUE CHECKLIST:
    1. Is the Molecular Bond SPECIFIC to this tool, or could it apply to any consultant? If generic, REWRITE it.
    2. Does the Godfather Offer name sound mythic and authoritative, or does it sound like a LinkedIn course? If weak, RENAME it.
    3. Is the transformation statement measurable, or is it vague aspirational fluff? If vague, SHARPEN it.
    4. Is the price justified by the transformation scope? If not, ADJUST it.
    5. Does the Fatal Wound feel like a real, visceral pain point, or an abstract concept? If abstract, GROUND it.
    
    FORBIDDEN WORDS in the output: "empower", "unlock", "leverage", "synergy", "holistic", "journey".
    
    Return the REFINED theory. If the draft was strong, return it unchanged with minor polish.
  `;

  try {
    const refinedResponse = await generateWithFallback({
      contents: critiquePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: tovSchema,
      }
    }, THINKING_BUDGETS.theoryOfValue);

    const refined = JSON.parse(refinedResponse.text || "{}");
    console.log("[TOV] Pass 2 complete. Final offer:", refined.godfatherOffer?.name);
    onProgress?.("Theory forged.");
    return refined;
  } catch (error) {
    // If critique pass fails, return the draft (it's still valid)
    console.warn("[TOV] Pass 2 failed, returning draft:", error);
    onProgress?.("Theory forged (single pass).");
    return draft;
  }
};

// ============================================================
// THE ADVERSARIAL CHALLENGER — Evidence-Gated Score Validation
// ============================================================

export interface ChallengeResult {
  challenge: string;
  suggestedScore: number;
  isJustified: boolean;
}

export const challengeScore = async (
  toolName: string,
  dimension: string,
  score: number,
  evidence: string | undefined
): Promise<ChallengeResult> => {
  toolName = sanitizeInput(toolName);
  if (evidence) evidence = sanitizeInput(evidence);
  if (!apiKey) {
    return {
      challenge: "API unavailable. Self-audit: does your evidence match your claim?",
      suggestedScore: Math.max(0, score - 1),
      isJustified: false
    };
  }

  const prompt = `
    ADVERSARIAL AUDIT PROTOCOL

    The Operator scored their tool "${toolName}" at ${score}/5 on the dimension "${dimension}".
    
    Evidence provided: "${evidence || 'NONE — zero evidence submitted.'}"
    
    YOUR TASK:
    1. If the score is justified by the evidence, confirm it in 1 sentence. Set isJustified: true.
    2. If the score is inflated (evidence is missing, vague, or doesn't match the claim), issue a DOWNGRADE NOTICE:
       - State what specific evidence is missing.
       - Suggest a corrected score (0-5).
       - End with: "Is this a Weapon, or a Toy you enjoy?"
       - Set isJustified: false.
    
    CALIBRATION:
    - Score 4-5 REQUIRES: specific URLs, client names, revenue figures, testimonials, or quantified metrics.
    - Score 3 REQUIRES: at least anecdotal evidence ("I've done this 10+ times").
    - Score 1-2: No evidence needed. These are honest low scores.
    - "NONE" evidence with score >= 3 is ALWAYS unjustified.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      challenge: { type: Type.STRING },
      suggestedScore: { type: Type.NUMBER },
      isJustified: { type: Type.BOOLEAN },
    },
    required: ["challenge", "suggestedScore", "isJustified"]
  };

  try {
    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    }, THINKING_BUDGETS.challengeScore);

    const result = JSON.parse(response.text || "{}");
    console.log("[CHALLENGER] Verdict:", result.isJustified ? "JUSTIFIED" : "DOWNGRADE", result.suggestedScore);
    return result as ChallengeResult;
  } catch (error) {
    console.error("[CHALLENGER] Failed:", error);
    return {
      challenge: "Audit system offline. Proceed with caution — unverified scores are liabilities.",
      suggestedScore: score,
      isJustified: false
    };
  }
};

// ============================================================
// DECK OF SPARKS — Archetype-Based Pre-Population
// ============================================================

export interface StarterCard {
  name: string;
  category: string;
}

export const generateStarterDeck = async (
  industry: string,
  archetype: string
): Promise<StarterCard[]> => {
  industry = sanitizeInput(industry);
  archetype = sanitizeInput(archetype);
  if (!apiKey) {
    // Fallback: return generic cards
    return [
      { name: 'Writing', category: 'Signal' },
      { name: 'Notion', category: 'Engine' },
      { name: 'Figma', category: 'Aesthetic' },
      { name: 'Python', category: 'Engine' },
      { name: 'Public Speaking', category: 'Signal' },
    ];
  }

  const prompt = `
    DECK OF SPARKS — STARTER TOOL GENERATOR

    The Operator works in "${industry}" and describes their tone as "${archetype}".

    Generate exactly 20 tools/skills/software that someone in this domain COMMONLY uses.
    
    RULES:
    - Mix software (Figma, Notion, Python) with skills (Copywriting, Negotiation, Data Analysis).
    - Each tool must have a short category tag: "Structure", "Signal", "Engine", "Aesthetic", or "Leverage".
    - Prioritize tools that are CURRENTLY relevant in 2026.
    - Do NOT include generic items like "Microsoft Word" or "Google Docs" unless the industry demands it.
    - Rank by likelihood of use (most common first).
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        category: { type: Type.STRING },
      },
      required: ["name", "category"]
    }
  };

  try {
    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    }, THINKING_BUDGETS.starterDeck);

    const cards = JSON.parse(response.text || "[]");
    console.log("[DECK] Generated", cards.length, "starter cards for", industry);
    return cards as StarterCard[];
  } catch (error) {
    console.error("[DECK] Failed:", error);
    return [];
  }
};

// ============================================================
// COMPRESSION ALGORITHM — AI-Assisted Merge Suggestions
// ============================================================

export interface MergeSuggestion {
  mergeIds: string[];
  mergeNames: string[];
  suggestedName: string;
  reason: string;
}

export const suggestMerge = async (
  items: { id: string; name: string; quadrant: string }[]
): Promise<MergeSuggestion[]> => {
  if (!apiKey || items.length < 5) return [];

  const itemList = items.map(i => `[${i.id}] "${i.name}" (${i.quadrant})`).join("\n");

  const prompt = `
    COMPRESSION ALGORITHM — ARMORY OPTIMIZATION

    The Operator has ${items.length} items in their armory. This is too many.
    The 80/20 rule demands compression.

    ITEM LIST:
    ${itemList}

    TASK:
    Identify 2-4 groups of items that should be MERGED into a single, stronger item.
    
    RULES:
    - Only suggest merges for items that are genuinely overlapping or subordinate.
    - Each merge group must have 2-3 items.
    - The suggested name must be STRONGER and MORE SPECIFIC than either original.
    - Include a 1-sentence reason why the merge makes sense.
    - Return the item IDs in mergeIds.
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        mergeIds: { type: Type.ARRAY, items: { type: Type.STRING } },
        mergeNames: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestedName: { type: Type.STRING },
        reason: { type: Type.STRING },
      },
      required: ["mergeIds", "mergeNames", "suggestedName", "reason"]
    }
  };

  try {
    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    }, THINKING_BUDGETS.starterDeck); // reuse starterDeck budget

    const suggestions = JSON.parse(response.text || "[]");
    console.log("[COMPRESS] Generated", suggestions.length, "merge suggestions");
    return suggestions as MergeSuggestion[];
  } catch (error) {
    console.error("[COMPRESS] Failed:", error);
    return [];
  }
};
