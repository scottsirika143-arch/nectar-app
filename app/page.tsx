"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import MediaModal from "./components/MediaModal";

type MediaType = "movie" | "tv";
type Tab = "home" | "trending" | "tv" | "movie" | "watchlist";
type Sort = "popular" | "top" | "new";

interface Item {
  id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string;
  year?: string;
}
interface SeasonInfo {
  season_number: number;
  episode_count: number;
}
interface Genre {
  id: number;
  name: string;
}

const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";

const HOME_ROWS: {
  key: string;
  title: string;
  type?: MediaType;
  tab: Tab;
  sort: Sort;
}[] = [
  { key: "trending", title: "Trending Worldwide", tab: "trending", sort: "popular" },
  { key: "popularTv", title: "Popular TV Shows", type: "tv", tab: "tv", sort: "popular" },
  { key: "popularMovies", title: "Popular Movies", type: "movie", tab: "movie", sort: "popular" },
  { key: "topRatedMovies", title: "Top Rated Movies", type: "movie", tab: "movie", sort: "top" },
  { key: "topRatedTv", title: "Top Rated Series", type: "tv", tab: "tv", sort: "top" },
];

const stripStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "nowrap",
  overflowX: "auto",
  overflowY: "hidden",
  gap: 16,
  paddingBottom: 14,
  scrollbarWidth: "none",
};
const stripCardStyle: CSSProperties = {
  flex: "0 0 150px",
  width: 150,
  minWidth: 150,
};
const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: "22px 16px",
};

const keyOf = (i: Item) => `${i.media_type}-${i.id}`;

function normalize(raw: any[], fallbackType?: MediaType): Item[] {
  return (raw || [])
    .filter((r) => {
      const t = r.media_type || fallbackType;
      return t === "movie" || t === "tv";
    })
    .map((r) => {
      const t: MediaType = r.media_type || fallbackType;
      const date: string = r.release_date || r.first_air_date || "";
      return {
        id: r.id,
        media_type: t,
        title: r.title || r.name || "Untitled",
        poster_path: r.poster_path || null,
        backdrop_path: r.backdrop_path || null,
        overview: r.overview || "",
        year: date ? date.slice(0, 4) : undefined,
      };
    });
}

function posterUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${IMG_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

async function getJson(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${url} returned HTTP ${res.status} (not JSON).`);
  }
  if (!res.ok || data.error) {
    throw new Error(data.error || data.status_message || `HTTP ${res.status}`);
  }
  return data;
}

/* ---------- Poster card ---------- */
function PosterCard({
  item,
  onOpen,
  inStrip,
}: {
  item: Item;
  onOpen: (i: Item) => void;
  inStrip?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = posterUrl(item.poster_path);

  return (
    <button
      className="card"
      style={inStrip ? stripCardStyle : undefined}
      onClick={() => onOpen(item)}
      title={item.title}
    >
      <div className="poster">
        <span className="badge">{item.media_type === "tv" ? "SERIES" : "MOVIE"}</span>
        {src && !failed ? (
          <img src={src} alt={item.title} loading="lazy" onError={() => setFailed(true)} />
        ) : (
          <div className="placeholder">
            <span className="ph-brand">NECTAR</span>
            <span className="ph-title">{item.title}</span>
          </div>
        )}
      </div>
      <div className="meta">
        <span className="name">{item.title}</span>
        <span className="sub">{item.year || "—"}</span>
      </div>
    </button>
  );
}

/* ---------- Hero Banner Carousel ---------- */
function HeroCarousel({
  onOpen,
  watchlist,
  onToggleWatchlist,
}: {
  onOpen: (i: Item) => void;
  watchlist: Item[];
  onToggleWatchlist: (i: Item) => void;
}) {
  const [slides, setSlides] = useState<Item[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    getJson(`/api/catalog?row=trending`)
      .then((d) => {
        const items = normalize(d.results).slice(0, 5);
        setSlides(items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <section className="hero">
        <p className="eyebrow">YOUR NEXT OBSESSION STARTS HERE</p>
        <h1>
          <span className="grey">STORIES THAT</span>
          <br />
          <span className="accent">STAY WITH YOU.</span>
        </h1>
        <p className="lead">Discover the movies and series everyone is talking about.</p>
      </section>
    );
  }

  const item = slides[current];
  const bgImage = item.backdrop_path ? `${BACKDROP_BASE}${item.backdrop_path}` : posterUrl(item.poster_path);
  const isSaved = watchlist.some((w) => w.id === item.id && w.media_type === item.media_type);

  return (
    <div className="hero-carousel">
      <div
        className="hero-backdrop"
        style={{ backgroundImage: bgImage ? `url(${bgImage})` : undefined }}
      >
        <div className="hero-gradient" />
      </div>

      <div className="hero-content">
        <span className="eyebrow">★ FEATURED TRENDING #{current + 1}</span>
        <h1>{item.title}</h1>
        <p className="hero-overview">
          {item.overview ? item.overview.slice(0, 180) + "..." : "Explore this epic title now."}
        </p>
        <div className="cta">
          <button className="btn primary" onClick={() => onOpen(item)}>
            ▶ Watch Now
          </button>
          <button className="btn ghost" onClick={() => onToggleWatchlist(item)}>
            {isSaved ? "✓ In Watchlist" : "+ Watchlist"}
          </button>
        </div>

        <div className="carousel-dots">
          {slides.map((_, idx) => (
            <button
              key={idx}
              className={`dot-btn ${idx === current ? "active" : ""}`}
              onClick={() => setCurrent(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Home row ---------- */
function HomeRow({
  row,
  onOpen,
  onExplore,
}: {
  row: (typeof HOME_ROWS)[number];
  onOpen: (i: Item) => void;
  onExplore: () => void;
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    getJson(`/api/catalog?row=${row.key}`)
      .then((d) => alive && setItems(normalize(d.results, row.type)))
      .catch((e) => {
        if (!alive) return;
        setItems([]);
        setErr(e.message);
      });
    return () => {
      alive = false;
    };
  }, [row.key, row.type]);

  const scroll = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="section">
      <div className="row-head">
        <h3>{row.title}</h3>
        <button className="explore" onClick={onExplore}>
          Explore collection →
        </button>
      </div>
      {err && <p className="note err">⚠ {err}</p>}
      <div className="strip-wrap">
        <button className="arrow left" onClick={() => scroll(-1)} aria-label="Scroll left">
          ‹
        </button>
        <div className="strip" style={stripStyle} ref={ref}>
          {(items || []).map((item) => (
            <PosterCard key={keyOf(item)} item={item} onOpen={onOpen} inStrip />
          ))}
          {items === null &&
            Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ ...stripCardStyle, aspectRatio: "2 / 3" }}
              />
            ))}
        </div>
        <button className="arrow right" onClick={() => scroll(1)} aria-label="Scroll right">
          ›
        </button>
      </div>
    </section>
  );
}

/* ---------- Infinite grid ---------- */
function InfiniteGrid({
  base,
  fallbackType,
  onOpen,
  emptyText,
}: {
  base: string;
  fallbackType?: MediaType;
  onOpen: (i: Item) => void;
  emptyText: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const page = useRef(1);
  const busy = useRef(false);
  const doneRef = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = async () => {
    if (busy.current || doneRef.current) return;
    busy.current = true;
    setLoading(true);
    try {
      const sep = base.includes("?") ? "&" : "?";
      const data = await getJson(`${base}${sep}page=${page.current}`);
      const next = normalize(data.results, fallbackType);
      setItems((prev) => {
        const seen = new Set(prev.map(keyOf));
        return [...prev, ...next.filter((i) => !seen.has(keyOf(i)))];
      });
      const total = Math.min(data.total_pages || 1, 500);
      if (page.current >= total) {
        doneRef.current = true;
        setDone(true);
      }
      page.current += 1;
    } catch (e: any) {
      setError(e.message || "Failed to load");
      doneRef.current = true;
      setDone(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "700px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || doneRef.current) return;
    if (el.getBoundingClientRect().top < window.innerHeight + 700) loadMore();
  }, [items.length]);

  return (
    <>
      {error && <p className="note err">⚠ {error}</p>}
      {!loading && !error && items.length === 0 && done && (
        <p className="note">{emptyText}</p>
      )}
      <div className="grid" style={gridStyle}>
        {items.map((item) => (
          <PosterCard key={keyOf(item)} item={item} onOpen={onOpen} />
        ))}
      </div>
      <div ref={sentinel} style={{ height: 1 }} />
      {loading && <p className="note center">Loading…</p>}
      {done && items.length > 0 && <p className="note center">You've reached the end.</p>}
    </>
  );
}

/* ---------- Browse view ---------- */
function Browse({
  tab,
  sort,
  setSort,
  genre,
  setGenre,
  onOpen,
}: {
  tab: Exclude<Tab, "home" | "watchlist">;
  sort: Sort;
  setSort: (s: Sort) => void;
  genre: string;
  setGenre: (g: string) => void;
  onOpen: (i: Item) => void;
}) {
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    if (tab === "trending") return;
    let alive = true;
    getJson(`/api/catalog?genres=${tab}`)
      .then((d) => alive && setGenres(d.genres || []))
      .catch(() => alive && setGenres([]));
    return () => {
      alive = false;
    };
  }, [tab]);

  const title =
    tab === "trending" ? "Trending Worldwide" : tab === "tv" ? "TV Shows" : "Movies";
  const base =
    tab === "trending"
      ? `/api/catalog?row=trending`
      : `/api/catalog?type=${tab}&sort=${sort}&genre=${genre}`;

  return (
    <section className="section">
      <div className="row-head">
        <h3 className="big">{title}</h3>
        {tab !== "trending" && (
          <div className="filters">
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="popular">Most Popular</option>
              <option value="top">Top Rated</option>
              <option value="new">Newest</option>
            </select>
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="">All genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <InfiniteGrid
        key={base}
        base={base}
        fallbackType={tab === "trending" ? undefined : tab}
        onOpen={onOpen}
        emptyText="Nothing found."
      />
    </section>
  );
}

/* ---------- Page ---------- */
export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [sort, setSort] = useState<Sort>("popular");
  const [genre, setGenre] = useState("");
  const [query, setQuery] = useState("");
  const [dq, setDq] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [watchlist, setWatchlist] = useState<Item[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("nectar_watchlist");
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse watchlist", e);
      }
    }
  }, []);

  const toggleWatchlist = (item: Item) => {
    setWatchlist((prev) => {
      const exists = prev.some((w) => w.id === item.id && w.media_type === item.media_type);
      let updated;
      if (exists) {
        updated = prev.filter((w) => !(w.id === item.id && w.media_type === item.media_type));
      } else {
        updated = [item, ...prev];
      }
      localStorage.setItem("nectar_watchlist", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const t = setTimeout(() => setDq(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const go = (t: Tab, s: Sort = "popular") => {
    setQuery("");
    setDq("");
    setTab(t);
    setSort(s);
    setGenre("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const searching = dq.length > 0;

  return (
    <main className="app">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="top">
        <button className="logo" onClick={() => go("home")}>
          NECTAR<span className="dot" />
        </button>
        <nav className="nav">
          {(
            [
              ["home", "Home"],
              ["trending", "Trending"],
              ["tv", "TV Shows"],
              ["movie", "Movies"],
              ["watchlist", `Watchlist (${watchlist.length})`],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              className={`navbtn ${!searching && tab === t ? "active" : ""}`}
              onClick={() => go(t)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="searchbox">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search any movie or series in the world..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      {searching ? (
        <section className="section">
          <h3 className="big">Results for “{dq}”</h3>
          <InfiniteGrid
            key={dq}
            base={`/api/search?query=${encodeURIComponent(dq)}`}
            onOpen={setSelected}
            emptyText="No results found."
          />
        </section>
      ) : tab === "watchlist" ? (
        <section className="section">
          <h3 className="big">My Watchlist</h3>
          {watchlist.length === 0 ? (
            <p className="note" style={{ marginTop: "20px" }}>
              Your watchlist is empty. Click "+ Watchlist" on any movie or series to save it here!
            </p>
          ) : (
            <div className="grid" style={{ ...gridStyle, marginTop: "20px" }}>
              {watchlist.map((item) => (
                <PosterCard key={keyOf(item)} item={item} onOpen={setSelected} />
              ))}
            </div>
          )}
        </section>
      ) : tab === "home" ? (
        <>
          <HeroCarousel
            onOpen={setSelected}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
          />

          {HOME_ROWS.map((row) => (
            <HomeRow
              key={row.key}
              row={row}
              onOpen={setSelected}
              onExplore={() => go(row.tab, row.sort)}
            />
          ))}
        </>
      ) : (
        <Browse
          tab={tab as Exclude<Tab, "home" | "watchlist">}
          sort={sort}
          setSort={setSort}
          genre={genre}
          setGenre={setGenre}
          onOpen={setSelected}
        />
      )}

      <MediaModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        mediaItem={selected}
      />
    </main>
  );
}

const CSS = `
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0; background: #050505; color: #f1f1f1;
  font-family: "Helvetica Neue", Arial, sans-serif;
}
button { font-family: inherit; }
.app { min-height: 100vh; padding-bottom: 80px; }

.top {
  position: sticky; top: 0; z-index: 30;
  display: flex; flex-direction: row; align-items: center; gap: 28px;
  padding: 16px 40px;
  background: linear-gradient(to bottom, rgba(5,5,5,.96), rgba(5,5,5,.8));
  backdrop-filter: blur(8px);
}
.logo {
  background: none; border: none; cursor: pointer; padding: 0;
  font-weight: 900; font-size: 26px; letter-spacing: -1px; color: #e63e1c;
  display: flex; align-items: flex-end; gap: 2px;
}
.logo .dot { width: 7px; height: 7px; background: #e8e8e8; display: inline-block; margin-bottom: 5px; }
.nav { display: flex; gap: 22px; }
.navbtn {
  background: none; border: none; color: #b5b5b5; font-size: 13px; font-weight: 600;
  cursor: pointer; padding: 6px 0;
}
.navbtn:hover, .navbtn.active { color: #fff; }
.searchbox {
  margin-left: auto; display: flex; align-items: center; gap: 10px;
  width: 340px; max-width: 42vw; padding: 10px 16px; border-radius: 999px;
  background: #0f0f0f; border: 1px solid #1d1d1d; color: #888;
}
.searchbox:focus-within { border-color: #e63e1c; }
.searchbox input {
  flex: 1; min-width: 0; background: none; border: none; outline: none;
  color: #fff; font-size: 13px;
}
.searchbox input::-webkit-search-cancel-button { filter: invert(1); }

/* Hero Carousel */
.hero-carousel {
  position: relative; width: 100%; height: 560px; display: flex; align-items: flex-end;
  overflow: hidden; background: #000;
}
.hero-backdrop {
  position: absolute; inset: 0; background-size: cover; background-position: center;
  filter: brightness(0.65); transition: background-image 0.8s ease-in-out;
}
.hero-gradient {
  position: absolute; inset: 0;
  background: linear-gradient(0deg, #050505 0%, rgba(5,5,5,0.7) 40%, rgba(5,5,5,0.2) 100%);
}
.hero-content {
  position: relative; z-index: 10; padding: 40px; max-width: 750px;
}
.eyebrow { color: #e63e1c; font-size: 11px; font-weight: 800; letter-spacing: 3px; margin: 0 0 12px; display: block; }
.hero-content h1 {
  margin: 0 0 14px; font-size: clamp(36px, 6vw, 64px); line-height: 1.05;
  font-weight: 900; letter-spacing: -1px; color: #fff; text-transform: uppercase;
}
.hero-overview { max-width: 520px; color: #cfcfcf; font-size: 14px; line-height: 1.5; margin: 0 0 24px; }
.carousel-dots { display: flex; gap: 8px; margin-top: 24px; }
.dot-btn {
  width: 28px; height: 4px; border-radius: 2px; border: none; background: rgba(255,255,255,0.3);
  cursor: pointer; transition: background 0.3s; padding: 0;
}
.dot-btn.active { background: #e63e1c; }

.cta { display: flex; gap: 12px; flex-wrap: wrap; }
.btn { padding: 13px 26px; border-radius: 6px; font-size: 14px; font-weight: 700; cursor: pointer; border: 1px solid transparent; }
.btn.primary { background: #e63e1c; color: #fff; }
.btn.primary:hover { background: #ff4a26; }
.btn.ghost { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.2); backdrop-filter: blur(4px); }
.btn.ghost:hover { border-color: #fff; }

/* Sections */
.section { padding: 26px 40px 0; }
.row-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
.section h3 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -.3px; }
.section h3.big { font-size: 28px; }
.explore { background: none; border: none; color: #8a8a8a; font-size: 12px; cursor: pointer; }
.explore:hover { color: #e63e1c; }
.note { color: #8b8b8b; font-size: 14px; }
.note.center { text-align: center; padding: 22px 0; }
.note.err { color: #ff6b6b; }
.filters { display: flex; gap: 10px; }
.filters select {
  background: #0f0f0f; color: #fff; border: 1px solid #222; border-radius: 8px;
  padding: 9px 12px; font-size: 13px;
}

/* Strip + arrows */
.strip-wrap { position: relative; }
.strip::-webkit-scrollbar { display: none; }
.arrow {
  position: absolute; top: 0; bottom: 56px; width: 44px; z-index: 5;
  border: none; color: #fff; font-size: 34px; cursor: pointer; opacity: 0;
  transition: opacity .2s;
}
.strip-wrap:hover .arrow { opacity: 1; }
.arrow.left { left: -40px; background: linear-gradient(to right, rgba(5,5,5,.95), transparent); }
.arrow.right { right: -40px; background: linear-gradient(to left, rgba(5,5,5,.95), transparent); }

/* Cards */
.card {
  display: flex; flex-direction: column; background: none; border: none; padding: 0;
  color: inherit; text-align: left; cursor: pointer; min-width: 0;
}
.poster {
  position: relative; width: 100%; aspect-ratio: 2 / 3; border-radius: 8px;
  overflow: hidden; background: #0d0d0d; border: 1px solid #161616;
  transition: transform .2s ease, border-color .2s ease;
}
.card:hover .poster { transform: translateY(-4px) scale(1.03); border-color: #e63e1c; }
.poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
.badge {
  position: absolute; top: 8px; right: 8px; z-index: 2;
  font-size: 9px; font-weight: 800; letter-spacing: 1px; color: #fff;
  background: rgba(0,0,0,.65); padding: 3px 7px; border-radius: 4px;
}
.placeholder {
  width: 100%; height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; padding: 14px; text-align: center;
  background: linear-gradient(160deg, #141414, #080808);
}
.ph-brand { font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #3a3a3a; }
.ph-title { font-size: 13px; font-weight: 700; color: #cfcfcf; line-height: 1.3; word-break: break-word; }
.meta { display: flex; flex-direction: column; padding: 10px 2px 0; min-width: 0; }
.name { font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub { font-size: 11px; color: #8b8b8b; margin-top: 3px; }
.skeleton {
  border-radius: 8px;
  background: linear-gradient(90deg, #0d0d0d, #171717, #0d0d0d);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }

/* Modal & Watchlist Styles */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,.88);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.modal {
  width: 100%; max-width: 1000px; max-height: 95vh; overflow-y: auto;
  background: #0a0a0a; border: 1px solid #1d1d1d; border-radius: 14px; padding: 18px;
}
.modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; gap: 12px; }
.modal-head h2 { margin: 0; font-size: 21px; font-weight: 800; }
.yr { color: #8b8b8b; font-weight: 500; }
.close {
  background: #181818; border: none; color: #fff; width: 34px; height: 34px;
  border-radius: 50%; cursor: pointer; font-size: 14px; flex: 0 0 auto;
}
.close:hover { background: #e63e1c; }
.player { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #000; border-radius: 10px; overflow: hidden; }
.player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }

@media (max-width: 760px) {
  .top { padding: 12px 16px; gap: 14px; flex-wrap: wrap; }
  .nav { order: 3; width: 100%; gap: 18px; overflow-x: auto; }
  .searchbox { width: auto; flex: 1; max-width: none; }
  .hero-carousel { height: 420px; }
  .hero-content { padding: 24px; }
  .section { padding: 22px 16px 0; }
  .arrow { display: none; }
}
`;