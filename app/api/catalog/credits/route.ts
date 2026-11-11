import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "movie";
  const id = searchParams.get("id");
  const title = searchParams.get("title");

  const apiKey = "c332903fa6f4961bf34873ab06e69315";

  try {
    let castList: any[] = [];

    // 1. Try direct lookup by ID first if available
    if (id && id !== "undefined" && id !== "null") {
      const endpoint = type === "tv" ? "aggregate_credits" : "credits";
      let res = await fetch(`https://api.themoviedb.org/3/${type}/${id}/${endpoint}?api_key=${apiKey}`);
      let data = await res.json();

      if (data && data.cast && data.cast.length > 0) {
        castList = data.cast;
      } else if (type === "tv") {
        res = await fetch(`https://api.themoviedb.org/3/tv/${id}/credits?api_key=${apiKey}`);
        data = await res.json();
        if (data && data.cast) castList = data.cast;
      }
    }

    // 2. If direct lookup returns nothing, search by title to get the accurate TMDB ID
    if (castList.length === 0 && title) {
      const searchRes = await fetch(`https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(title)}`);
      const searchData = await searchRes.json();
      
      if (searchData.results && searchData.results.length > 0) {
        const correctId = searchData.results[0].id;
        const endpoint = type === "tv" ? "aggregate_credits" : "credits";
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${correctId}/${endpoint}?api_key=${apiKey}`);
        const data = await res.json();
        if (data && data.cast) castList = data.cast;
      }
    }

    const formattedCast = castList.slice(0, 10).map((person: any) => ({
      id: person.id,
      name: person.name,
      profile_path: person.profile_path,
      character: person.character || (person.roles && person.roles[0]?.character) || "Actor"
    }));

    return NextResponse.json({ cast: formattedCast });
  } catch (error: any) {
    return NextResponse.json({ cast: [] }, { status: 500 });
  }
}