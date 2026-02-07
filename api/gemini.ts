import type { VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { withAuth, type AuthedRequest } from './middleware/auth';

// ============================================================
// GEMINI PROXY — Server-Side API Route
// ============================================================
// All Gemini SDK calls are proxied through this route.
// The API key never reaches the client bundle.
// 
// POST /api/gemini
// Body: { model, contents, config, systemInstruction, thinkingBudget? }
// Returns: { text, candidates }
// ============================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default withAuth(async (req: AuthedRequest, res: VercelResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    try {
        const { model, contents, config, systemInstruction, thinkingBudget } = req.body;

        if (!model || !contents) {
            return res.status(400).json({ error: 'Missing required fields: model, contents' });
        }

        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        // Build the generation config
        const generateConfig: any = {
            ...config,
        };

        // Add thinking budget if specified (for thinking models)
        if (thinkingBudget && model.includes('thinking')) {
            generateConfig.thinkingConfig = { thinkingBudget };
        }

        const response = await ai.models.generateContent({
            model,
            contents,
            config: {
                ...generateConfig,
                systemInstruction: systemInstruction || undefined,
            },
        });

        return res.status(200).json({
            text: response.text || '',
            candidates: response.candidates || [],
        });
    } catch (error: any) {
        console.error('[Gemini Proxy Error]', error.message);

        // If primary model fails, return error with fallback hint
        return res.status(502).json({
            error: 'Gemini API call failed',
            message: error.message,
            shouldFallback: true,
        });
    }
});
