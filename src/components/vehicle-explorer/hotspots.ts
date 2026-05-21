export type Hotspot = {
  id: string;
  prefixes: string[];
  name: string;
  desc: string;
  /** The exact Three.js object name to detach for part-isolation. Defaults to prefixes[0]. */
  isolate?: string;
};

export const LC200_HOTSPOTS: Hotspot[] = [
  {
    id: "wheels",
    prefixes: ["Wheel_FL", "Wheel_FR", "Wheel_RL", "Wheel_RR"],
    name: "Дугуй & Түдгэлзүүр",
    desc: "JAPAN TOK түдгэлзүүрийн эд анги, дугуйн балансжуулалт, тэнхлэгийн засвар, амортизаторын солилт.",
  },
  {
    id: "hood",
    prefixes: ["Hood"],
    name: "Хөдөлгүүр & Капот",
    desc: "Хөдөлгүүрийн оношилгоо, тосны солилт, цахилгаан системийн шалгалт. Капот нээгдэж дотор эд анги харагдана.",
  },
  {
    id: "body",
    prefixes: ["Body_Panel"],
    name: "Кузов & Хаалга",
    desc: "Кузовны засвар, будалт, цомхотголын ажил, гадна эд ангийн солилт.",
  },
  {
    id: "window",
    prefixes: ["Window"],
    name: "Цонх",
    desc: "Шил, шилний резин, битүүмжлэлийн засвар. Хагарсан шилний солилт.",
  },
  {
    id: "headlight",
    prefixes: ["Headlight_L"],
    name: "Урд гэрэл",
    desc: "Цахилгаан оношилгоо, урд гэрлийн засвар, LED шинэчлэлт.",
  },
  {
    id: "taillight",
    prefixes: ["Taillight_L", "Taillight_R"],
    name: "Арын гэрэл",
    desc: "Арын гэрлийн засвар, цахилгаан холболт, шилний солилт.",
  },
  {
    id: "underside",
    prefixes: ["Underside"],
    name: "Ёроол",
    desc: "Шасси, утаа гаргуур, доод хамгаалалт, түдгэлзүүрийн ёроолын шалгалт.",
  },
];

export const LX570_HOTSPOTS: Hotspot[] = [
  {
    id: "tire",
    prefixes: ["Tire_RR"],
    name: "Дугуй",
    desc: "Дугуй солилт, балансжуулалт, агаарын дарамтын хяналт, элэгдлийн оношилгоо.",
  },
  {
    id: "wheel",
    prefixes: ["Wheel"],
    name: "Дугуйн обуд",
    desc: "Обудны засвар, өнгөлгөө, будалт, гажиг тэгшилгээ.",
  },
  {
    id: "brake",
    prefixes: ["Brake_Disc"],
    name: "Тормос",
    desc: "Тормосны диск, накладкын солилт, гидравликийн системийн засвар.",
  },
  {
    id: "body",
    prefixes: ["Body_Panel"],
    name: "Кузов",
    desc: "Кузовны панель, гадна эд анги, будалт, кеш засвар.",
  },
  {
    id: "window",
    prefixes: ["Window"],
    name: "Цонх",
    desc: "Шилний солилт, битүүмжлэл, цонхны механизмын засвар.",
  },
  {
    id: "chrome",
    prefixes: ["Chrome_Trim"],
    name: "Хром",
    desc: "Хром эд ангийн солилт, өнгөлгөө, зэврэлтийн арилгалт.",
  },
  {
    id: "lights",
    prefixes: ["LED", "Lamp_Glass", "Taillight"],
    name: "Гэрэл",
    desc: "LED модулийн засвар, гэрлийн шилний солилт, цахилгаан холболт.",
  },
  {
    id: "interior",
    prefixes: ["Interior_Trim", "Plastic_Matte", "Plastic_Gloss"],
    name: "Салон",
    desc: "Салоны эд анги, пластикын засвар, өнгөлгөө, цэвэрлэгээ.",
  },
];

/**
 * LC300 GLB node names — re-exported from the LC300 .blend file with:
 *  - Hood Mirror+Bevel+Subdiv modifiers baked, duplicated and renamed
 *    "Bonnet_Full" with its origin moved to the rear-bottom hinge edge so
 *    Three.js can rotate it directly (no pivot calculation needed).
 *  - Engine_Block, Door_FL/FR/RL/RR (+ Int*_Door interiors), Wheel_FL/FR/RL/RR
 *    preserved with their Blender object names.
 *  - "Car plates" / NLM material stripped during gltf-transform optimization.
 */
