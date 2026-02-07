// @ts-nocheck
// ============================================================
// ERROR BOUNDARY — Crash Isolation Shell
// ============================================================
// Catches uncaught render exceptions anywhere in the component tree.
// Prevents a single broken component from killing the entire UI.
// Shows a recovery screen instead of a white page.
//
// NOTE: @ts-nocheck is required because this is a class component
// that needs React.Component types, but the project uses React 19
// without @types/react (functional components work via JSX transform).
// The class is correct and will compile/run via Vite without issue.

import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
        this.handleReset = this.handleReset.bind(this);
        this.handleHardReset = this.handleHardReset.bind(this);
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, errorMessage: error.message };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[FATAL] Render crash:', error.message, errorInfo.componentStack);
    }

    handleReset() {
        this.setState({ hasError: false, errorMessage: '' });
    }

    handleHardReset() {
        globalThis.location.reload();
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-void flex items-center justify-center p-8">
                    <div className="max-w-md w-full border-2 border-[#FF3333] bg-zinc-900 p-8 text-center space-y-6">
                        {/* Hazard Icon */}
                        <div className="text-5xl">⚠️</div>

                        {/* Title */}
                        <h1 className="text-xl font-mono font-black uppercase tracking-wider text-[#FF3333]">
                            SESSION INTERRUPTED
                        </h1>

                        {/* Error Detail */}
                        <div className="text-xs font-mono text-zinc-500 bg-zinc-950 p-3 text-left overflow-auto max-h-32 border border-zinc-800">
                            {this.state.errorMessage || 'Unknown render failure'}
                        </div>

                        {/* Recovery Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full font-mono text-sm px-6 py-3 uppercase tracking-wider border-2 border-bone text-bone bg-void hover:bg-bone hover:text-void transition-all"
                            >
                                ↻ Retry Render
                            </button>
                            <button
                                onClick={this.handleHardReset}
                                className="w-full font-mono text-sm px-6 py-3 uppercase tracking-wider border border-zinc-700 text-zinc-500 hover:text-bone hover:border-bone transition-all"
                            >
                                ⟳ Full Reload
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
                            TetraTool Engine · Error Recovery
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
