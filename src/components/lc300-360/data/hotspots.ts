import type { Hotspot } from './types';

/**
 * MONGOLIAN TERMINOLOGY GLOSSARY (reviewed 2026-05-27)
 *
 * Audited and approved by GS Auto Center owner with input from Cowork expert
 * review. Full proposal + per-row reasoning at:
 *   docs/superpowers/specs/2026-05-26-lc300-mongolian-terms.md
 *
 * == TECHNICAL ACCURACY FIXES ==
 *
 * - "Timing belt" → "timing chain" (цагийн гинж):
 *   The Toyota V35A-FTS 3.5L V6 twin-turbo engine uses a timing CHAIN, not a
 *   belt. Earlier copy said "цагийн бүс солилт" (belt replacement) which would
 *   be misleading to customers and mechanics.
 *
 * - LC300 is true 4WD, not AWD:
 *   Transfer-case description uses "Дөрвөн дугуйт хөтлөгчийн систем (4WD)".
 *   The proposed "Бүх дугуйт" (all-wheel-drive) was rejected because the LC300
 *   has a low-range transfer case and locking differentials — true 4WD, not
 *   a passenger-car AWD.
 *
 * - Transfer case = power distributor (хуваарилагч), not transmitter (дамжуулагч):
 *   "Хүчний дамжуулагч" was the original proposal but дамжуулагч means
 *   driveshaft. Correct term is "Хүчний хуваарилагч" (power distributor).
 *   Russian colloquial "раздаткаа" kept in parens for instant shop-talk
 *   recognition.
 *
 * == RUSSIAN LOANWORDS KEPT INTENTIONALLY ==
 *
 * Universal in Mongolian automotive shops; customers parse instantly. Native
 * calques exist but sound bookish or ambiguous (e.g., "Хөргөгч" for radiator
 * also means refrigerator). Kept loanwords:
 *
 *   Капот               — engine hood (native "Хөдөлгүүрийн таг" is bookish)
 *   Аккумулятор         — battery (native "Цахилгаан хураагуур" is pedantic)
 *   Радиатор            — radiator (native "Хөргөгч" ambiguous)
 *   Диференциал         — differential (native "Ялгавартай хайрцаг" is bookish)
 *   Амортизатор         — shock absorber (native "Цохилт сааруулагч" pedantic)
 *   Насос               — pump (native "Шахуурга" rare in auto context)
 *   Цилиндр             — cylinder (no native equivalent)
 *   Каталитик хувиргагч — catalytic converter (hybrid term)
 *   Рэлэ                — relay (no native equivalent)
 *   Раздаткаа           — transfer case (parenthetical to хуваарилагч)
 *   Геометр             — wheel alignment (parenthetical to дугуйны өнцөг)
 *   Фар                 — headlamp (replaces generic "Гэрэлтүүлэг")
 *   LED, 4WD, V35A-FTS  — manufacturer / engineering nomenclature
 *
 * == OTHER CORRECTIONS APPLIED ==
 *
 * - "Сорогч хошуу" → "Хөдөлгүүрийн агаар авах систем"
 *   "Sucking snout" was colloquial. Replaced with formal "engine air-intake system".
 *
 * - "Тэнхлэгийн тохируулга" → "Дугуйны өнцгийн тохируулга (геометр)"
 *   Actual service is wheel alignment (toe/camber/caster), not axle alignment.
 *
 * - "Бамбай тохируулга" → "Гэрлийн өнцөг тохируулга"
 *   "Shield adjustment" was ambiguous; actual service is headlight beam angle.
 *
 * - "Гэрэлтүүлэг" → "Урд фар"
 *   "Illumination" was generic; "Фар" is the standard Mongolian for headlamp.
 *
 * - "Хөтлөгчийн хайрцаг" → "Хүчний хуваарилагч (раздаткаа)"
 *   (See Technical Accuracy section.)
 *
 * - "Толины шилний солилт" → "толин шил солих"
 *   Three-deep genitive flattened to verb phrase.
 *
 * - "Капот ба түүний механизм" → "Капотын механизм"
 *   Heavy "and its" construction simplified.
 *
 * - "Капот доторх булан рүү шилжих" → "Хөдөлгүүрийн хэсэг рүү шилжих"
 *   "The corner inside the capot" was awkward; direct "switch to engine bay".
 *
 * - "Капот ба хөдөлгүүрийн булан" → "Капот ба хөдөлгүүрийн хэсэг"
 *   "Engine corner" → "engine compartment section".
 *
 * - "Батарей солилт" → "Аккумуляторын солилт"
 *   Genitive marker added; also aligned battery term with the title.
 *
 * - "цахилгааны оношилгоо" → "цахилгаан системийн оношилгоо"
 *   Specified "electrical system" not generic electrical.
 *
 * - "системийн угаалт" → "хөргөлтийн системийн угаалт"
 *   Specified "cooling system flush".
 *
 * - "халаалт" → "халаалтын систем"
 *   "Heating" → "heating system".
 *
 * - "шүдлэг засвар" / "шүдлэг хүрд" → "арааны засвар" / "араа шалгалт"
 *   Modernized — "шүдлэг" (toothed) is archaic for араа (gear).
 *
 * - Genitive marker consistency: added missing -ын/-ний markers where
 *   grammatically improved (e.g., Түлшний савны цэвэрлэгээ, шугамын шалгалт).
 *
 * == ALSO UPDATED OUTSIDE THIS FILE ==
 *
 *   StageButtons.tsx aria-label: "Машины үзэх булан" → "Машины хэсгүүд"
 *
 * Do not edit terminology in isolation — coordinate changes through a fresh
 * review pass against the proposal doc above.
 */

