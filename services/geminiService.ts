import { GoogleGenAI, Type, Schema, Modality, LiveServerMessage } from "@google/genai";
import { AIAnalysisResult, ToolCandidate } from "../types";

const apiKey = process.env.API_KEY || '';
console.log('[DEBUG] API Key present:', !!apiKey, 'Length:', apiKey.length);
const ai = new GoogleGenAI({ apiKey });

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

        const source = inputAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);

        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmData = createPcmData(inputData);

          // Send audio chunk
          sessionPromise.then(session => {
            session.sendRealtimeInput({ media: pcmData });
          });
        };

        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
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
      model: 'gemini-3-flash-preview',
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

export const generatePilotProtocol = async (toolName: string, functionStatement: string): Promise<string> => {
  if (!apiKey) return "API Key Required for Protocol.";

  const prompt = `
      Create a 7-Day Pilot Protocol for "${toolName}" (${functionStatement}).
      Tone: Clinical, instructional.
      Format: Markdown.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Failed to generate protocol.";
  } catch (error) {
    return "Failed to generate protocol.";
  }
};
