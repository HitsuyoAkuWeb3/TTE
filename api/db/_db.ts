import { neon } from '@neondatabase/serverless';

// Shared Neon SQL helper — reads POSTGRES_URL from environment
export function getDb() {
    const url = process.env.POSTGRES_URL;
    if (!url) throw new Error('POSTGRES_URL not configured');
    return neon(url);
}
