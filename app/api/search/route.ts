import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = "https://api.themoviedb.org/3";
const TMDB_API_KEY = "860fd9c64801ef8912a2e07e8d619535";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  // Support 'q' or 'query' parameter from the frontend
  const query = sp.get("q") || sp.get("query") || "";
  const page = sp.get("page") || "1";

  if (!query.trim()) {
    return NextResponse.json({ results: [], page: 1, total_pages: 0, total_results: 0 });
  }

  const url = new URL(`${BASE}/search/multi`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("query", query);
  url.searchParams.set("page", page);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Failed to fetch search results" }, { status: 500 });
  }
}