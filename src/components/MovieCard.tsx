import React, { useState } from 'react';
import { Play, Bookmark, SkipForward, Star, Sparkles, Eye } from 'lucide-react';
import type { MovieRecommendation } from '../types/movie';

interface MovieCardProps {
  movie: MovieRecommendation;
  onWatchTrailer: (trailerKey: string) => void;
  onSaveToWatchlist: (movie: MovieRecommendation) => void;
  onSaveToFavorites: (movie: MovieRecommendation) => void;
  onMarkAsWatched: (movie: MovieRecommendation) => void;
  onNext: () => void;
  onChangeAmbiance?: () => void;
  movieLists?: Array<{ id: string; label: string; count: number }>;
  onOpenList?: (listId: string) => void;
  onCreateCustomList?: (name: string) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onWatchTrailer,
  onSaveToWatchlist,
  onSaveToFavorites,
  onMarkAsWatched,
  onNext,
  onChangeAmbiance,
  movieLists = [],
  onOpenList,
  onCreateCustomList,
}) => {
  const [customListName, setCustomListName] = useState('');

  const handleCreateCustomList = () => {
    const trimmedName = customListName.trim();

    if (!trimmedName || !onCreateCustomList) {
      return;
    }

    onCreateCustomList(trimmedName);
    setCustomListName('');
  };
  return (
    <div className="relative w-full max-w-sm mx-auto min-h-[700px] rounded-[28px] overflow-visible shadow-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between group">
      <div className="absolute inset-0 z-0">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
      </div>

      <div className="relative z-10 p-5 pb-0 flex justify-start">
        {onChangeAmbiance && (
          <button
            onClick={onChangeAmbiance}
            className="mb-3 inline-flex items-center text-xs text-slate-200 hover:text-white underline transition-colors"
          >
            ← Retour
          </button>
        )}
      </div>

      <div className="relative z-10 p-5 pt-2 flex justify-between items-start">
        <span className="bg-slate-900/80 backdrop-blur-md text-amber-400 font-semibold text-xs px-3 py-1.5 rounded-full border border-amber-500/30 flex items-center gap-1">
          <Star size={12} fill="currentColor" /> {movie.year}
        </span>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {movie.tags.slice(0, 2).map((tag, i) => (
            <span
              key={i}
              className="bg-indigo-950/80 backdrop-blur-md text-indigo-300 text-[10px] font-medium px-2.5 py-1 rounded-full border border-indigo-700/50"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
        {/* Buttons */}
      <div className="relative z-10 p-6 space-y-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white leading-tight drop-shadow-md">
            {movie.title}
          </h2>
          <p className="text-amber-400 font-medium text-sm mt-1 flex items-center gap-1.5">
            <Sparkles size={14} />
            {movie.catchphrase}
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-left">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Réalisateur</p>
            <p className="text-sm text-slate-100">{movie.director || 'Réalisateur inconnu'}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Acteurs principaux</p>
            <p className="text-xs text-slate-300">
              {movie.actors && movie.actors.length > 0
                ? movie.actors.slice(0, 5).join(' • ')
                : 'Acteurs non disponibles'}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-amber-300 text-xs font-semibold">
              <Star size={12} fill="currentColor" />
              <span>{movie.rating ? movie.rating.toFixed(1) : 'N/A'} / 10</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {movie.reviewCount ?? 0} avis
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-indigo-400 block mb-0.5">
            Pourquoi ce soir ?
          </span>
          {movie.whyThisTonight}
        </div>

        <div className="pt-2 grid grid-cols-5 gap-1.5">
          <button
            onClick={() => onSaveToFavorites(movie)}
            className="flex flex-col items-center justify-center gap-1 bg-amber-500/80 hover:bg-amber-400 text-slate-950 py-2 rounded-xl shadow-lg transition-all text-[10px] font-semibold"
          >
            <Star size={14} fill="currentColor" />
            <span>Favoris</span>
          </button>

          <button
            onClick={() => onSaveToWatchlist(movie)}
            className="flex flex-col items-center justify-center gap-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 py-2 rounded-xl border border-slate-700 transition-all text-[10px] font-medium"
          >
            <Bookmark size={14} />
            <span>À voir</span>
          </button>

          <button
            onClick={() => movie.trailerKey && onWatchTrailer(movie.trailerKey)}
            disabled={!movie.trailerKey}
            className="flex flex-col items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-xl shadow-lg transition-all text-[10px] font-semibold"
          >
            <Play size={14} fill="currentColor" />
            <span>Bande-annonce</span>
          </button>

          <button
            onClick={() => onMarkAsWatched(movie)}
            className="flex flex-col items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl shadow-lg transition-all text-[10px] font-semibold"
          >
            <Eye size={14} />
            <span>Déjà vu</span>
          </button>

          <button
            onClick={onNext}
            className="flex flex-col items-center justify-center gap-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 py-2 rounded-xl border border-slate-700 transition-all text-[10px] font-medium"
          >
            <SkipForward size={14} />
            <span>Suivant</span>
          </button>
        </div>

        {/* Movie Lists */}
        {movieLists.length > 0 && (
          <div className="pt-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
              Mes listes
            </p>
            <ul className="mt-2 space-y-2">
              {movieLists.map((list) => (
                <li key={list.id} className="border-b border-slate-800 pb-1.5 last:border-b-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => onOpenList?.(list.id)}
                    className="flex w-full items-center justify-between gap-2 text-left text-xs text-slate-200 hover:text-white underline-offset-2 hover:underline"
                  >
                    <span>{list.label}</span>
                    <span className="text-slate-400">{list.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
            Créer une liste
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customListName}
              onChange={(e) => setCustomListName(e.target.value)}
              placeholder="Nom de la liste"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="button"
              onClick={handleCreateCustomList}
              className="rounded-2xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Créer
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};