// Generates a large, deterministic pile of mock items for the demo.
// Includes the canonical 14 originals, then ~200 more across realistic
// categories and neighbors. Stable IDs so re-seeding is idempotent.

import type { Item, TrustCircle } from "./types";

const AVATAR_COLORS = [
  "oklch(0.7 0.16 32)",
  "oklch(0.72 0.14 180)",
  "oklch(0.7 0.18 145)",
  "oklch(0.74 0.15 90)",
  "oklch(0.7 0.17 280)",
  "oklch(0.7 0.15 50)",
  "oklch(0.72 0.16 220)",
  "oklch(0.7 0.17 340)",
];

function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function doorsLabel(mi: number) {
  if (mi <= 0.02) return "Right next door";
  if (mi <= 0.04) return "2 doors down";
  if (mi <= 0.07) return "4 doors down";
  if (mi <= 0.12) return "Same block";
  if (mi <= 0.2) return "1 block over";
  if (mi <= 0.3) return "2 blocks over";
  if (mi <= 0.4) return "3 blocks over";
  return "5 min walk";
}

function syns(name: string, extra: string[] = []): string[] {
  const n = name.toLowerCase();
  const out = new Set<string>([n, ...extra.map((e) => e.toLowerCase())]);
  for (const w of n.split(/\s+/)) if (w.length > 2) out.add(w);
  if (n.endsWith("s")) out.add(n.slice(0, -1));
  else out.add(n + "s");
  return [...out];
}

type Template = {
  name: string;
  emoji: string;
  category: string;
  value: number;
  co2: number;
  extras?: string[];
};

const NEIGHBORS = [
  "Maria", "James", "Priya", "Tom", "Sofia", "Aiden", "Leah", "Marcus",
  "Hannah", "Devon", "Naomi", "Wes", "Jules", "Theo", "Carmen", "Owen",
  "Riya", "Ben", "Anika", "Zara", "Felix", "Mira", "Jonah", "Elena",
  "Kai", "Nora", "Sam", "Iris", "Diego", "Lila", "Otis", "Yusuf",
  "Asha", "Reuben", "Mei", "Caleb", "Sloane", "Ravi", "Etta", "Hugo",
];

const AVAIL = [
  "Free this weekend",
  "Free weekdays after 5pm",
  "Free Saturday morning",
  "Free Sunday afternoon",
  "Free anytime this week",
  "Free Monday–Thursday",
  "Free this Saturday only",
  "Free for the next 3 days",
  "Free most evenings",
  "Free until next Friday",
];

const AVAIL_TAGS = [
  ["weekend"],
  ["weekday"],
  ["weekend", "saturday"],
  ["weekend", "sunday"],
  ["today", "tomorrow", "weekday"],
  ["weekday"],
  ["weekend", "saturday"],
  ["today", "tomorrow", "weekend"],
  ["weekday"],
  ["weekday", "weekend"],
];

const CIRCLES: TrustCircle[] = ["building", "block", "neighborhood"];

