import { useMemo, useState, type JSX } from "react";

/**
 * Seasonal mascot — a pixel-art coral crab in the style of the Claude Code
 * sprite. Pure inline SVG with crisp pixel rendering. Each accessory is
 * also a hand-pixeled sprite so the whole mascot stays on-style.
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

/* ---------- Pixel-art helpers ---------- */

function PixelSprite({
  rows,
  palette,
  className,
  style,
}: {
  rows: string[];
  palette: Record<string, string>;
  className?: string;
  style?: React.CSSProperties;
}) {
  const w = rows[0]?.length ?? 0;
  const h = rows.length;
  const cells: JSX.Element[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const fill = palette[ch];
      if (fill) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
    });
  });
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      style={{ shapeRendering: "crispEdges", imageRendering: "pixelated", ...style }}
      aria-hidden
    >
      {cells}
    </svg>
  );
}

/* ---------- Crab ---------- */

const CRAB_PALETTE = {
  "#": "#7a2914",   // outline
  o: "#ff7a59",     // coral fill
  h: "#ffc9b3",     // highlight
  s: "#d44a2a",     // shadow
  w: "#ffffff",     // eye white
  k: "#1a1a1a",     // pupil / mouth
  c: "#ff8f72",     // claw mid
};

// 16 cols x 14 rows. Eyes, claws and shading all painted in.
const CRAB_ROWS_STATIC = [
  "................",
  "..##........##..",
  ".#cc#......#cc#.",
  ".#cc#.####.#cc#.",
  "..##.#hhhh#.##..",
  "....#oohhoo#....",
  "...#oowookoo#...",
  "...#ooowwooo#...",  // overwritten below for eyes
  "...#osskksso#...",
  "....#ssssss#....",
  ".....######.....",
  "................",
  "................",
  "................",
];

