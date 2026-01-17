import { SystemState } from '../types';

export const apiService = {
    /**
     * Persists the current session state to the backend.
     */
    async submitSession(state: SystemState): Promise<{ success: boolean; sessionId?: string; error?: string }> {
        console.log('apiService: submitSession triggered');
        try {
            const response = await fetch('/api/submit-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(state),
            });

            console.log('apiService: Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('apiService: Error response:', errorData);
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
