import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { ArmoryItem, Quadrant } from '../types';
import { useVernacular } from '../contexts/VernacularContext';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'gold' }> = ({
  children, variant = 'primary', className = '', ...props
}) => {
  const baseStyle = "font-mono text-sm px-6 py-3 uppercase tracking-wider transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-bone text-void border-2 border-bone font-bold shadow-hard hover:shadow-hard-white hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 active:shadow-hard",
    secondary: "bg-void text-bone border-2 border-zinc-700 hover:border-bone hover:shadow-hard",
    danger: "bg-void text-[#FF3333] border-2 border-[#FF3333] hover:bg-[#FF3333]/10 hover:shadow-hard-hazard hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0",
    gold: "bg-void text-[#00FF41] border-2 border-[#00FF41] hover:bg-[#00FF41]/10 hover:shadow-hard-spirit"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    className="w-full bg-[#121212] border-2 border-zinc-700 text-bone p-3 font-mono focus:outline-none focus:border-bone focus:shadow-[0_0_0_2px_rgba(245,245,240,0.1)] transition-all placeholder:text-zinc-600"
    {...props}
  />
);

export const SectionHeader: React.FC<{ title: string, subtitle?: string, onBack?: () => void }> = ({ title, subtitle, onBack }) => (
  <div className="mb-8 border-b border-zinc-800 pb-4">
    {onBack && (
      <button onClick={onBack} className="mb-4 text-xs font-mono text-zinc-500 hover:text-bone flex items-center gap-2 transition-colors">
        &larr; BACK
      </button>
    )}
    <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-bone mb-2">{title}</h2>
    {subtitle && <p className="text-zinc-500 font-mono text-sm">{subtitle}</p>}
  </div>
);

interface ArmoryMapProps {
  items: ArmoryItem[];
}

// ============================================================
// Standalone sub-components (extracted from ArmoryMap per SonarQube)
// ============================================================

interface QuadrantLabels {
  craft: string;
  ritual: string;
  sandbox: string;
  mischief: string;
}

const CustomBackground: React.FC<{ labels: QuadrantLabels }> = ({ labels }) => (
  <g className="pointer-events-none select-none">
    <text x="25%" y="25%" textAnchor="middle" fill="#fff" opacity="0.12" fontSize="16" fontWeight="900" fontFamily="monospace">{labels.craft}</text>
    <text x="75%" y="25%" textAnchor="middle" fill="#fff" opacity="0.12" fontSize="16" fontWeight="900" fontFamily="monospace">{labels.ritual}</text>
    <text x="25%" y="75%" textAnchor="middle" fill="#fff" opacity="0.12" fontSize="16" fontWeight="900" fontFamily="monospace">{labels.sandbox}</text>
    <text x="75%" y="75%" textAnchor="middle" fill="#fff" opacity="0.12" fontSize="16" fontWeight="900" fontFamily="monospace">{labels.mischief}</text>
  </g>
);

const ArmoryTooltipContent: React.FC<{ active?: boolean; payload?: any[] }> = ({ active, payload }) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-void border border-white p-2 font-mono text-xs z-30 relative">
        <p className="font-bold text-bone">{data.verb}</p>
        <p className="text-zinc-400">{data.quadrant}</p>
      </div>
    );
  }
  return null;
};

