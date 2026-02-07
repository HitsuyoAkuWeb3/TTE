import React, { createContext, useContext, useMemo } from 'react';
import { useOrganization, useOrganizationList } from '@clerk/clerk-react';

// ============================================================
// ORG CONTEXT — Organization-Aware State
// ============================================================
// Provides organization context to all child components.
// When an org is active, the app switches to "org mode"
// where shared armory and dossiers are visible.

export type OrgRole = 'admin' | 'member' | 'viewer' | null;

export interface OrgContextValue {
    /** Whether the user is currently in an org context */
    isOrgMode: boolean;
    /** The active Clerk org ID (null if personal mode) */
    orgId: string | null;
    /** Display name of the active org */
    orgName: string | null;
    /** URL slug for the active org */
    orgSlug: string | null;
    /** User's role within the active org */
    userRole: OrgRole;
    /** Whether org data is still loading */
    isLoading: boolean;
    /** Whether the user can write (admin or member) */
    canWrite: boolean;
    /** Whether the user has admin privileges */
    isAdmin: boolean;
}

const OrgContext = createContext<OrgContextValue>({
    isOrgMode: false,
    orgId: null,
    orgName: null,
    orgSlug: null,
    userRole: null,
    isLoading: true,
    canWrite: false,
    isAdmin: false,
});

export const useOrg = () => useContext(OrgContext);

export const OrgProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { organization, isLoaded, membership } = useOrganization();

    const value = useMemo<OrgContextValue>(() => {
        const role = (membership?.role as OrgRole) ?? null;
        const isOrgMode = !!organization;
        return {
            isOrgMode,
            orgId: organization?.id ?? null,
            orgName: organization?.name ?? null,
            orgSlug: organization?.slug ?? null,
            userRole: role,
            isLoading: !isLoaded,
            canWrite: role === 'admin' || role === 'member',
            isAdmin: role === 'admin',
        };
    }, [organization, isLoaded, membership]);

    return (
        <OrgContext.Provider value={value}>
            {children}
        </OrgContext.Provider>
    );
};
