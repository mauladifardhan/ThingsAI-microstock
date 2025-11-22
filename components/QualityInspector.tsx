
import React from 'react';
import { QualityAssessment } from '../types';
import { Button } from './Button';
import { Microscope, CheckCircle2, XCircle, AlertTriangle, Activity, Eye } from 'lucide-react';

interface QualityInspectorProps {
  assessment: QualityAssessment | undefined;
  isLoading: boolean;
  onAnalyze: () => void;
}

export const QualityInspector: React.FC<QualityInspectorProps> = ({ assessment, isLoading, onAnalyze }) => {
  
  if (!assessment && !isLoading) {
    return (
      <div className="mt-6 p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-purple-900/20 flex items-center justify-center mb-3">
          <Microscope className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-zinc-300 font-medium mb-2">Quality Inspection</h3>
        <p className="text-zinc-500 text-sm mb-4 max-w-xs">
          Scan your image for anatomy errors, artifacts, and microstock rejection risks.
        </p>
        <Button onClick={onAnalyze} variant="primary" className="bg-purple-600 hover:bg-purple-700">
          Run Inspection
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-6 p-8 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Eye size={16} className="text-purple-500" />
          </div>
        </div>
        <p className="text-zinc-400 text-sm font-medium">Scanning pixels for defects...</p>
      </div>
    );
  }

  if (!assessment) return null;

  const { score, microstock_pass, issues, explanation } = assessment;
  const isPass = microstock_pass;
  const scoreColor = isPass ? 'text-green-400' : score > 60 ? 'text-yellow-400' : 'text-red-400';
  const progressColor = isPass ? 'bg-green-500' : score > 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/30 flex items-center justify-between">
        <h3 className="font-medium text-zinc-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          Inspection Report
        </h3>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
          {new Date(assessment.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className="p-5 space-y-6">
        {/* Score & Status Header */}
        <div className="flex items-center gap-5">
          {/* Circular Gauge Placeholder (using simple CSS conic or svg) */}
          <div className="relative w-20 h-20 flex-shrink-0">
             <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
               <path
                 className="text-zinc-800"
                 d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                 fill="none"
                 stroke="currentColor"
                 strokeWidth="3"
               />
               <path
                 className={isPass ? "text-green-500" : score > 60 ? "text-yellow-500" : "text-red-500"}
                 strokeDasharray={`${score}, 100`}
                 d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                 fill="none"
                 stroke="currentColor"
                 strokeWidth="3"
               />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center flex-col">
               <span className={`text-xl font-bold ${scoreColor}`}>{score}</span>
             </div>
          </div>

          <div className="flex-1">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border mb-2 ${
              isPass 
              ? 'bg-green-900/20 text-green-400 border-green-800' 
              : 'bg-red-900/20 text-red-400 border-red-800'
            }`}>
              {isPass ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {isPass ? 'MICROSTOCK PASS' : 'REJECT RISK'}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {explanation}
            </p>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-3 pt-2 border-t border-zinc-800/50">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Detected Issues</h4>
          
          {issues.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-400/80 italic bg-green-900/10 p-3 rounded border border-green-900/20">
              <CheckCircle2 size={16} />
              No significant defects found.
            </div>
          ) : (
            <ul className="space-y-2">
              {issues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-300 bg-zinc-800/40 p-2.5 rounded border border-zinc-800">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {!isPass && (
           <div className="text-[11px] text-zinc-500 text-center pt-2">
             Recommendation: Regenerate using the same prompt or refine the prompt to fix anatomy.
           </div>
        )}
      </div>
    </div>
  );
};