// Canonical 14 originals — fixed neighbors/distances so the demo stays
// recognizable.
const ORIGINALS: Array<{
  id: string; name: string; emoji: string; category: string;
  owner: string; mi: number; avail: string; value: number; co2: number;
  circle: TrustCircle; extras?: string[];
}> = [
  { id: "seed-001", name: "Pressure washer", emoji: "💦", category: "Outdoor", owner: "Maria",  mi: 0.03, avail: "Free this weekend",        value: 320, co2: 14, circle: "block", extras: ["power washer", "powerwasher"] },
  { id: "seed-002", name: "Cordless drill",  emoji: "🪛", category: "Tools",   owner: "James",  mi: 0.1,  avail: "Free weekdays after 5pm",  value: 120, co2: 6,  circle: "block", extras: ["drill", "power drill", "impact driver"] },
  { id: "seed-003", name: "Extension ladder", emoji: "🪜", category: "Tools",  owner: "Priya",  mi: 0.3,  avail: "Free Saturday morning",    value: 180, co2: 9,  circle: "neighborhood", extras: ["ladder", "step ladder"] },
  { id: "seed-004", name: "Stand mixer",     emoji: "🧁", category: "Kitchen", owner: "Tom",    mi: 0.2,  avail: "Free Sunday afternoon",    value: 380, co2: 12, circle: "block", extras: ["kitchenaid", "mixer"] },
  { id: "seed-005", name: "Camping tent",    emoji: "⛺", category: "Outdoor", owner: "Sofia",  mi: 0.4,  avail: "Free this weekend",        value: 240, co2: 11, circle: "neighborhood", extras: ["tent", "shelter"] },
  { id: "seed-006", name: "Hedge trimmer",   emoji: "🌿", category: "Outdoor", owner: "Aiden",  mi: 0.15, avail: "Free Saturday morning",    value: 160, co2: 7,  circle: "block", extras: ["hedge cutter", "trimmer"] },
  { id: "seed-007", name: "Carpet cleaner",  emoji: "🧼", category: "Home",    owner: "Leah",   mi: 0.25, avail: "Free this weekend",        value: 220, co2: 9,  circle: "neighborhood", extras: ["rug cleaner", "shampooer"] },
  { id: "seed-008", name: "Projector",       emoji: "📽️", category: "Tech",   owner: "Marcus", mi: 0.18, avail: "Free Sunday afternoon",    value: 280, co2: 10, circle: "block", extras: ["movie projector", "beamer"] },
  { id: "seed-009", name: "Folding tables",  emoji: "🪑", category: "Party",   owner: "Hannah", mi: 0.07, avail: "Free anytime this week",   value: 90,  co2: 5,  circle: "building", extras: ["table", "banquet table"] },
  { id: "seed-010", name: "Kids' bike",      emoji: "🚲", category: "Outdoor", owner: "Devon",  mi: 0.22, avail: "Free for the next 3 days", value: 140, co2: 8,  circle: "block", extras: ["bike", "bicycle", "kids bike"] },
  { id: "seed-011", name: "Sewing machine",  emoji: "🧵", category: "Craft",   owner: "Naomi",  mi: 0.12, avail: "Free weekdays after 5pm",  value: 200, co2: 8,  circle: "block", extras: ["sewing", "sewer"] },
  { id: "seed-012", name: "Jigsaw",          emoji: "🪚", category: "Tools",   owner: "Wes",    mi: 0.28, avail: "Free Saturday morning",    value: 110, co2: 6,  circle: "neighborhood", extras: ["jig saw", "saw"] },
  { id: "seed-013", name: "Wheelbarrow",     emoji: "🛒", category: "Outdoor", owner: "Jules",  mi: 0.33, avail: "Free this weekend",        value: 130, co2: 7,  circle: "neighborhood", extras: ["barrow", "wheel barrow"] },
  { id: "seed-014", name: "KitchenAid",      emoji: "🍰", category: "Kitchen", owner: "Theo",   mi: 0.09, avail: "Free Sunday afternoon",    value: 400, co2: 12, circle: "building", extras: ["stand mixer", "mixer"] },
];

