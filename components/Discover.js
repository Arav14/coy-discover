"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import SwipeCard from "./SwipeCard";
import MatchModal from "./MatchModal";
import Matches from "./Matches";
import { api } from "@/lib/api";

export default function Discover() {
  const [view, setView] = useState("swipe"); // "swipe" | "matches"
  const [cards, setCardsState] = useState([]);
  // Mirror of `cards` that updates synchronously, so rapid taps/keys never act on a stale top card.
  const cardsRef = useRef([]);
  const setCards = useCallback((next) => {
    cardsRef.current = typeof next === "function" ? next(cardsRef.current) : next;
    setCardsState(cardsRef.current);
  }, []);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [exitDir, setExitDir] = useState(1);
  const [match, setMatch] = useState(null);
  const [matches, setMatches] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  const showToast = useCallback((text, kind) => {
    clearTimeout(toastTimer.current);
    setToast({ text, kind, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 1400);
  }, []);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [feed, m] = await Promise.all([api.feed(), api.matches()]);
      setCards(feed.profiles);
      setMatches(m.matches);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [setCards]);

  useEffect(() => {
    load();
  }, [load]);

  const swipe = useCallback(
    async (action) => {
      const top = cardsRef.current[0];
      if (!top || match) return;
      const dir = action === "like" ? 1 : -1;
      setExitDir(dir);
      setCards((c) => c.slice(1)); // optimistic: card flies off immediately
      showToast(action === "like" ? `You liked ${top.name}` : `Passed on ${top.name}`, action);
      if (navigator.vibrate) navigator.vibrate(12);

      try {
        const res = await api.swipe(top.id, action);
        if (res.matched) {
          setMatch(res.match);
          setMatches((m) => [res.match, ...m]);
        }
      } catch (err) {
        if (err.status === 409) return; // already recorded (e.g. another tab)
        setCards((c) => [top, ...c]); // roll back so the swipe can be retried
        showToast("Couldn't save that swipe. Try again.", "error");
      }
    },
    [match, setCards, showToast]
  );

  // Keyboard support on desktop: ← pass, → like.
  useEffect(() => {
    if (view !== "swipe") return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") swipe("like");
      if (e.key === "ArrowLeft") swipe("pass");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [swipe, view]);

  async function resetDemo() {
    await api.reset();
    await load();
  }

  return (
    <section className="discover">
      <header className="topbar">
        <h1 className="logo">coy</h1>
        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={view === "swipe"} onClick={() => setView("swipe")}>
            Discover
          </button>
          <button role="tab" aria-selected={view === "matches"} onClick={() => setView("matches")}>
            Matches{matches.length > 0 && <span className="badge">{matches.length}</span>}
          </button>
        </div>
      </header>

      {view === "matches" ? (
        <Matches matches={matches} onDiscover={() => setView("swipe")} />
      ) : (
        <>
          <div className="deck">
            {status === "loading" && <div className="card skeleton" aria-label="Loading" />}
            {status === "error" && (
              <div className="empty">
                <h2>Couldn't load profiles</h2>
                <button className="btn" onClick={load}>Retry</button>
              </div>
            )}
            {status === "ready" && cards.length === 0 && (
              <div className="empty">
                <div className="empty-art" aria-hidden="true">✨</div>
                <h2>You're all caught up</h2>
                <p>No new profiles right now. Check back later, or see who you matched with.</p>
                <button className="btn" onClick={() => setView("matches")}>View matches</button>
                <button className="link" onClick={resetDemo}>Reset demo data</button>
              </div>
            )}
            <AnimatePresence custom={exitDir}>
              {status === "ready" &&
                cards
                  .slice(0, 2)
                  .reverse()
                  .map((p) => (
                    <SwipeCard key={p.id} profile={p} isTop={p.id === cards[0].id} onSwipe={swipe} />
                  ))}
            </AnimatePresence>
          </div>

          {status === "ready" && cards.length > 0 && (
            <div className="actions">
              <button className="action pass" onClick={() => swipe("pass")} aria-label="Pass">
                <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
              </button>
              <button className="action like" onClick={() => swipe("like")} aria-label="Like">
                <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 21s-7.5-4.6-9.5-9.2C1.1 8.4 3.2 5 6.6 5c2 0 3.6 1.1 4.4 2.6h2C13.8 6.1 15.4 5 17.4 5c3.4 0 5.5 3.4 4.1 6.8C19.5 16.4 12 21 12 21z"
                  />
                </svg>
              </button>
            </div>
          )}
          <p className="privacy-note">🔒 Your likes stay secret unless it's mutual.</p>
        </>
      )}

      {toast && (
        <div key={toast.key} className={`toast toast-${toast.kind}`} role="status">
          {toast.text}
        </div>
      )}

      <MatchModal
        match={match}
        onClose={() => setMatch(null)}
        onViewMatches={() => {
          setMatch(null);
          setView("matches");
        }}
      />
    </section>
  );
}
