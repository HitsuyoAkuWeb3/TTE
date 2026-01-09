import React, { useState, useEffect, useRef } from 'react';
import { 
  Phase, 
  SystemState, 
  INITIAL_STATE, 
  ArmoryItem, 
  Quadrant,
  ToolCandidate
} from './types';
import { 
  classifyActivity, 
  synthesizeToolDefinition, 
  synthesizeSovereignAuthority,
  generatePilotProtocol, 
  generateAudioDossier,
  validateMarketWithSearch,
  connectLiveSession,
  disconnectLiveSession,
  pcmToAudioBuffer
} from './services/geminiService';
import { Button, Input, SectionHeader, ArmoryMap, ProgressBar } from './components/Visuals';

// --- Markdown Helper ---

const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === '---' || trimmed === '----') return <hr key={i} className="border-zinc-700 my-6 border-dashed" />;
        
        if (line.startsWith('# ')) return <h2 key={i} className="text-xl font-black uppercase text-white mt-8 mb-4 tracking-tight border-b border-zinc-800 pb-2">{parseBold(line.slice(2))}</h2>;
        if (line.startsWith('## ')) return <h3 key={i} className="text-lg font-bold text-white mt-6 mb-3">{parseBold(line.slice(3))}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} className="text-base font-bold text-zinc-200 mt-4 mb-2">{parseBold(line.slice(4))}</h4>;
        
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
                <div key={i} className="flex gap-3 ml-2 mb-2">
                    <span className="text-zinc-500 mt-1">•</span>
                    <span className="text-zinc-300">{parseBold(trimmed.substring(2))}</span>
                </div>
            );
        }
        
        if (/^\d+\./.test(trimmed)) {
             const match = trimmed.match(/^(\d+)\./);
             const num = match ? match[1] : '•';
             return (
                 <div key={i} className="flex gap-3 ml-2 mb-2">
                     <span className="text-zinc-500 font-mono text-xs pt-1 w-4 text-right flex-shrink-0">{num}.</span>
                     <span className="text-zinc-300">{parseBold(trimmed.replace(/^\d+\.\s*/, ''))}</span>
                 </div>
             )
        }

        if (!trimmed) return <div key={i} className="h-2" />;

        return <p key={i} className="text-zinc-400 leading-relaxed mb-2">{parseBold(line)}</p>;
      })}
    </div>
  );
};

// --- Sub-components (Phases) defined within App context for state simplicity ---

const IntroPhase: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-2xl mx-auto px-6">
    <div className="mb-8 relative">
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 uppercase">
        Tetra<br/>Tool<br/>Engine
      </h1>
      <div className="absolute inset-0 bg-white/5 blur-3xl -z-10 rounded-full"></div>
    </div>
    <p className="font-mono text-zinc-400 mb-8 max-w-lg leading-relaxed">
      POST-NEON DIAGNOSTIC ENGINE v2.0<br/>
      <span className="text-zinc-600">--------------------------------</span><br/>
      Identify, validate, and install your unextractable Starting Tool.
      This is not a quiz. It is an architecture protocol.
      No receipts = No progression.
    </p>
    <Button onClick={onStart}>Initialize System</Button>
  </div>
);

const PRESETS = [
  "Writing Code", "Designing UI", "Sales Calls", "Debugging", 
  "Writing Copy", "Project Management", "Creating Content", 
  "Financial Planning", "Public Speaking", "Team Leadership",
  "Researching", "Editing Video", "Customer Support", "Data Analysis"
];

