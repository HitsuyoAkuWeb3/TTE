// ============================================================
// INPUT SANITIZER — Prompt Injection Defense
// ============================================================
// Pre-scans all user inputs before they reach the LLM.
// Strips command-like syntax that could hijack the Daemon persona.
// ============================================================

const INJECTION_PATTERNS: RegExp[] = [
    /ignore\s+(all\s+)?previous\s+(instructions?|prompts?|context)/gi,
    /forget\s+(all\s+)?(previous|prior|above)/gi,
    /you\s+are\s+now\s+a/gi,
    /act\s+as\s+(a|an|if)/gi,
    /pretend\s+(you|to\s+be)/gi,
    /system\s*:\s*/gi,
    /\[system\]/gi,
    /\[INST\]/gi,
    /<\/?system>/gi,
    /override\s+(system|instructions?|prompt)/gi,
    /new\s+instructions?\s*:/gi,
    /disregard\s+(the\s+)?(above|previous|prior)/gi,
    /jailbreak/gi,
    /do\s+not\s+follow\s+(your|the)\s+(rules|instructions)/gi,
    /\bDAN\b/g,      // "Do Anything Now" jailbreak
    /roleplay\s+as/gi,
];

/**
 * Sanitize user input before passing to LLM prompts.
 * Strips known injection patterns and returns cleaned text.
 */
export const sanitizeInput = (input: string): string => {
    if (!input || typeof input !== 'string') return '';

    let cleaned = input;

    for (const pattern of INJECTION_PATTERNS) {
        cleaned = cleaned.replace(pattern, '[REDACTED]');
    }

    // Strip any HTML/XML tags
    cleaned = cleaned.replaceAll(/<[^>]*>/g, '');

    // Collapse multiple spaces
    cleaned = cleaned.replaceAll(/\s{2,}/g, ' ').trim();

    return cleaned;
};

/**
 * Check if input contains suspicious patterns.
 * Returns true if the input is likely an injection attempt.
 */
export const isInjectionAttempt = (input: string): boolean => {
    if (!input) return false;
    return INJECTION_PATTERNS.some(p => p.test(input));
};
