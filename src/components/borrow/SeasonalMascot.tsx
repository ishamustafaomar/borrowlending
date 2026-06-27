import { useMemo, useState } from "react";

/**
 * Seasonal mascot — a pixel-art coral crab that adapts to the time of year.
 * Pure inline SVG (crisp-edges) + CSS keyframes. No external assets.
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
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (m === 2 && d <= 14) return { key: "superbowl", label: "Super Bowl Sunday", caption: "Hut, hut, borrow!" };
  if (m === 2 && d >= 13 && d <= 15) return { key: "valentines", label: "Valentine's", caption: "Share the love." };
  if (m === 3 && d >= 14 && d <= 18) return { key: "stpatricks", label: "St. Paddy's", caption: "Lucky to share." };
  if ((m === 6 && d >= 11) || (m === 7 && d <= 19)) return { key: "worldcup", label: "World Cup", caption: "Goooaaal-sharing!" };
  if (m === 7 && d >= 1 && d <= 6) return { key: "july4", label: "4th of July", caption: "Block-party energy." };
  if (m === 4 && d >= 1 && d <= 21) return { key: "easter", label: "Easter", caption: "Hop on over." };
  if (m >= 3 && m <= 5) return { key: "spring", label: "Spring", caption: "Fresh-air sharing." };
  if (m === 8 || (m === 9 && d <= 10)) return { key: "backToSchool", label: "Back-to-school", caption: "Borrow the basics." };
  if (m === 10 && d >= 25) return { key: "halloween", label: "Halloween", caption: "Spookily sustainable." };
  if (m === 11 && d >= 20 && d <= 30) return { key: "thanksgiving", label: "Thanksgiving", caption: "Grateful for neighbors." };
  if (m === 9 || m === 10 || (m === 11 && d <= 20)) return { key: "fall", label: "Autumn", caption: "Falling for sharing." };
  if (m === 12 && d >= 20 && d <= 27) return { key: "christmas", label: "Holidays", caption: "Wrap, lend, repeat." };
  if ((m === 12 && d >= 28) || (m === 1 && d <= 2)) return { key: "newyear", label: "New Year", caption: "New year, less stuff." };
  if (m === 12 || m === 1 || m === 2) return { key: "winter", label: "Winter", caption: "Cozy on the block." };
  if (m === 6 || m === 7 || m === 8) return { key: "summer", label: "Summer", caption: "Sun's out, share's out." };
  return { key: "default", label: "Today", caption: "Borrow, don't buy." };
}

/* ---------- Pixel art primitives ----------
   Each crab is drawn on a 16-wide pixel grid. We compose with <rect>
   pixels so it stays crisp at any size via shape-rendering: crispEdges.
*/

type Pixel = [number, number, string]; // x, y, color

// Coral primary, shadow, white highlight, black
const C = {
  shell: "#ff7a59",
  shellDark: "#e0593a",
  shellHi: "#ffb39a",
  eye: "#1a1a1a",
  eyeWhite: "#ffffff",
  mouth: "#1a1a1a",
};

// 16x12 pixel crab body (rows: y=0 top)
const CRAB_PIXELS: Pixel[] = (() => {
  const p: Pixel[] = [];
  // claws (left & right, raised)
  const claws = [
    [1, 5], [2, 5], [1, 6], [2, 6], [2, 4],
    [13, 5], [14, 5], [13, 6], [14, 6], [13, 4],
  ];
  claws.forEach(([x, y]) => p.push([x, y, C.shell]));
  // body — rounded rectangle 4..11 wide, 3..9 tall
  for (let y = 3; y <= 9; y++) {
    for (let x = 4; x <= 11; x++) {
      // round corners
      if ((y === 3 || y === 9) && (x === 4 || x === 11)) continue;
      p.push([x, y, C.shell]);
    }
  }
  // shadow underside
  for (let x = 5; x <= 10; x++) p.push([x, 9, C.shellDark]);
  p.push([4, 8, C.shellDark]);
  p.push([11, 8, C.shellDark]);
  // highlight
  p.push([5, 4, C.shellHi]);
  p.push([6, 3, C.shellHi]);
  // eyes (whites + pupils)
  p.push([6, 5, C.eyeWhite]);
  p.push([9, 5, C.eyeWhite]);
  p.push([6, 5, C.eye]); // override pixel: pupil
  p.push([9, 5, C.eye]);
  // mouth
  p.push([7, 7, C.mouth]);
  p.push([8, 7, C.mouth]);
  // feet (legs) — drawn separately so we can animate them
  return p;
})();

