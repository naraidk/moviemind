import { useEffect, useState } from 'react';
import { MoodSelector } from './components/MoodSelector';
import { MovieCard } from './components/MovieCard';
import { TrailerModal } from './components/TrailerModal';
import type { Mood, MovieRecommendation } from './types/movie';

const API_BASE_URLS = [
  'http://localhost:5000',
  'http://localhost:5001',
  'http://localhost:5002',
  'http://localhost:5003',
  'http://localhost:5004',
  'http://localhost:5005',
  'http://localhost:5006',
  'http://localhost:5007',
  'http://localhost:5008',
  'http://localhost:5009',
  'http://localhost:5010',
];

const STORAGE_KEY = 'moviemind-state-v1';

const uniqueById = <T extends { id: number }>(items: T[]) =>
  [...new Map(items.map((item) => [item.id, item])).values()];

type CustomMovieList = {
  id: string;
  name: string;
  movies: MovieRecommendation[];
};

export default function App() {
  const loadPersistedState = () => {
    try {
      const storedState = localStorage.getItem(STORAGE_KEY);

      if (!storedState) {
        return {
          watchedMovies: [],
          watchlistMovies: [],
          favoriteMovies: [],
          customLists: [],
        };
      }

      const parsedState = JSON.parse(storedState) as {
        watchedMovies?: MovieRecommendation[];
        watchlistMovies?: MovieRecommendation[];
        favoriteMovies?: MovieRecommendation[];
        customLists?: CustomMovieList[];
      };

      return {
        watchedMovies: parsedState.watchedMovies ?? [],
        watchlistMovies: parsedState.watchlistMovies ?? [],
        favoriteMovies: parsedState.favoriteMovies ?? [],
        customLists: parsedState.customLists ?? [],
      };
    } catch {
      return {
        watchedMovies: [],
        watchlistMovies: [],
        favoriteMovies: [],
        customLists: [],
      };
    }
  };

  const [currentMovie, setCurrentMovie] = useState<MovieRecommendation | null>(null);
  const [activeTrailer, setActiveTrailer] = useState<string | null>(null);
  const [movieQueue, setMovieQueue] = useState<MovieRecommendation[]>([]);
  const [movieQueueIndex, setMovieQueueIndex] = useState(0);
  const [showQueueEndedModal, setShowQueueEndedModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [watchedMovies, setWatchedMovies] = useState<MovieRecommendation[]>(() => loadPersistedState().watchedMovies);
  const [watchlistMovies, setWatchlistMovies] = useState<MovieRecommendation[]>(() => loadPersistedState().watchlistMovies);
  const [favoriteMovies, setFavoriteMovies] = useState<MovieRecommendation[]>(() => loadPersistedState().favoriteMovies);
  const [customLists, setCustomLists] = useState<CustomMovieList[]>(() => loadPersistedState().customLists);
  const [showLists, setShowLists] = useState<'watched' | 'watchlist' | 'favorites' | string | null>(null);
  const [customListNameDraft, setCustomListNameDraft] = useState('');
  const [movieSearchResults, setMovieSearchResults] = useState<
    Array<{ id: number; title: string; year: number; posterUrl: string }>
  >([]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          watchedMovies,
          watchlistMovies,
          favoriteMovies,
          customLists,
        })
      );
    } catch {
      // ignore localStorage write failures
    }
  }, [watchedMovies, watchlistMovies, favoriteMovies, customLists]);
  const [newMovieDraft, setNewMovieDraft] = useState({
    title: '',
    year: '',
    posterUrl: '',
  });
  const [editingMovie, setEditingMovie] = useState<{
    id: number;
    title: string;
    year: string;
    posterUrl: string;
  } | null>(null);

  const getLiveApiBaseUrl = async () => {
    let lastError: unknown = null;

    for (const baseUrl of API_BASE_URLS) {
      try {
        const res = await fetch(`${baseUrl}/api/ping`, { method: 'GET' });
        if (res.ok) {
          return baseUrl;
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError ?? new Error('Aucun serveur disponible');
  };

  const requestRecommendation = async (mood: Mood, excludedIds: number[] = []) => {
    setIsLoading(true);

    try {
      const baseUrl = await getLiveApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mood, excludedIds, limit: 15 }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Erreur réseau');
      }

      const data: { movies?: MovieRecommendation[] } = await res.json();
      const fetchedMovies = Array.isArray(data.movies) ? data.movies : data ? [data as MovieRecommendation] : [];
      const filteredMovies = uniqueById(
        fetchedMovies.filter((movie) => movie && !excludedIds.includes(movie.id))
      );

      if (filteredMovies.length === 0) {
        setCurrentMovie(null);
        setMovieQueue([]);
        setMovieQueueIndex(0);
        alert('Aucun film supplémentaire disponible pour cette recherche. Changez d’ambiance pour relancer une nouvelle demande.');
        return [];
      }

      setMovieQueue(filteredMovies);
      setMovieQueueIndex(0);
      setCurrentMovie(filteredMovies[0]);
      setShowQueueEndedModal(false);
      return filteredMovies;
    } catch (err) {
      console.error('Erreur frontend:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      alert(`Erreur : ${errorMessage}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoodSubmit = async (mood: Mood) => {
    setShowLists(null);
    setShowQueueEndedModal(false);
    const excludedIds = watchedMovies.map((movie) => movie.id);
    await requestRecommendation(mood, excludedIds);
  };

  const showNextMovie = () => {
    if (movieQueue.length === 0) {
      return;
    }

    const nextIndex = movieQueueIndex + 1;

    if (nextIndex >= movieQueue.length) {
      setShowQueueEndedModal(true);
      return;
    }

    setMovieQueueIndex(nextIndex);
    setCurrentMovie(movieQueue[nextIndex]);
  };

  const handleNext = () => {
    showNextMovie();
  };

  const handleMarkAsWatched = (movie: MovieRecommendation) => {
    const nextWatchedMovies = uniqueById([...watchedMovies, movie]);
    setWatchedMovies(nextWatchedMovies);
    setWatchlistMovies((prev) => prev.filter((item) => item.id !== movie.id));
    showNextMovie();
  };

  const handleSaveToWatchlist = (movie: MovieRecommendation) => {
    setWatchlistMovies((prev) => uniqueById([...prev, movie]));
  };

  const handleSaveToFavorites = (movie: MovieRecommendation) => {
    setFavoriteMovies((prev) => uniqueById([...prev, movie]));
  };

  const handleCreateCustomList = (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    setCustomLists((prev) => {
      const alreadyExists = prev.some(
        (list) => list.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (alreadyExists) {
        return prev;
      }

      return [
        ...prev,
        {
          id: `custom-${Date.now()}-${prev.length}`,
          name: trimmedName,
          movies: [],
        },
      ];
    });
  };

  const openListView = (listId: string) => {
    setShowLists(listId);
    const currentList = customLists.find((list) => list.id === listId);
    setCustomListNameDraft(currentList?.name ?? '');
  };

  const isCustomListSelected =
    !!showLists &&
    showLists !== 'watched' &&
    showLists !== 'watchlist' &&
    showLists !== 'favorites';

  const movieListsForCard = [
    { id: 'watched', label: 'Films déjà vu', count: watchedMovies.length },
    { id: 'watchlist', label: 'Films à regarder', count: watchlistMovies.length },
    { id: 'favorites', label: 'Films favoris', count: favoriteMovies.length },
    ...customLists.map((list) => ({
      id: list.id,
      label: list.name,
      count: list.movies.length,
    })),
  ];

  const handleRenameCustomList = () => {
    if (!showLists || typeof showLists !== 'string' || showLists.startsWith('watched')) {
      return;
    }

    const trimmedName = customListNameDraft.trim();

    if (!trimmedName) {
      return;
    }

    setCustomLists((prev) =>
      prev.map((list) =>
        list.id === showLists
          ? {
              ...list,
              name: trimmedName,
            }
          : list
      )
    );
  };

  const handleDeleteCustomList = () => {
    if (!showLists || typeof showLists !== 'string' || showLists.startsWith('watched')) {
      return;
    }

    setCustomLists((prev) => prev.filter((list) => list.id !== showLists));
    setShowLists(null);
  };

  const handleMovieSearchResultSelect = (movie: {
    id: number;
    title: string;
    year: number;
    posterUrl: string;
  }) => {
    setNewMovieDraft((prev) => ({
      ...prev,
      title: movie.title,
      year: String(movie.year),
      posterUrl: movie.posterUrl,
    }));
    setMovieSearchResults([]);
  };

  useEffect(() => {
    const query = newMovieDraft.title.trim();

    if (query.length < 2) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const baseUrl = await getLiveApiBaseUrl();
        const res = await fetch(
          `${baseUrl}/api/search-movies?query=${encodeURIComponent(query)}`
        );

        if (!res.ok) {
          setMovieSearchResults([]);
          return;
        }

        const data = await res.json();
        setMovieSearchResults(data.movies || []);
      } catch {
        setMovieSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [newMovieDraft.title]);

  const handleAddMovieToCustomList = () => {
    if (!showLists || typeof showLists !== 'string' || showLists.startsWith('watched')) {
      return;
    }

    const title = newMovieDraft.title.trim();

    if (!title) {
      return;
    }

    const year = Number(newMovieDraft.year || new Date().getFullYear());

    const movie: MovieRecommendation = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      title,
      year: Number.isFinite(year) ? year : new Date().getFullYear(),
      catchphrase: '',
      tags: [],
      whyThisTonight: '',
      posterUrl: newMovieDraft.posterUrl.trim(),
      trailerKey: undefined,
      director: '',
      actors: [],
      rating: null,
      reviewCount: 0,
    };

    setCustomLists((prev) =>
      prev.map((list) =>
        list.id === showLists
          ? {
              ...list,
              movies: uniqueById([...list.movies, movie]),
            }
          : list
      )
    );

    setNewMovieDraft({
      title: '',
      year: '',
      posterUrl: '',
    });
  };

  const handleDeleteMovieFromCustomList = (movieId: number) => {
    if (!showLists || typeof showLists !== 'string' || showLists.startsWith('watched')) {
      return;
    }

    setCustomLists((prev) =>
      prev.map((list) =>
        list.id === showLists
          ? {
              ...list,
              movies: list.movies.filter((movie) => movie.id !== movieId),
            }
          : list
      )
    );
  };

  const handleSaveEditedMovie = () => {
    if (!showLists || typeof showLists !== 'string' || showLists.startsWith('watched') || !editingMovie) {
      return;
    }

    setCustomLists((prev) =>
      prev.map((list) => {
        if (list.id !== showLists) {
          return list;
        }

        return {
          ...list,
          movies: list.movies.map((movie) =>
            movie.id === editingMovie.id
              ? {
                  ...movie,
                  title: editingMovie.title.trim() || movie.title,
                  year: Number(editingMovie.year) || movie.year,
                  posterUrl: editingMovie.posterUrl.trim() || movie.posterUrl,
                }
              : movie
          ),
        };
      })
    );

    setEditingMovie(null);
  };

  const getActiveListData = () => {
    if (showLists === 'watched') {
      return {
        title: 'Films vus',
        items: watchedMovies,
      };
    }

    if (showLists === 'watchlist') {
      return {
        title: 'Films à voir',
        items: watchlistMovies,
      };
    }

    if (showLists === 'favorites') {
      return {
        title: 'Films favoris',
        items: favoriteMovies,
      };
    }

    const customList = customLists.find((list) => list.id === showLists);

    return customList
      ? {
          title: customList.name,
          items: customList.movies,
        }
      : {
          title: 'Liste',
          items: [],
        };
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      {showLists ? (
        <div className="w-full max-w-sm mx-auto min-h-[700px] rounded-[28px] border border-slate-800 bg-slate-900/70 p-4 text-left shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setShowLists(null)}
              className="text-xs text-slate-400 hover:text-white underline transition-colors"
            >
              ← Retour
            </button>

            {isCustomListSelected && (
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={customListNameDraft}
                  onChange={(e) => setCustomListNameDraft(e.target.value)}
                  placeholder="Nom de la liste"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleRenameCustomList}
                  className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Renommer
                </button>
                <button
                  onClick={handleDeleteCustomList}
                  className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                >
                  Supprimer la liste
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="text-xl font-bold text-white">{getActiveListData().title}</h3>
            <span className="text-xs text-slate-400">{getActiveListData().items.length} films</span>
          </div>

          {isCustomListSelected && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                Ajouter un film
              </p>

              <div className="space-y-2">
                <div className="grid grid-cols-[minmax(0,2fr)_140px] gap-2">
                  <input
                    type="text"
                    value={newMovieDraft.title}
                    onChange={(e) => {
                      const nextValue = e.target.value;

                      setNewMovieDraft((prev) => ({
                        ...prev,
                        title: nextValue,
                      }));

                      if (nextValue.trim().length < 2) {
                        setMovieSearchResults([]);
                      }
                    }}
                    placeholder="Titre du film"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />

                  <input
                    type="number"
                    value={newMovieDraft.year}
                    readOnly
                    placeholder="Année"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {movieSearchResults.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-2">
                    {movieSearchResults.map((movie) => (
                      <button
                        key={movie.id}
                        type="button"
                        onClick={() => handleMovieSearchResultSelect(movie)}
                        className="flex w-full items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-left hover:border-indigo-500"
                      >
                        <img
                          src={movie.posterUrl || 'https://placehold.co/60x90/0f172a/ffffff?text=Film'}
                          alt={movie.title}
                          className="h-14 w-10 rounded-md object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-white">{movie.title}</p>
                          <p className="text-[10px] text-slate-400">{movie.year}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleAddMovieToCustomList}
                className="mt-3 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Ajouter à la liste
              </button>
            </div>
          )}

          <div className="space-y-3">
            {getActiveListData().items.length === 0 ? (
              <p className="text-xs text-slate-400">
                {showLists === 'watched'
                  ? 'Aucun film vu pour le moment.'
                  : showLists === 'watchlist'
                    ? 'Aucune film ajouté à la liste “À voir”.'
                    : showLists === 'favorites'
                      ? 'Aucun film favori pour le moment.'
                      : 'Cette liste est vide pour le moment.'}
              </p>
            ) : (
              <ul className="space-y-3">
                {getActiveListData().items.map((movie) => (
                  <li
                    key={movie.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <div className="flex gap-3">
                      <img
                        src={movie.posterUrl || 'https://placehold.co/120x180/0f172a/ffffff?text=Film'}
                        alt={movie.title}
                        className="h-24 w-16 rounded-xl object-cover"
                      />

                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{movie.title}</p>
                        <p className="text-[10px] text-slate-400">{movie.year}</p>
                      </div>

                      {isCustomListSelected && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() =>
                              setEditingMovie({
                                id: movie.id,
                                title: movie.title,
                                year: String(movie.year),
                                posterUrl: movie.posterUrl || '',
                              })
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-200 hover:border-slate-500"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteMovieFromCustomList(movie.id)}
                            className="rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-rose-500"
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>

                    {isCustomListSelected && editingMovie?.id === movie.id && (
                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                        <input
                          type="text"
                          value={editingMovie.title}
                          onChange={(e) =>
                            setEditingMovie((prev) =>
                              prev ? { ...prev, title: e.target.value } : prev
                            )
                          }
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="number"
                          value={editingMovie.year}
                          onChange={(e) =>
                            setEditingMovie((prev) =>
                              prev ? { ...prev, year: e.target.value } : prev
                            )
                          }
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={editingMovie.posterUrl}
                          onChange={(e) =>
                            setEditingMovie((prev) =>
                              prev ? { ...prev, posterUrl: e.target.value } : prev
                            )
                          }
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <div className="md:col-span-3 flex gap-2">
                          <button
                            onClick={handleSaveEditedMovie}
                            className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                          >
                            Enregistrer
                          </button>
                          <button
                            onClick={() => setEditingMovie(null)}
                            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : !currentMovie ? (
        <MoodSelector
          onSubmit={handleMoodSubmit}
          isLoading={isLoading}
          watchedCount={watchedMovies.length}
          watchlistCount={watchlistMovies.length}
          favoriteCount={favoriteMovies.length}
          movieLists={customLists.map((list) => ({
            id: list.id,
            name: list.name,
            count: list.movies.length,
          }))}
          onCreateCustomList={handleCreateCustomList}
          onOpenList={openListView}
        />
      ) : (
        <div className="w-full max-w-5xl text-center">
          <MovieCard
            movie={currentMovie}
            onWatchTrailer={(key) => setActiveTrailer(key)}
            onSaveToWatchlist={handleSaveToWatchlist}
            onSaveToFavorites={handleSaveToFavorites}
            onMarkAsWatched={handleMarkAsWatched}
            onNext={handleNext}
            onChangeAmbiance={() => setCurrentMovie(null)}
            movieLists={movieListsForCard}
            onOpenList={openListView}
            onCreateCustomList={handleCreateCustomList}
          />
        </div>
      )}

      {showQueueEndedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <p className="text-[10px] uppercase tracking-[0.12em] text-indigo-300">
              Fin des résultats
            </p>
            <h3 className="mt-2 text-xl font-bold text-white">
              Vous avez parcouru les 15 films de cette demande.
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Pour relancer une nouvelle recherche avec de nouveaux films, cliquez sur “Changer d’ambiance”.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowQueueEndedModal(false);
                  setCurrentMovie(null);
                  setMovieQueue([]);
                  setMovieQueueIndex(0);
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Changer d’ambiance
              </button>
              <button
                onClick={() => setShowQueueEndedModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-200 hover:border-slate-500"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <TrailerModal
        trailerKey={activeTrailer}
        onClose={() => setActiveTrailer(null)}
      />
    </main>
  );
}