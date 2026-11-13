"use client";

import { useEffect, useState } from "react";

interface Item {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string;
  year?: string;
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: Item | null;
}

export default function MediaModal({
  isOpen,
  onClose,
  mediaItem,
}: MediaModalProps) {
  const [cast, setCast] = useState<CastMember[]>([]);
  const [loadingCast, setLoadingCast] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");

  // TV Series Selector States
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [seasonList, setSeasonList] = useState<number[]>([1, 2, 3]); // Fallback or dynamic
  const [episodesCount, setEpisodesCount] = useState<number>(10); // Default placeholder count per season

  // Auto-detect browser/region language for automatic localization (Defaults to English)
  useEffect(() => {
    try {
      if (!localStorage.getItem("nectar_user_lang")) {
        const navLang = window.navigator.language || "en";
        if (navLang.startsWith("fr")) {
          localStorage.setItem("nectar_user_lang", "fr");
        } else {
          localStorage.setItem("nectar_user_lang", "en");
        }
      }
      setCurrentLang(localStorage.getItem("nectar_user_lang") || "en");
    } catch {
      setCurrentLang("en");
    }
  }, []);

  // Reset season/episode when modal opens with a new media item
  useEffect(() => {
    setSelectedSeason(1);
    setSelectedEpisode(1);
  }, [mediaItem]);

  // Play the professional mp3 intro audio and manage the 5.5s timeline
  useEffect(() => {
    if (!isOpen) return;
    setShowIntro(true);

    const audio = new Audio("/nectar-intro.mp3");
    audio.volume = 0.9;
    audio.play().catch((err) => {
      console.log("Browser autoplay restriction prevented audio playback:", err);
    });

    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 5500);

    return () => {
      clearTimeout(timer);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isOpen, mediaItem]);

  // Check if current item is already in Watch Later list
  useEffect(() => {
    if (!mediaItem) return;
    try {
      const savedList = JSON.parse(localStorage.getItem("nectar_watch_later") || "[]");
      const exists = savedList.some((item: Item) => item.id === mediaItem.id);
      setIsWatchLater(exists);
    } catch {
      setIsWatchLater(false);
    }
  }, [mediaItem]);

  // Toggle Watch Later state
  const handleWatchLaterToggle = () => {
    if (!mediaItem) return;
    try {
      const savedList = JSON.parse(localStorage.getItem("nectar_watch_later") || "[]");
      if (isWatchLater) {
        const filtered = savedList.filter((item: Item) => item.id !== mediaItem.id);
        localStorage.setItem("nectar_watch_later", JSON.stringify(filtered));
        setIsWatchLater(false);
      } else {
        savedList.push(mediaItem);
        localStorage.setItem("nectar_watch_later", JSON.stringify(savedList));
        setIsWatchLater(true);
      }
    } catch (e) {
      console.log("Error updating watch later", e);
    }
  };

  // Close modal with Escape and prevent background scrolling.
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Fetch cast profiles & TV metadata (seasons count)
  useEffect(() => {
    if (!isOpen || !mediaItem) return;

    setLoadingCast(true);
    let alive = true;

    const queryParams = new URLSearchParams({
      type: mediaItem.media_type || "movie",
      id: String(mediaItem.id || ""),
      title: mediaItem.title || "",
      lang: currentLang,
    });

    fetch(`/api/catalog/credits?${queryParams.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load cast");
        return res.json();
      })
      .then((data) => {
        if (!alive) return;

        if (data?.cast?.length > 0) {
          setCast(data.cast);
        } else {
          setCast([
            {
              id: 1,
              name: currentLang === "fr" ? "Acteur Principal" : "Featured Star",
              character: currentLang === "fr" ? "Rôle Principal" : "Main Role",
              profile_path: null,
            },
            {
              id: 2,
              name: currentLang === "fr" ? "Co-Star" : "Co-Star Actor",
              character: currentLang === "fr" ? "Rôle Secondaire" : "Supporting Role",
              profile_path: null,
            },
          ]);
        }
      })
      .catch(() => {
        if (!alive) return;
        setCast([
          {
            id: 1,
            name: "Featured Star",
            character: "Main Role",
            profile_path: null,
          },
        ]);
      })
      .finally(() => {
        if (alive) setLoadingCast(false);
      });

    return () => {
      alive = false;
    };
  }, [isOpen, mediaItem, currentLang]);

  // Inject Adsterra scripts when the modal opens.
  useEffect(() => {
    if (!isOpen) return;

    const banner1Container = document.getElementById("adsterra-728x90");

    if (banner1Container) {
      banner1Container.innerHTML = "";

      const optionsScript = document.createElement("script");
      optionsScript.type = "text/javascript";
      optionsScript.text =
        "atOptions = { 'key' : '5ec4f55f97a3a385351f624b4060de9a', 'format' : 'iframe', 'height' : 90, 'width' : 728, 'params' : {} };";

      const script1 = document.createElement("script");
      script1.type = "text/javascript";
      script1.src =
        "//www.highperformanceformat.com/5ec4f55f97a3a385351f624b4060de9a/invoke.js";

      banner1Container.appendChild(optionsScript);
      banner1Container.appendChild(script1);
    }

    const banner2Container = document.getElementById("adsterra-300x250");

    if (banner2Container) {
      banner2Container.innerHTML = "";

      const optionsScript2 = document.createElement("script");
      optionsScript2.type = "text/javascript";
      optionsScript2.text =
        "atOptions = { 'key' : 'a4a46b8905aa9c65fe1defb28f6fd6fd', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };";

      const script2 = document.createElement("script");
      script2.type = "text/javascript";
      script2.src =
        "//www.highperformanceformat.com/a4a46b8905aa9c65fe1defb28f6fd6fd/invoke.js";

      banner2Container.appendChild(optionsScript2);
      banner2Container.appendChild(script2);
    }
  }, [isOpen]);

  if (!isOpen || !mediaItem) return null;

  const embedUrl =
    mediaItem.media_type === "movie"
      ? `https://vidsrc.me/embed/movie?tmdb=${mediaItem.id}`
      : `https://vidsrc.me/embed/tv?tmdb=${mediaItem.id}&season=${selectedSeason}&episode=${selectedEpisode}`;

  // Localized string dictionary supporting English & French automatically
  const uiText = {
    en: {
      play: mediaItem.media_type === "tv" ? "Play Series" : "Play Movie",
      watchLater: "+ Watch Later",
      inWatchLater: "✓ In Watch Later",
      overview: "Overview",
      details: "Details",
      type: "Type",
      year: "Release Year",
      cast: "Top Cast & Participants",
      loading: "Loading cast profiles...",
      tvSeries: "TV Series",
      movie: "Movie",
      noDesc: "No description available for this title.",
      seasons: "Season",
      episodes: "Episodes",
    },
    fr: {
      play: mediaItem.media_type === "tv" ? "Lire la série" : "Lire le film",
      watchLater: "+ Ma Liste",
      inWatchLater: "✓ Dans Ma Liste",
      overview: "Synopsis",
      details: "Détails",
      type: "Type",
      year: "Année de sortie",
      cast: "Distribution principale",
      loading: "Chargement des acteurs...",
      tvSeries: "Série TV",
      movie: "Film",
      noDesc: "Aucune description disponible pour ce titre.",
      seasons: "Saison",
      episodes: "Épisodes",
    },
  };

  const t = uiText[currentLang as keyof typeof uiText] || uiText.en;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-grid-layout"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Column: Player & Ads */}
        <div className="modal-main">
          <div className="modal-head">
            <div>
              <h2>
                {mediaItem.title}{" "}
                {mediaItem.year && (
                  <span className="yr">({mediaItem.year})</span>
                )}
              </h2>
            </div>

            <button className="close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          {/* Red Action Buttons Bar */}
          <div className="modal-actions-bar">
            <a href="#player-section" className="btn-red-play">
              ▶ {t.play}
            </a>
            <button 
              className={`btn-watch-later ${isWatchLater ? "active" : ""}`}
              onClick={handleWatchLaterToggle}
            >
              {isWatchLater ? t.inWatchLater : t.watchLater}
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "10px 0",
            }}
          >
            <div id="adsterra-728x90"></div>
          </div>

          <div className="player" id="player-section">
            {/* Ultra-Premium 5.5s Cinematic NECTAR Intro Ident Overlay with MP3 Audio */}
            <div 
              className="nectar-cinematic-intro"
              style={{
                opacity: showIntro ? 1 : 0,
                pointerEvents: showIntro ? "auto" : "none",
              }}
            >
              <div className="tunnel-spectrum">
                <div className="light-ribbon r-deepred"></div>
                <div className="light-ribbon r-crimson"></div>
                <div className="light-ribbon r-orange"></div>
                <div className="light-ribbon r-yellow"></div>
                <div className="light-ribbon r-magenta"></div>
                <div className="light-ribbon r-pink"></div>
                <div className="light-ribbon r-violet"></div>
                <div className="light-ribbon r-purple"></div>
                <div className="light-ribbon r-blue"></div>
              </div>

              <div className="ident-stage">
                <div className="giant-ribbon-n-wrapper">
                  <div className="glossy-ribbon-n">N</div>
                </div>
                <div className="nectar-final-logo">
                  <span className="logo-n">N</span>
                  <span className="logo-ect">ECTAR</span>
                </div>
              </div>
            </div>

            <iframe
              src={embedUrl}
              title={`${mediaItem.title} video player`}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          {/* --- Season & Episode Selector for TV Series --- */}
          {mediaItem.media_type === "tv" && (
            <div className="tv-selector-container">
              <div className="tv-selector-header">
                <h3>{t.episodes}</h3>
                <div className="season-dropdown-wrapper">
                  <label htmlFor="season-select" className="sr-only">Select Season</label>
                  <select
                    id="season-select"
                    value={selectedSeason}
                    onChange={(e) => {
                      setSelectedSeason(Number(e.target.value));
                      setSelectedEpisode(1); // Reset to Episode 1 on season change
                    }}
                    className="season-select"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        {t.seasons} {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="episode-grid">
                {Array.from({ length: episodesCount }, (_, i) => i + 1).map((epNum) => (
                  <button
                    key={epNum}
                    onClick={() => setSelectedEpisode(epNum)}
                    className={`episode-card ${selectedEpisode === epNum ? "active" : ""}`}
                  >
                    <span className="ep-num">E{epNum}</span>
                    <span className="ep-label">Episode {epNum}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* ----------------------------------------------- */}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "16px 0",
            }}
          >
            <div id="adsterra-300x250"></div>
          </div>
        </div>

        {/* Right Column: Details & Cast Profiles */}
        <div className="modal-sidebar">
          <h3>{t.overview}</h3>

          <p className="modal-overview-text">
            {mediaItem.overview || t.noDesc}
          </p>

          <div className="modal-info-block">
            <h4>{t.details}</h4>

            <p>
              <strong>{t.type}:</strong>{" "}
              {mediaItem.media_type === "tv" ? t.tvSeries : t.movie}
            </p>

            <p>
              <strong>{t.year}:</strong> {mediaItem.year || "N/A"}
            </p>
          </div>

          <div className="modal-info-block">
            <h4>{t.cast}</h4>

            {loadingCast ? (
              <p
                className="note"
                style={{ fontSize: "12px", marginTop: "8px" }}
              >
                {t.loading}
              </p>
            ) : (
              <div className="cast-grid">
                {cast.map((person) => (
                  <div key={person.id} className="cast-card">
                    {person.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                        alt={person.name}
                        className="cast-avatar"
                        loading="lazy"
                      />
                    ) : (
                      <div className="cast-avatar placeholder-avatar">
                        {person.name ? person.name.charAt(0) : "A"}
                      </div>
                    )}

                    <div className="cast-details">
                      <span className="cast-name">{person.name}</span>
                      <span className="cast-character">
                        {person.character || "Actor"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-grid-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          width: 95vw;
          max-width: 1400px;
          max-height: 95vh;
          overflow-y: auto;
          background: #0a0a0a;
          border: 1px solid #1d1d1d;
          border-radius: 14px;
          padding: 24px;
          color: #f1f1f1;
        }

        .modal-main {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .modal-head h2 {
          margin: 0;
          font-size: 20px;
        }

        .modal-actions-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 14px;
        }

        .btn-red-play {
          background-color: #e50914;
          color: #ffffff;
          padding: 8px 18px;
          font-weight: 700;
          font-size: 14px;
          border-radius: 6px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s ease;
        }

        .btn-red-play:hover {
          background-color: #f40612;
        }

        .btn-watch-later {
          background-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          font-weight: 600;
          font-size: 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-watch-later:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .btn-watch-later.active {
          background-color: #ffffff;
          color: #000000;
          border-color: #ffffff;
        }

        .close {
          background: transparent;
          border: none;
          color: #fff;
          font-size: 20px;
          cursor: pointer;
        }

        .player {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
        }

        .player iframe {
          display: block;
          width: 100%;
          height: 100%;
          border: none;
        }

        /* --- TV Selector Styles --- */
        .tv-selector-container {
          margin-top: 16px;
          background: #141414;
          border: 1px solid #222;
          border-radius: 8px;
          padding: 16px;
        }

        .tv-selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .tv-selector-header h3 {
          margin: 0;
          font-size: 16px;
          color: #fff;
        }

        .season-select {
          background: #1f1f1f;
          color: #fff;
          border: 1px solid #333;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          outline: none;
          cursor: pointer;
        }

        .season-select:hover {
          border-color: #e50914;
        }

        .episode-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 8px;
          max-height: 140px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .episode-grid::-webkit-scrollbar {
          width: 4px;
        }

        .episode-grid::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 2px;
        }

        .episode-card {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          padding: 8px;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 2px;
          transition: all 0.2s ease;
        }

        .episode-card:hover {
          background: #252525;
          border-color: #444;
        }

        .episode-card.active {
          background: #e50914;
          border-color: #e50914;
        }

        .ep-num {
          font-size: 12px;
          font-weight: 700;
          color: #fff;
        }

        .ep-label {
          font-size: 10px;
          color: #aaa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .episode-card.active .ep-label {
          color: rgba(255, 255, 255, 0.8);
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }

        /* --- Ultra-Premium 5.5s Cinematic NECTAR Intro Ident --- */
        .nectar-cinematic-intro {
          position: absolute;
          inset: 0;
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 70;
          overflow: hidden;
          transition: opacity 0.7s ease-in-out;
        }

        .ident-stage {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .giant-ribbon-n-wrapper {
          position: absolute;
          animation: giantNSequence 3.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .glossy-ribbon-n {
          font-family: sans-serif;
          font-weight: 900;
          font-size: 140px;
          color: #e50914;
          text-shadow: 0 0 50px rgba(229, 9, 20, 0.9), inset 0 0 20px rgba(255, 255, 255, 0.5);
          filter: drop-shadow(0 15px 25px rgba(0,0,0,0.8));
        }

        .tunnel-spectrum {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          animation: tunnelZoomSequence 2s cubic-bezier(0.1, 0.9, 0.2, 1) 3.5s forwards;
        }

        .light-ribbon {
          position: absolute;
          width: 150%;
          height: 150%;
          border: 6px solid rgba(255,255,255,0.08);
          border-radius: 50%;
        }

        .r-deepred { border-color: rgba(180, 0, 10, 0.9); transform: scale(0.2); animation: ringPulse 1.5s infinite; }
        .r-crimson { border-color: rgba(229, 9, 20, 0.9); transform: scale(0.4); animation: ringPulse 1.5s infinite 0.1s; }
        .r-orange  { border-color: rgba(255, 107, 0, 0.8); transform: scale(0.6); animation: ringPulse 1.5s infinite 0.2s; }
        .r-yellow  { border-color: rgba(255, 214, 0, 0.8); transform: scale(0.8); animation: ringPulse 1.5s infinite 0.3s; }
        .r-magenta { border-color: rgba(219, 0, 150, 0.9); transform: scale(1.0); animation: ringPulse 1.5s infinite 0.4s; }
        .r-pink    { border-color: rgba(255, 45, 120, 0.8); transform: scale(1.2); animation: ringPulse 1.5s infinite 0.5s; }
        .r-violet  { border-color: rgba(180, 0, 255, 0.8); transform: scale(1.4); animation: ringPulse 1.5s infinite 0.6s; }
        .r-purple  { border-color: rgba(120, 0, 219, 0.8); transform: scale(1.6); animation: ringPulse 1.5s infinite 0.7s; }
        .r-blue    { border-color: rgba(0, 115, 255, 0.9); transform: scale(1.8); animation: ringPulse 1.5s infinite 0.8s; }

        .nectar-final-logo {
          position: absolute;
          display: flex;
          align-items: baseline;
          font-family: sans-serif;
          font-weight: 900;
          letter-spacing: 10px;
          opacity: 0;
          transform: scale(0.85);
          animation: finalBrandReveal 0.7s cubic-bezier(0.1, 0.9, 0.2, 1) 4.8s forwards;
        }

        .logo-n {
          color: #e50914;
          font-size: 58px;
          text-shadow: 0 0 30px rgba(229, 9, 20, 0.7);
        }

        .logo-ect {
          color: #ffffff;
          font-size: 42px;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }

        @keyframes giantNSequence {
          0% { transform: scale(0.3); opacity: 0; filter: blur(12px); }
          25% { transform: scale(1); opacity: 1; filter: blur(0px); }
          65% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(4.5); opacity: 0; filter: blur(15px); }
        }

        @keyframes tunnelZoomSequence {
          0% { opacity: 0; transform: scale(0.3); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: scale(3.5); }
        }

        @keyframes ringPulse {
          0% { opacity: 0.2; transform: scale(0.5); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: scale(2.2); }
        }

        @keyframes finalBrandReveal {
          0% { opacity: 0; transform: scale(0.85); filter: blur(8px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0px); }
        }
        /* ----------------------------------------------------- */

        .modal-sidebar {
          background: #121212;
          border: 1px solid #222;
          border-radius: 10px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 85vh;
          overflow-y: auto;
          min-width: 0;
        }

        .modal-sidebar::-webkit-scrollbar {
          width: 4px;
        }

        .modal-sidebar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 2px;
        }

        .modal-sidebar h3,
        .modal-sidebar h4 {
          margin: 0 0 8px 0;
          color: #fff;
        }

        .modal-overview-text {
          font-size: 13px;
          line-height: 1.5;
          color: #b5b5b5;
          margin: 0;
        }

        .modal-info-block {
          border-top: 1px solid #222;
          padding-top: 12px;
          font-size: 13px;
          color: #ccc;
        }

        .modal-info-block p {
          margin: 4px 0;
        }

        .cast-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }

        .cast-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #181818;
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid #222;
        }

        .cast-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .placeholder-avatar {
          background: #333;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
        }

        .cast-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .cast-name {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cast-character {
          font-size: 11px;
          color: #8b8b8b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 900px) {
          .modal-grid-layout {
            grid-template-columns: 1fr;
            padding: 16px;
            gap: 16px;
          }

          .modal-sidebar {
            max-height: none;
          }
        }

        @media (max-width: 480px) {
          .modal-grid-layout {
            width: 96vw;
            max-height: 96vh;
            padding: 12px;
          }

          .modal-head h2 {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}