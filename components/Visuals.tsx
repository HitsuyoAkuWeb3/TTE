import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label } from 'recharts';
import { ArmoryItem, Quadrant } from '../types';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'gold' }> = ({
  children, variant = 'primary', className = '', ...props
}) => {
  const baseStyle = "font-mono text-sm px-6 py-3 uppercase tracking-wider transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-zinc-100 text-black border-zinc-100 hover:bg-transparent hover:text-white",
    secondary: "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-500 hover:text-white",
    danger: "bg-red-900/20 text-red-500 border-red-900 hover:bg-red-900/40",
    gold: "bg-yellow-600/20 text-yellow-500 border-yellow-600 hover:bg-yellow-600/40"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    className="w-full bg-zinc-900/50 border border-zinc-700 text-white p-3 font-mono focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
    {...props}
  />
);

export const SectionHeader: React.FC<{ title: string, subtitle?: string, onBack?: () => void }> = ({ title, subtitle, onBack }) => (
  <div className="mb-8 border-b border-zinc-800 pb-4">
    {onBack && (
      <button onClick={onBack} className="mb-4 text-xs font-mono text-zinc-500 hover:text-white flex items-center gap-2 transition-colors">
        &larr; BACK
      </button>
    )}
    <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-2">{title}</h2>
    {subtitle && <p className="text-zinc-500 font-mono text-sm">{subtitle}</p>}
  </div>
);

interface ArmoryMapProps {
  items: ArmoryItem[];
}

export const ArmoryMap: React.FC<ArmoryMapProps> = ({ items }) => {
  // Quadrant background labels
  const CustomBackground = () => (
    <g className="opacity-20 pointer-events-none select-none font-black text-4xl uppercase">
      <text x="25%" y="25%" textAnchor="middle" fill="#fff">Craft</text>
      <text x="75%" y="25%" textAnchor="middle" fill="#fff">Ritual</text>
      <text x="25%" y="75%" textAnchor="middle" fill="#fff">Sandbox</text>
      <text x="75%" y="75%" textAnchor="middle" fill="#fff">Mischief</text>
    </g>
  );

  const [activeZone, setActiveZone] = React.useState<Quadrant | null>(null);

  const QUADRANT_INFO = {
    [Quadrant.CRAFT]: {
      title: "The Builder",
      desc: "You use discipline to construct lasting systems.",
      examples: "Engineering, Writing Code, Architecture"
    },
    [Quadrant.RITUAL]: {
      title: "The Critic",
      desc: "You use discipline to audit or disrupt systems.",
      examples: "Code Review, QA, Security Research"
    },
    [Quadrant.SANDBOX]: {
      title: "The Explorer",
      desc: "You play to discover new patterns or ideas.",
      examples: "Prototyping, Brainstorming, Sketching"
    },
    [Quadrant.MISCHIEF]: {
      title: "The Hacker",
      desc: "You play to break or exploit existing patterns.",
      examples: "Pentesting, Pranks, guerrilla marketing"
    }
  };

  return (
    <div className="w-full h-[400px] bg-zinc-950 border border-zinc-800 relative group">
      {/* Axis Labels */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-zinc-500/50">INSTRUMENT (DISCIPLINE)</div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-zinc-500/50">TOY (DISCOVERY)</div>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-mono text-zinc-500/50">TOOL (CONSTRUCTION)</div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-mono text-zinc-500/50">WEAPON (DISRUPTION)</div>

      {/* Quadrant Hover Overlay */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 z-10">
        <div
          className="hover:bg-zinc-900/10 transition-colors"
          onMouseEnter={() => setActiveZone(Quadrant.CRAFT)}
          onMouseLeave={() => setActiveZone(null)}
        />
        <div
          className="hover:bg-zinc-900/10 transition-colors"
          onMouseEnter={() => setActiveZone(Quadrant.RITUAL)}
          onMouseLeave={() => setActiveZone(null)}
        />
        <div
          className="hover:bg-zinc-900/10 transition-colors"
          onMouseEnter={() => setActiveZone(Quadrant.SANDBOX)}
          onMouseLeave={() => setActiveZone(null)}
        />
        <div
          className="hover:bg-zinc-900/10 transition-colors"
          onMouseEnter={() => setActiveZone(Quadrant.MISCHIEF)}
          onMouseLeave={() => setActiveZone(null)}
        />
      </div>

      {/* Info Card */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-zinc-900/95 backdrop-blur border border-white/20 p-4 pointer-events-none transition-all duration-300 z-20 ${activeZone ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {activeZone && (
          <>
            <h4 className="text-white font-bold uppercase tracking-wider mb-1">{QUADRANT_INFO[activeZone].title}</h4>
            <p className="text-xs text-zinc-300 mb-2">{QUADRANT_INFO[activeZone].desc}</p>
            <div className="text-[10px] text-zinc-500 font-mono border-t border-white/10 pt-2">
              Ex: {QUADRANT_INFO[activeZone].examples}
            </div>
          </>
        )}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid stroke="#333" strokeDasharray="3 3" opacity={0.5} />
          <XAxis type="number" dataKey="x" domain={[-10, 10]} hide />
          <YAxis type="number" dataKey="y" domain={[-10, 10]} hide />
          <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
          <ReferenceLine x={0} stroke="#666" strokeDasharray="3 3" />
          <CustomBackground />
          <Scatter name="Armory" data={items} fill="#fff">
            {items.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.quadrant === Quadrant.RITUAL ? '#ef4444' : '#fff'} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ProgressBar: React.FC<{ current: number, total: number }> = ({ current, total }) => {
  const progress = (current / total) * 100;
  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-zinc-900 z-50">
      <div
        className="h-full bg-white transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};