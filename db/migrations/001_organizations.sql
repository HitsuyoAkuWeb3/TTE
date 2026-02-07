-- ============================================================
-- MIGRATION 001: Organizations & Memberships
-- ============================================================
-- Adds multi-tenant support: organizations, memberships,
-- org-scoped armory items, and org-scoped dossier sessions.
--
-- Run: psql $POSTGRES_URL -f db/migrations/001_organizations.sql
-- ============================================================

-- Organizations (synced from Clerk Organizations)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_org_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memberships (join table: user ↔ org with role)
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member'
        CHECK (role IN ('admin', 'member', 'viewer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, clerk_user_id)
);

-- Org-scoped armory items (normalized — not JSONB blob)
CREATE TABLE IF NOT EXISTS org_armory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    added_by TEXT NOT NULL, -- clerk_user_id of contributor
    verb TEXT NOT NULL,
    x INT NOT NULL DEFAULT 0,
    y INT NOT NULL DEFAULT 0,
    quadrant TEXT NOT NULL,
    candidate_data JSONB DEFAULT '{}', -- compressed tool data
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Org-scoped dossier sessions
CREATE TABLE IF NOT EXISTS org_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL, -- clerk_user_id of creator
    data JSONB NOT NULL DEFAULT '{}',
    version INT NOT NULL DEFAULT 1,
    finalized BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_memberships_org ON memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_org_armory_org ON org_armory_items(org_id);
CREATE INDEX IF NOT EXISTS idx_org_sessions_org ON org_sessions(org_id);