// Categories of additional templates we'll fan out across neighbors.
const TEMPLATES: Template[] = [
  // Tools
  { name: "Circular saw",     emoji: "🪚", category: "Tools", value: 140, co2: 7, extras: ["saw"] },
  { name: "Reciprocating saw", emoji: "🪚", category: "Tools", value: 150, co2: 7, extras: ["sawzall", "saw"] },
  { name: "Miter saw",        emoji: "🪚", category: "Tools", value: 260, co2: 9, extras: ["chop saw"] },
  { name: "Table saw",        emoji: "🪚", category: "Tools", value: 420, co2: 11, extras: ["saw"] },
  { name: "Belt sander",      emoji: "🧰", category: "Tools", value: 110, co2: 6, extras: ["sander"] },
  { name: "Orbital sander",   emoji: "🧰", category: "Tools", value: 95, co2: 5, extras: ["sander"] },
  { name: "Router",           emoji: "🪛", category: "Tools", value: 180, co2: 7 },
  { name: "Heat gun",         emoji: "🔥", category: "Tools", value: 60, co2: 4 },
  { name: "Stud finder",      emoji: "🧲", category: "Tools", value: 35, co2: 3 },
  { name: "Laser level",      emoji: "📏", category: "Tools", value: 80, co2: 4, extras: ["level"] },
  { name: "Tile cutter",      emoji: "🟫", category: "Tools", value: 90, co2: 5 },
  { name: "Wet/dry vac",      emoji: "🧹", category: "Tools", value: 130, co2: 7, extras: ["shop vac", "wet dry vacuum"] },
  { name: "Air compressor",   emoji: "💨", category: "Tools", value: 200, co2: 9, extras: ["compressor"] },
  { name: "Nail gun",         emoji: "🔨", category: "Tools", value: 170, co2: 7, extras: ["brad nailer"] },
  { name: "Caulking gun",     emoji: "🔧", category: "Tools", value: 25, co2: 2 },
  { name: "Pipe wrench",      emoji: "🔧", category: "Tools", value: 40, co2: 3, extras: ["wrench"] },
  { name: "Socket set",       emoji: "🧰", category: "Tools", value: 120, co2: 6 },
  { name: "Multimeter",       emoji: "🔌", category: "Tools", value: 60, co2: 3 },
  { name: "Soldering iron",   emoji: "🔥", category: "Tools", value: 50, co2: 3 },
  { name: "Step ladder",      emoji: "🪜", category: "Tools", value: 90, co2: 5, extras: ["ladder", "stepladder"] },
  { name: "Workbench",        emoji: "🪵", category: "Tools", value: 220, co2: 9 },
  { name: "Drill press",      emoji: "🛠️", category: "Tools", value: 320, co2: 10 },
  { name: "Angle grinder",    emoji: "⚙️", category: "Tools", value: 110, co2: 6, extras: ["grinder"] },
  { name: "Bolt cutters",     emoji: "✂️", category: "Tools", value: 50, co2: 3 },
  { name: "Stud-mount vice",  emoji: "🧱", category: "Tools", value: 90, co2: 5, extras: ["vice"] },

  // Outdoor / yard
  { name: "Lawn mower",       emoji: "🌱", category: "Outdoor", value: 320, co2: 14, extras: ["mower"] },
  { name: "Leaf blower",      emoji: "🍃", category: "Outdoor", value: 140, co2: 7, extras: ["blower"] },
  { name: "Weed whacker",     emoji: "🌾", category: "Outdoor", value: 130, co2: 7, extras: ["string trimmer", "weed eater"] },
  { name: "Chainsaw",         emoji: "🪓", category: "Outdoor", value: 240, co2: 10 },
  { name: "Pole saw",         emoji: "🌳", category: "Outdoor", value: 160, co2: 8, extras: ["saw"] },
  { name: "Garden tiller",    emoji: "🪴", category: "Outdoor", value: 280, co2: 12, extras: ["rototiller"] },
  { name: "Edger",            emoji: "🌿", category: "Outdoor", value: 120, co2: 6 },
  { name: "Snow shovel",      emoji: "❄️", category: "Outdoor", value: 30, co2: 2, extras: ["shovel"] },
  { name: "Snow blower",      emoji: "🌨️", category: "Outdoor", value: 460, co2: 16 },
  { name: "Garden hose",      emoji: "💧", category: "Outdoor", value: 30, co2: 2, extras: ["hose"] },
  { name: "Wheelbarrow",      emoji: "🛒", category: "Outdoor", value: 130, co2: 7, extras: ["barrow"] },
  { name: "Pruning shears",   emoji: "✂️", category: "Outdoor", value: 35, co2: 2 },
  { name: "Loppers",          emoji: "✂️", category: "Outdoor", value: 45, co2: 3 },
  { name: "Patio umbrella",   emoji: "☂️", category: "Outdoor", value: 110, co2: 6 },
  { name: "Fire pit",         emoji: "🔥", category: "Outdoor", value: 160, co2: 7 },
  { name: "Charcoal grill",   emoji: "🍖", category: "Outdoor", value: 180, co2: 8, extras: ["bbq", "barbecue"] },
  { name: "Gas grill",        emoji: "🔥", category: "Outdoor", value: 320, co2: 12, extras: ["bbq", "barbecue"] },
  { name: "Smoker",           emoji: "🥩", category: "Outdoor", value: 280, co2: 11, extras: ["bbq"] },
  { name: "Cooler",           emoji: "🧊", category: "Outdoor", value: 60, co2: 4, extras: ["ice chest"] },

  // Camping / sport
  { name: "Sleeping bag",     emoji: "🛌", category: "Outdoor", value: 90, co2: 5 },
  { name: "Camping stove",    emoji: "🔥", category: "Outdoor", value: 80, co2: 4, extras: ["stove"] },
  { name: "Backpack (60L)",   emoji: "🎒", category: "Outdoor", value: 160, co2: 7, extras: ["backpack", "pack"] },
  { name: "Trekking poles",   emoji: "🥾", category: "Outdoor", value: 70, co2: 4 },
  { name: "Kayak",            emoji: "🛶", category: "Outdoor", value: 540, co2: 18 },
  { name: "Paddleboard",      emoji: "🏄", category: "Outdoor", value: 480, co2: 16, extras: ["sup"] },
  { name: "Snorkel set",      emoji: "🤿", category: "Outdoor", value: 50, co2: 3 },
  { name: "Beach umbrella",   emoji: "🏖️", category: "Outdoor", value: 45, co2: 3 },
  { name: "Beach chairs",     emoji: "🪑", category: "Outdoor", value: 60, co2: 4 },
  { name: "Bike rack",        emoji: "🚲", category: "Outdoor", value: 220, co2: 8, extras: ["rack"] },
  { name: "Adult bike",       emoji: "🚴", category: "Outdoor", value: 540, co2: 14, extras: ["bike", "bicycle"] },
  { name: "Mountain bike",    emoji: "🚵", category: "Outdoor", value: 720, co2: 16, extras: ["bike"] },
  { name: "Roller skates",    emoji: "🛼", category: "Outdoor", value: 80, co2: 4 },
  { name: "Skateboard",       emoji: "🛹", category: "Outdoor", value: 110, co2: 5 },
  { name: "Tennis racket",    emoji: "🎾", category: "Sport",   value: 90, co2: 4 },
  { name: "Pickleball set",   emoji: "🥎", category: "Sport",   value: 70, co2: 4 },
  { name: "Disc golf set",    emoji: "🥏", category: "Sport",   value: 60, co2: 3 },
  { name: "Cornhole set",     emoji: "🌽", category: "Party",   value: 90, co2: 4 },
  { name: "Bocce ball set",   emoji: "🟢", category: "Party",   value: 70, co2: 3 },
  { name: "Croquet set",      emoji: "🏏", category: "Party",   value: 90, co2: 4 },
  { name: "Yoga mat",         emoji: "🧘", category: "Sport",   value: 30, co2: 2 },
  { name: "Foam roller",      emoji: "🧘", category: "Sport",   value: 25, co2: 2 },
  { name: "Kettlebell (20lb)", emoji: "🏋️", category: "Sport", value: 60, co2: 4 },
  { name: "Dumbbell pair",    emoji: "🏋️", category: "Sport",   value: 80, co2: 4 },
  { name: "Pull-up bar",      emoji: "💪", category: "Sport",   value: 40, co2: 3 },

  // Kitchen
  { name: "Instant Pot",      emoji: "🍲", category: "Kitchen", value: 110, co2: 6, extras: ["pressure cooker"] },
  { name: "Air fryer",        emoji: "🍟", category: "Kitchen", value: 120, co2: 6 },
  { name: "Waffle iron",      emoji: "🧇", category: "Kitchen", value: 70, co2: 4 },
  { name: "Bread machine",    emoji: "🍞", category: "Kitchen", value: 140, co2: 7 },
  { name: "Pasta maker",      emoji: "🍝", category: "Kitchen", value: 90, co2: 4, extras: ["pasta machine"] },
  { name: "Ice cream maker",  emoji: "🍦", category: "Kitchen", value: 100, co2: 5 },
  { name: "Food dehydrator",  emoji: "🍌", category: "Kitchen", value: 95, co2: 5, extras: ["dehydrator"] },
  { name: "Sous-vide stick",  emoji: "🥩", category: "Kitchen", value: 90, co2: 5, extras: ["sous vide"] },
  { name: "Blender",          emoji: "🥤", category: "Kitchen", value: 110, co2: 5 },
  { name: "Food processor",   emoji: "🥗", category: "Kitchen", value: 160, co2: 7, extras: ["processor"] },
  { name: "Immersion blender", emoji: "🥣", category: "Kitchen", value: 60, co2: 3, extras: ["stick blender"] },
  { name: "Espresso machine", emoji: "☕", category: "Kitchen", value: 480, co2: 14, extras: ["espresso", "coffee machine"] },
  { name: "Cold brew tower",  emoji: "🥤", category: "Kitchen", value: 110, co2: 5 },
  { name: "Cast iron skillet", emoji: "🍳", category: "Kitchen", value: 50, co2: 3, extras: ["skillet", "pan"] },
  { name: "Dutch oven",       emoji: "🥘", category: "Kitchen", value: 180, co2: 7 },
  { name: "Pizza stone",      emoji: "🍕", category: "Kitchen", value: 40, co2: 3 },
  { name: "Pizza oven",       emoji: "🔥", category: "Kitchen", value: 380, co2: 12, extras: ["ooni"] },
  { name: "Cake pans (set)",  emoji: "🎂", category: "Kitchen", value: 60, co2: 3, extras: ["cake pan"] },
  { name: "Cookie cutters",   emoji: "🍪", category: "Kitchen", value: 20, co2: 2 },
  { name: "Cocktail kit",     emoji: "🍸", category: "Kitchen", value: 90, co2: 4, extras: ["bar kit"] },
  { name: "Punch bowl",       emoji: "🥣", category: "Kitchen", value: 60, co2: 3 },
  { name: "Serving platters", emoji: "🍽️", category: "Kitchen", value: 70, co2: 4 },

  // Home
  { name: "Vacuum cleaner",   emoji: "🧹", category: "Home", value: 220, co2: 9, extras: ["vacuum"] },
  { name: "Steam mop",        emoji: "🧼", category: "Home", value: 110, co2: 6, extras: ["mop"] },
  { name: "Spot cleaner",     emoji: "🧽", category: "Home", value: 150, co2: 7 },
  { name: "Window squeegee",  emoji: "🪟", category: "Home", value: 25, co2: 2, extras: ["squeegee"] },
  { name: "Pressure cooker",  emoji: "🍲", category: "Home", value: 90, co2: 5 },
  { name: "Stepstool",        emoji: "🪜", category: "Home", value: 30, co2: 2 },
  { name: "Box fan",          emoji: "🌬️", category: "Home", value: 35, co2: 3 },
  { name: "Space heater",     emoji: "🔥", category: "Home", value: 70, co2: 4, extras: ["heater"] },
  { name: "Window AC",        emoji: "❄️", category: "Home", value: 280, co2: 12, extras: ["air conditioner", "ac"] },
  { name: "Dehumidifier",     emoji: "💧", category: "Home", value: 220, co2: 9 },
  { name: "Humidifier",       emoji: "🌫️", category: "Home", value: 90, co2: 5 },
  { name: "Air purifier",     emoji: "🌬️", category: "Home", value: 240, co2: 10, extras: ["purifier"] },
  { name: "Iron + board",     emoji: "👔", category: "Home", value: 70, co2: 4, extras: ["iron"] },
  { name: "Garment steamer",  emoji: "👗", category: "Home", value: 90, co2: 5, extras: ["steamer"] },
  { name: "Cordless vacuum",  emoji: "🧹", category: "Home", value: 280, co2: 10, extras: ["dyson", "vacuum"] },

  // Tech / AV
  { name: "DSLR camera",      emoji: "📷", category: "Tech", value: 720, co2: 16, extras: ["camera"] },
  { name: "Tripod",           emoji: "📸", category: "Tech", value: 90, co2: 4 },
  { name: "GoPro",            emoji: "🎥", category: "Tech", value: 320, co2: 10, extras: ["action camera"] },
  { name: "Ring light",       emoji: "💡", category: "Tech", value: 70, co2: 4, extras: ["light"] },
  { name: "Studio softbox",   emoji: "🎬", category: "Tech", value: 110, co2: 5, extras: ["softbox", "light"] },
  { name: "Lavalier mic",     emoji: "🎤", category: "Tech", value: 60, co2: 3, extras: ["lav mic", "microphone"] },
  { name: "Shotgun mic",      emoji: "🎙️", category: "Tech", value: 180, co2: 6, extras: ["microphone"] },
  { name: "Audio interface",  emoji: "🎚️", category: "Tech", value: 170, co2: 6 },
  { name: "Bluetooth speaker", emoji: "🔊", category: "Tech", value: 130, co2: 6, extras: ["speaker"] },
  { name: "PA speaker",       emoji: "🔊", category: "Tech", value: 320, co2: 10, extras: ["speaker"] },
  { name: "Karaoke machine",  emoji: "🎤", category: "Tech", value: 120, co2: 6 },
  { name: "Outdoor screen",   emoji: "🎞️", category: "Tech", value: 140, co2: 6, extras: ["screen", "projector screen"] },
  { name: "Streaming deck",   emoji: "🎮", category: "Tech", value: 180, co2: 6, extras: ["stream deck"] },
  { name: "VR headset",       emoji: "🥽", category: "Tech", value: 380, co2: 12, extras: ["vr"] },
  { name: "Drone",            emoji: "🛸", category: "Tech", value: 540, co2: 14 },

  // Party / events
  { name: "Bounce house",     emoji: "🎈", category: "Party", value: 380, co2: 14 },
  { name: "Helium tank",      emoji: "🎈", category: "Party", value: 70, co2: 4 },
  { name: "Snow cone maker",  emoji: "🍧", category: "Party", value: 90, co2: 5 },
  { name: "Cotton candy maker", emoji: "🍭", category: "Party", value: 110, co2: 5 },
  { name: "Popcorn cart",     emoji: "🍿", category: "Party", value: 220, co2: 8 },
  { name: "Chafing dishes",   emoji: "🍱", category: "Party", value: 90, co2: 4, extras: ["chafer"] },
  { name: "Outdoor heater",   emoji: "🔥", category: "Party", value: 240, co2: 9, extras: ["patio heater"] },
  { name: "String lights",    emoji: "✨", category: "Party", value: 40, co2: 2, extras: ["lights"] },
  { name: "Folding chairs",   emoji: "🪑", category: "Party", value: 80, co2: 4, extras: ["chair"] },
  { name: "Round tablecloths", emoji: "🍽️", category: "Party", value: 30, co2: 2, extras: ["tablecloth"] },
  { name: "DJ controller",    emoji: "🎧", category: "Party", value: 320, co2: 10 },
  { name: "Disco ball",       emoji: "🪩", category: "Party", value: 35, co2: 2 },

  // Kids / family
  { name: "Pack-n-play",      emoji: "👶", category: "Kids", value: 120, co2: 6, extras: ["travel crib"] },
  { name: "Car seat",         emoji: "🚗", category: "Kids", value: 220, co2: 8 },
  { name: "Stroller",         emoji: "🍼", category: "Kids", value: 280, co2: 10 },
  { name: "Double stroller",  emoji: "🍼", category: "Kids", value: 380, co2: 12, extras: ["stroller"] },
  { name: "Baby gate",        emoji: "🚪", category: "Kids", value: 50, co2: 3 },
  { name: "High chair",       emoji: "🍽️", category: "Kids", value: 110, co2: 5 },
  { name: "Balance bike",     emoji: "🚴", category: "Kids", value: 90, co2: 4, extras: ["bike"] },
  { name: "Wagon",            emoji: "🛻", category: "Kids", value: 110, co2: 5 },
  { name: "Sled",             emoji: "🛷", category: "Kids", value: 50, co2: 3 },
  { name: "Halloween costumes (kid)", emoji: "🎃", category: "Kids", value: 40, co2: 3, extras: ["costume"] },

  // Craft / hobby
  { name: "Embroidery hoop kit", emoji: "🪡", category: "Craft", value: 30, co2: 2, extras: ["embroidery"] },
  { name: "Knitting needles",  emoji: "🧶", category: "Craft", value: 25, co2: 2 },
  { name: "Pottery wheel",     emoji: "🏺", category: "Craft", value: 380, co2: 12 },
  { name: "Cricut machine",    emoji: "✂️", category: "Craft", value: 240, co2: 8 },
  { name: "Heat press",        emoji: "👕", category: "Craft", value: 220, co2: 9 },
  { name: "Easel",             emoji: "🎨", category: "Craft", value: 80, co2: 4 },
  { name: "Sewing serger",     emoji: "🧵", category: "Craft", value: 280, co2: 10, extras: ["serger"] },
  { name: "Loom",              emoji: "🧶", category: "Craft", value: 140, co2: 6 },

  // Auto / moving
  { name: "Car jack",          emoji: "🚗", category: "Auto", value: 90, co2: 5 },
  { name: "Jump starter",      emoji: "🔋", category: "Auto", value: 110, co2: 5, extras: ["jumper"] },
  { name: "Tire inflator",     emoji: "🛞", category: "Auto", value: 60, co2: 3 },
  { name: "Roof box",          emoji: "🚙", category: "Auto", value: 320, co2: 10, extras: ["cargo box"] },
  { name: "Hand truck",        emoji: "📦", category: "Moving", value: 90, co2: 4, extras: ["dolly"] },
  { name: "Furniture dolly",   emoji: "📦", category: "Moving", value: 60, co2: 3, extras: ["dolly"] },
  { name: "Moving blankets",   emoji: "🛏️", category: "Moving", value: 40, co2: 3 },
  { name: "Tie-down straps",   emoji: "📦", category: "Moving", value: 25, co2: 2, extras: ["ratchet straps"] },
  { name: "Hitch bike carrier", emoji: "🚲", category: "Auto", value: 240, co2: 8 },

  // Music
  { name: "Acoustic guitar",   emoji: "🎸", category: "Music", value: 240, co2: 8 },
  { name: "Electric guitar",   emoji: "🎸", category: "Music", value: 380, co2: 10 },
  { name: "Guitar amp",        emoji: "🎚️", category: "Music", value: 220, co2: 8, extras: ["amp", "amplifier"] },
  { name: "Keyboard (61-key)", emoji: "🎹", category: "Music", value: 280, co2: 10, extras: ["piano", "keyboard"] },
  { name: "Drum pad",          emoji: "🥁", category: "Music", value: 180, co2: 6 },
  { name: "Ukulele",           emoji: "🎶", category: "Music", value: 80, co2: 4 },

  // Wellness
  { name: "Massage gun",       emoji: "💆", category: "Wellness", value: 180, co2: 6 },
  { name: "Inversion table",   emoji: "🧘", category: "Wellness", value: 240, co2: 8 },
  { name: "Spin bike",         emoji: "🚴", category: "Wellness", value: 480, co2: 14 },
  { name: "Rowing machine",    emoji: "🚣", category: "Wellness", value: 540, co2: 16 },
  { name: "Treadmill",         emoji: "🏃", category: "Wellness", value: 680, co2: 20 },

  // Misc / seasonal
  { name: "Halloween projector", emoji: "🎃", category: "Seasonal", value: 90, co2: 4, extras: ["projector"] },
  { name: "Christmas tree stand", emoji: "🎄", category: "Seasonal", value: 30, co2: 2 },
  { name: "Inflatable Santa", emoji: "🎅", category: "Seasonal", value: 60, co2: 4 },
  { name: "Turkey fryer",      emoji: "🦃", category: "Seasonal", value: 140, co2: 7 },
  { name: "Apple peeler",      emoji: "🍎", category: "Seasonal", value: 25, co2: 2 },
  { name: "Pumpkin carving kit", emoji: "🎃", category: "Seasonal", value: 15, co2: 1 },
  { name: "Garden cart",       emoji: "🛒", category: "Outdoor", value: 110, co2: 5 },
  { name: "Wheel barrow tire pump", emoji: "💨", category: "Tools", value: 30, co2: 2, extras: ["pump"] },
];

