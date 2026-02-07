import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthedRequest } from '../middleware/auth';
import { getDb } from './_db';

// ============================================================
// ORG ARMORY CRUD — Shared Armory Items Within an Org
// ============================================================
// GET  /api/db/org-armory?orgId=xxx — List all org armory items
// POST /api/db/org-armory — Add item (requires member+ role)
// DELETE /api/db/org-armory — Remove item (requires admin role)

export default withAuth(async (req: AuthedRequest, res: VercelResponse) => {
    const { userId } = req.auth;
    const sql = getDb();

    // GET — List all items for an org (all members can view)
    if (req.method === 'GET') {
        const orgId = req.query.orgId as string;
        if (!orgId) return res.status(400).json({ error: 'Missing orgId' });

        try {
            // Verify membership
            const membership = await sql`
                SELECT role FROM memberships
                WHERE org_id = ${orgId}::uuid AND clerk_user_id = ${userId}
            `;
            if (membership.length === 0) {
                return res.status(403).json({ error: 'Not a member of this organization' });
            }

            const items = await sql`
                SELECT id, added_by, verb, x, y, quadrant, candidate_data, created_at
                FROM org_armory_items
                WHERE org_id = ${orgId}::uuid
                ORDER BY created_at DESC
            `;
            return res.status(200).json({ items });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // POST — Add item (requires member or admin role)
    if (req.method === 'POST') {
        const { orgId, verb, x, y, quadrant, candidateData } = req.body;
        if (!orgId || !verb || !quadrant) {
            return res.status(400).json({ error: 'Missing required fields: orgId, verb, quadrant' });
        }

        try {
            // Verify write permission
            const membership = await sql`
                SELECT role FROM memberships
                WHERE org_id = ${orgId}::uuid AND clerk_user_id = ${userId}
                  AND role IN ('admin', 'member')
            `;
            if (membership.length === 0) {
                return res.status(403).json({ error: 'Insufficient permissions: member or admin required' });
            }

            const rows = await sql`
                INSERT INTO org_armory_items (org_id, added_by, verb, x, y, quadrant, candidate_data)
                VALUES (${orgId}::uuid, ${userId}, ${verb}, ${x || 0}, ${y || 0}, ${quadrant}, ${JSON.stringify(candidateData || {})}::jsonb)
                RETURNING id, verb, quadrant, created_at
            `;
            return res.status(201).json(rows[0]);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // DELETE — Remove item (requires admin role)
    if (req.method === 'DELETE') {
        const { orgId, itemId } = req.body;
        if (!orgId || !itemId) {
            return res.status(400).json({ error: 'Missing orgId or itemId' });
        }

        try {
            // Verify admin permission
            const membership = await sql`
                SELECT role FROM memberships
                WHERE org_id = ${orgId}::uuid AND clerk_user_id = ${userId}
                  AND role = 'admin'
            `;
            if (membership.length === 0) {
                return res.status(403).json({ error: 'Admin role required for deletion' });
            }

            await sql`
                DELETE FROM org_armory_items
                WHERE id = ${itemId}::uuid AND org_id = ${orgId}::uuid
            `;
            return res.status(200).json({ deleted: true });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
