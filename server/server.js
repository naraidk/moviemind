import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import net from 'net';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config({ path: new URL('.env', import.meta.url).pathname });

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const tmdbKey = process.env.TMDB_API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// 1. Route de test basique
app.get('/api/ping', (_req, res) => {
  res.json({ status: 'ok', message: 'Serveur Express actif' });
});

app.get('/api/search-movies', async (req, res) => {
  try {
    if (!tmdbKey) {
      return res.status(500).json({ error: 'Clés d\'API manquantes dans le fichier .env' });
    }

    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';

    if (!query) {
      return res.json({ movies: [] });
    }

    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(
      query
    )}&language=fr-FR&page=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    const movies = (searchData.results || [])
      .slice(0, 6)
      .map((result) => ({
        id: result.id,
        title: result.title || result.original_title || 'Film sans titre',
        year: result.release_date ? new Date(result.release_date).getFullYear() : null,
        posterUrl: result.poster_path
          ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
          : '',
      }));

    return res.json({ movies });
  } catch (error) {
    console.error('Erreur recherche TMDB :', error);
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    res.status(500).json({ error: msg });
  }
});

// 2. Route de recommandation
app.post('/api/recommend', async (req, res) => {
  try {
    if (!apiKey || !tmdbKey) {
      return res.status(500).json({ error: 'Clés d\'API manquantes dans le fichier .env' });
    }

    const {
      energy,
      weather,
      desiredVibe,
      excludedIds = [],
      currentYear,
      inCinema,
      fromCountry,
      hollywood,
      favoriteCountry,
      genres = [],
      limit = 15,
    } = req.body;

    const normalizedDesiredVibe = typeof desiredVibe === 'string' ? desiredVibe.trim() : '';
    const normalizedGenres = Array.isArray(genres)
      ? genres.map((genre) => String(genre).trim()).filter(Boolean)
      : [];
    const normalizedLimit = Math.min(Math.max(Number(limit) || 15, 1), 15);

    const prompt = `Propose une recherche précise pour trouver jusqu'à 15 films adaptés à cette ambiance, en utilisant précisément ces signaux structurés.
- Énergie : ${energy}
  * TIRED = épuisé, besoin d'un film léger et rassurant
  * BRAIN_OFF = cerveau off, pas envie de réfléchir, film très simple à suivre
  * BALANCED = calme, film polyvalent et agréable
  * FOCUSED = captivé, prêt pour une intrigue complexe ou un thriller à alambics
  * ENERGETIC = au taquet, film dynamique, intense ou très énergique
  * COMFORT = besoin de réconfort, film rassurant, déjà vu ou ultra sécurisant
  * EMOTIVE = sensible, envie d'émotion, d'être touché, de frissonner ou de pleurer
  * CREATIVE = curieux, envie de surprise, de cinéma d'auteur, de visuels forts ou d'idées originales
- Météo : ${weather}
  * SUNNY = grand soleil, ambiance lumineuse et optimiste
  * PARTLY_CLOUDY = éclaircies / nuageux, film doux, léger, pas trop sombre
  * OVERCAST = ciel gris / couvert, film plus contemplatif ou mélancolique
  * DRIZZLE = petite pluie, ambiance douce, douce-amère ou cozy
  * HEAVY_RAIN = forte pluie, film plus intense, émotionnel ou immersif
  * STORM = orage / tempête, film palpitant, lourd ou dramatique
  * SNOW = neige, film cocooning, poétique ou féérique
  * NIGHT = nuit claire / sombre, film nocturne, mystérieux, tense ou contemplatif
- Envie particulière : ${normalizedDesiredVibe || 'Aucune'}
- Genres sélectionnés : ${normalizedGenres.length ? normalizedGenres.join(', ') : 'Aucun'}
- Filtres supplémentaires :
  * film de cette année : ${currentYear ? 'oui' : 'non'}
  * en salle / cinéma : ${inCinema ? 'oui' : 'non'}
  * film de mon pays : ${fromCountry ? 'oui' : 'non'}
  * Hollywood / USA : ${hollywood ? 'oui' : 'non'}
  * pays favori : ${favoriteCountry || 'non spécifié'}

Règles importantes :
1. Si l'utilisateur donne des mots-clés ou des informations spécifiques (titre, acteur, année, genre, pays, mot-clé), utilise-les pour construire une recherche précise.
2. Si currentYear est vrai, privilégie un film sorti cette année.
3. Si inCinema est vrai, privilégie un film récent ou actuellement en salle.
4. Si favoriteCountry est renseigné, cherche un film de ce pays quand c'est cohérent avec l'ambiance demandée.
5. Si fromCountry est vrai, cherche un film produit dans le pays de l'utilisateur ou dans un pays local de préférence.
6. Si hollywood est vrai, privilégie un film américain / Hollywood.
7. Réponds uniquement avec un objet JSON valide contenant : searchTitle, catchphrase, tags, whyThisTonight.`;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            searchTitle: { type: Type.STRING },
            catchphrase: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            whyThisTonight: { type: Type.STRING },
          },
          required: ['searchTitle', 'catchphrase', 'tags', 'whyThisTonight'],
        },
      },
    });

    const aiData = JSON.parse(aiResponse.text || '{}');

    const searchTitle = normalizedDesiredVibe || aiData.searchTitle || 'film';

    // Recherche sur TMDB
    const currentYearValue = new Date().getFullYear();

    const searchQuery = [
      searchTitle,
      ...normalizedGenres,
      currentYear ? `sortie ${currentYearValue}` : '',
      inCinema ? 'cinema salle' : '',
      fromCountry ? 'film de mon pays' : '',
      hollywood ? 'Hollywood USA' : '',
      favoriteCountry || '',
    ]
      .filter(Boolean)
      .join(' ');

    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(
      searchQuery
    )}&language=fr-FR`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const searchResults = searchData.results || [];

    const scoredResults = searchResults
      .filter((result) => !excludedIds.includes(result.id))
      .map((result) => {
        const text = [result.title, result.original_title, result.overview || '', result.release_date || '']
          .join(' ')
          .toLowerCase();

        const terms = [searchTitle, ...normalizedGenres, favoriteCountry]
          .filter(Boolean)
          .map((term) => term.toLowerCase());

        let score = 0;

        for (const term of terms) {
          if (text.includes(term)) {
            score += 3;
          }
        }

        if (currentYear && result.release_date?.slice(0, 4) === String(currentYearValue)) {
          score += 2;
        }

        if (inCinema && result.popularity > 0) {
          score += 1;
        }

        if (hollywood && (result.original_language === 'en' || text.includes('hollywood'))) {
          score += 1;
        }

        return { result, score };
      })
      .sort((a, b) => b.score - a.score);

    const candidateResults = scoredResults.length
      ? scoredResults
      : searchResults
          .filter((result) => !excludedIds.includes(result.id))
          .map((result) => ({ result, score: 0 }));

    const limitedResults = candidateResults.slice(0, normalizedLimit);

    if (!limitedResults.length) {
      return res.status(404).json({ error: `Film "${aiData.searchTitle}" introuvable sur TMDB.` });
    }

    const movies = await Promise.all(
      limitedResults.map(async ({ result }) => {
        const creditsUrl = `https://api.themoviedb.org/3/movie/${result.id}/credits?api_key=${tmdbKey}&language=fr-FR`;
        const videoUrl = `https://api.themoviedb.org/3/movie/${result.id}/videos?api_key=${tmdbKey}&language=fr-FR`;

        const [creditsRes, videoRes] = await Promise.all([fetch(creditsUrl), fetch(videoUrl)]);
        const creditsData = await creditsRes.json();
        const videoData = await videoRes.json();

        const director = creditsData.crew?.find((person) => person.job === 'Director')?.name || 'Réalisateur inconnu';
        const actors = creditsData.cast?.slice(0, 5).map((person) => person.name) || [];
        const trailer = videoData.results?.find(
          (v) => v.site === 'YouTube' && v.type === 'Trailer'
        );

        return {
          id: result.id,
          title: result.title,
          year: result.release_date ? new Date(result.release_date).getFullYear() : 2026,
          catchphrase: aiData.catchphrase,
          tags: aiData.tags,
          whyThisTonight: aiData.whyThisTonight,
          posterUrl: result.poster_path
            ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
            : '',
          trailerKey: trailer?.key || undefined,
          director,
          actors,
          rating: typeof result.vote_average === 'number' ? result.vote_average : null,
          reviewCount: typeof result.vote_count === 'number' ? result.vote_count : 0,
        };
      })
    );

    res.json({ movies });
  } catch (error) {
    console.error('Erreur traitement :', error);
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    res.status(500).json({ error: msg });
  }
});

const candidatePorts = Number(process.env.PORT)
  ? [Number(process.env.PORT)]
  : [5000, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010];

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const tester = net.createServer();

    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port, '127.0.0.1');
  });

const getAvailablePort = async () => {
  for (const port of candidatePorts) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error('Aucun port disponible dans la plage configurée.');
};

const PORT = await getAvailablePort();

// On stocke la référence du serveur pour maintenir la boucle d'événement
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur actif et en écoute permanente sur http://localhost:${PORT}`);
});

// Sécurité pour éviter toute coupure automatique
setInterval(() => {}, 100000);
