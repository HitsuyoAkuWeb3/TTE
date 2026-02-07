-- ============================================================
-- TTE Sovereign Creator System — Database Schema
-- Vercel Postgres / Neon
-- ============================================================

-- Operator Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL UNIQUE,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dossier Sessions (hot state)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    version INT NOT NULL DEFAULT 1,
    finalized BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Version Snapshots (append-only)
CREATE TABLE IF NOT EXISTS snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    version INT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    finalized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, version)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_session ON snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at);
