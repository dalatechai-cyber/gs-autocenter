/**
 * Hotspot catalogue for the 3D vehicle explorer.
 *
 * Each part declares the mesh-name prefixes used in the prepped GLBs
 * (see public/models/prep_lc200.py and prep_lx570.py) so that arbitrary
 * meshes can be resolved back to a hotspot id at runtime.
 *
 * All copy is Mongolian Cyrillic, no pricing. CTAs point to tel:+97677200570.
 */

export type PartCategory =
  | "engine"
  | "door"
  | "wheel"
  | "light"
  | "glass"
  | "body"
  | "chrome"
  | "underbody"
  | "interior";

export type Part = {
  id: string;
  category: PartCategory;
  /** Mesh name prefixes (case-sensitive, matched to start of object name). */
  prefixes: string[];
  /** Mongolian name shown in the UI. */
  name: string;
  /** Short sub-label / location. */
  subtitle: string;
  /** 1–2 sentence description of what GS Auto Center services on this part. */
  desc: string;
  /** Bullet list of services shown in modal. */
  bullets: string[];
  /** Whether selecting this triggers a part-open animation. */
  animates?: "hood" | "door" | null;
};

/** Sub-parts revealed inside the engine bay when the hood is open. */
export type EngineBayHotspot = {
  id: string;
  /** Position relative to the car's center, in fitted/scaled world units. */
  position: [number, number, number];
  name: string;
  desc: string;
};

const COMMON_BULLETS = [
  "Анхдагч эд анги",
  "Мэргэшсэн мастер",
  "Чанарын баталгаа",
  "Шуурхай үйлчилгээ",
];

/* -------------------------------------------------------------- */
/* Land Cruiser 200 (LC200)                                       */
/* -------------------------------------------------------------- */

