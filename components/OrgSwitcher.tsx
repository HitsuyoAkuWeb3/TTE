import React from 'react';
import { OrganizationSwitcher } from '@clerk/clerk-react';
import { useOrg } from '../contexts/OrgContext';

// ============================================================
// ORG SWITCHER — Toggle Between Personal / Org Modes
// ============================================================
// Wraps Clerk's OrganizationSwitcher with the Void-Architect
// DLS styling. Shows the active org + role badge.

export const OrgSwitcherPanel: React.FC = () => {
    const { isOrgMode, orgName, userRole } = useOrg();

    return (
        <div className="flex items-center gap-3">
            <OrganizationSwitcher
                hidePersonal={false}
                afterSelectOrganizationUrl="/"
                afterSelectPersonalUrl="/"
                appearance={{
                    elements: {
                        rootBox: 'font-mono text-xs',
                        organizationSwitcherTrigger:
                            'border border-zinc-700 bg-void px-3 py-1.5 text-bone hover:border-zinc-500 transition-colors',
                        organizationSwitcherPopoverCard:
                            'bg-void border border-zinc-700 shadow-hard',
                    },
                }}
            />
            {isOrgMode && userRole && (
                <span
                    className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border ${
                        userRole === 'admin'
                            ? 'border-hazard text-hazard'
                            : userRole === 'member'
                              ? 'border-spirit text-spirit'
                              : 'border-zinc-600 text-zinc-500'
                    }`}
                >
                    {userRole}
                </span>
            )}
        </div>
    );
};
