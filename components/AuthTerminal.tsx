import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useVernacular } from '../contexts/VernacularContext';

export const AuthTerminal: React.FC = () => {
    const { v } = useVernacular();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full border border-zinc-800 p-8 bg-void relative overflow-hidden shadow-hard">
                {/* Decorative scanning line */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20 animate-scan"></div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-display font-black tracking-tighter mb-2 text-white">{v.auth_title}</h1>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{v.auth_subtitle}</p>
                </div>

                <div className="flex justify-center w-full">
                    <SignIn
                        appearance={{
                            baseTheme: dark,
                            variables: {
                                colorPrimary: '#ffffff',
                                colorBackground: 'transparent',
                                colorInputBackground: 'rgba(24, 24, 27, 0.5)', // bg-zinc-900/50
                                colorInputText: '#ffffff',
                                colorText: '#a1a1aa', // text-zinc-400
                                colorTextOnPrimaryBackground: '#000000',
                                fontFamily: '"Iosevka", "Fira Code", "Courier New", Courier, monospace',
                                borderRadius: '0px',
                            },
                            elements: {
                                rootBox: 'w-full flex justify-center',
                                cardBox: 'w-full shadow-none rounded-none',
                                card: 'bg-transparent shadow-none border-0 w-full rounded-none p-0',
                                headerTitle: 'hidden',
                                headerSubtitle: 'hidden',
                                socialButtonsBlockButton: 'rounded-none border-zinc-800 text-zinc-400 hover:border-white hover:text-white hover:bg-zinc-900 transition-colors font-mono text-xs shadow-none',
                                socialButtonsBlockButtonText: 'font-mono text-xs uppercase font-normal',
                                dividerLine: 'bg-zinc-800',
                                dividerText: 'font-mono text-[10px] text-zinc-600 uppercase',
                                formFieldLabel: 'font-mono text-[10px] text-zinc-500 uppercase tracking-widest',
                                formFieldInput: 'bg-zinc-900/50 border-zinc-800 text-bone rounded-none focus:border-white focus:ring-0 font-mono text-sm transition-colors shadow-none',
                                formButtonPrimary: 'bg-white text-black hover:bg-zinc-200 uppercase tracking-widest text-xs font-mono rounded-none shadow-none mt-4 transition-colors',
                                footerActionText: 'font-mono text-[10px] text-zinc-500 hidden',
                                footerActionLink: 'font-mono text-[10px] text-zinc-400 hover:text-white',
                                footer: 'hidden',
                                identityPreviewText: 'font-mono text-white',
                                identityPreviewEditButton: 'text-zinc-500 hover:text-white',
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