export const LC200_PARTS: Part[] = [
  {
    id: "hood",
    category: "engine",
    prefixes: ["Hood"],
    name: "Хөдөлгүүрийн тасалгаа",
    subtitle: "Капот · Хөдөлгүүр",
    desc:
      "1UR-FE / 1VD-FTV хөдөлгүүрийн бүрэн оношилгоо, тосны солилт, " +
      "хөргөлтийн систем, цахилгаан хэсгийн засвар. Капот товчилно — нээгдэнэ.",
    bullets: [
      "Хөдөлгүүрийн оношилгоо",
      "Тос & шүүлтүүр",
      "Хөргөлтийн систем",
      "Цахилгаан холболт",
    ],
    animates: "hood",
  },
  {
    id: "door-fl",
    category: "door",
    prefixes: ["Door_FL"],
    name: "Урд зүүн хаалга",
    subtitle: "Хаалга · FL",
    desc:
      "Хаалганы механизм, түгжээ, цонхны мотор, эвдрэлийн үед хийц " +
      "нөхөн сэргээх, будалт. Товчилбол хаалга нээгдэнэ.",
    bullets: COMMON_BULLETS,
    animates: "door",
  },
  {
    id: "door-fr",
    category: "door",
    prefixes: ["Door_FR"],
    name: "Урд баруун хаалга",
    subtitle: "Хаалга · FR",
    desc:
      "Хаалганы механизм, түгжээ, цонхны мотор, эвдрэлийн үед хийц " +
      "нөхөн сэргээх, будалт. Товчилбол хаалга нээгдэнэ.",
    bullets: COMMON_BULLETS,
    animates: "door",
  },
  {
    id: "door-rl",
    category: "door",
    prefixes: ["Door_RL"],
    name: "Хойд зүүн хаалга",
    subtitle: "Хаалга · RL",
    desc:
      "Хаалганы механизм, түгжээ, цонхны мотор, дотор бүрээс. " +
      "Товчилбол хаалга нээгдэнэ.",
    bullets: COMMON_BULLETS,
    animates: "door",
  },
  {
    id: "door-rr",
    category: "door",
    prefixes: ["Door_RR"],
    name: "Хойд баруун хаалга",
    subtitle: "Хаалга · RR",
    desc:
      "Хаалганы механизм, түгжээ, цонхны мотор, дотор бүрээс. " +
      "Товчилбол хаалга нээгдэнэ.",
    bullets: COMMON_BULLETS,
    animates: "door",
  },
  {
    id: "wheel",
    category: "wheel",
    prefixes: ["Wheel", "Tire", "Brake"],
    name: "Дугуй & Түдгэлзүүр",
    subtitle: "Шасси · Suspension",
    desc:
      "JAPAN TOK түдгэлзүүрийн эд анги, дугуйн балансжуулалт, " +
      "тэнхлэгийн засвар, амортизаторын солилт, тормосны диск.",
    bullets: [
      "Балансжуулалт",
      "Амортизатор",
      "Тэнхлэг тохируулга",
      "Тормосны диск",
    ],
  },
  {
    id: "headlight",
    category: "light",
    prefixes: ["Headlight"],
    name: "Урд гэрэл",
    subtitle: "LED · Цахилгаан",
    desc:
      "LED матриц шинэчлэлт, гэрлийн модуль, цахилгаан холболт, " +
      "линз цэвэрлэгээ, өндөр / нам туяаны тохируулга.",
    bullets: COMMON_BULLETS,
  },
  {
    id: "taillight",
    category: "light",
    prefixes: ["Taillight"],
    name: "Арын гэрэл",
    subtitle: "LED · Дохио",
    desc:
      "Арын гэрэл, тоормосны дохио, эргэлтийн залуурын засвар, " +
      "цахилгаан холболт, шилний солилт.",
    bullets: COMMON_BULLETS,
  },
  {
    id: "glass",
    category: "glass",
    prefixes: ["Windshield", "RearWindow", "Window"],
    name: "Шил & Цонх",
    subtitle: "Гадна шил",
    desc:
      "Анхдагч урд салхины шилний солилт, битүүмжлэл, цонхны " +
      "мотор, хагарсан шилний орлуулалт.",
    bullets: COMMON_BULLETS,
  },
  {
    id: "body",
    category: "body",
    prefixes: ["Body_Panel", "Roof", "Bumper_F", "Bumper_R", "Fender_F", "Fender_R", "Tailgate"],
    name: "Кузов & Будалт",
    subtitle: "Гадна биет",
    desc:
      "Кузовны засвар, цоохор арилгах, бүрэн будалт, лак өнгөлгөө, " +
      "паркийн хамгаалалт, керамик бүрээс.",
    bullets: [
      "Кузов засвар",
      "Бүрэн будалт",
      "Цоохор арилгах",
      "Керамик бүрээс",
    ],
  },
];

/** Sub-hotspots that appear inside the LC200 engine bay when the hood opens. */
export const LC200_ENGINE_BAY: EngineBayHotspot[] = [
  {
    id: "engine-block",
    position: [0.35, 0.55, 0.05],
    name: "Хөдөлгүүрийн блок",
    desc:
      "1UR-FE / 1VD-FTV хөдөлгүүрийн оношилгоо, инжектор цэвэрлэгээ, " +
      "цаг тохируулга, бүрэн засвар.",
  },
  {
    id: "battery",
    position: [-0.55, 0.55, -0.35],
    name: "Аккумулятор",
    desc:
      "Аккумуляторын ачаалал шалгалт, цэнэглэх систем, шинэ батарей суулгац.",
  },
  {
    id: "radiator",
    position: [0.95, 0.45, 0],
    name: "Радиатор & Хөргөлт",
    desc:
      "Радиатор сэлбэх / цэвэрлэх, антифриз солих, термостатын засвар.",
  },
];

/* -------------------------------------------------------------- */
/* Lexus LX 570                                                   */
/* -------------------------------------------------------------- */