export const LC300_HOTSPOTS: Hotspot[] = [
  {
    id: "hood",
    prefixes: ["Bonnet_Full"],
    name: "Хөдөлгүүр & Капот",
    desc: "Хөдөлгүүрийн оношилгоо, тосны солилт, цагийн бүс солилт. Капот нээгдэж дотор эд анги харагдана.",
    isolate: "Bonnet_Full",
  },
  {
    id: "engine",
    prefixes: ["Engine_Block"],
    name: "Хөдөлгүүрийн блок",
    desc: "V6 хөдөлгүүрийн бүрэн оношилгоо, тосны солилт, цагийн бүс шалгалт. JAPAN TOK оригинал эд ангиар үйлчилнэ.",
    isolate: "Engine_Block",
  },
  {
    id: "battery",
    prefixes: ["Battery"],
    name: "Аккумулятор",
    desc: "Батарей шалгалт, солилт. Цахилгааны системийн бүрэн оношилгоо.",
    isolate: "Battery",
  },
  {
    id: "air_filter",
    prefixes: ["Air_Filter"],
    name: "Агаарын шүүлтүүр",
    desc: "Агаарын шүүлтүүр солилт, агаарын системийн цэвэрлэгээ.",
    isolate: "Air_Filter",
  },
  {
    id: "radiator",
    prefixes: ["Radiator"],
    name: "Радиатор",
    desc: "Хөргөлтийн системийн үйлчилгээ, радиатор угаалт, шингэн солилт.",
    isolate: "Radiator",
  },
  {
    id: "door_fl",
    prefixes: ["Door_FL", "IntFL_Door"],
    name: "Жолоочийн хаалга",
    desc: "Биеийн засвар, хаалганы механизм, дотор резин, шилний солилт, бэхэлгээний засвар.",
    isolate: "Door_FL",
  },
  {
    id: "door_fr",
    prefixes: ["Door_FR", "IntFR_Door"],
    name: "Урд хажуугийн хаалга",
    desc: "Биеийн засвар, хаалганы механизм, дотор резин, шилний солилт, бэхэлгээний засвар.",
    isolate: "Door_FR",
  },
  {
    id: "door_rl",
    prefixes: ["Door_RL", "IntRL_Door"],
    name: "Арын зүүн хаалга",
    desc: "Биеийн засвар, хаалганы механизм, дотор резин, шилний солилт, бэхэлгээний засвар.",
    isolate: "Door_RL",
  },
  {
    id: "door_rr",
    prefixes: ["Door_RR", "IntRR_Door"],
    name: "Арын баруун хаалга",
    desc: "Биеийн засвар, хаалганы механизм, дотор резин, шилний солилт, бэхэлгээний засвар.",
    isolate: "Door_RR",
  },
  {
    id: "wheel_fl",
    prefixes: ["Wheel_FL"],
    name: "Урд зүүн дугуй",
    desc: "JAPAN TOK түдгэлзүүрийн эд анги, дугуй солилт, балансжуулалт, тэнхлэгийн тохиргоо, амортизаторын шалгалт.",
    isolate: "Wheel_FL",
  },
  {
    id: "wheel_fr",
    prefixes: ["Wheel_FR"],
    name: "Урд баруун дугуй",
    desc: "JAPAN TOK түдгэлзүүрийн эд анги, дугуй солилт, балансжуулалт, тэнхлэгийн тохиргоо, амортизаторын шалгалт.",
    isolate: "Wheel_FR",
  },
  {
    id: "wheel_rl",
    prefixes: ["Wheel_RL"],
    name: "Арын зүүн дугуй",
    desc: "Дугуй солилт, балансжуулалт, амортизаторын шалгалт, гальмуурын системийн үзлэг.",
    isolate: "Wheel_RL",
  },
  {
    id: "wheel_rr",
    prefixes: ["Wheel_RR"],
    name: "Арын баруун дугуй",
    desc: "Дугуй солилт, балансжуулалт, амортизаторын шалгалт, гальмуурын системийн үзлэг.",
    isolate: "Wheel_RR",
  },
];

export function findHotspotId(name: string, hotspots: Hotspot[]): string | null {
  for (const h of hotspots) {
    for (const p of h.prefixes) {
      if (name === p || name.startsWith(p + "_") || name.startsWith(p + ".")) {
        return h.id;
      }
    }
  }
  return null;
}
