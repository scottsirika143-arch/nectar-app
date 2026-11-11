import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = "https://api.themoviedb.org/3";
const TMDB_API_KEY = "860fd9c64801ef8912a2e07e8d619535";

const ROWS: Record<string, string> = {
  trending: "trending/all/week",
  popularTv: "tv/popular",
  popularMovies: "movie/popular",
  topRatedMovies: "movie/top_rated",
  topRatedTv: "tv/top_rated",
};

async function tmdb(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}/${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);

  Object.entries({ language: "en-US", ...params }).forEach(([k, v]) => {
    if (v !== "") url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();
  
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const page = sp.get("page") || "1";

  // Fetch full details + videos + cast for a specific item
  const id = sp.get("id");
  const mediaType = sp.get("mediaType") || "movie"; // 'movie' or 'tv'
  if (id) {
    return tmdb(`${mediaType}/${encodeURIComponent(id)}`, {
      append_to_response: "videos,credits",
    });
  }

  const tv = sp.get("tv");
  if (tv) return tmdb(`tv/${encodeURIComponent(tv)}`);

  const genres = sp.get("genres");
  if (genres === "tv" || genres === "movie") return tmdb(`genre/${genres}/list`);

  const row = sp.get("row");
  if (row && ROWS[row]) return tmdb(ROWS[row], { page });

  const type = sp.get("type");
  if (type === "tv" || type === "movie") {
    const sort = sp.get("sort") || "popular";
    const genre = sp.get("genre") || "";
    const today = new Date().toISOString().slice(0, 10);
    const dateField = type === "tv" ? "first_air_date" : "primary_release_date";

    const params: Record<string, string> = {
      page,
      include_adult: "false",
      with_genres: genre,
    };
    if (sort === "top") {
      params.sort_by = "vote_average.desc";
      params["vote_count.gte"] = "300";
    } else if (sort === "new") {
      params.sort_by = `${dateField}.desc`;
      params[`${dateField}.lte`] = today;
      params["vote_count.gte"] = "1";
    } else {
      params.sort_by = "popularity.desc";
    }
    return tmdb(`discover/${type}`, params);
  }

  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}