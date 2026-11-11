const API_KEY = "860fd9c64801ef8912a2e07e8d619535";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export const TMDB_API_KEY = API_KEY;

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface MovieDetails {
  id: number;
  title?: string;
  name?: string; // For TV series
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string; // For TV series
  runtime?: number;
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
}

export async function fetchTrendingMovies(): Promise<Movie[]> {
  try {
    const res = await fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Failed to fetch movies:", error);
    return [];
  }
}

// NEW: Fetch full movie details including cast and crew participants
export async function fetchMovieDetails(id: string | number): Promise<MovieDetails | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=credits`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch movie details and credits:", error);
    return null;
  }
}

export function getImageUrl(path: string): string {
  return path ? `${IMAGE_BASE_URL}${path}` : "https://via.placeholder.com/500x750?text=No+Image";
}