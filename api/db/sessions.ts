import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';

// ============================================================
// SESSION CRUD — Save / Load / List Dossier Sessions
// ============================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const userId = req.headers['x-clerk-user-id'] as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const sql = getDb();

    // GET /api/db/sessions — List all sessions for user
    if (req.method === 'GET') {
        try {
            const rows = await sql`
        SELECT id, data, version, finalized, created_at, updated_at
        FROM sessions
        WHERE clerk_user_id = ${userId}
        ORDER BY updated_at DESC
      `;
            return res.status(200).json({ sessions: rows });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // POST /api/db/sessions — Save/upsert a session
    if (req.method === 'POST') {
        try {
            const { id, data, version, finalized } = req.body;
            const sessionId = id || crypto.randomUUID();

            const rows = await sql`
        INSERT INTO sessions (id, clerk_user_id, data, version, finalized, updated_at)
        VALUES (${sessionId}::uuid, ${userId}, ${JSON.stringify(data)}::jsonb, ${version || 1}, ${finalized || false}, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          data = ${JSON.stringify(data)}::jsonb,
          version = ${version || 1},
          finalized = ${finalized || false},
          updated_at = NOW()
        RETURNING id, version, finalized
      `;
            return res.status(200).json(rows[0]);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
