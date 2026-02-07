import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';

// ============================================================
// PROFILE CRUD — Save / Load Operator Profile
// ============================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const userId = req.headers['x-clerk-user-id'] as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const sql = getDb();

    if (req.method === 'GET') {
        try {
            const rows = await sql`
        SELECT id, data FROM profiles WHERE clerk_user_id = ${userId} LIMIT 1
      `;
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Profile not found' });
            }
            return res.status(200).json(rows[0]);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    if (req.method === 'POST') {
        try {
            const { data } = req.body;
            const rows = await sql`
        INSERT INTO profiles (clerk_user_id, data, updated_at)
        VALUES (${userId}, ${JSON.stringify(data)}::jsonb, NOW())
        ON CONFLICT (clerk_user_id)
        DO UPDATE SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
        RETURNING id, data
      `;
            return res.status(200).json(rows[0]);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
