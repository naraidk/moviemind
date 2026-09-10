export type WeatherCondition =
  | 'SUNNY'
  | 'PARTLY_CLOUDY'
  | 'OVERCAST'
  | 'DRIZZLE'
  | 'HEAVY_RAIN'
  | 'STORM'
  | 'SNOW'
  | 'NIGHT';

export interface Mood {
  energy:
    | 'TIRED'
    | 'BRAIN_OFF'
    | 'BALANCED'
    | 'FOCUSED'
    | 'ENERGETIC'
    | 'COMFORT'
    | 'EMOTIVE'
    | 'CREATIVE';
  weather: WeatherCondition;
  desiredVibe?: string;
  currentYear?: boolean;
  inCinema?: boolean;
  fromCountry?: boolean;
  hollywood?: boolean;
  favoriteCountry?: string;
  genres?: string[];
}

export interface MovieRecommendation {
  id: number;
  title: string;
  year: number;
  catchphrase: string;
  tags: string[];
  whyThisTonight: string;
  posterUrl: string;
  trailerKey?: string;
  director?: string;
  actors?: string[];
  rating?: number | null;
  reviewCount?: number;
}