export const ArmoryMap: React.FC<ArmoryMapProps> = ({ items }) => {
  const { v } = useVernacular();


  const quadrantLabels: QuadrantLabels = {
    craft: v.quadrant_craft,
    ritual: v.quadrant_ritual,
    sandbox: v.quadrant_sandbox,
    mischief: v.quadrant_mischief
  };

  const [activeZone, setActiveZone] = React.useState<Quadrant | null>(null);

  const QUADRANT_INFO = {
    [Quadrant.CRAFT]: {
      title: v.quadrant_craft_title,
      desc: v.quadrant_craft_desc,
      examples: v.quadrant_craft_examples
    },
    [Quadrant.RITUAL]: {
      title: v.quadrant_ritual_title,
      desc: v.quadrant_ritual_desc,
      examples: v.quadrant_ritual_examples
    },
    [Quadrant.SANDBOX]: {
      title: v.quadrant_sandbox_title,
      desc: v.quadrant_sandbox_desc,
      examples: v.quadrant_sandbox_examples
    },
    [Quadrant.MISCHIEF]: {
      title: v.quadrant_mischief_title,
      desc: v.quadrant_mischief_desc,
      examples: v.quadrant_mischief_examples
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate percentage position
    const xPct = x / rect.width;
    const yPct = y / rect.height;

    // Determine Quadrant (Top-Left=Craft, Top-Right=Ritual, Bottom-Left=Sandbox, Bottom-Right=Mischief)
    if (xPct < 0.5 && yPct < 0.5) setActiveZone(Quadrant.CRAFT);
    else if (xPct >= 0.5 && yPct < 0.5) setActiveZone(Quadrant.RITUAL);
    else if (xPct < 0.5 && yPct >= 0.5) setActiveZone(Quadrant.SANDBOX);
    else if (xPct >= 0.5 && yPct >= 0.5) setActiveZone(Quadrant.MISCHIEF);
  };

  return (
    <div
      className="w-full h-[600px] bg-void border-2 border-zinc-700 relative group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setActiveZone(null)}
    >
      {/* Scan lines overlay */}
      <div className="absolute inset-0 pointer-events-none bg-scanlines z-1" />
      {/* Axis Labels */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-zinc-500/50">{v.axis_top}</div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-zinc-500/50">{v.axis_bottom}</div>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-mono text-zinc-500/50">{v.axis_left}</div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-mono text-zinc-500/50">{v.axis_right}</div>

      {/* Visual Feedback Layer (Pointer Events None) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {activeZone === Quadrant.CRAFT && <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-zinc-900/10 transition-colors duration-300" />}
        {activeZone === Quadrant.RITUAL && <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-zinc-900/10 transition-colors duration-300" />}
        {activeZone === Quadrant.SANDBOX && <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-zinc-900/10 transition-colors duration-300" />}
        {activeZone === Quadrant.MISCHIEF && <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-zinc-900/10 transition-colors duration-300" />}
      </div>

      {/* Info Card - Mirror Logic Position */}
      <div
        className={`absolute w-64 bg-void border-2 border-zinc-700 p-4 pointer-events-none transition-all duration-300 z-20 
        ${activeZone ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        ${activeZone === Quadrant.CRAFT ? 'bottom-4 right-4 translate-x-0 translate-y-0' : ''}
        ${activeZone === Quadrant.RITUAL ? 'bottom-4 left-4 translate-x-0 translate-y-0' : ''}
        ${activeZone === Quadrant.SANDBOX ? 'top-4 right-4 translate-x-0 translate-y-0' : ''}
        ${activeZone === Quadrant.MISCHIEF ? 'top-4 left-4 translate-x-0 translate-y-0' : ''}
        ${activeZone ? '' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'}
        `}
      >
        {activeZone && (
          <>
            <h4 className="text-bone font-bold uppercase tracking-wider mb-1">{QUADRANT_INFO[activeZone].title}</h4>
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
          <CustomBackground labels={quadrantLabels} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={ArmoryTooltipContent}
          />
          <Scatter name="Armory" data={items} fill="#fff">
            {items.map((entry, index) => (
              <Cell key={entry.id || `cell-${entry.verb}`} fill={entry.quadrant === Quadrant.RITUAL ? '#ef4444' : '#fff'} />
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
        className="h-full bg-bone transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// ============================================================
// RITUAL COMPONENTS — Phase 4/5 Polish
// ============================================================

export const BurnButton: React.FC<{ onBurn: () => void, className?: string }> = ({ onBurn, className = '' }) => {
  const [progress, setProgress] = React.useState(0);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const startBurn = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onBurn();
          return 100;
        }
        return p + 4; // ~1.5s to fill (25 frames * 60ms)
      });
    }, 60);
  };

  const stopBurn = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress(0);
  };

  return (
    <button
      onMouseDown={startBurn}
      onMouseUp={stopBurn}
      onMouseLeave={stopBurn}
      onTouchStart={startBurn}
      onTouchEnd={stopBurn}
      className={`relative overflow-hidden group border border-red-900/50 text-red-500 hover:text-red-400 hover:border-red-500 hover:bg-red-900/10 transition-all px-3 py-1 text-[10px] font-mono uppercase tracking-widest ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">
        <span className="text-xs">🔥</span> {progress > 0 ? 'HOLD TO BURN...' : 'BURN'}
      </span>
      <div 
        className="absolute bottom-0 left-0 h-full bg-red-600/20 transition-all duration-75 ease-linear z-0"
        style={{ width: `${progress}%` }}
      />
    </button>
  );
};

export const RitualError: React.FC<{ title?: string, message: string, onDismiss?: () => void }> = ({ title = "SYSTEM FAULT", message, onDismiss }) => (
  <div className="border-2 border-[#FF3333] bg-[#FF3333]/5 p-6 relative animate-fade-in">
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 border-2 border-[#FF3333] flex items-center justify-center shrink-0">
        <span className="text-[#FF3333] text-lg font-bold">!</span>
      </div>
      <div className="space-y-2 flex-1">
        <h3 className="text-lg font-mono font-bold text-[#FF3333] uppercase tracking-wider">
          {title}
        </h3>
        <p className="text-sm text-bone font-mono leading-relaxed">
          {message}
        </p>
      </div>
    </div>
    {onDismiss && (
      <button 
        onClick={onDismiss}
        className="absolute top-4 right-4 text-[#FF3333] hover:text-white transition-colors"
      >
        ✕
      </button>
    )}
  </div>
);

export const RitualSuccess: React.FC<{ title: string, message?: string }> = ({ title, message }) => (
  <div className="border-2 border-[#00FF41] bg-[#00FF41]/5 p-6 animate-fade-in text-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-2 border-[#00FF41] rounded-full flex items-center justify-center">
        <span className="text-[#00FF41] text-2xl">✓</span>
      </div>
      <h3 className="text-sm uppercase tracking-[0.3em] text-[#00FF41] font-mono font-bold">
        {title}
      </h3>
      {message && (
        <p className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
          {message}
        </p>
      )}
    </div>
  </div>
);

export const LoadingRitual: React.FC<{ status?: string }> = ({ status = "ESTABLISHING NEURAL LINK..." }) => (
  <div className="flex flex-col items-center justify-center gap-4 animate-pulse">
    <div className="relative">
      <div className="w-3 h-3 bg-[#00FF41] rounded-full animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="w-2 h-2 bg-[#00FF41] rounded-full relative z-10" />
    </div>
    <div className="text-xs font-mono text-[#00FF41] uppercase tracking-[0.2em]">
      {status}
    </div>
  </div>
);