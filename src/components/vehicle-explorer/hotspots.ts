export type Hotspot = {
  id: string;
  prefixes: string[];
  name: string;
  desc: string;
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