const ArmoryAuditPhase: React.FC<{ 
  items: ArmoryItem[], 
  onAddItem: (verb: string, x: number, y: number) => void,
  onUpdateItem: (id: string, x: number, y: number) => void,
  onNext: () => void,
  onBack: () => void
}> = ({ items, onAddItem, onUpdateItem, onNext, onBack }) => {
  const [verb, setVerb] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);

  const processItem = async (text: string) => {
    if (!text.trim()) return;
    setIsClassifying(true);
    // Uses gemini-2.5-flash-lite for speed
    const pos = await classifyActivity(text);
    onAddItem(text, pos.x, pos.y);
    setVerb('');
    setIsClassifying(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processItem(verb);
  };

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in">
      <SectionHeader 
        title="Phase 1: Armory Audit" 
        subtitle="List every recurring activity. Verbs only. No metaphors."
        onBack={onBack}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input 
              value={verb} 
              onChange={(e) => setVerb(e.target.value)} 
              placeholder="e.g., Edit copy, Design workflows"
              disabled={isClassifying}
            />
            <Button type="submit" disabled={isClassifying}>
              {isClassifying ? '...' : 'Add'}
            </Button>
          </form>

          <div className="bg-zinc-900/30 p-4 border border-zinc-800">
             <p className="text-xs uppercase text-zinc-500 mb-3 font-mono">Quick Add (Analysis Paralysis Breakers)</p>
             <div className="flex flex-wrap gap-2">
               {PRESETS.map(preset => (
                 <button 
                   key={preset}
                   disabled={isClassifying || items.some(i => i.verb === preset)}
                   onClick={() => processItem(preset)}
                   className="text-[10px] uppercase font-mono px-2 py-1 border border-zinc-700 bg-zinc-900 hover:border-zinc-400 hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                 >
                   {preset}
                 </button>
               ))}
             </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
            {items.map(item => (
              <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-white uppercase">{item.verb}</span>
                  <span className="text-xs font-mono text-zinc-500 uppercase">{item.quadrant}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 w-12 text-right">CONST</span>
                    <input 
                      type="range" min="-10" max="10" step="1" 
                      value={item.x}
                      onChange={(e) => {
                        const newX = parseInt(e.target.value);
                        onUpdateItem(item.id, newX, item.y);
                      }}
                      className="w-full accent-white h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-500 w-12">DISRUPT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 w-12 text-right">PLAY</span>
                    <input 
                      type="range" min="-10" max="10" step="1" 
                      value={item.y}
                      onChange={(e) => {
                        const newY = parseInt(e.target.value);
                        onUpdateItem(item.id, item.x, newY);
                      }}
                      className="w-full accent-white h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-500 w-12">DISCIPL</span>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-zinc-600 italic text-sm">Armory empty. Add at least 3 items to map your arsenal.</p>
            )}
          </div>
        </div>

        <div>
          <ArmoryMap items={items} />
          <div className="mt-6 p-4 border border-yellow-900/50 bg-yellow-900/10 text-yellow-200 text-sm font-mono">
             WARNING: Ensure you have items in the <span className="font-bold">RITUAL</span> or <span className="font-bold">CRAFT</span> quadrants. 
             Pure Sandbox items cannot become infrastructure.
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={onNext} disabled={items.length < 3}>
          Proceed to Compression &rarr;
        </Button>
      </div>
    </div>
  );
};

