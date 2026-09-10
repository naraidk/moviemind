import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Zap,
  BatteryLow,
  Compass,
  BrainCircuit,
  Heart,
  Wand2,
} from 'lucide-react';
import type { Mood, WeatherCondition } from '../types/movie';

interface MoodSelectorProps {
  onSubmit: (mood: Mood) => void;
  isLoading?: boolean;
  watchedCount?: number;
  watchlistCount?: number;
  favoriteCount?: number;
  movieLists?: Array<{ id: string; name: string; count: number }>;
  onCreateCustomList?: (name: string) => void;
  onOpenList?: (listId: string) => void;
}

const genreOptions = [
  'Action & Aventure',
  'Action',
  'Aventure',
  'Western',
  'Comédie',
  'Comédie romantique',
  'Comédie noire',
  'Parodie / Satire',
  'Drame psychologique',
  'Drame social / Biopic',
  'Romance / Mélodrame',
  'Science-Fiction',
  'Fantasy',
  'Fantastique',
  'Thriller',
  'Horreur / Épouvante',
  'Policier / Film Noir',
  'Film historique / Peplum',
  'Film de guerre',
  'Biopic',
  'Animation 2D / 3D',
  'Anime japonais',
  'Film familial / Jeunesse',
  'Comédie musicale',
  'Documentaire',
  'Comédie policière',
  'Mystère',
];

