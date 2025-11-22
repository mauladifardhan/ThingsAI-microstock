import React from 'react';
import { GenerationParams, AspectRatio, ImageQuality, StylePreset } from '../types';
import { Button } from './Button';
import { ASPECT_RATIOS, QUALITIES, STYLES } from '../constants';
import { Settings2, Wand2, Sparkles } from 'lucide-react';

interface ControlPanelProps {
  params: GenerationParams;
  setParams: React.Dispatch<React.SetStateAction<GenerationParams>>;
  onGenerate: () => void;
  isGenerating: boolean;
  hasApiKey: boolean;
  onSelectKey: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  setParams,
  onGenerate,
  isGenerating,
  hasApiKey,
  onSelectKey
}) => {
  const handleChange = <K extends keyof GenerationParams>(key: K, value: GenerationParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 p-6 overflow-y-auto w-full lg:w-80 shrink-0">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="text-blue-500" />
          GenStudio Pro
        </h1>
        <p className="text-xs text-zinc-500 mt-1">Powered by Gemini 3 Pro Image</p>
      </div>

      {!hasApiKey && (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
          <p className="text-yellow-200 text-sm mb-3">Access to Gemini 3 models requires a paid API key.</p>
          <Button variant="secondary" size="sm" onClick={onSelectKey} className="w-full">
            Connect API Key
          </Button>
        </div>
      )}

      <div className="space-y-6 grow">
        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Prompt</label>
          <textarea
            value={params.prompt}
            onChange={(e) => handleChange('prompt', e.target.value)}
            placeholder="Describe your image in detail..."
            className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio}
                onClick={() => handleChange('aspectRatio', ratio)}
                className={`text-xs py-2 px-1 rounded-md border transition-all ${
                  params.aspectRatio === ratio
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Style Preset */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Style Preset</label>
          <select
            value={params.style}
            onChange={(e) => handleChange('style', e.target.value as StylePreset)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100 focus:ring-2 focus:ring-blue-500"
          >
            {STYLES.map((style) => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </div>

        {/* Quality */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Resolution</label>
          <div className="flex gap-2 p-1 bg-zinc-800 rounded-lg border border-zinc-700">
            {QUALITIES.map((q) => (
              <button
                key={q}
                onClick={() => handleChange('quality', q)}
                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${
                  params.quality === q
                    ? 'bg-zinc-600 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Microstock Switch */}
        <div className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-200">Stock Mode</span>
            <span className="text-[10px] text-zinc-500">Safe, no brands, HQ</span>
          </div>
          <button
            onClick={() => handleChange('optimizeForMicrostock', !params.optimizeForMicrostock)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
              params.optimizeForMicrostock ? 'bg-blue-600' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                params.optimizeForMicrostock ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8 pt-6 border-t border-zinc-800 sticky bottom-0 bg-zinc-900 pb-2">
        <Button
          onClick={onGenerate}
          isLoading={isGenerating}
          disabled={!params.prompt.trim() || !hasApiKey}
          className="w-full"
          size="lg"
          icon={<Wand2 className="w-4 h-4" />}
        >
          Generate Image
        </Button>
        <p className="text-[10px] text-center text-zinc-600 mt-3">
          Uses Google Gemini 3 Pro (Imagen)
        </p>
      </div>
    </div>
  );
};