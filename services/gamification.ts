// ============================================================
// GAMIFICATION ENGINE — XP, Ranks, Streaks
// ============================================================

export interface MythicRank {
    level: number;
    name: string;
    xpThreshold: number;
    color: string;
    glyph: string;
}

export const RANKS: MythicRank[] = [
    { level: 1, name: 'Initiate', xpThreshold: 0, color: '#71717A', glyph: '◇' },
    { level: 2, name: 'Apprentice', xpThreshold: 500, color: '#A1A1AA', glyph: '◆' },
    { level: 3, name: 'Adept', xpThreshold: 1500, color: '#22D3EE', glyph: '⬡' },
    { level: 4, name: 'Architect', xpThreshold: 4000, color: '#A78BFA', glyph: '⬢' },
    { level: 5, name: 'Sovereign', xpThreshold: 10000, color: '#F59E0B', glyph: '⟁' },
    { level: 6, name: 'Demigod', xpThreshold: 25000, color: '#EF4444', glyph: '☉' },
    { level: 7, name: 'Primordial', xpThreshold: 100000, color: '#00FF41', glyph: '✦' },
];

// XP Awards for phase completions
export const XP_AWARDS = {
    CALIBRATION_COMPLETE: 50,
    ARMORY_ITEM_ADDED: 10,
    TOOL_COMPRESSED: 25,
    EVIDENCE_SCORED: 30,
    TOOL_LOCKED: 75,
    THEORY_SYNTHESIZED: 150,
    DOSSIER_FINALIZED: 500,
    RITUAL_ENTRY: 25,
    STREAK_7: 100,
    STREAK_14: 250,
    STREAK_30: 500,
} as const;

/** Get rank for a given XP total */
export function getRank(xp: number): MythicRank {
    let rank = RANKS[0];
    for (const r of RANKS) {
        if (xp >= r.xpThreshold) rank = r;
        else break;
    }
    return rank;
}

/** Calculate progress to next rank (0–100) */
export function getRankProgress(xp: number): number {
    const current = getRank(xp);
    const nextIdx = RANKS.findIndex(r => r.level === current.level) + 1;
    if (nextIdx >= RANKS.length) return 100; // Max rank
    const next = RANKS[nextIdx];
    const range = next.xpThreshold - current.xpThreshold;
    const progress = xp - current.xpThreshold;
    return Math.min(100, Math.round((progress / range) * 100));
}

/** Calculate streak from a sorted array of date strings (newest first) */
export function calculateStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        if (dates[i] === expected.toISOString().split('T')[0]) {
            streak++;
        } else break;
    }
    return streak;
}

/** Check if a streak milestone was just hit */
export function getStreakMilestone(streak: number): number | null {
    if (streak === 7) return XP_AWARDS.STREAK_7;
    if (streak === 14) return XP_AWARDS.STREAK_14;
    if (streak === 30) return XP_AWARDS.STREAK_30;
    return null;
}
