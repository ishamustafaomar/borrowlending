import { useEffect, useMemo, useState } from "react";

/**
 * Seasonal mascot — a simple Claude-style round coral crab that
 * adapts to the time of year. Pure SVG + CSS, no external assets.
 */

type Season =
  | "superbowl"
  | "valentines"
  | "stpatricks"
  | "spring"
  | "easter"
  | "summer"
  | "july4"
  | "worldcup"
  | "backToSchool"
  | "fall"
  | "halloween"
  | "thanksgiving"
  | "winter"
  | "christmas"
  | "newyear"
  | "default";

interface SeasonInfo {
  key: Season;
  label: string;
  caption: string;
}

function detectSeason(date: Date): SeasonInfo {
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();
  const md = m * 100 + d;

  // Super Bowl — early February (usually 2nd Sun)
  if (m === 2 && d <= 14) return { key: "superbowl", label: "Super Bowl Sunday", caption: "Hut, hut, borrow!" };
  if (m === 2 && d >= 13 && d <= 15) return { key: "valentines", label: "Valentine's", caption: "Share the love." };
  if (m === 3 && d >= 14 && d <= 18) return { key: "stpatricks", label: "St. Paddy's", caption: "Lucky to share." };
  // FIFA World Cup 2026: June 11 – July 19
  if ((m === 6 && d >= 11) || (m === 7 && d <= 19)) return { key: "worldcup", label: "World Cup", caption: "Goooaaal-sharing!" };
  if (m === 7 && d >= 1 && d <= 6) return { key: "july4", label: "4th of July", caption: "Block-party energy." };
  if (m >= 3 && m <= 5) return { key: "spring", label: "Spring", caption: "Fresh-air sharing." };
  if (m === 4 && d >= 1 && d <= 21) return { key: "easter", label: "Easter", caption: "Hop on over." };
  if (m === 8 || (m === 9 && d <= 10)) return { key: "backToSchool", label: "Back-to-school", caption: "Borrow the basics." };
  if (m === 10 && d >= 25) return { key: "halloween", label: "Halloween", caption: "Spookily sustainable." };
  if (m === 11 && d >= 20 && d <= 30) return { key: "thanksgiving", label: "Thanksgiving", caption: "Grateful for neighbors." };
  if (m === 9 || m === 10 || (m === 11 && d <= 20)) return { key: "fall", label: "Autumn", caption: "Falling for sharing." };
  if (m === 12 && d >= 20 && d <= 27) return { key: "christmas", label: "Holidays", caption: "Wrap, lend, repeat." };
  if ((m === 12 && d >= 28) || (m === 1 && d <= 2)) return { key: "newyear", label: "New Year", caption: "New year, less stuff." };
  if (m === 12 || m === 1 || m === 2) return { key: "winter", label: "Winter", caption: "Cozy on the block." };
  if (m === 6 || m === 7 || m === 8) return { key: "summer", label: "Summer", caption: "Sun's out, share's out." };
  void md;
  return { key: "default", label: "Today", caption: "Borrow, don't buy." };
}

