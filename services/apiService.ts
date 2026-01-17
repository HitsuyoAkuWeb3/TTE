import { SystemState } from '../types';

export const apiService = {
    /**
     * Persists the current session state to the backend.
     */
    async submitSession(state: SystemState): Promise<{ success: boolean; sessionId?: string; error?: string }> {
        try {
            const response = await fetch('/api/submit-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(state),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit session');
            }

            return await response.json();
        } catch (err) {
            console.error('API Error (submitSession):', err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    },

    /**
     * Retrieves all sessions from the backend.
     */
    async getResults(): Promise<any> {
        try {
            const response = await fetch('/api/get-results');
            if (!response.ok) {
                throw new Error('Failed to fetch results');
            }
            return await response.json();
        } catch (err) {
            console.error('API Error (getResults):', err);
            throw err;
        }
    },

    /**
     * Health check for the backend and persistence layer.
     */
    async healthCheck(): Promise<{ status: string; persistence: boolean }> {
        try {
            const response = await fetch('/api/health');
            return await response.json();
        } catch (err) {
            return { status: 'down', persistence: false };
        }
    }
};
