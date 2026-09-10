import React from 'react';
import { X } from 'lucide-react';

interface TrailerModalProps {
  trailerKey: string | null;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ trailerKey, onClose }) => {
  if (!trailerKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        <div className="relative pt-[56.25%] w-full">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1`}
            title="YouTube trailer player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};