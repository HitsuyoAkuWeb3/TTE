import {
    GoogleGenAI
} from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
    console.error("❌ No API Key found in environment variables (GEMINI_API_KEY or API_KEY).");
    process.exit(1);
}

console.log(`🔑 API Key found (${apiKey.substring(0, 8)}...)`);

const ai = new GoogleGenAI({
    apiKey
});

async function verify() {
    try {
        const modelId = "gemini-2.0-flash";
        console.log(`📡 Connecting to Gemini (${modelId})...`);

        // Correct API call structure
        const response = await ai.models.generateContent({
            model: modelId,
            contents: [{
                parts: [{
                    text: "Respond with 'PONG' if you receive this message."
                }]
            }]
        });

        // Evaluate response safely without optional chaining just in case
        let text = "No text found";
        if (response && response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                text = candidate.content.parts[0].text;
            }
        } else {
            text = JSON.stringify(response);
        }

        console.log("✅ SDK Response Received:");
        console.log("---------------------------------------------------");
        console.log(text);
        console.log("---------------------------------------------------");

        if (text && text.includes("PONG")) {
            console.log("🎉 VERIFICATION SUCCESSFUL: SDK is active and responsive.");
        } else {
            console.log("⚠️ Received response, but unexpected content.");
        }

    } catch (error) {
        console.error("❌ SDK Connection Failed:");
        if (error.message) console.error(error.message);
        else console.error(error);
        process.exit(1);
    }
}

verify();