const mapWeatherCode = (weatherCode: number, isDay: number): WeatherCondition => {
  if (isDay === 0) return 'NIGHT';

  if ([0, 1].includes(weatherCode)) return 'SUNNY';
  if ([2].includes(weatherCode)) return 'PARTLY_CLOUDY';
  if ([3, 45, 48].includes(weatherCode)) return 'OVERCAST';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(weatherCode)) return 'DRIZZLE';
  if ([66, 67, 71, 73, 75, 77, 85, 86].includes(weatherCode)) return 'SNOW';
  if ([95, 96, 99].includes(weatherCode)) return 'STORM';

  return 'PARTLY_CLOUDY';
};

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  onSubmit,
  isLoading,
  watchedCount = 0,
  watchlistCount = 0,
  favoriteCount = 0,
  movieLists = [],
  onCreateCustomList,
  onOpenList,
}) => {
  const [energy, setEnergy] = useState<Mood['energy']>('BALANCED');
  const [weather, setWeather] = useState<Mood['weather']>('SUNNY');
  const [desiredVibe, setDesiredVibe] = useState('');
  const [currentYear, setCurrentYear] = useState(false);
  const [inCinema, setInCinema] = useState(false);
  const [fromCountry, setFromCountry] = useState(false);
  const [hollywood, setHollywood] = useState(false);
  const [favoriteCountry, setFavoriteCountry] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [customListName, setCustomListName] = useState('');

  useEffect(() => {
    const detectWeather = async () => {
      if (!navigator.geolocation) {
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&current=weather_code,is_day&timezone=auto`
            );

            if (!response.ok) {
              return;
            }

            const data = await response.json();
            const weatherCode = data.current?.weather_code ?? 0;
            const isDay = data.current?.is_day ?? 1;
            setWeather(mapWeatherCode(weatherCode, isDay));
          } catch {
            // fallback silently
          }
        },
        () => {
          // fallback silently if geolocation is denied
        }
      );
    };

    detectWeather();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      energy,
      weather,
      desiredVibe,
      currentYear,
      inCinema,
      fromCountry,
      hollywood,
      favoriteCountry: favoriteCountry.trim() || undefined,
      genres,
    });
  };

  const handleCreateCustomList = () => {
    if (!customListName.trim()) {
      return;
    }

    onCreateCustomList?.(customListName);
    setCustomListName('');
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-white flex items-center justify-center gap-2">
          MovieMind <Sparkles className="text-amber-400" size={20} />
        </h1>
        <p className="text-xs text-slate-400">
          Raconte-moi ton état d'esprit, l'IA s'occupe de trouver le film idéal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Niveau d'énergie */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">Ton niveau d'énergie</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'TIRED', label: 'Épuisé', icon: BatteryLow },
              { id: 'BRAIN_OFF', label: 'Cerveau off', icon: BrainCircuit },
              { id: 'BALANCED', label: 'Tranquille', icon: Compass },
              { id: 'FOCUSED', label: 'Captivé', icon: Sparkles },
              { id: 'ENERGETIC', label: 'Au taquet', icon: Zap },
              { id: 'COMFORT', label: 'Réconfort', icon: Heart },
              { id: 'EMOTIVE', label: 'Émotif', icon: Heart },
              { id: 'CREATIVE', label: 'Créatif', icon: Wand2 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setEnergy(id as Mood['energy'])}
                className={`flex min-h-[72px] flex-col items-center justify-center rounded-xl border p-2 text-[10px] font-medium transition-all ${
                  energy === id
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Icon size={15} className="mb-1" />
                <span className="text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">Genres</label>
          <select
            value={genres[0] ?? ''}
            onChange={(e) => {
              const selectedGenre = e.target.value;
              setGenres(selectedGenre ? [selectedGenre] : []);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">Sélectionner un genre</option>
            {genreOptions.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Une envie spécifique ? (titre, acteur, mot-clé, année, genres...)
          </label>
          <input
            type="text"
            value={desiredVibe}
            onChange={(e) => setDesiredVibe(e.target.value)}
            placeholder="Ex: thriller psychologique, 2026, film récent, acteur ou titre..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filtres de recherche */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">Filtres supplémentaires</label>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'currentYear', label: 'Cette année', checked: currentYear, onToggle: () => setCurrentYear((prev) => !prev) },
              { id: 'inCinema', label: 'En salle', checked: inCinema, onToggle: () => setInCinema((prev) => !prev) },
              { id: 'fromCountry', label: 'Mon pays', checked: fromCountry, onToggle: () => setFromCountry((prev) => !prev) },
              { id: 'hollywood', label: 'Hollywood', checked: hollywood, onToggle: () => setHollywood((prev) => !prev) },
            ].map(({ id, label, checked, onToggle }) => (
              <button
                key={id}
                type="button"
                onClick={onToggle}
                className={`rounded-xl border px-2 py-2 text-[10px] font-medium transition-all ${
                  checked
                    ? 'border-indigo-500 bg-indigo-600/20 text-indigo-100'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={favoriteCountry}
            onChange={(e) => setFavoriteCountry(e.target.value)}
            placeholder="Pays favori (facultatif, ex: France, Japon, Corée du Sud)"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-500 to-amber-500 hover:from-indigo-600 hover:to-amber-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="animate-pulse">Recherche en cours...</span>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Trouve-moi un film</span>
            </>
          )}
        </button>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">Mes listes</label>

          {/* Film List */}
          <ul className="space-y-2">
            {[
              { id: 'watched', label: 'Films déjà vu', count: watchedCount },
              { id: 'watchlist', label: 'Films à regarder', count: watchlistCount },
              { id: 'favorites', label: 'Films favoris', count: favoriteCount },
              ...movieLists.map((list) => ({
                id: list.id,
                label: list.name,
                count: list.count,
              })),
            ].map((item) => (
              <li key={item.id} className="border-b border-slate-800 pb-1.5 last:border-b-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => onOpenList?.(item.id)}
                  className="flex w-full items-center justify-between gap-2 text-left text-xs text-slate-200 hover:text-white underline-offset-2 hover:underline"
                >
                  <span>{item.label}</span>
                  <span className="text-slate-400">{item.count}</span>
                </button>
              </li>
            ))}
          </ul>

            {/* Custom List Creation */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={customListName}
              onChange={(e) => setCustomListName(e.target.value)}
              placeholder="Créer une liste personnalisée"
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
      </form>
    </div>
  );
};