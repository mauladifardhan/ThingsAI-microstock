import React from 'react';
import { GeneratedImage } from '../types';
import { Download, Trash2, Maximize2 } from 'lucide-react';

interface GalleryProps {
  images: GeneratedImage[];
  onSelect: (image: GeneratedImage) => void;
  onDelete: (id: string) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ images, onSelect, onDelete }) => {
  if (images.length === 0) return null;

  return (
    <div className="w-full bg-zinc-900/50 border-t border-zinc-800 p-6">
      <h3 className="text-sm font-semibold text-zinc-400 mb-4">History</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {images.map((img) => (
          <div 
            key={img.id} 
            className="relative group shrink-0 w-48 aspect-square rounded-lg overflow-hidden border border-zinc-700 cursor-pointer snap-start bg-zinc-800"
            onClick={() => onSelect(img)}
          >
            <img 
              src={img.url} 
              alt={img.params.prompt} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(img.id); }}
                className="p-2 rounded-full bg-zinc-800 text-red-400 hover:bg-red-900/30 transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none">
              <p className="text-[10px] text-zinc-300 truncate">{img.params.prompt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};