// Build crab pixels with eyes painted on top (so whites + pupils render cleanly).
function CrabSprite({ kickRightLeg = false }: { kickRightLeg?: boolean }) {
  // Base body rows
  const rows = [
    "................",
    "..##........##..",
    ".#cc#......#cc#.",
    ".#cc#.####.#cc#.",
    "..##.#hhhh#.##..",
    "....#oooooo#....",
    "...#oooooooo#...",
    "...#oooooooo#...",
    "...#osssssso#...",
    "....#ssssss#....",
    ".....######.....",
    "................",
    "................",
    "................",
  ];
  // Eyes: 2-pixel-wide whites with a 1-pixel black pupil each
  const eyesAndMouth: { x: number; y: number; fill: string }[] = [
    // left eye white
    { x: 5, y: 6, fill: "#ffffff" },
    { x: 6, y: 6, fill: "#ffffff" },
    // right eye white
    { x: 9, y: 6, fill: "#ffffff" },
    { x: 10, y: 6, fill: "#ffffff" },
    // pupils — looking slightly inward
    { x: 6, y: 6, fill: "#1a1a1a" },
    { x: 9, y: 6, fill: "#1a1a1a" },
    // tiny smile
    { x: 7, y: 8, fill: "#1a1a1a" },
    { x: 8, y: 8, fill: "#1a1a1a" },
  ];

  // Legs (4 pixels under body). Right two form the "kicking" group.
  const staticLegs = [
    { x: 5, y: 11, fill: CRAB_PALETTE["#"] },
    { x: 6, y: 11, fill: CRAB_PALETTE["#"] },
  ];
  const kickLegs = [
    { x: 9, y: 11, fill: CRAB_PALETTE["#"] },
    { x: 10, y: 11, fill: CRAB_PALETTE["#"] },
  ];

  const cells: JSX.Element[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const fill = CRAB_PALETTE[ch as keyof typeof CRAB_PALETTE];
      if (fill) cells.push(<rect key={`b-${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
    });
  });
  eyesAndMouth.forEach((p, i) => cells.push(<rect key={`f-${i}`} x={p.x} y={p.y} width={1} height={1} fill={p.fill} />));
  staticLegs.forEach((p, i) => cells.push(<rect key={`sl-${i}`} x={p.x} y={p.y} width={1} height={1} fill={p.fill} />));

  return (
    <svg
      viewBox="0 0 16 14"
      className="h-20 w-20 drop-shadow-md"
      style={{ shapeRendering: "crispEdges", imageRendering: "pixelated" }}
      aria-hidden
    >
      {cells}
      {/* Right leg group — animates for World Cup kick */}
      <g
        style={{
          transformOrigin: "9.5px 10.5px",
          transformBox: "fill-box",
          animation: kickRightLeg ? "crab-kick 0.9s ease-in-out infinite" : "none",
        }}
      >
        {kickLegs.map((p, i) => (
          <rect key={`kl-${i}`} x={p.x} y={p.y} width={1} height={1} fill={p.fill} />
        ))}
      </g>
    </svg>
  );
}

/* ---------- Accessory sprites (all pixel art) ---------- */

// 8x8 soccer ball
const BALL_ROWS = [
  "..wwww..",
  ".wwkkww.",
  "wwkwwkww",
  "wkwwwwkw",
  "wkwwwwks",
  "wwkwwkss",
  ".wwkkss.",
  "..wsss..",
];
const BALL_PAL = { w: "#ffffff", k: "#1a1a1a", s: "#bdbdbd" };

// 10x7 football (American)
const FOOTBALL_ROWS = [
  "...####...",
  "..#ssss#..",
  ".#sswwss#.",
  "#sswwwwss#",
  ".#sswwss#.",
  "..#ssss#..",
  "...####...",
];
const FOOTBALL_PAL = { "#": "#3a1d0a", s: "#8b4513", w: "#ffffff" };

// 8x8 leaf
const LEAF_ROWS = [
  "...##...",
  "..#oo#..",
  ".#oooo#.",
  "#oossoo#",
  "#osssso#",
  ".#ooss#.",
  "..#ss#..",
  "...##...",
];
const LEAF_AUTUMN_PAL = { "#": "#5a2a0a", o: "#ff8a3d", s: "#c44a18" };
const LEAF_RED_PAL = { "#": "#5a0a0a", o: "#e84a3a", s: "#a02020" };

// 7x7 snowflake
const SNOW_ROWS = [
  "...#...",
  "#..#..#",
  ".#.#.#.",
  "###W###",
  ".#.#.#.",
  "#..#..#",
  "...#...",
];
const SNOW_PAL = { "#": "#cfe9ff", W: "#ffffff" };

// 9x8 pumpkin
const PUMP_ROWS = [
  "...#g....",
  "..#go#...",
  ".#oooo#..",
  "#oo##oo#.",
  "#o#oo#o#.",
  "#oo##oo#.",
  ".#oooo#..",
  "..####...",
];
const PUMP_PAL = { "#": "#5a2a05", o: "#ff8a1e", g: "#2e7d32" };

// 7x6 heart
const HEART_ROWS = [
  ".##.##.",
  "#oo#oo#",
  "#ooooo#",
  ".#ooo#.",
  "..#o#..",
  "...#...",
];
const HEART_PAL = { "#": "#7a0a1f", o: "#ff4a6a" };

// 7x7 clover
const CLOVER_ROWS = [
  "..#g#..",
  ".#ggg#.",
  "#ggwgg#",
  ".#ggg#.",
  "...g...",
  "...g...",
  "..ggg..",
];
const CLOVER_PAL = { "#": "#0d3a14", g: "#3aa84a", w: "#a8e0b0" };

// 9x9 sun
const SUN_ROWS = [
  "...#.#...",
  ".#.###.#.",
  "..#yyy#..",
  "#.yywwy.#",
  "##yyyyy##",
  "#.yywwy.#",
  "..#yyy#..",
  ".#.###.#.",
  "...#.#...",
];
const SUN_PAL = { "#": "#a05a00", y: "#ffd23a", w: "#fff3a8" };

// 9x9 firework
const FIRE_ROWS = [
  "....#....",
  ".#..r..#.",
  "..#.r.#..",
  "...#r#...",
  "#rrrwrrr#",
  "...#r#...",
  "..#.r.#..",
  ".#..r..#.",
  "....#....",
];
const FIRE_PAL = { "#": "#ff5a5a", r: "#ffd23a", w: "#ffffff" };

// 9x7 santa hat
const SANTA_ROWS = [
  ".....##W.",
  "....##W..",
  "...##W...",
  "..##r#...",
  ".##rrr#..",
  "##rrrrr#.",
  "#WWWWWW#.",
];
const SANTA_PAL = { "#": "#3a0a0a", r: "#e63946", W: "#ffffff" };

// 9x9 flower
const FLOWER_ROWS = [
  "..#p#....",
  ".#ppp#...",
  "#pppyp#..",
  "#ppyyp#..",
  ".#ppp#g..",
  "...g.gg..",
  "..gg.g...",
  ".g..gg...",
  "....g....",
];
const FLOWER_PAL = { "#": "#5a0a4a", p: "#ff8acb", y: "#ffd23a", g: "#3aa84a" };

// 9x9 egg (easter)
const EGG_ROWS = [
  "...###...",
  "..#www#..",
  ".#wpwpw#.",
  "#wwwwwww#",
  "#wbwwwbw#",
  "#wwwwwww#",
  "#wpwpwpw#",
  ".#wwwww#.",
  "..#####..",
];
const EGG_PAL = { "#": "#a05a3a", w: "#fff3e0", p: "#ff8acb", b: "#7ac3ff" };

// 7x7 turkey
const TURKEY_ROWS = [
  "y.r.o.b",
  "yy#r#ob",
  ".#ooo#.",
  "#oywwo#",
  "#ooooo#",
  ".#ooo#.",
  "..#.#..",
];
const TURKEY_PAL = { "#": "#3a1a05", o: "#a85a2a", w: "#ffffff", y: "#ffd23a", r: "#c44a18", b: "#5a2a05" };

// 7x9 pencil (back-to-school)
const PENCIL_ROWS = [
  "..#k#..",
  ".#yyy#.",
  "#yyyyy#",
  "#yYyYy#",
  "#yyyyy#",
  ".#ppp#.",
  "..#p#..",
  "...g...",
  "...g...",
];
const PENCIL_PAL = { "#": "#3a2a05", k: "#1a1a1a", y: "#ffd23a", Y: "#e0a800", p: "#ff8a8a", g: "#a05a2a" };

// 7x6 confetti / party (new year)
const CONFETTI_ROWS = [
  "r.y.g.b",
  ".r.y.g.",
  "y.g.b.r",
  ".g.b.r.",
  "b.r.y.g",
  ".b.r.y.",
];
const CONFETTI_PAL = { r: "#ff5a5a", y: "#ffd23a", g: "#3aa84a", b: "#5aa8ff" };

// 7x7 seedling (default)
const SEED_ROWS = [
  "....g..",
  "...gg..",
  "g.gggg.",
  "ggggg..",
  "..g....",
  "..g....",
  ".ggg...",
];
const SEED_PAL = { g: "#3aa84a" };

/* ---------- Accessory rendering ---------- */

function Accessory({ season }: { season: Season }) {
  switch (season) {
    case "worldcup":
      // Soccer ball juggled by the right foot
      return (
        <div
          className="pointer-events-none absolute"
          style={{
            right: "-4px",
            top: "0px",
            animation: "ball-juggle 0.9s ease-in-out infinite",
          }}
        >
          <PixelSprite rows={BALL_ROWS} palette={BALL_PAL} className="h-7 w-7" />
        </div>
      );
    case "superbowl":
      return (
        <div
          className="pointer-events-none absolute -top-3 -right-3"
          style={{ animation: "throw-spin 1.6s ease-in-out infinite" }}
        >
          <PixelSprite rows={FOOTBALL_ROWS} palette={FOOTBALL_PAL} className="h-7 w-9" />
        </div>
      );
    case "fall":
      return (
        <>
          <div className="pointer-events-none absolute -top-3 left-1" style={{ animation: "leaf-fall 2.6s linear infinite" }}>
            <PixelSprite rows={LEAF_ROWS} palette={LEAF_AUTUMN_PAL} className="h-5 w-5" />
          </div>
          <div className="pointer-events-none absolute -top-4 right-2" style={{ animation: "leaf-fall 3.2s linear .6s infinite" }}>
            <PixelSprite rows={LEAF_ROWS} palette={LEAF_RED_PAL} className="h-4 w-4" />
          </div>
          <div className="pointer-events-none absolute -top-2 left-9" style={{ animation: "leaf-fall 2.8s linear 1.4s infinite" }}>
            <PixelSprite rows={LEAF_ROWS} palette={LEAF_AUTUMN_PAL} className="h-3 w-3" />
          </div>
        </>
      );
    case "winter":
      return (
        <>
          <div className="pointer-events-none absolute -top-2 left-2" style={{ animation: "leaf-fall 3.2s linear infinite" }}>
            <PixelSprite rows={SNOW_ROWS} palette={SNOW_PAL} className="h-4 w-4" />
          </div>
          <div className="pointer-events-none absolute -top-4 right-1" style={{ animation: "leaf-fall 3.8s linear .9s infinite" }}>
            <PixelSprite rows={SNOW_ROWS} palette={SNOW_PAL} className="h-3 w-3" />
          </div>
          <div className="pointer-events-none absolute -top-1 left-10" style={{ animation: "leaf-fall 4.2s linear 1.5s infinite" }}>
            <PixelSprite rows={SNOW_ROWS} palette={SNOW_PAL} className="h-3 w-3" />
          </div>
        </>
      );
    case "christmas":
      return (
        <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2">
          <PixelSprite rows={SANTA_ROWS} palette={SANTA_PAL} className="h-7 w-9" />
        </div>
      );
    case "newyear":
      return (
        <div className="pointer-events-none absolute -top-3 -right-1" style={{ animation: "pop 1.4s ease-in-out infinite" }}>
          <PixelSprite rows={CONFETTI_ROWS} palette={CONFETTI_PAL} className="h-6 w-7" />
        </div>
      );
    case "halloween":
      return (
        <div className="pointer-events-none absolute -top-3 -right-1" style={{ animation: "pop 1.8s ease-in-out infinite" }}>
          <PixelSprite rows={PUMP_ROWS} palette={PUMP_PAL} className="h-7 w-8" />
        </div>
      );
    case "thanksgiving":
      return (
        <div className="pointer-events-none absolute -top-3 -right-1">
          <PixelSprite rows={TURKEY_ROWS} palette={TURKEY_PAL} className="h-7 w-7" />
        </div>
      );
    case "valentines":
      return (
        <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2" style={{ animation: "pop 1.2s ease-in-out infinite" }}>
          <PixelSprite rows={HEART_ROWS} palette={HEART_PAL} className="h-6 w-6" />
        </div>
      );
    case "stpatricks":
      return (
        <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2" style={{ animation: "spin-slow 4s linear infinite" }}>
          <PixelSprite rows={CLOVER_ROWS} palette={CLOVER_PAL} className="h-6 w-6" />
        </div>
      );
    case "easter":
      return (
        <div className="pointer-events-none absolute -top-3 -right-2" style={{ animation: "wobble 2.4s ease-in-out infinite" }}>
          <PixelSprite rows={EGG_ROWS} palette={EGG_PAL} className="h-7 w-7" />
        </div>
      );
    case "spring":
      return (
        <div className="pointer-events-none absolute -top-3 -right-2" style={{ animation: "wobble 3s ease-in-out infinite" }}>
          <PixelSprite rows={FLOWER_ROWS} palette={FLOWER_PAL} className="h-7 w-7" />
        </div>
      );
    case "summer":
      return (
        <div className="pointer-events-none absolute -top-3 -right-2" style={{ animation: "spin-slow 6s linear infinite" }}>
          <PixelSprite rows={SUN_ROWS} palette={SUN_PAL} className="h-7 w-7" />
        </div>
      );
    case "july4":
      return (
        <div className="pointer-events-none absolute -top-3 -right-2" style={{ animation: "pop 1.2s ease-in-out infinite" }}>
          <PixelSprite rows={FIRE_ROWS} palette={FIRE_PAL} className="h-7 w-7" />
        </div>
      );
    case "backToSchool":
      return (
        <div className="pointer-events-none absolute -top-3 -right-1" style={{ animation: "wobble 2s ease-in-out infinite" }}>
          <PixelSprite rows={PENCIL_ROWS} palette={PENCIL_PAL} className="h-7 w-6" />
        </div>
      );
    default:
      return (
        <div className="pointer-events-none absolute -top-2 -right-1">
          <PixelSprite rows={SEED_ROWS} palette={SEED_PAL} className="h-6 w-6" />
        </div>
      );
  }
}

void CRAB_ROWS_STATIC; // reserved for future variants

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
        @keyframes leaf-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 0 }
          15% { opacity: 1 }
          100% { transform: translateY(90px) rotate(220deg); opacity: 0 }
        }
        @keyframes throw-spin {
          0%, 100% { transform: translate(0,0) rotate(0deg) }
          50% { transform: translate(16px,-20px) rotate(60deg) }
        }
        @keyframes ball-juggle {
          0%   { transform: translate(0, 18px) rotate(0deg) scale(1) }
          45%  { transform: translate(-6px, -22px) rotate(180deg) scale(0.95) }
          55%  { transform: translate(-6px, -22px) rotate(220deg) scale(0.95) }
          100% { transform: translate(0, 18px) rotate(360deg) scale(1) }
        }
        @keyframes crab-kick {
          0%, 40%, 100% { transform: translateY(0) rotate(0deg) }
          50%           { transform: translateY(-2px) rotate(-22deg) }
          60%           { transform: translateY(0) rotate(0deg) }
        }
        @keyframes pop {
          0%, 100% { transform: scale(1) }
          50% { transform: scale(1.15) }
        }
        @keyframes wobble {
          0%, 100% { transform: rotate(-6deg) }
          50% { transform: rotate(6deg) }
        }
        @keyframes spin-slow {
          to { transform: rotate(360deg) }
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
          <CrabSprite kickRightLeg={kicking} />
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
