import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { useVernacular } from '../contexts/VernacularContext';
import { Button } from './Visuals';

interface CortexChatProps {
    history: ChatMessage[];
    onSendMessage: (text: string) => void;
    isThinking: boolean;
    className?: string;
    placeholder?: string;
}

export const CortexChat: React.FC<CortexChatProps> = ({ 
    history, 
    onSendMessage, 
    isThinking, 
    className = '',
    placeholder
}) => {
    const { v } = useVernacular();
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, isThinking]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;
        onSendMessage(input.trim());
        setInput('');
    };

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`flex flex-col bg-zinc-950 border border-zinc-800 h-full ${className}`}>
            {/* Header / Status */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-900/30">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isThinking ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                        {isThinking ? v.cortex_thinking : 'CORTEX ONLINE'}
                    </span>
                </div>
                <div className="text-[9px] font-mono text-zinc-600">v3.0</div>
            </div>

            {/* Message Log */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 font-mono text-sm scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
            >
                {history.length === 0 && (
                    <div className="text-center text-zinc-600 italic text-xs mt-10">
                        {v.cortex_thinking /* Reusing thinking string as placeholder/status for now, or just empty */}
                    </div>
                )}
                
                {history.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-baseline gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${
                                msg.role === 'user' ? 'text-zinc-500' : 'text-emerald-600'
                            }`}>
                                {msg.role === 'user' ? 'OPERATOR' : 'CORTEX'}
                            </span>
                            <span className="text-[9px] text-zinc-700">{formatTime(msg.timestamp)}</span>
                        </div>
                        
                        <div className={`max-w-[85%] px-4 py-3 border ${
                            msg.role === 'user' 
                                ? 'bg-zinc-900/50 border-zinc-800 text-zinc-300 rounded-tl-lg rounded-bl-lg rounded-br-none' 
                                : 'bg-emerald-950/10 border-emerald-900/30 text-emerald-100 rounded-tr-lg rounded-br-lg rounded-bl-none shadow-[0_0_15px_rgba(0,255,65,0.05)]'
                        }`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {isThinking && (
                    <div className="flex flex-col items-start animate-pulse">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">CORTEX</span>
                        </div>
                        <div className="bg-emerald-950/5 border border-emerald-900/20 px-4 py-3 rounded-tr-lg rounded-br-lg rounded-bl-none">
                            <span className="inline-block w-2 H-4 bg-emerald-500/50 animate-blink" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-900 bg-zinc-950 relative">
                <div className="relative flex items-center gap-2">
                    <span className="text-zinc-600 font-mono text-lg">{'>'}</span>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholder || v.cortex_input_placeholder}
                        disabled={isThinking}
                        className="flex-1 bg-transparent border-none outline-none font-mono text-bone placeholder-zinc-700 focus:ring-0"
                        autoFocus
                    />
                    <Button 
                        type="submit" 
                        disabled={!input.trim() || isThinking}
                        variant="secondary"
                        className="px-4 py-1.5 text-[10px] h-auto border-zinc-800 hover:border-zinc-600"
                    >
                        SEND
                    </Button>
                </div>
                {/* Security/Encrypted decoration */}
                <div className="absolute top-0 right-0 -mt-3 mr-4 text-[8px] text-zinc-800 font-mono uppercase tracking-widest bg-zinc-950 px-2">
                    E2E ENCRYPTED // SOVEREIGN LEVEL 3
                </div>
            </form>
        </div>
    );
};