function makeOriginal(o: typeof ORIGINALS[number]): Item {
  return {
    id: o.id,
    owner_id: null,
    owner_display_name: o.owner,
    owner_avatar_color: colorFor(o.owner),
    distance_mi: o.mi,
    doors_away: doorsLabel(o.mi),
    name: o.name,
    emoji: o.emoji,
    category: o.category,
    synonyms: syns(o.name, o.extras ?? []),
    availability: o.avail,
    availability_tags: ["weekend", "today", "tomorrow"],
    estimated_value: o.value,
    trust_circle: o.circle,
    borrow_count: 0,
    co2_kg_per_borrow: o.co2,
    owner_karma: 3 + ((o.name.length * 7) % 12),
  };
}

function makeFromTemplate(t: Template, idx: number): Item {
  const owner = NEIGHBORS[idx % NEIGHBORS.length];
  // Spread distances 0.02 .. 0.49
  const mi = Math.round((0.02 + ((idx * 37) % 480) / 1000) * 100) / 100;
  const availIdx = (idx * 13) % AVAIL.length;
  const circle = CIRCLES[(idx * 5) % CIRCLES.length];
  return {
    id: `seed-t-${idx.toString().padStart(4, "0")}`,
    owner_id: null,
    owner_display_name: owner,
    owner_avatar_color: colorFor(owner + idx),
    distance_mi: mi,
    doors_away: doorsLabel(mi),
    name: t.name,
    emoji: t.emoji,
    category: t.category,
    synonyms: syns(t.name, t.extras ?? []),
    availability: AVAIL[availIdx],
    availability_tags: AVAIL_TAGS[availIdx],
    estimated_value: t.value,
    trust_circle: circle,
    borrow_count: (idx * 3) % 9,
    co2_kg_per_borrow: t.co2,
    owner_karma: 1 + ((idx * 11) % 18),
  };
}

export function buildMockItems(): Item[] {
  const originals = ORIGINALS.map(makeOriginal);
  // Repeat templates enough times to comfortably clear 200 total.
  const target = 220;
  const remaining = target - originals.length;
  const filler: Item[] = [];
  let i = 0;
  while (filler.length < remaining) {
    const t = TEMPLATES[i % TEMPLATES.length];
    filler.push(makeFromTemplate(t, i));
    i++;
  }
  return [...originals, ...filler];
}