const ToolCompressionPhase: React.FC<{
  armory: ArmoryItem[],
  onSelectCandidates: (candidates: ToolCandidate[]) => void,
  onNext: () => void,
  onBack: () => void
}> = ({ armory, onSelectCandidates, onNext, onBack }) => {
  const [selections, setSelections] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<ToolCandidate[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [synthesizingSovereign, setSynthesizingSovereign] = useState(false);

  const toggleSelection = (id: string) => {
    if (selections.includes(id)) {
      setSelections(s => s.filter(x => x !== id));
    } else {
      if (selections.length < 3) {
        setSelections(s => [...s, id]);
      }
    }
  };

  const handleCompress = async () => {
    setAnalyzing(true);
    const newCandidates: ToolCandidate[] = [];

    // gemini-3-pro-preview (Thinking) processes each item deeply
    for (const id of selections) {
      const item = armory.find(i => i.id === id);
      if (!item) continue;

      const analysis = await synthesizeToolDefinition(item.verb, item.quadrant);
      
      newCandidates.push({
        id: item.id,
        originalVerb: item.verb,
        plainName: analysis.plainName,
        functionStatement: analysis.functionStatement,
        promise: analysis.promise,
        antiPitch: analysis.antiPitch,
        scores: { unbiddenRequests: false, frictionlessDoing: false, resultEvidence: false, extractionRisk: false },
        proofs: {}
      });
    }

    setCandidates(newCandidates);
    onSelectCandidates(newCandidates);
    setAnalyzing(false);
  };

  const handleSovereign = async () => {
      setSynthesizingSovereign(true);
      const sovereign = await synthesizeSovereignAuthority(candidates);
      const result = [sovereign];
      setCandidates(result);
      onSelectCandidates(result);
      setSynthesizingSovereign(false);
  }

  if (candidates.length > 0) {
    // Check if we already have a single Sovereign candidate
    const isSovereign = candidates.length === 1 && candidates[0].isSovereign;

    return (
      <div className="max-w-5xl mx-auto w-full animate-fade-in">
        <SectionHeader 
          title="Phase 2: Market Synthesis" 
          subtitle="The Engine has compressed your skills into commercially viable functions."
          onBack={onBack}
        />
        <div className={`grid grid-cols-1 ${isSovereign ? 'md:grid-cols-1 max-w-2xl mx-auto' : 'md:grid-cols-3'} gap-6`}>
          {candidates.map((c, idx) => (
            <div 
              key={c.id} 
              className={`border bg-zinc-900/50 flex flex-col h-full relative group transition-all duration-500
                ${c.isSovereign ? 'border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]' : 'border-zinc-700'}
              `}
            >
              <div className={`absolute top-0 right-0 p-2 text-black text-[10px] font-bold uppercase
                  ${c.isSovereign ? 'bg-yellow-500' : 'bg-white'}
              `}>
                {c.isSovereign ? 'SOVEREIGN AUTHORITY' : `Candidate 0${idx + 1}`}
              </div>
              <div className="p-6 flex-grow">
                <div className="text-zinc-500 font-mono text-xs mb-2 uppercase">{c.originalVerb}</div>
                <h3 className="text-2xl font-black mb-4 text-white uppercase break-words">{c.plainName}</h3>
                
                <div className="space-y-4">
                  <div>
                     <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Function</label>
                     <p className="text-sm font-mono text-zinc-300">{c.functionStatement}</p>
                  </div>
                  <div>
                     <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">The Promise</label>
                     <p className="text-sm font-mono text-zinc-300">{c.promise}</p>
                  </div>
                  <div>
                     <label className="text-[10px] text-red-500/70 uppercase font-bold block mb-1">Anti-Pitch</label>
                     <p className="text-sm font-mono text-zinc-400 italic">"{c.antiPitch}"</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 flex justify-between items-center border-t border-zinc-800 pt-6">
           {/* Option to refine into Sovereign if we haven't already */}
           {!isSovereign ? (
              <Button 
                variant="gold" 
                onClick={handleSovereign} 
                disabled={synthesizingSovereign}
                className="flex-1 mr-4"
              >
                  {synthesizingSovereign ? 'Synthesizing Authority...' : 'Refine into One Sovereign Authority'}
              </Button>
           ) : <div className="flex-1"></div>}

          <Button onClick={onNext}>Proceed to Evidence &rarr;</Button>
        </div>
      </div>
    );
  }

  // Selection View
  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in">
      <SectionHeader 
        title="Phase 2: Skill Selection" 
        subtitle="Select 3 core activities. The AI will synthesize them into market roles." 
        onBack={onBack}
      />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {armory.map(item => (
          <button
            key={item.id}
            onClick={() => toggleSelection(item.id)}
            className={`p-4 border text-left transition-all ${
              selections.includes(item.id) 
                ? 'border-white bg-white text-black' 
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            <div className="font-bold text-sm mb-1">{item.verb}</div>
            <div className="text-[10px] font-mono opacity-60">{item.quadrant}</div>
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-4 items-center">
        <span className="font-mono text-zinc-500 text-sm">{selections.length} / 3 Selected</span>
        <Button 
          disabled={selections.length !== 3 || analyzing} 
          onClick={handleCompress}
        >
          {analyzing ? (
            <span className="flex items-center gap-2">
               <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
               Synthesizing Market Function...
            </span>
          ) : 'Compress into Market Function'}
        </Button>
      </div>
      {analyzing && (
        <div className="text-center mt-4 text-xs font-mono text-zinc-500 animate-pulse">
          Applying 32k context reasoning to niche down...
        </div>
      )}
    </div>
  );
};

const EvidenceScoringPhase: React.FC<{
  candidates: ToolCandidate[],
  onUpdateCandidate: (candidates: ToolCandidate[]) => void,
  onNext: () => void,
  onBack: () => void
}> = ({ candidates, onUpdateCandidate, onNext, onBack }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeCandidate = candidates[activeIndex];

  const updateScore = (key: keyof ToolCandidate['scores'], val: boolean) => {
    const updated = [...candidates];
    updated[activeIndex].scores[key] = val;
    onUpdateCandidate(updated);
  };

  const updateProof = (key: keyof ToolCandidate['proofs'], val: string) => {
    const updated = [...candidates];
    updated[activeIndex].proofs = { ...updated[activeIndex].proofs, [key]: val };
    onUpdateCandidate(updated);
  };

  const isComplete = candidates.every(c => 
    (c.scores.unbiddenRequests ? !!c.proofs.unbidden : true) &&
    (c.scores.resultEvidence ? !!c.proofs.result : true)
  );

  return (
    <div className="max-w-3xl mx-auto w-full animate-fade-in">
      <SectionHeader 
        title="Phase 3: Evidence Gates" 
        subtitle="Binary Proof. No receipts = No progression."
        onBack={onBack}
      />
      
      <div className="flex gap-2 mb-8 border-b border-zinc-800 overflow-x-auto">
        {candidates.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActiveIndex(i)}
            className={`px-4 py-2 font-mono text-sm border-b-2 transition-colors whitespace-nowrap ${
              i === activeIndex 
                ? (c.isSovereign ? 'border-yellow-500 text-yellow-500' : 'border-white text-white') 
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {c.plainName}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        <div className="border border-zinc-800 p-6">
          <h3 className="text-xl font-bold mb-4 text-white">1. Unbidden Requests</h3>
          <p className="text-zinc-400 mb-4 text-sm">Do you have 3 DMs/Emails asking for this specifically?</p>
          <div className="flex gap-4 mb-4">
            <Button 
              variant={activeCandidate.scores.unbiddenRequests ? 'primary' : 'secondary'}
              onClick={() => updateScore('unbiddenRequests', true)}
            >Yes</Button>
            <Button 
              variant={!activeCandidate.scores.unbiddenRequests ? 'primary' : 'secondary'}
              onClick={() => updateScore('unbiddenRequests', false)}
            >No</Button>
          </div>
          {activeCandidate.scores.unbiddenRequests && (
            <div className="animate-fade-in">
              <label className="block text-xs uppercase text-zinc-500 mb-1">Paste Evidence</label>
              <textarea 
                className="w-full bg-zinc-900 border border-zinc-700 text-white p-2 font-mono text-sm h-20"
                placeholder="Paste the DM content here..."
                value={activeCandidate.proofs.unbidden || ''}
                onChange={(e) => updateProof('unbidden', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="border border-zinc-800 p-6">
          <h3 className="text-xl font-bold mb-4 text-white">2. Frictionless Doing</h3>
          <p className="text-zinc-400 mb-4 text-sm">Can you deliver the <b>{activeCandidate.promise}</b> in 30 mins with zero prep?</p>
          <div className="flex gap-4">
             <Button 
              variant={activeCandidate.scores.frictionlessDoing ? 'primary' : 'secondary'}
              onClick={() => updateScore('frictionlessDoing', true)}
            >Yes</Button>
            <Button 
              variant={!activeCandidate.scores.frictionlessDoing ? 'primary' : 'secondary'}
              onClick={() => updateScore('frictionlessDoing', false)}
            >No</Button>
          </div>
        </div>

        <div className="border border-zinc-800 p-6">
          <h3 className="text-xl font-bold mb-4 text-white">3. Result Evidence</h3>
          <p className="text-zinc-400 mb-4 text-sm">Do you have a Case Study or Testimonial?</p>
          <div className="flex gap-4 mb-4">
            <Button 
              variant={activeCandidate.scores.resultEvidence ? 'primary' : 'secondary'}
              onClick={() => updateScore('resultEvidence', true)}
            >Yes</Button>
            <Button 
              variant={!activeCandidate.scores.resultEvidence ? 'primary' : 'secondary'}
              onClick={() => updateScore('resultEvidence', false)}
            >No</Button>
          </div>
          {activeCandidate.scores.resultEvidence && (
            <div className="animate-fade-in">
              <label className="block text-xs uppercase text-zinc-500 mb-1">Paste Evidence</label>
              <textarea 
                className="w-full bg-zinc-900 border border-zinc-700 text-white p-2 font-mono text-sm h-20"
                placeholder="Paste the testimonial or metric..."
                value={activeCandidate.proofs.result || ''}
                onChange={(e) => updateProof('result', e.target.value)}
              />
            </div>
          )}
        </div>
        
        <div className="border border-red-900/30 p-6 bg-red-900/5">
          <h3 className="text-xl font-bold mb-4 text-red-400">4. Extraction Risk</h3>
          <p className="text-zinc-400 mb-4 text-sm">Is this a job or an asset? If you stop, does it stop?</p>
          <div className="flex gap-4">
             <Button 
              variant={activeCandidate.scores.extractionRisk ? 'danger' : 'secondary'}
              onClick={() => updateScore('extractionRisk', true)}
            >Yes (Job)</Button>
            <Button 
              variant={!activeCandidate.scores.extractionRisk ? 'primary' : 'secondary'}
              onClick={() => updateScore('extractionRisk', false)}
            >No (Asset)</Button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={onNext} disabled={!isComplete}>Audit Completion &rarr;</Button>
      </div>
    </div>
  );
};

const ToolLockPhase: React.FC<{
  candidates: ToolCandidate[],
  onLock: (id: string) => void,
  onBack: () => void
}> = ({ candidates, onLock, onBack }) => {
  const getScore = (c: ToolCandidate) => {
    let score = 0;
    if (c.scores.unbiddenRequests) score += 2;
    if (c.scores.frictionlessDoing) score += 1;
    if (c.scores.resultEvidence) score += 2;
    if (c.scores.extractionRisk) score -= 1;
    return score;
  };

  const sorted = [...candidates].sort((a, b) => getScore(b) - getScore(a));

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in text-center">
      <SectionHeader title="Phase 4: The Verdict" onBack={onBack} />
      
      <div className={`grid grid-cols-1 ${candidates.length === 1 ? 'max-w-xl mx-auto' : 'md:grid-cols-3'} gap-6 mb-12`}>
        {sorted.map((c, i) => (
          <div 
            key={c.id} 
            className={`border p-6 flex flex-col transition-all
                ${i === 0 ? 'border-white bg-zinc-900 transform scale-105' : 'border-zinc-800 opacity-50'}
                ${c.isSovereign ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : ''}
            `}
          >
            <h3 className="text-xl font-bold mb-2 break-words">{c.plainName}</h3>
            <div className="text-4xl font-mono mb-4">{getScore(c)} <span className="text-sm text-zinc-500">PTS</span></div>
            <p className="text-xs text-zinc-400 mb-6">{c.functionStatement}</p>
            {i === 0 && (
              <Button onClick={() => onLock(c.id)} variant={c.isSovereign ? 'gold' : 'primary'}>
                  Confirm Starting Tool
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const InstallationPhase: React.FC<{
  tool: ToolCandidate,
  plan: string | null,
  onGeneratePlan: () => void,
  onBack: () => void,
  isGenerating: boolean
}> = ({ tool, plan, onGeneratePlan, onBack, isGenerating }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [validating, setValidating] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  const handleTTS = async () => {
    if (!plan) return;
    setIsPlaying(true);
    const buffer = await generateAudioDossier(plan.slice(0, 500)); // Limit for preview
    if (buffer) {
       const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
       
       const data = new Uint8Array(buffer);
       const audioBuffer = await pcmToAudioBuffer(data, ctx, 24000, 1);
       
       const source = ctx.createBufferSource();
       source.buffer = audioBuffer;
       source.connect(ctx.destination);
       source.start(0);
       source.onended = () => setIsPlaying(false);
    } else {
        setIsPlaying(false);
    }
  };

  const handleValidation = async () => {
      setValidating(true);
      const urls = await validateMarketWithSearch(tool.plainName);
      if (urls.length > 0) {
        // Just a simple alert or state update for now
        tool.marketValidation = urls;
      }
      setValidating(false);
  }

  const toggleLiveSession = async () => {
      if (liveConnected) {
          await disconnectLiveSession();
          setLiveConnected(false);
      } else {
          try {
            const session = await connectLiveSession();
            // Send context
            session.sendRealtimeInput([{
                mimeType: "text/plain",
                data: btoa(`The user has selected the tool: ${tool.plainName}. Function: ${tool.functionStatement}. Promise: ${tool.promise}. Challenge them on how they will monetize this on Day 1.`)
            }]);
            setLiveConnected(true);
          } catch (e) {
              console.error("Live Error", e);
              alert("Microphone access required for Live API.");
          }
      }
  }

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in pb-20">
       <div className={`border p-8 bg-black relative overflow-hidden
           ${tool.isSovereign ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'border-white'}
       `}>
         <div className={`absolute top-0 right-0 p-2 text-black font-mono text-xs font-bold
             ${tool.isSovereign ? 'bg-yellow-500' : 'bg-white'}
         `}>
             {tool.isSovereign ? 'SOVEREIGN DOSSIER' : 'OFFICIAL DOSSIER'}
         </div>
         
         <div className="mb-4">
             <button onClick={onBack} className="text-xs font-mono text-zinc-500 hover:text-white">&larr; CHANGE TOOL</button>
         </div>

         <h2 className="text-4xl font-black uppercase mb-2 break-words">{tool.plainName}</h2>
         <p className="font-mono text-zinc-400 mb-8 border-b border-zinc-800 pb-4">{tool.functionStatement}</p>
         
         <div className="grid md:grid-cols-2 gap-8 mb-8">
           <div>
             <h4 className="text-xs uppercase text-zinc-500 mb-2">Proof Ledger</h4>
             <ul className="text-sm font-mono space-y-2">
                <li className="flex items-center gap-2">
                  <span className={tool.scores.unbiddenRequests ? "text-green-500" : "text-red-500"}>●</span> Unbidden Demand
                </li>
                <li className="flex items-center gap-2">
                  <span className={tool.scores.frictionlessDoing ? "text-green-500" : "text-red-500"}>●</span> Frictionless
                </li>
             </ul>
           </div>
           <div>
             <h4 className="text-xs uppercase text-zinc-500 mb-2">Market Status</h4>
             <div className="text-sm font-mono mb-2">
               {tool.scores.extractionRisk 
                 ? <span className="text-red-500 font-bold bg-red-900/20 px-2 py-1">CONTAINMENT REQ</span> 
                 : <span className="text-green-500 font-bold bg-green-900/20 px-2 py-1">SCALABLE ASSET</span>
               }
             </div>
             <button 
               onClick={handleValidation}
               disabled={validating}
               className="text-[10px] underline text-zinc-400 hover:text-white"
            >
               {validating ? 'Searching Grounding...' : 'Run Market Search Check'}
             </button>
             {tool.marketValidation && (
                 <div className="mt-2 space-y-1">
                     {tool.marketValidation.map((u, i) => (
                         <a key={i} href={u} target="_blank" className="block text-[10px] text-blue-400 truncate">{u}</a>
                     ))}
                 </div>
             )}
           </div>
         </div>

         {!plan ? (
            <div className="text-center py-12 border-t border-zinc-800 border-dashed">
              <Button onClick={onGeneratePlan} disabled={isGenerating}>
                {isGenerating ? 'Architecting Pilot...' : 'Generate 7-Day Pilot Protocol'}
              </Button>
            </div>
         ) : (
           <div className="animate-fade-in border-t border-zinc-800 pt-6">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold uppercase">7-Day Installation Protocol</h3>
                  <Button onClick={handleTTS} disabled={isPlaying} variant="secondary" className="!py-1 !px-3 !text-xs">
                      {isPlaying ? 'Broadcasting...' : 'Listen to Protocol'}
                  </Button>
              </div>
              <div className="font-mono text-sm leading-relaxed text-zinc-300 bg-zinc-900/50 p-6 border-l-2 border-white max-h-[500px] overflow-y-auto">
                <SimpleMarkdown text={plan} />
              </div>
           </div>
         )}
       </div>

       <div className="mt-8 flex justify-center w-full">
            <Button 
                onClick={toggleLiveSession} 
                variant={liveConnected ? "danger" : "secondary"} 
                className={`w-full ${liveConnected ? 'border-red-500 bg-red-900/10 hover:bg-red-900/30' : 'border-green-900 text-green-500 hover:bg-green-900/20'}`}
            >
                {liveConnected ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        LIVE LINK ACTIVE (CLICK TO DISCONNECT)
                    </span>
                ) : (
                    "Initialize Live Consultation (Voice Mode)"
                )}
            </Button>
       </div>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<SystemState>(INITIAL_STATE);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const getProgress = () => {
    switch (state.currentPhase) {
      case Phase.INTRO: return 0;
      case Phase.ARMORY_AUDIT: return 20;
      case Phase.TOOL_COMPRESSION: return 40;
      case Phase.EVIDENCE_SCORING: return 60;
      case Phase.TOOL_LOCK: return 80;
      case Phase.INSTALLATION: return 100;
      default: return 0;
    }
  };

  const handleUpdateItem = (id: string, x: number, y: number) => {
    setState(s => ({
      ...s,
      armory: s.armory.map(i => i.id === id ? { ...i, x, y, quadrant: getQuadrant(x,y) } : i)
    }));
  };

  const getQuadrant = (x: number, y: number): Quadrant => {
    if (x > 0 && y > 0) return Quadrant.RITUAL; 
    if (x > 0 && y <= 0) return Quadrant.MISCHIEF; 
    if (x <= 0 && y > 0) return Quadrant.CRAFT; 
    return Quadrant.SANDBOX; 
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-white selection:text-black">
      <ProgressBar current={getProgress()} total={100} />
      
      <main className="container mx-auto px-4 py-16 md:py-24">
        {state.currentPhase === Phase.INTRO && (
          <IntroPhase onStart={() => setState(s => ({ ...s, currentPhase: Phase.ARMORY_AUDIT }))} />
        )}

        {state.currentPhase === Phase.ARMORY_AUDIT && (
          <ArmoryAuditPhase 
            items={state.armory}
            onAddItem={(verb, x, y) => {
              const newItem: ArmoryItem = {
                id: Math.random().toString(36).substr(2, 9),
                verb,
                x: x,
                y: y,
                quadrant: getQuadrant(x, y)
              };
              setState(s => ({ ...s, armory: [...s.armory, newItem] }));
            }}
            onUpdateItem={handleUpdateItem}
            onNext={() => setState(s => ({ ...s, currentPhase: Phase.TOOL_COMPRESSION }))}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.INTRO }))}
          />
        )}

        {state.currentPhase === Phase.TOOL_COMPRESSION && (
          <ToolCompressionPhase 
            armory={state.armory}
            onSelectCandidates={(candidates) => setState(s => ({ ...s, candidates }))}
            onNext={() => setState(s => ({ ...s, currentPhase: Phase.EVIDENCE_SCORING }))}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.ARMORY_AUDIT }))}
          />
        )}

        {state.currentPhase === Phase.EVIDENCE_SCORING && (
          <EvidenceScoringPhase 
            candidates={state.candidates}
            onUpdateCandidate={(candidates) => setState(s => ({ ...s, candidates }))}
            onNext={() => setState(s => ({ ...s, currentPhase: Phase.EVIDENCE_SCORING }))}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.TOOL_COMPRESSION }))}
          />
        )}

        {state.currentPhase === Phase.TOOL_LOCK && (
          <ToolLockPhase 
            candidates={state.candidates}
            onLock={(id) => setState(s => ({ ...s, selectedToolId: id, currentPhase: Phase.INSTALLATION }))}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.EVIDENCE_SCORING }))}
          />
        )}

        {state.currentPhase === Phase.INSTALLATION && state.selectedToolId && (
          <InstallationPhase 
            tool={state.candidates.find(c => c.id === state.selectedToolId)!}
            plan={state.pilotPlan}
            isGenerating={isGeneratingPlan}
            onGeneratePlan={async () => {
              setIsGeneratingPlan(true);
              const tool = state.candidates.find(c => c.id === state.selectedToolId)!;
              const plan = await generatePilotProtocol(tool.plainName, tool.functionStatement);
              setState(s => ({ ...s, pilotPlan: plan }));
              setIsGeneratingPlan(false);
            }}
            onBack={() => setState(s => ({ ...s, currentPhase: Phase.TOOL_LOCK }))}
          />
        )}
      </main>
    </div>
  );
}