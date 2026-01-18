import React, { useState } from 'react';
import { db } from '../services/instantDb';
import { Button } from './Visuals';

export const AuthTerminal: React.FC = () => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        try {
            await db.auth.sendMagicCode({ email });
            setSent(true);
        } catch (err) {
            console.error("Auth Error:", err);
            alert("Handshake failed. Check console.");
        }
        setLoading(false);
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;
        setLoading(true);
        try {
            await db.auth.signInWithMagicCode({ email, code });
        } catch (err) {
            console.error("Verification Error:", err);
            alert("Invalid key. Access denied.");
        }
        setLoading(false);
    };

    const handleGoogle = async () => {
        try {
            const url = db.auth.createAuthorizationURL({
                clientName: 'google',
                redirectURL: window.location.origin
            });
            window.location.assign(url);
        } catch (err) {
            console.error("Google Auth Error:", err);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full border border-zinc-800 p-8 bg-black relative overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.02)]">
                {/* Decorative scanning line */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20 animate-scan"></div>

                <div className="text-center mb-12">
                    <h1 className="text-2xl font-black tracking-tighter mb-2">NEURAL_VAULT / AUTH</h1>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Awaiting Verification Handshake</p>
                </div>

                {!sent ? (
                    <form onSubmit={handleMagicLink} className="space-y-6">
                        <div>
                            <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-mono">Input Identity [Email]</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-zinc-700 p-4 font-mono text-sm text-white focus:border-white outline-none transition-colors"
                                placeholder="name@domain.com"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-4 relative group overflow-hidden"
                            disabled={loading}
                        >
                            <span className="relative z-10">{loading ? 'ENCRYPTING...' : 'INITIATE MAGIC LINK'}</span>
                            <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                        </Button>

                        <div className="relative py-4 flex items-center">
                            <div className="flex-grow border-t border-zinc-800"></div>
                            <span className="px-4 text-[10px] font-mono text-zinc-600">OR</span>
                            <div className="flex-grow border-t border-zinc-800"></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogle}
                            className="w-full py-3 border border-zinc-800 text-zinc-400 font-mono text-[11px] hover:text-white hover:border-white transition-all uppercase tracking-tight flex items-center justify-center gap-2"
                        >
                            <svg className="w-3 h-3" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Fast Clearance via Google
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyCode} className="space-y-6">
                        <div className="text-center mb-8 animate-pulse">
                            <div className="text-zinc-500 font-mono text-[10px] uppercase mb-4 tracking-widest">Verification Key Dispatched</div>
                            <div className="text-white font-bold italic text-sm">CHECK [ {email} ]</div>
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase text-zinc-500 mb-2 font-mono">Input 6-Digit Key</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-zinc-700 p-4 font-mono text-center text-xl tracking-[0.5em] text-white focus:border-white outline-none transition-colors"
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-4 relative group overflow-hidden"
                            disabled={loading}
                        >
                            <span className="relative z-10">{loading ? 'VERIFYING...' : 'FINALIZE HANDSHAKE'}</span>
                            <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                        </Button>

                        <button
                            type="button"
                            onClick={() => setSent(false)}
                            className="w-full text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors uppercase"
                        >
                            [ Back to Identification ]
                        </button>
                    </form>
                )}
            </div>

            <div className="mt-8 text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em]">
                TetraTool Engine // Enterprise Node
            </div>
        </div>
    );
};
