import type { Hotspot } from './types';

// NOTE: Mongolian copy below is the PRE-correction baseline. Phase 5 produces the corrected
// version after user review. Do not ship without that review pass.

export const HOTSPOTS: Hotspot[] = [
  // === EXTERIOR ===
  { id: 'ext-hood',        stage: 'exterior',
    titleMn: 'Капот ба хөдөлгүүрийн булан',
    descriptionMn: 'Хөдөлгүүрийн оношилгоо, тосны солилт, цагийн бүс солилт. Капот нээж дотор харна уу.' },
  { id: 'ext-headlight-l', stage: 'exterior',
    titleMn: 'Гэрэлтүүлэг (зүүн)',
    descriptionMn: 'LED гэрэл, тохиргоо, шилний солилт, бамбай тохируулга.' },
  { id: 'ext-headlight-r', stage: 'exterior',
    titleMn: 'Гэрэлтүүлэг (баруун)',
    descriptionMn: 'LED гэрэл, тохиргоо, шилний солилт, бамбай тохируулга.' },
  { id: 'ext-grille',      stage: 'exterior',
    titleMn: 'Радиаторын тор',
    descriptionMn: 'Радиаторын торны цэвэрлэгээ, гэмтэлийн засвар.' },
  { id: 'ext-wheel-fl',    stage: 'exterior',
    titleMn: 'Урд зүүн дугуй',
    descriptionMn: 'Түдгэлзүүр, балансжуулалт, тэнхлэгийн тохируулга.' },
  { id: 'ext-wheel-fr',    stage: 'exterior',
    titleMn: 'Урд баруун дугуй',
    descriptionMn: 'Түдгэлзүүр, балансжуулалт, тэнхлэгийн тохируулга.' },
  { id: 'ext-wheel-rl',    stage: 'exterior',
    titleMn: 'Арын зүүн дугуй',
    descriptionMn: 'Дугуй солилт, балансжуулалт, амортизаторын шалгалт.' },
  { id: 'ext-wheel-rr',    stage: 'exterior',
    titleMn: 'Арын баруун дугуй',
    descriptionMn: 'Дугуй солилт, балансжуулалт, амортизаторын шалгалт.' },
  { id: 'ext-mirror-l',    stage: 'exterior',
    titleMn: 'Хажуугийн толь (зүүн)',
    descriptionMn: 'Цахилгаан тохируулга, толины шилний солилт, халаалт.' },
  { id: 'ext-mirror-r',    stage: 'exterior',
    titleMn: 'Хажуугийн толь (баруун)',
    descriptionMn: 'Цахилгаан тохируулга, толины шилний солилт, халаалт.' },
  { id: 'ext-windshield',  stage: 'exterior',
    titleMn: 'Урд салхины шил',
    descriptionMn: 'Шилний солилт, хагарал засвар, шил арчигчийн засвар.' },

  // === ENGINE APPROACH (closed hood) — only hotspots reachable from outside ===
  { id: 'eng-app-hood',    stage: 'engine_approach',
    titleMn: 'Капот ба түүний механизм',
    descriptionMn: 'Капотын механизмын засвар, амортизатор, түгжээ. Капот доторх булан рүү шилжих.' },
  { id: 'eng-app-front',   stage: 'engine_approach',
    titleMn: 'Урд гэрэлтүүлэг',
    descriptionMn: 'Урд LED гэрэл, бамбай, шилний солилт.' },

  // === ENGINE BAY (open hood) — internals visible only with hood open ===
  { id: 'eng-block',       stage: 'engine_bay',
    titleMn: 'V35A-FTS хөдөлгүүр',
    descriptionMn: '3.5л V6 турбо хөдөлгүүрийн оношилгоо, их засвар, цилиндрийн засвар.' },
  { id: 'eng-battery',     stage: 'engine_bay',
    titleMn: 'Аккумулятор',
    descriptionMn: 'Батарей солилт, цахилгааны оношилгоо, зэврэлт цэвэрлэгээ.' },
  { id: 'eng-air-filter',  stage: 'engine_bay',
    titleMn: 'Агаарын шүүлтүүр',
    descriptionMn: 'Шүүлтүүр солилт, агаарын замын шалгалт.' },
  { id: 'eng-radiator',    stage: 'engine_bay',
    titleMn: 'Радиатор',
    descriptionMn: 'Хөргөлтийн шингэн солилт, радиатор засвар, системийн угаалт.' },
  { id: 'eng-intake',      stage: 'engine_bay',
    titleMn: 'Сорогч хошуу',
    descriptionMn: 'Турбо системийн оношилгоо, агаар сорох замын шалгалт.' },
  { id: 'eng-fuse-box',    stage: 'engine_bay',
    titleMn: 'Гал хамгаалагчийн хайрцаг',
    descriptionMn: 'Цахилгаан схемийн оношилгоо, гал хамгаалагч солилт, рэлэ шалгалт.' },

  // === UNDERNEATH ===
  { id: 'und-susp-fl',    stage: 'underneath',
    titleMn: 'Урд түдгэлзүүр (зүүн)',
    descriptionMn: 'Давхар хөшүүргэт түдгэлзүүр, амортизатор, бөмбөлгөн холбоосын засвар.' },
  { id: 'und-susp-fr',    stage: 'underneath',
    titleMn: 'Урд түдгэлзүүр (баруун)',
    descriptionMn: 'Давхар хөшүүргэт түдгэлзүүр, амортизатор, бөмбөлгөн холбоосын засвар.' },
  { id: 'und-susp-rl',    stage: 'underneath',
    titleMn: 'Арын түдгэлзүүр (зүүн)',
    descriptionMn: 'Хатуу тэнхлэгт түдгэлзүүр, 4 цэгийн холбоос, амортизаторын засвар.' },
  { id: 'und-susp-rr',    stage: 'underneath',
    titleMn: 'Арын түдгэлзүүр (баруун)',
    descriptionMn: 'Хатуу тэнхлэгт түдгэлзүүр, 4 цэгийн холбоос, амортизаторын засвар.' },
  { id: 'und-exhaust',    stage: 'underneath',
    titleMn: 'Яндангийн систем',
    descriptionMn: 'Каталитик хувиргагч, дуу намсгагч, иж бүрэн солилт ба засвар.' },
  { id: 'und-fuel-tank',  stage: 'underneath',
    titleMn: 'Түлшний сав',
    descriptionMn: 'Түлшний сав цэвэрлэгээ, насос солилт, шугам шалгалт.' },
  { id: 'und-transfer',   stage: 'underneath',
    titleMn: 'Хөтлөгчийн хайрцаг',
    descriptionMn: 'Дөрвөн дугуйн хөтлөгчийн систем, тосны солилт, шүдлэг засвар.' },
  { id: 'und-diff-f',     stage: 'underneath',
    titleMn: 'Урд диференциал',
    descriptionMn: 'Урд диференциал тосны солилт, шүдлэг хүрд шалгалт.' },
  { id: 'und-diff-r',     stage: 'underneath',
    titleMn: 'Арын диференциал',
    descriptionMn: 'Арын диференциал тосны солилт, шүдлэг хүрд шалгалт.' },
];

export function hotspotById(id: string): Hotspot | undefined {
  return HOTSPOTS.find((h) => h.id === id);
}

export function hotspotsForStage(stage: import('./types').Stage) {
  return HOTSPOTS.filter((h) => h.stage === stage);
}
