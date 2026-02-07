import React from 'react';

const parseBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`bold-${part}`} className="text-bone font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const lineKey = `line-${i}-${trimmed.slice(0, 16).replaceAll(/\W/g, '')}`;

        if (trimmed === '---' || trimmed === '----') return <hr key={lineKey} className="border-zinc-700 my-6 border-dashed" />;

        if (line.startsWith('# ')) return <h2 key={lineKey} className="text-xl font-display font-black uppercase text-bone mt-8 mb-4 tracking-tight border-b border-zinc-800 pb-2">{parseBold(line.slice(2))}</h2>;
        if (line.startsWith('## ')) return <h3 key={lineKey} className="text-lg font-display font-bold text-bone mt-6 mb-3">{parseBold(line.slice(3))}</h3>;
        if (line.startsWith('### ')) return <h4 key={lineKey} className="text-base font-display font-bold text-zinc-200 mt-4 mb-2">{parseBold(line.slice(4))}</h4>;

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={lineKey} className="flex gap-3 ml-2 mb-2">
              <span className="text-zinc-500 mt-1">•</span>
              <span className="text-zinc-300">{parseBold(trimmed.substring(2))}</span>
            </div>
          );
        }

        if (/^\d+\./.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\./);
          const num = match ? match[1] : '•';
          return (
            <div key={lineKey} className="flex gap-3 ml-2 mb-2">
              <span className="text-zinc-500 font-mono text-xs pt-1 w-4 text-right shrink-0">{num}.</span>
              <span className="text-zinc-300">{parseBold(trimmed.replace(/^\d+\.\s*/, ''))}</span>
            </div>
          )
        }

        if (!trimmed) return <div key={lineKey} className="h-2" />;

        return <p key={lineKey} className="text-zinc-400 leading-relaxed mb-2">{parseBold(line)}</p>;
      })}
    </div>
  );
};
