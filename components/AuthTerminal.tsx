import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useVernacular } from '../contexts/VernacularContext';

export const AuthTerminal: React.FC = () => {
    const { v } = useVernacular();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full border border-zinc-800 p-8 bg-void relative overflow-hidden shadow-hard">
                {/* Decorative scanning line */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20 animate-scan"></div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-display font-black tracking-tighter mb-2">{v.auth_title}</h1>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{v.auth_subtitle}</p>
                </div>

                <div className="flex justify-center [&_.cl-rootBox]:w-full [&_.cl-card]:bg-transparent [&_.cl-card]:shadow-none [&_.cl-card]:border-0 [&_.cl-headerTitle]:text-bone [&_.cl-headerSubtitle]:text-zinc-500 [&_.cl-formButtonPrimary]:bg-white [&_.cl-formButtonPrimary]:text-black [&_.cl-formFieldInput]:bg-zinc-900/50 [&_.cl-formFieldInput]:border-zinc-700 [&_.cl-formFieldInput]:text-bone [&_.cl-footerActionLink]:text-zinc-400 [&_.cl-dividerLine]:bg-zinc-800 [&_.cl-dividerText]:text-zinc-600 [&_.cl-socialButtonsBlockButton]:border-zinc-800 [&_.cl-socialButtonsBlockButton]:text-zinc-400 [&_.cl-socialButtonsBlockButton:hover]:border-white [&_.cl-socialButtonsBlockButton:hover]:text-bone">
                    <SignIn
                        appearance={{
                            elements: {
                                rootBox: 'w-full',
                                card: 'bg-transparent shadow-none border-0 w-full',
                            }
                        }}
                    />
                </div>
            </div>

            <div className="mt-8 text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em]">
                {v.auth_footer}
            </div>
        </div>
    );
};
