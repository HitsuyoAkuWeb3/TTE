import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '@clerk/backend';

// ============================================================
// AUTH MIDDLEWARE — Clerk JWT Verification
// ============================================================
// Replaces raw x-clerk-user-id header spoofing with proper
// JWT verification. Extracts userId and optional orgId from
// the verified token claims.
//
// Usage in API routes:
//   import { withAuth, type AuthedRequest } from '../middleware/auth';
//   export default withAuth(async (req, res) => { ... });

export interface AuthedRequest extends VercelRequest {
    auth: {
        userId: string;
        orgId: string | null;
        orgRole: string | null;
    };
}

type AuthedHandler = (req: AuthedRequest, res: VercelResponse) => Promise<void | VercelResponse>;

/**
 * Wraps a Vercel API handler with Clerk JWT verification.
 * The verified userId and orgId are injected into req.auth.
 */
export function withAuth(handler: AuthedHandler) {
    return async (req: VercelRequest, res: VercelResponse) => {
        // Extract Bearer token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;

        if (!token) {
            return res.status(401).json({ error: 'Missing authorization token' });
        }

        try {
            // Verify the session JWT using Clerk's backend SDK
            const verified = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY!,
            });

            if (!verified?.sub) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Inject verified auth context into the request
            (req as AuthedRequest).auth = {
                userId: verified.sub,
                orgId: (verified as Record<string, unknown>).org_id as string | null ?? null,
                orgRole: (verified as Record<string, unknown>).org_role as string | null ?? null,
            };

            return handler(req as AuthedRequest, res);
        } catch (error: any) {
            console.error('[AUTH] Token verification failed:', error.message);
            return res.status(401).json({ error: 'Token verification failed' });
        }
    };
}
