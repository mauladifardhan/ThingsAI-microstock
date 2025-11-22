import React from 'react';
import { EXAMPLES } from '../constants';
import { PromptExample } from '../types';
import { Coffee, Briefcase, Cpu, Box, Layers } from 'lucide-react';

interface PromptLibraryProps {
  onSelect: (prompt: string) => void;
}

// Mapping string icon names to components for rendering
const IconMap: Record<string, React.FC<{ className?: string }>> = {
  Coffee,
  Briefcase,
  Cpu,
  Box,
  Layers
};

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
      {EXAMPLES.map((ex) => {
        const Icon = IconMap[ex.icon] || Box;
        return (
          <button
            key={ex.label}
            onClick={() => onSelect(ex.prompt)}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-blue-500/50 hover:text-blue-400 transition-all group text-center h-24"
          >
            <Icon className="mb-2 w-5 h-5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
            <span className="text-xs font-medium text-zinc-300 group-hover:text-white">{ex.label}</span>
          </button>
        );
      })}
    </div>
  );
};