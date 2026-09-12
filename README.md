## MovieMind — A Smart Movie Recommendation App

MovieMind is a movie recommendation app designed to help users discover films that match their mood, energy, context, and taste in just a few clicks. Instead of endlessly browsing, users can get curated suggestions, save their favorite picks, build custom lists, and explore trailers for the films they want to watch next.

I built MovieMind using React, TypeScript, Vite, Express, Node.js, Google GenAI, TMDB, and local persistence for movie lists.

## MovieMind — Application intelligente de recommandation de films

MovieMind est une application de recommandation de films conçue pour aider les utilisateurs à découvrir des films qui correspondent à leur humeur, à leur énergie, à leur contexte et à leurs goûts en quelques clics. Plutôt que de parcourir sans fin des catalogues, les utilisateurs peuvent obtenir des suggestions personnalisées, enregistrer leurs films préférés, créer des listes sur mesure et regarder les bandes-annonces des films qu’ils veulent voir ensuite.

J'ai développé MovieMind en utilisant React, TypeScript, Vite, Express, Node.js, Google GenAI, TMDB et une persistance locale pour les listes de films.

## Technologies

- React
- TypeScript
- Vite
- Express
- Node.js
- Google GenAI
- TMDB API
- Lucide React

## Features

MovieMind comes with everything you’d expect from a modern, mood-driven movie discovery app:

- Mood-based movie recommendations
- Extra filters such as genre, year, cinema, country, and Hollywood preference
- Automatic weather detection for contextual suggestions
- Personalized movie lists (`Déjà vu`, `À voir`, `Favoris`, and custom lists)
- Movie trailer support
- Custom list management with add, edit, and delete actions
- Local persistence so users can keep their saved lists between sessions

## The Process

We started by imagining a movie app that could feel personal and intuitive rather than overwhelming. First came the recommendation flow, then the list system, so users could save and organize films in a way that felt natural. After that, we added richer controls like genre filters, country preferences, and weather-aware suggestions to make recommendations more contextual.

The backend was built with Express and Node.js, using Google GenAI to shape the recommendation prompt and TMDB to fetch movie data, trailers, and metadata. On the frontend, React + TypeScript + Vite made it possible to build a fast, responsive experience with reusable components and smooth interactions.

## What I Learned

This project helped me grow in several areas:

- Building a full-stack app with React and Express
- Integrating AI-powered recommendation logic with Google GenAI
- Working with external APIs like TMDB for content discovery and media data
- Designing a clean UX for movie discovery and list management
- Structuring a multi-feature app with reusable frontend components
- Improving local state management and persistence for a prototype product

## What Could Be Improved

- Add user accounts and saved profiles
- Improve recommendation quality with stronger scoring and filtering logic
- Add notification or “watch later” reminders
- Expand the app with favorites, social sharing, and collaborative lists
- Improve visual polish with richer animations and a stronger mobile experience

## Demo

https://github.com/user-attachments/assets/f4e95e64-27a8-4d16-b8a0-9696472acf8a
