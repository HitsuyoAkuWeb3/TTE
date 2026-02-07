import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthedRequest } from '../middleware/auth';
import { getDb } from './_db';

// ============================================================
// ORG SESSIONS CRUD — Shared Dossier Sessions Within an Org
// ============================================================
// GET    /api/db/org-sessions?orgId=xxx — List all org sessions
// POST   /api/db/org-sessions — Create/update session (member+)
// DELETE /api/db/org-sessions — Delete session (admin only)

export default withAuth(async (req: AuthedRequest, res: VercelResponse) => {
    const { userId } = req.auth;
    const sql = getDb();

    // GET — List all sessions for an org
    if (req.method === 'GET') {
        const orgId = req.query.orgId as string;
        if (!orgId) return res.status(400).json({ error: 'Missing orgId' });

        try {
            const membership = await sql`
                SELECT role FROM memberships
                WHERE org_id = ${orgId}::uuid AND clerk_user_id = ${userId}
            `;
            if (membership.length === 0) {
                return res.status(403).json({ error: 'Not a member of this organization' });
            }

            const sessions = await sql`
                SELECT id, created_by, data, version, finalized, created_at, updated_at
                FROM org_sessions
                WHERE org_id = ${orgId}::uuid
                ORDER BY updated_at DESC
            `;
            return res.status(200).json({ sessions });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // POST — Create or update an org session (requires member+)
    if (req.method === 'POST') {
        const { orgId, id, data, version, finalized } = req.body;
        if (!orgId) return res.status(400).json({ error: 'Missing orgId' });

        try {
            const membership = await sql`
                SELECT role FROM memberships
                WHERE org_id = ${orgId}::uuid AND clerk_user_id = ${userId}
                  AND role IN ('admin', 'member')
            `;
            if (membership.length === 0) {
                return res.status(403).json({ error: 'Member or admin role required' });
            }

            const sessionId = id || crypto.randomUUID();
            const rows = await sql`
                INSERT INTO org_sessions (id, org_id, created_by, data, version, finalized, updated_at)
                VALUES (${sessionId}::uuid, ${orgId}::uuid, ${userId}, ${JSON.stringify(data || {})}::jsonb, ${version || 1}, ${finalized || false}, NOW())
                ON CONFLICT (id)
                DO UPDATE SET
                    data = ${JSON.stringify(data || {})}::jsonb,
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

    // DELETE — Remove org session (admin only)
    if (req.method === 'DELETE') {
        const { orgId, sessionId } = req.body;
        if (!orgId || !sessionId) {
            return res.status(400).json({ error: 'Missing orgId or sessionId' });
        }

        try {
            const membership = await sql`
                SELECT role FROM memberships
                WHERE org_id = ${orgId}::uuid AND clerk_user_id = ${userId}
                  AND role = 'admin'
            `;
            if (membership.length === 0) {
                return res.status(403).json({ error: 'Admin role required for deletion' });
            }

            await sql`
                DELETE FROM org_sessions
                WHERE id = ${sessionId}::uuid AND org_id = ${orgId}::uuid
            `;
            return res.status(200).json({ deleted: true });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