export const HOTSPOTS: Hotspot[] = [
  // === EXTERIOR ===
  { id: 'ext-hood',        stage: 'exterior',
    titleMn: 'Капот ба хөдөлгүүрийн хэсэг',
    descriptionMn: 'Хөдөлгүүрийн оношилгоо, тосны солилт, цагийн гинж солилт. Капот нээж дотор харна уу.' },
  { id: 'ext-headlight-l', stage: 'exterior',
    titleMn: 'Урд фар (зүүн)',
    descriptionMn: 'LED гэрэл, тохиргоо, шилний солилт, Гэрлийн өнцөг тохируулга.' },
  { id: 'ext-headlight-r', stage: 'exterior',
    titleMn: 'Урд фар (баруун)',
    descriptionMn: 'LED гэрэл, тохиргоо, шилний солилт, Гэрлийн өнцөг тохируулга.' },
  { id: 'ext-grille',      stage: 'exterior',
    titleMn: 'Радиаторын тор',
    descriptionMn: 'Радиаторын торны цэвэрлэгээ, гэмтэлийн засвар.' },
  { id: 'ext-wheel-fl',    stage: 'exterior',
    titleMn: 'Урд зүүн дугуй',
    descriptionMn: 'Түдгэлзүүр, балансжуулалт, дугуйны өнцгийн тохируулга (геометр).' },
  { id: 'ext-wheel-fr',    stage: 'exterior',
    titleMn: 'Урд баруун дугуй',
    descriptionMn: 'Түдгэлзүүр, балансжуулалт, дугуйны өнцгийн тохируулга (геометр).' },
  { id: 'ext-wheel-rl',    stage: 'exterior',
    titleMn: 'Арын зүүн дугуй',
    descriptionMn: 'Дугуй солилт, балансжуулалт, амортизаторын шалгалт.' },
  { id: 'ext-wheel-rr',    stage: 'exterior',
    titleMn: 'Арын баруун дугуй',
    descriptionMn: 'Дугуй солилт, балансжуулалт, амортизаторын шалгалт.' },
  { id: 'ext-mirror-l',    stage: 'exterior',
    titleMn: 'Хажуугийн толь (зүүн)',
    descriptionMn: 'Цахилгаан тохируулга, толин шил солих, халаалтын систем.' },
  { id: 'ext-mirror-r',    stage: 'exterior',
    titleMn: 'Хажуугийн толь (баруун)',
    descriptionMn: 'Цахилгаан тохируулга, толин шил солих, халаалтын систем.' },
  { id: 'ext-windshield',  stage: 'exterior',
    titleMn: 'Урд салхины шил',
    descriptionMn: 'Шилний солилт, хагарал засвар, шил арчигчийн засвар.' },

  // === ENGINE APPROACH (closed hood) — only hotspots reachable from outside ===
  { id: 'eng-app-hood',    stage: 'engine_approach',
    titleMn: 'Капотын механизм',
    descriptionMn: 'Капотын механизм, амортизатор, түгжээний засвар. Хөдөлгүүрийн хэсэг рүү шилжих.' },
  { id: 'eng-app-front',   stage: 'engine_approach',
    titleMn: 'Урд фар',
    descriptionMn: 'Урд LED гэрэл, гэрлийн өнцөг, шилний солилт.' },

  // === ENGINE BAY (open hood) — internals visible only with hood open ===
  { id: 'eng-block',       stage: 'engine_bay',
    titleMn: 'V35A-FTS хөдөлгүүр',
    descriptionMn: '3.5л V6 турбо хөдөлгүүрийн оношилгоо, их засвар, цилиндрийн засвар.' },
  { id: 'eng-battery',     stage: 'engine_bay',
    titleMn: 'Аккумулятор',
    descriptionMn: 'Аккумуляторын солилт, цахилгаан системийн оношилгоо, зэврэлт цэвэрлэгээ.' },
  { id: 'eng-air-filter',  stage: 'engine_bay',
    titleMn: 'Агаарын шүүлтүүр',
    descriptionMn: 'Шүүлтүүр солилт, агаарын замын шалгалт.' },
  { id: 'eng-radiator',    stage: 'engine_bay',
    titleMn: 'Радиатор',
    descriptionMn: 'Хөргөлтийн шингэн солилт, радиатор засвар, хөргөлтийн системийн угаалт.' },
  { id: 'eng-intake',      stage: 'engine_bay',
    titleMn: 'Хөдөлгүүрийн агаар авах систем',
    descriptionMn: 'Турбо системийн оношилгоо, агаар орох замын шалгалт.' },
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
    descriptionMn: 'Түлшний савны цэвэрлэгээ, насос солилт, шугамын шалгалт.' },
  { id: 'und-transfer',   stage: 'underneath',
    titleMn: 'Хүчний хуваарилагч (раздаткаа)',
    descriptionMn: 'Дөрвөн дугуйт хөтлөгчийн систем (4WD), тосны солилт, арааны засвар.' },
  { id: 'und-diff-f',     stage: 'underneath',
    titleMn: 'Урд диференциал',
    descriptionMn: 'Урд диференциал тосны солилт, араа шалгалт.' },
  { id: 'und-diff-r',     stage: 'underneath',
    titleMn: 'Арын диференциал',
    descriptionMn: 'Арын диференциал тосны солилт, араа шалгалт.' },
];

export function hotspotById(id: string): Hotspot | undefined {
  return HOTSPOTS.find((h) => h.id === id);
}

export function hotspotsForStage(stage: import('./types').Stage) {
  return HOTSPOTS.filter((h) => h.stage === stage);
}
