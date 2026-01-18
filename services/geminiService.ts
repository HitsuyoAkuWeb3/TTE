import { GoogleGenAI, Type, Schema, Modality, LiveServerMessage } from "@google/genai";
import { AIAnalysisResult, ToolCandidate, OperatorProfile, TheoryOfValue } from "../types";

const apiKey = process.env.API_KEY || '';
console.log('[DEBUG] API Key present:', !!apiKey, 'Length:', apiKey.length);
const ai = new GoogleGenAI({ apiKey });

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
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
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
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      },
      systemInstruction: "You are the TetraTool Senior Architect. Discuss the user's selected tool and challenge them on its viability. Be concise, direct, and slightly clinical."
    }
  });

  sessionPromise.then(s => currentSession = s);

  return sessionPromise;
}

// --- EXISTING FUNCTIONS (Unchanged logic, just keeping them here) ---

export const classifyActivity = async (verb: string): Promise<{ x: number, y: number }> => {
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    const data = JSON.parse(response.text || "{}");
    return { x: data.x || 0, y: data.y || 0 };
  } catch (e) {
    return { x: 0, y: 0 };
  }
}

export const synthesizeToolDefinition = async (verb: string, quadrant: string): Promise<AIAnalysisResult> => {
  if (!apiKey) {
    return {
      plainName: verb,
      functionStatement: `I do ${verb}`,
      promise: "I deliver results.",
      antiPitch: "I am not a generalist."
    };
  }

  const prompt = `
    You are the TetraTool Architect. The user is a multi-talented entrepreneur needing to niche down.
    
    INPUT SKILL: "${verb}"
    QUADRANT CONTEXT: ${quadrant}

    Your goal: Compress this skill into a specific "Market Function".
    1. PLAIN NAME: A brutal, non-jargon title (e.g., "The Fixer", "System Architect", "Deal Closer").
    2. FUNCTION STATEMENT: A clear sentence starting with "I produce value by..."
    3. PROMISE: The specific outcome for the client.
    4. ANTI-PITCH: What this is NOT. (e.g., "This is not coaching; it is surgery.")
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });

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
      scores: { unbiddenRequests: false, frictionlessDoing: false, resultEvidence: false, extractionRisk: false },
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        thinkingConfig: { thinkingBudget: 24000 }
      }
    });

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
      scores: { unbiddenRequests: false, frictionlessDoing: false, resultEvidence: false, extractionRisk: false },
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
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
      model: "gemini-2.5-flash-preview-tts",
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
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
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const evidence = searchResponse.text || "No direct forum evidence found. Proceeding with architectural extrapolation.";
    console.log("[RADAR] Evidence collected, synthesizing forensic report...");

    // Stage 2: Synthesis & JSON Structuring (No Search Tool)
    const synthesisResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
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
    });

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
  profile?: OperatorProfile
): Promise<TheoryOfValue> => {
  if (!apiKey) throw new Error("API Key required for ToV Synthesis");

  const prompt = `
    You are a Sovereign Architect. 
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

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
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
      } as Schema
    }
  });

  const result = JSON.parse(response.text || "{}");
  console.log("[TOV] Synthesis complete:", result.godfatherOffer.name);
  return result;
};