export const LX570_PARTS: Part[] = [
  {
    id: "hood",
    category: "engine",
    prefixes: ["Hood"],
    name: "Хөдөлгүүрийн тасалгаа",
    subtitle: "Капот · 3UR-FE V8",
    desc:
      "Lexus 3UR-FE 5.7л V8 хөдөлгүүрийн бүрэн оношилгоо, " +
      "тос/шүүлтүүр, цахилгаан, хөргөлтийн систем. Капот товчилно — нээгдэнэ.",
    bullets: [
      "V8 оношилгоо",
      "Тос & шүүлтүүр",
      "Хөргөлтийн систем",
      "Цахилгаан холболт",
    ],
    animates: "hood",
  },
  {
    id: "door-fl",
    category: "door",
    prefixes: ["Door_FL"],
    name: "Урд зүүн хаалга",
    subtitle: "Хаалга · FL",
    desc:
      "Soft-close хаалганы механизм, хром хүрээ, эвдрэл нөхөн сэргээх, " +
      "будалт. Товчилбол хаалга нээгдэнэ.",
    bullets: COMMON_BULLETS,
    animates: "door",
  },
  {
    id: "door-fr",
    category: "door",
    prefixes: ["Door_FR"],
    name: "Урд баруун хаалга",
    subtitle: "Хаалга · FR",
    desc:
      "Soft-close хаалганы механизм, хром хүрээ, эвдрэл нөхөн сэргээх, " +
      "будалт. Товчилбол хаалга нээгдэнэ.",
    bullets: COMMON_BULLETS,
    animates: "door",
  },
  {
    id: "door-rl",
    category: "door",
    prefixes: ["Door_RL"],
    name: "Хойд зүүн хаалга",
    subtitle: "Хаалга · RL",
    desc:
      "Soft-close, хром, дотор бүрээс. Товчилбол хаалга нээгдэнэ.",
    bullets: COMMON_BULLETS,
    animates: "door",
  },
  {
    id: "door-rr",
    category: "door",
    prefixes: ["Door_RR"],
    name: "Хойд баруун хаалга",
    subtitle: "Хаалга · RR",
    desc:
      "Soft-close, хром, дотор бүрээс. Товчилбол хаалга нээгдэнэ.",
    bullets: COMMON_BULLETS,
    animates: "door",
  },
  {
    id: "wheel",
    category: "wheel",
    prefixes: ["Wheel", "Tire", "Brake_Disc"],
    name: "Дугуй & Түдгэлзүүр",
    subtitle: "21\" · KDSS",
    desc:
      "KDSS / AHC түдгэлзүүрийн засвар, обуд өнгөлгөө, дугуй балансжуулалт, " +
      "тормосны диск/накладка солилт.",
    bullets: [
      "KDSS / AHC",
      "Обуд өнгөлгөө",
      "Балансжуулалт",
      "Тормос",
    ],
  },
  {
    id: "headlight",
    category: "light",
    prefixes: ["Headlight"],
    name: "Урд гэрэл",
    subtitle: "Tri-LED",
    desc:
      "Tri-LED модуль засвар, шинэчлэлт, линз цэвэрлэгээ, " +
      "адаптив гэрлийн тохируулга.",
    bullets: COMMON_BULLETS,
  },
  {
    id: "taillight",
    category: "light",
    prefixes: ["Taillight"],
    name: "Арын гэрэл",
    subtitle: "L-shape LED",
    desc:
      "L-хэлбэрийн LED арын гэрлийн засвар, цахилгаан холболт, " +
      "шилний солилт.",
    bullets: COMMON_BULLETS,
  },
  {
    id: "glass",
    category: "glass",
    prefixes: ["Windshield", "RearWindow", "Window", "Lamp_Glass"],
    name: "Шил & Цонх",
    subtitle: "Гадна шил",
    desc:
      "Анхдагч урд салхины шил, цонхны битүүмжлэл, soft-close цонхны " +
      "механизм засвар.",
    bullets: COMMON_BULLETS,
  },
  {
    id: "body",
    category: "body",
    prefixes: ["Body_Panel", "Roof", "Bumper_F", "Bumper_R", "Fender_F", "Fender_R", "Tailgate"],
    name: "Кузов & Будалт",
    subtitle: "Гадна биет",
    desc:
      "Lexus стандартын будалт, цоохор арилгах, керамик бүрээс, " +
      "паркийн PPF хальсалт.",
    bullets: [
      "Кузов засвар",
      "Бүрэн будалт",
      "Керамик бүрээс",
      "PPF хальсалт",
    ],
  },
  {
    id: "chrome",
    category: "chrome",
    prefixes: ["Chrome_Trim", "Badge"],
    name: "Хром эд анги",
    subtitle: "Trim · Гадна",
    desc:
      "Хром эд ангийн солилт, өнгөлгөө, зэврэлтийн арилгалт, " +
      "Lexus логоны нөхөн сэргээлт.",
    bullets: COMMON_BULLETS,
  },
];