function Crab({ tilt = 0 }: { tilt?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-20 w-20 drop-shadow-md"
      style={{ transform: `rotate(${tilt}deg)` }}
      aria-hidden
    >
      {/* legs */}
      <g stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M28 62 L18 70" />
        <path d="M30 70 L22 80" />
        <path d="M72 62 L82 70" />
        <path d="M70 70 L78 80" />
      </g>
      {/* claws */}
      <circle cx="20" cy="50" r="7" fill="hsl(var(--primary))" />
      <circle cx="80" cy="50" r="7" fill="hsl(var(--primary))" />
      {/* body */}
      <circle cx="50" cy="55" r="26" fill="hsl(var(--coral))" />
      {/* eyes */}
      <circle cx="42" cy="50" r="3" fill="#1a1a1a" />
      <circle cx="58" cy="50" r="3" fill="#1a1a1a" />
      {/* smile */}
      <path d="M44 62 Q50 67 56 62" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Accessory({ season }: { season: Season }) {
  switch (season) {
    case "worldcup":
      return (
        // soccer ball bouncing next to crab
        <div className="pointer-events-none absolute -right-2 bottom-2 text-3xl animate-bounce">⚽</div>
      );
    case "superbowl":
      return (
        <div className="pointer-events-none absolute -top-3 -right-2 text-2xl" style={{ animation: "mascot-throw 1.6s ease-in-out infinite" }}>🏈</div>
      );
    case "fall":
      return (
        <>
          <div className="pointer-events-none absolute -top-3 left-1 text-xl" style={{ animation: "mascot-fall 2.4s linear infinite" }}>🍂</div>
          <div className="pointer-events-none absolute -top-4 right-3 text-lg" style={{ animation: "mascot-fall 3s linear .6s infinite" }}>🍁</div>
          <div className="pointer-events-none absolute -top-2 left-8 text-base" style={{ animation: "mascot-fall 2.8s linear 1.2s infinite" }}>🍂</div>
        </>
      );
    case "winter":
      return (
        <>
          <div className="pointer-events-none absolute -top-2 left-2 text-base" style={{ animation: "mascot-fall 3s linear infinite" }}>❄️</div>
          <div className="pointer-events-none absolute -top-4 right-2 text-sm" style={{ animation: "mascot-fall 3.6s linear .8s infinite" }}>❄️</div>
        </>
      );
    case "christmas":
      return <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">🎅</div>;
    case "newyear":
      return <div className="pointer-events-none absolute -top-4 right-0 text-2xl animate-pulse">🎉</div>;
    case "halloween":
      return <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">🎃</div>;
    case "thanksgiving":
      return <div className="pointer-events-none absolute -top-3 right-0 text-2xl">🦃</div>;
    case "valentines":
      return <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 text-2xl animate-pulse">❤️</div>;
    case "stpatricks":
      return <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">🍀</div>;
    case "easter":
      return <div className="pointer-events-none absolute -top-3 right-0 text-2xl">🐣</div>;
    case "spring":
      return (
        <>
          <div className="pointer-events-none absolute -top-3 left-2 text-lg">🌸</div>
          <div className="pointer-events-none absolute -top-2 right-1 text-base">🌼</div>
        </>
      );
    case "summer":
      return <div className="pointer-events-none absolute -top-3 right-1 text-2xl">☀️</div>;
    case "july4":
      return <div className="pointer-events-none absolute -top-3 right-0 text-2xl animate-pulse">🎆</div>;
    case "backToSchool":
      return <div className="pointer-events-none absolute -top-2 right-0 text-xl">✏️</div>;
    default:
      return <div className="pointer-events-none absolute -top-2 right-0 text-lg">🌱</div>;
  }
}

export function SeasonalMascot() {
  const [open, setOpen] = useState(false);
  // recompute once per mount; seasons don't change mid-session
  const season = useMemo(() => detectSeason(new Date()), []);

  // small idle bob
  useEffect(() => {
    // nothing — bob via CSS
  }, []);

  const tilt = season.key === "worldcup" || season.key === "superbowl" ? -8 : 0;

  return (
    <>
      <style>{`
        @keyframes mascot-bob {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-4px) }
        }
        @keyframes mascot-fall {
          0% { transform: translateY(-8px) rotate(0deg); opacity: 0 }
          15% { opacity: 1 }
          100% { transform: translateY(80px) rotate(220deg); opacity: 0 }
        }
        @keyframes mascot-throw {
          0%, 100% { transform: translate(0,0) rotate(0deg) }
          50% { transform: translate(14px,-18px) rotate(60deg) }
        }
      `}</style>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Mascot — ${season.label}`}
        className="fixed bottom-4 right-4 z-40 flex h-24 w-24 items-center justify-center rounded-full bg-card/80 backdrop-blur border border-border shadow-[var(--shadow-soft)] hover:scale-105 transition-transform"
        style={{ animation: "mascot-bob 2.6s ease-in-out infinite" }}
      >
        <div className="relative">
          <Crab tilt={tilt} />
          <Accessory season={season.key} />
        </div>
      </button>
      {open && (
        <div className="fixed bottom-32 right-4 z-40 max-w-[220px] rounded-2xl bg-card border border-border p-3 text-sm shadow-[var(--shadow-soft)] animate-fade-in">
          <p className="font-display text-base font-bold text-primary">{season.label}</p>
          <p className="text-muted-foreground">{season.caption}</p>
        </div>
      )}
    </>
  );
}
