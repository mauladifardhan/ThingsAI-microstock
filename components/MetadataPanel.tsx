
import React, { useState, useMemo } from 'react';
import { ImageMetadata } from '../types';
import { validateMetadata } from '../services/validatorService';
import { Button } from './Button';
import { Copy, Check, Tag, FileText, User, Layers, Sparkles, ShieldCheck, AlertTriangle, AlertOctagon, Info, Zap } from 'lucide-react';

interface MetadataPanelProps {
  metadata: ImageMetadata | undefined;
  isLoading: boolean;
  onGenerate: () => void;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ metadata, isLoading, onGenerate }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'optimize'>('all');

  // Compute validation only when metadata changes
  const validation = useMemo(() => {
    if (!metadata) return null;
    return validateMetadata(metadata);
  }, [metadata]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatKeywords = (keywords: string[]) => keywords.join(', ');

  if (!metadata && !isLoading) {
    return (
      <div className="mt-6 p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center">
        <h3 className="text-zinc-300 font-medium mb-2">Microstock Metadata</h3>
        <p className="text-zinc-500 text-sm mb-4">Generate SEO-optimized titles, descriptions, and keywords for stock sites.</p>
        <Button onClick={onGenerate} variant="secondary" icon={<Sparkles className="w-4 h-4" />}>
          Generate Metadata
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-6 p-8 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-3 animate-pulse">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Analyzing image vision & semantics...</p>
      </div>
    );
  }

  if (!metadata || !validation) return null;

  // Determine score color
  const scoreColor = 
    validation.score >= 90 ? 'text-green-400 border-green-500/30 bg-green-500/10' :
    validation.score >= 70 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
    'text-red-400 border-red-500/30 bg-red-500/10';

  return (
    <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/30 flex items-center justify-between">
        <h3 className="font-medium text-zinc-200 flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-400" />
          Metadata
        </h3>
        <div className="flex gap-1">
           <button 
             onClick={() => setActiveTab('all')}
             className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${activeTab === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
           >
             General
           </button>
           {metadata.keywordAnalysis && (
             <button 
               onClick={() => setActiveTab('optimize')}
               className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${activeTab === 'optimize' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               Optimizer
             </button>
           )}
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Validation Score Card */}
        <div className={`p-4 rounded-lg border ${scoreColor} flex items-start gap-4`}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold">{validation.score}</span>
              <span className="text-xs uppercase tracking-wide font-medium opacity-80">Quality Score</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-current transition-all duration-500"
                style={{ width: `${validation.score}%` }}
              />
            </div>
            {validation.issues.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {validation.issues.slice(0, 3).map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs opacity-90">
                    {issue.type === 'error' ? <AlertOctagon size={12} className="shrink-0 mt-0.5" /> : 
                     issue.type === 'warning' ? <AlertTriangle size={12} className="shrink-0 mt-0.5" /> :
                     <Info size={12} className="shrink-0 mt-0.5" />}
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {activeTab === 'all' ? (
          <>
            {/* Title */}
            <div className="space-y-1.5 group">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Title</label>
                <button 
                  onClick={() => handleCopy(metadata.title, 'title')}
                  className="text-zinc-500 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  {copiedField === 'title' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-sm text-zinc-100 bg-zinc-950/50 p-2 rounded border border-zinc-800/50 font-medium leading-snug">
                {metadata.title}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5 group">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Description</label>
                <button 
                  onClick={() => handleCopy(metadata.description, 'desc')}
                  className="text-zinc-500 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  {copiedField === 'desc' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-sm text-zinc-300 bg-zinc-950/50 p-2 rounded border border-zinc-800/50 leading-relaxed">
                {metadata.description}
              </p>
            </div>

            {/* Keywords */}
            <div className="space-y-2 group">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Keywords ({metadata.keywords.length})
                </label>
                <button 
                  onClick={() => handleCopy(formatKeywords(metadata.keywords), 'keywords')}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-900/20 px-2 py-1 rounded transition-colors"
                >
                  {copiedField === 'keywords' ? <Check size={12} /> : <Copy size={12} />}
                  <span>Copy CSV</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 bg-zinc-950/50 p-3 rounded border border-zinc-800/50 max-h-48 overflow-y-auto custom-scrollbar">
                {metadata.keywords.map((kw, i) => {
                  const isWarning = validation.issues.some(
                    iss => iss.field === 'keywords' && (iss.message.toLowerCase().includes(kw.toLowerCase()))
                  );
                  return (
                    <span 
                      key={i} 
                      className={`px-2 py-1 rounded text-xs border ${
                        isWarning 
                          ? 'bg-red-900/30 text-red-200 border-red-700/50' 
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700/50'
                      }`}
                    >
                      {kw}
                    </span>
                  );
                })}
              </div>
            </div>
            
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800/50">
               {/* ... existing grid items ... */}
               <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase">Content Type</label>
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Layers size={14} className="text-purple-400" />
                  {metadata.contentType}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase">Category</label>
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <FileText size={14} className="text-green-400" />
                  {metadata.category}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* KEYWORD OPTIMIZER TAB */
          <div className="space-y-4">
             <div className="p-3 bg-blue-900/10 border border-blue-900/30 rounded-lg">
               <h4 className="text-xs font-semibold text-blue-300 mb-1 flex items-center gap-1">
                 <Zap size={12} /> Vision Analysis
               </h4>
               <p className="text-[10px] text-zinc-400">
                 Keywords are categorized based on visual analysis of the generated image.
               </p>
             </div>

             {/* Trending */}
             {metadata.keywordAnalysis?.trending && metadata.keywordAnalysis.trending.length > 0 && (
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1">
                   <Sparkles size={10} /> Trending (Visual Est.)
                 </label>
                 <div className="flex flex-wrap gap-1">
                   {metadata.keywordAnalysis.trending.map((kw, i) => (
                     <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-pink-900/20 text-pink-200 border border-pink-800/50">
                       {kw}
                     </span>
                   ))}
                 </div>
               </div>
             )}

             {/* Categories */}
             <div className="space-y-3">
               <div>
                 <label className="text-[10px] font-medium text-zinc-500 uppercase">Broad (Volume)</label>
                 <div className="flex flex-wrap gap-1 mt-1">
                   {metadata.keywordAnalysis?.broad.map((kw, i) => (
                     <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700">
                       {kw}
                     </span>
                   ))}
                 </div>
               </div>

               <div>
                 <label className="text-[10px] font-medium text-zinc-500 uppercase">Medium (Descriptive)</label>
                 <div className="flex flex-wrap gap-1 mt-1">
                   {metadata.keywordAnalysis?.medium.map((kw, i) => (
                     <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                       {kw}
                     </span>
                   ))}
                 </div>
               </div>

               <div>
                 <label className="text-[10px] font-medium text-zinc-500 uppercase">Niche (Specific)</label>
                 <div className="flex flex-wrap gap-1 mt-1">
                   {metadata.keywordAnalysis?.niche.map((kw, i) => (
                     <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-200 border border-zinc-600">
                       {kw}
                     </span>
                   ))}
                 </div>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
