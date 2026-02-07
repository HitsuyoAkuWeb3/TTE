import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';

// ============================================================
// SNAPSHOT CRUD — Version History (Append-Only)
// ============================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const userId = req.headers['x-clerk-user-id'] as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const sql = getDb();

    // GET /api/db/snapshots?sessionId=xxx — List snapshots for a session
    if (req.method === 'GET') {
        const sessionId = req.query.sessionId as string;
        if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

        try {
            const rows = await sql`
        SELECT s.id, s.version, s.data, s.finalized_at
        FROM snapshots s
        JOIN sessions sess ON s.session_id = sess.id
        WHERE s.session_id = ${sessionId}::uuid AND sess.clerk_user_id = ${userId}
        ORDER BY s.version DESC
      `;
            return res.status(200).json({ snapshots: rows });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // POST /api/db/snapshots — Create a new snapshot
    if (req.method === 'POST') {
        const { sessionId, version, data } = req.body;
        if (!sessionId || !version) return res.status(400).json({ error: 'Missing sessionId or version' });

        try {
            const rows = await sql`
        INSERT INTO snapshots (session_id, version, data, finalized_at)
        VALUES (${sessionId}::uuid, ${version}, ${JSON.stringify(data)}::jsonb, NOW())
        ON CONFLICT (session_id, version) DO NOTHING
        RETURNING id, version, finalized_at
      `;
            return res.status(200).json(rows[0] || { skipped: true });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
