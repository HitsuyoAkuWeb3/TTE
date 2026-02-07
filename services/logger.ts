// ============================================================
// STRUCTURED LOGGER — Centralized Logging Utility
// ============================================================
// Replaces scattered console.* calls with a tagged, filterable
// logging interface. In production, these can be wired to a
// remote observability service (e.g., Sentry, Datadog).
// ============================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Default: show info+ in production, debug+ in development
const MIN_LEVEL: LogLevel = import.meta.env?.DEV ? 'debug' : 'info';

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatTag(tag: string): string {
    return `[${tag.toUpperCase()}]`;
}

export const logger = {
    debug(tag: string, message: string, ...data: unknown[]): void {
        if (shouldLog('debug')) console.debug(formatTag(tag), message, ...data);
    },

    info(tag: string, message: string, ...data: unknown[]): void {
        if (shouldLog('info')) console.log(formatTag(tag), message, ...data);
    },

    warn(tag: string, message: string, ...data: unknown[]): void {
        if (shouldLog('warn')) console.warn(formatTag(tag), message, ...data);
    },

    error(tag: string, message: string, ...data: unknown[]): void {
        if (shouldLog('error')) console.error(formatTag(tag), message, ...data);
    },
};
