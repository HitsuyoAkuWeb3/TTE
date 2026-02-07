import type { VercelRequest, VercelResponse } from '@vercel/node';

// ============================================================
// URL EVIDENCE VERIFICATION — Server-Side Fetch + Analysis
// ============================================================
// Fetches a URL server-side (avoiding CORS) and checks if
// the page content supports the claimed evidence.

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url, claim } = req.body;
    if (!url || !claim) {
        return res.status(400).json({ error: 'Missing url or claim' });
    }

    try {
        // Fetch the URL server-side (bypasses CORS)
        const pageResponse = await fetch(url, {
            headers: { 'User-Agent': 'TTE-Evidence-Verifier/1.0' },
            signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!pageResponse.ok) {
            return res.status(200).json({
                verified: false,
                confidence: 0,
                reason: `URL returned ${pageResponse.status}`,
            });
        }

        const html = await pageResponse.text();
        // Extract meaningful text (strip HTML tags)
        const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000); // Cap at 5000 chars for LLM

        if (!textContent || textContent.length < 50) {
            return res.status(200).json({
                verified: false,
                confidence: 0,
                reason: 'Page content too short or empty',
            });
        }

        // Use Gemini to analyze if the page content supports the claim
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(200).json({
                verified: false,
                confidence: 0,
                reason: 'GEMINI_API_KEY not configured for verification',
            });
        }

        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        const verifyResponse = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{
                role: 'user',
                parts: [{
                    text: `You are a forensic evidence verifier. Analyze if the following web page content supports the claimed evidence.

CLAIMED EVIDENCE: "${claim}"

WEB PAGE CONTENT (extracted text):
${textContent}

Respond in JSON only:
{
  "verified": true/false,
  "confidence": 0-100,
  "reason": "one sentence explanation"
}`
                }]
            }],
            config: {
                responseMimeType: 'application/json',
            },
        });

        const analysis = JSON.parse(verifyResponse.text || '{}');
        return res.status(200).json({
            verified: analysis.verified || false,
            confidence: analysis.confidence || 0,
            reason: analysis.reason || 'Unable to determine',
        });
    } catch (error: any) {
        console.error('[Evidence Verify Error]', error.message);
        return res.status(200).json({
            verified: false,
            confidence: 0,
            reason: `Verification failed: ${error.message}`,
        });
    }
}