export const LX570_ENGINE_BAY: EngineBayHotspot[] = [
  {
    id: "engine-block",
    position: [0.35, 0.55, 0.05],
    name: "3UR-FE V8",
    desc:
      "5.7л V8 хөдөлгүүрийн оношилгоо, инжектор цэвэрлэгээ, " +
      "цаг тохируулга, бүрэн засвар.",
  },
  {
    id: "battery",
    position: [-0.55, 0.55, -0.35],
    name: "Аккумулятор",
    desc:
      "Аккумуляторын ачаалал шалгалт, цэнэглэх систем, шинэ батарей суулгац.",
  },
  {
    id: "radiator",
    position: [0.95, 0.45, 0],
    name: "Радиатор",
    desc:
      "Радиатор цэвэрлэх / солих, антифриз, термостат, хөргөлтийн насос.",
  },
];

/* -------------------------------------------------------------- */
/* Resolver                                                        */
/* -------------------------------------------------------------- */

/**
 * Walks the object name. Returns the first part whose prefix list matches.
 * Matches if name === prefix, name.startsWith(prefix + "_"), or
 * name.startsWith(prefix + ".").
 */
export function findPartId(name: string, parts: Part[]): string | null {
  for (const p of parts) {
    for (const prefix of p.prefixes) {
      if (
        name === prefix ||
        name.startsWith(prefix + "_") ||
        name.startsWith(prefix + ".")
      ) {
        return p.id;
      }
    }
  }
  return null;
}

export function findPart(name: string, parts: Part[]): Part | null {
  const id = findPartId(name, parts);
  return id ? parts.find((p) => p.id === id) ?? null : null;
}

/* -------------------------------------------------------------- */
/* Per-vehicle config                                              */
/* -------------------------------------------------------------- */

export type VehicleKey = "lc200" | "lx570";

export type VehicleConfig = {
  url: string;
  label: string;
  sub: string;
  tagline: string;
  /** Hex string used for body paint material override. */
  paintColor: string;
  parts: Part[];
  engineBay: EngineBayHotspot[];
  /** Initial orbit distance. */
  cameraDistance: number;
};

export const VEHICLES: Record<VehicleKey, VehicleConfig> = {
  lc200: {
    url: "/models/lc200-ready.glb",
    label: "Land Cruiser 200",
    sub: "Toyota · J200",
    tagline: "Чулуулаг шиг бат · Хээрийн домог",
    paintColor: "#28323b",
    parts: LC200_PARTS,
    engineBay: LC200_ENGINE_BAY,
    cameraDistance: 5.8,
  },
  lx570: {
    url: "/models/lx570-ready.glb",
    label: "Lexus LX 570",
    sub: "Lexus · J200 Premium",
    tagline: "Premium V8 · Atomic Silver",
    paintColor: "#c3c6cc",
    parts: LX570_PARTS,
    engineBay: LX570_ENGINE_BAY,
    cameraDistance: 5.5,
  },
};
