
import React, { useState, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { Gallery } from './components/Gallery';
import { PromptLibrary } from './components/PromptLibrary';
import { MetadataPanel } from './components/MetadataPanel';
import { QualityInspector } from './components/QualityInspector';
import { ContributorGuide } from './components/ContributorGuide';
import { GenerationParams, GeneratedImage, AspectRatio, ImageQuality, StylePreset } from './types';
import { checkApiKey, promptForApiKey, generateImage, generateMetadata, assessImageQuality } from './services/geminiService';
import { Download, Image as ImageIcon, AlertCircle, BookOpen, Tag, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState<boolean>(false);
  const [isAnalyzingQuality, setIsAnalyzingQuality] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState<'metadata' | 'quality'>('metadata');
  
  const [params, setParams] = useState<GenerationParams>({
    prompt: '',
    aspectRatio: AspectRatio.SQUARE,
    quality: ImageQuality.TWO_K,
    style: StylePreset.NONE,
    optimizeForMicrostock: true
  });

  const verifyKey = async () => {
    try {
      const valid = await checkApiKey();
      setHasApiKey(valid);
    } catch (e) {
      console.error("Failed to check API key status", e);
    }
  };

  useEffect(() => {
    verifyKey();
    window.addEventListener('focus', verifyKey);
    return () => window.removeEventListener('focus', verifyKey);
  }, []);

  const handleGenerate = async () => {
    if (!hasApiKey) {
      await promptForApiKey();
      const stillValid = await checkApiKey();
       if (!stillValid) {
           setHasApiKey(true);
       }
    }

    setError(null);
    setIsGenerating(true);

    try {
      // 1. Generate Image
      const imageUrl = await generateImage(params);
      
      const newId = crypto.randomUUID();
      const newImage: GeneratedImage = {
        id: newId,
        url: imageUrl,
        params: { ...params },
        timestamp: Date.now(),
        metadata: undefined // initially undefined
      };
      
      setCurrentImage(newImage);
      setHistory(prev => [newImage, ...prev]);
      setActiveTab('metadata'); // Reset to metadata tab on new image
      
      // 2. Auto-generate metadata if optimizing for microstock
      if (params.optimizeForMicrostock) {
         try {
           // Pass the image URL (base64) to the metadata service for vision analysis
           generateMetadata(params, imageUrl).then(meta => {
              updateImageMetadata(newId, meta);
           }).catch(err => {
             console.warn("Metadata auto-generation skipped/failed", err);
           });
         } catch (e) {
           console.warn("Metadata setup failed", e);
         }
      }

    } catch (err: any) {
      setError(err.message || "Failed to generate image. Please try again.");
      if (err.message?.includes("API key") || err.message?.includes("403")) {
        setHasApiKey(false);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMetadata = async () => {
    if (!currentImage) return;
    
    setIsGeneratingMetadata(true);
    try {
      const metadata = await generateMetadata(currentImage.params, currentImage.url);
      updateImageMetadata(currentImage.id, metadata);
    } catch (err: any) {
      setError("Failed to generate metadata: " + err.message);
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  const handleAnalyzeQuality = async () => {
    if (!currentImage) return;

    setIsAnalyzingQuality(true);
    try {
      const assessment = await assessImageQuality(currentImage.url);
      updateImageAssessment(currentImage.id, assessment);
    } catch (err: any) {
      setError("Failed to analyze quality: " + err.message);
    } finally {
      setIsAnalyzingQuality(false);
    }
  };

  const updateImageMetadata = (id: string, metadata: any) => {
    setHistory(prev => prev.map(img => 
      img.id === id ? { ...img, metadata } : img
    ));
    setCurrentImage(prev => {
      if (prev && prev.id === id) {
        return { ...prev, metadata };
      }
      return prev;
    });
  };

  const updateImageAssessment = (id: string, qualityAssessment: any) => {
    setHistory(prev => prev.map(img => 
      img.id === id ? { ...img, qualityAssessment } : img
    ));
    setCurrentImage(prev => {
      if (prev && prev.id === id) {
        return { ...prev, qualityAssessment };
      }
      return prev;
    });
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = `genstudio-${currentImage.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string) => {
    setHistory(prev => prev.filter(img => img.id !== id));
    if (currentImage?.id === id) {
      setCurrentImage(null);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Sidebar */}
      <ControlPanel 
        params={params}
        setParams={setParams}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        hasApiKey={hasApiKey}
        onSelectKey={promptForApiKey}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Bar */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-400">
               Model: <span className="text-blue-400">gemini-3-pro-image-preview</span>
            </span>
            {params.optimizeForMicrostock && (
              <span className="px-2 py-1 rounded-full bg-green-900/30 text-green-400 text-[10px] border border-green-800">
                Stock Optimized
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setShowGuide(true)}
               disabled={!currentImage}
               className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md border border-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <BookOpen size={14} />
               Submission Guide
             </button>
             <div className="h-4 w-px bg-zinc-800 mx-1"></div>
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 underline">
               Billing Info
             </a>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto flex flex-col min-h-full">
            
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-3 shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-sm text-red-200">{error}</div>
              </div>
            )}

            <div className="flex-1 flex flex-col lg:flex-row gap-8">
              {currentImage ? (
                <>
                  {/* Left: Image Display */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="relative group rounded-lg overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900/50 self-start max-w-full">
                      <img 
                        src={currentImage.url} 
                        alt="Generated Result" 
                        className="max-h-[60vh] lg:max-h-[70vh] object-contain"
                      />
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={handleDownload}
                          className="p-2 bg-zinc-900/80 text-white rounded-lg hover:bg-blue-600 transition-colors backdrop-blur-sm border border-zinc-700"
                          title="Download PNG"
                        >
                          <Download size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-4 text-zinc-500 text-xs">
                      <span>{currentImage.params.quality}</span>
                      <span>•</span>
                      <span>{currentImage.params.aspectRatio}</span>
                      <span>•</span>
                      <span className="capitalize">{currentImage.params.style}</span>
                    </div>
                  </div>

                  {/* Right: Metadata & Quality Tabs */}
                  <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4">
                     
                     {/* Tab Switcher */}
                     <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
                       <button 
                         onClick={() => setActiveTab('metadata')}
                         className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
                           activeTab === 'metadata' 
                             ? 'bg-zinc-800 text-white shadow-sm' 
                             : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                         }`}
                       >
                         <Tag size={14} />
                         Metadata
                       </button>
                       <button 
                         onClick={() => setActiveTab('quality')}
                         className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
                           activeTab === 'quality' 
                             ? 'bg-zinc-800 text-purple-300 shadow-sm' 
                             : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                         }`}
                       >
                         <Activity size={14} />
                         Quality
                       </button>
                     </div>

                     {activeTab === 'metadata' ? (
                       <MetadataPanel 
                          metadata={currentImage.metadata} 
                          isLoading={isGeneratingMetadata}
                          onGenerate={handleGenerateMetadata}
                       />
                     ) : (
                       <QualityInspector 
                          assessment={currentImage.qualityAssessment}
                          isLoading={isAnalyzingQuality}
                          onAnalyze={handleAnalyzeQuality}
                       />
                     )}
                  </div>
                </>
              ) : (
                <div className="w-full text-center space-y-4 mt-20">
                  <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto border border-zinc-800">
                    <ImageIcon className="w-10 h-10 text-zinc-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-200">Ready to Create</h2>
                  <p className="text-zinc-500 text-sm max-w-md mx-auto">
                    Select a style, define your resolution (up to 4K), and enter a prompt. 
                    Try the examples below to get started.
                  </p>
                  <PromptLibrary onSelect={(p) => setParams(prev => ({ ...prev, prompt: p }))} />
                </div>
              )}
            </div>

          </div>
        </div>

        {/* History Gallery */}
        <div className="shrink-0">
          <Gallery 
            images={history} 
            onSelect={setCurrentImage}
            onDelete={handleDelete}
          />
        </div>

        {/* Guide Modal */}
        {showGuide && currentImage && (
          <ContributorGuide 
            image={currentImage}
            metadata={currentImage.metadata}
            onClose={() => setShowGuide(false)}
          />
        )}

      </div>
    </div>
  );
};

export default App;
