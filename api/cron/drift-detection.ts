import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../db/_db';

// ============================================================
// DRIFT DETECTION — Nightly User degradation check
// ============================================================
// Runs daily via Vercel cron. Marks sessions as degraded if 
// they haven't been active in 7+ days.

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Verify this is a cron request (Vercel sets this header)
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const sql = getDb();

    try {
        const result = await sql`
      UPDATE sessions
      SET data = jsonb_set(data, '{accessDegraded}', 'true'::jsonb)
      WHERE (data->>'lastActiveDate')::timestamptz < NOW() - INTERVAL '7 days'
      AND ((data->>'accessDegraded')::boolean IS NULL OR (data->>'accessDegraded')::boolean = false)
      RETURNING id
    `;
        console.log(`[CRON] Marked ${result.length} sessions as degraded due to drift`);
        return res.status(200).json({ degraded: result.length });
    } catch (error: any) {
        console.error('[CRON] Drift detection failed:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
