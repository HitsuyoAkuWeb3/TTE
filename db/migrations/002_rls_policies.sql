-- ============================================================
-- MIGRATION 002: Row-Level Security Policies
-- ============================================================
-- Restricts data access so users can only see/modify data
-- for organizations they belong to.
--
-- Run: psql $POSTGRES_URL -f db/migrations/002_rls_policies.sql
-- ============================================================

-- Enable RLS on org tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_armory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ORGANIZATIONS: visible to members only
-- ============================================================
CREATE POLICY org_member_select ON organizations
    FOR SELECT
    USING (
        id IN (SELECT org_id FROM memberships WHERE clerk_user_id = current_setting('app.clerk_user_id', true))
    );

-- ============================================================
-- MEMBERSHIPS: visible to members of the same org
-- ============================================================
CREATE POLICY membership_select ON memberships
    FOR SELECT
    USING (
        org_id IN (SELECT org_id FROM memberships WHERE clerk_user_id = current_setting('app.clerk_user_id', true))
    );

-- Only admins can insert/update/delete memberships
CREATE POLICY membership_admin_modify ON memberships
    FOR ALL
    USING (
        org_id IN (
            SELECT org_id FROM memberships
            WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
              AND role = 'admin'
        )
    );

-- ============================================================
-- ORG ARMORY ITEMS: all members can read, members+ can write
-- ============================================================
CREATE POLICY org_armory_select ON org_armory_items
    FOR SELECT
    USING (
        org_id IN (SELECT org_id FROM memberships WHERE clerk_user_id = current_setting('app.clerk_user_id', true))
    );

CREATE POLICY org_armory_insert ON org_armory_items
    FOR INSERT
    WITH CHECK (
        org_id IN (
            SELECT org_id FROM memberships
            WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
              AND role IN ('admin', 'member')
        )
    );

CREATE POLICY org_armory_delete ON org_armory_items
    FOR DELETE
    USING (
        org_id IN (
            SELECT org_id FROM memberships
            WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
              AND role = 'admin'
        )
    );

-- ============================================================
-- ORG SESSIONS: all members can read, members+ can write
-- ============================================================
CREATE POLICY org_session_select ON org_sessions
    FOR SELECT
    USING (
        org_id IN (SELECT org_id FROM memberships WHERE clerk_user_id = current_setting('app.clerk_user_id', true))
    );

CREATE POLICY org_session_insert ON org_sessions
    FOR INSERT
    WITH CHECK (
        org_id IN (
            SELECT org_id FROM memberships
            WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
              AND role IN ('admin', 'member')
        )
    );

CREATE POLICY org_session_update ON org_sessions
    FOR UPDATE
    USING (
        org_id IN (
            SELECT org_id FROM memberships
            WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
              AND role IN ('admin', 'member')
        )
    );

CREATE POLICY org_session_delete ON org_sessions
    FOR DELETE
    USING (
        org_id IN (
            SELECT org_id FROM memberships
            WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
              AND role = 'admin'
        )
    );