function PixelCrab({ kicking = false }: { kicking?: boolean }) {
  // 16x12 viewbox, but extend to 16x14 for legs
  return (
    <svg
      viewBox="0 0 16 14"
      className="h-20 w-20 drop-shadow-md"
      style={{ shapeRendering: "crispEdges", imageRendering: "pixelated" }}
      aria-hidden
    >
      {CRAB_PIXELS.map(([x, y, fill], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill={fill} />
      ))}
      {/* legs — left static, right kicks */}
      <g fill={C.shellDark}>
        <rect x={5} y={10} width={1} height={1} />
        <rect x={4} y={11} width={1} height={1} />
        <rect x={7} y={10} width={1} height={1} />
        <rect x={7} y={11} width={1} height={1} />
      </g>
      {/* kicking leg group (right side) */}
      <g
        fill={C.shellDark}
        style={{
          transformOrigin: "10px 10px",
          animation: kicking ? "crab-kick 0.9s ease-in-out infinite" : "none",
        }}
      >
        <rect x={9} y={10} width={1} height={1} />
        <rect x={10} y={10} width={1} height={1} />
        <rect x={10} y={11} width={1} height={1} />
        <rect x={11} y={11} width={1} height={1} />
      </g>
    </svg>
  );
}

function PixelSoccerBall() {
  // 8x8 pixel soccer ball
  const W = "#ffffff";
  const B = "#1a1a1a";
  const S = "#cccccc";
  const grid: (string | null)[][] = [
    [null, null, W, W, W, W, null, null],
    [null, W, W, B, B, W, W, null],
    [W, W, B, W, W, B, W, W],
    [W, B, W, W, W, W, B, W],
    [W, B, W, W, W, W, B, S],
    [W, W, B, W, W, B, S, S],
    [null, W, W, B, B, S, S, null],
    [null, null, W, S, S, S, null, null],
  ];
  return (
    <svg
      viewBox="0 0 8 8"
      className="h-6 w-6"
      style={{ shapeRendering: "crispEdges", imageRendering: "pixelated" }}
      aria-hidden
    >
      {grid.flatMap((row, y) =>
        row.map((c, x) =>
          c ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c} /> : null,
        ),
      )}
    </svg>
  );
}

function Accessory({ season }: { season: Season }) {
  switch (season) {
    case "worldcup":
      return (
        <div
          className="pointer-events-none absolute"
          style={{
            right: "-2px",
            top: "-2px",
            animation: "ball-juggle 0.9s ease-in-out infinite",
          }}
        >
          <PixelSoccerBall />
        </div>
      );
    case "superbowl":
      return (
        <div
          className="pointer-events-none absolute -top-3 -right-2 text-2xl"
          style={{ animation: "mascot-throw 1.6s ease-in-out infinite" }}
        >
          🏈
        </div>
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
  const season = useMemo(() => detectSeason(new Date()), []);
  const kicking = season.key === "worldcup";

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
        /* World Cup: ball arcs up from foot, spins, and falls back */
        @keyframes ball-juggle {
          0%   { transform: translate(0, 14px) rotate(0deg) }
          50%  { transform: translate(-4px, -18px) rotate(180deg) }
          100% { transform: translate(0, 14px) rotate(360deg) }
        }
        /* Right leg kicks up as the ball lands */
        @keyframes crab-kick {
          0%, 40%, 100% { transform: translateY(0) rotate(0deg) }
          50%           { transform: translateY(-3px) rotate(-25deg) }
          60%           { transform: translateY(0) rotate(0deg) }
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
          <PixelCrab kicking={kicking} />
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
