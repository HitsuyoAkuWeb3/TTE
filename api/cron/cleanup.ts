import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../db/_db';

// ============================================================
// GARBAGE COLLECTION — Auto-archive stale drafts
// ============================================================
// Runs daily via Vercel cron. Deletes unfinalised sessions
// that haven't been updated in 7+ days.

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Verify this is a cron request (Vercel sets this header)
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const sql = getDb();

    try {
        const result = await sql`
      DELETE FROM sessions
      WHERE finalized = false
        AND updated_at < NOW() - INTERVAL '7 days'
      RETURNING id
    `;
        console.log(`[CRON] Cleaned up ${result.length} stale drafts`);
        return res.status(200).json({ cleaned: result.length });
    } catch (error: any) {
        console.error('[CRON] Cleanup failed:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
