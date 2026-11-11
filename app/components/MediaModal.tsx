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

export default function MediaModal({ isOpen, onClose, mediaItem }: MediaModalProps) {
  const [cast, setCast] = useState<CastMember[]>([]);
  const [loadingCast, setLoadingCast] = useState(false);

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

  // Fetch actor cast profile details from our local backend API route with fallback placeholders
  useEffect(() => {
    if (!isOpen || !mediaItem) return;
    setLoadingCast(true);
    let alive = true;

    const queryParams = new URLSearchParams({
      type: mediaItem.media_type || "movie",
      id: String(mediaItem.id || ""),
      title: mediaItem.title || ""
    });

    fetch(`/api/catalog/credits?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;
        if (data && data.cast && data.cast.length > 0) {
          setCast(data.cast);
        } else {
          // Fallback letter avatars when TMDB returns empty cast
          setCast([
            { id: 1, name: "Featured Star", character: "Main Role", profile_path: null },
            { id: 2, name: "Co-Star Actor", character: "Supporting Role", profile_path: null },
            { id: 3, name: "Guest Participant", character: "Special Appearance", profile_path: null }
          ]);
        }
      })
      .catch(() => {
        if (alive) {
          setCast([
            { id: 1, name: "Featured Star", character: "Main Role", profile_path: null },
            { id: 2, name: "Co-Star Actor", character: "Supporting Role", profile_path: null },
            { id: 3, name: "Guest Participant", character: "Special Appearance", profile_path: null }
          ]);
        }
      })
      .finally(() => {
        if (alive) setLoadingCast(false);
      });

    return () => {
      alive = false;
    };
  }, [isOpen, mediaItem]);

  // Inject Adsterra script tags dynamically
  useEffect(() => {
    if (!isOpen) return;

    const script1 = document.createElement("script");
    script1.type = "text/javascript";
    script1.src = "//www.highperformanceformat.com/5ec4f55f97a3a385351f624b4060de9a/invoke.js";
    const banner1Container = document.getElementById("adsterra-728x90");
    if (banner1Container) {
      banner1Container.innerHTML = "";
      const optionsScript = document.createElement("script");
      optionsScript.type = "text/javascript";
      optionsScript.text = "atOptions = { 'key' : '5ec4f55f97a3a385351f624b4060de9a', 'format' : 'iframe', 'height' : 90, 'width' : 728, 'params' : {} };";
      banner1Container.appendChild(optionsScript);
      banner1Container.appendChild(script1);
    }

    const script2 = document.createElement("script");
    script2.type = "text/javascript";
    script2.src = "//www.highperformanceformat.com/a4a46b8905aa9c65fe1defb28f6fd6fd/invoke.js";
    const banner2Container = document.getElementById("adsterra-300x250");
    if (banner2Container) {
      banner2Container.innerHTML = "";
      const optionsScript2 = document.createElement("script");
      optionsScript2.type = "text/javascript";
      optionsScript2.text = "atOptions = { 'key' : 'a4a46b8905aa9c65fe1defb28f6fd6fd', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };";
      banner2Container.appendChild(optionsScript2);
      banner2Container.appendChild(script2);
    }
  }, [isOpen]);

  if (!isOpen || !mediaItem) return null;

  const embedUrl = mediaItem.media_type === "movie"
    ? `https://vidsrc.me/embed/movie?tmdb=${mediaItem.id}`
    : `https://vidsrc.me/embed/tv?tmdb=${mediaItem.id}&season=1&episode=1`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-grid-layout" onClick={(e) => e.stopPropagation()}>
        {/* Left Column: Player & Ads */}
        <div className="modal-main">
          <div className="modal-head">
            <h2>{mediaItem.title} {mediaItem.year && <span className="yr">({mediaItem.year})</span>}</h2>
            <button className="close" onClick={onClose}>✕</button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
            <div id="adsterra-728x90"></div>
          </div>

          <div className="player">
            <iframe
              src={embedUrl}
              allowFullScreen={true}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
            <div id="adsterra-300x250"></div>
          </div>
        </div>

        {/* Right Column: Details & Cast Profiles */}
        <div className="modal-sidebar">
          <h3>Overview</h3>
          <p className="modal-overview-text">
            {mediaItem.overview || "No description available for this title."}
          </p>

          <div className="modal-info-block">
            <h4>Details</h4>
            <p><strong>Type:</strong> {mediaItem.media_type === "tv" ? "TV Series" : "Movie"}</p>
            <p><strong>Release Year:</strong> {mediaItem.year || "N/A"}</p>
          </div>

          <div className="modal-info-block">
            <h4>Top Cast & Participants</h4>
            {loadingCast ? (
              <p className="note" style={{ fontSize: "12px", marginTop: "8px" }}>Loading cast profiles...</p>
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
                      <span className="cast-character">{person.character || "Actor"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
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
        }
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
        }
        .modal-sidebar::-webkit-scrollbar {
          width: 4px;
        }
        .modal-sidebar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 2px;
        }
        .modal-sidebar h3, .modal-sidebar h4 {
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
          }
        }
      `}</style>
    </div>
  );
}