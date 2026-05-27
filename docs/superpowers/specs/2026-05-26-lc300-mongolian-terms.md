# LC300 Hotspot Mongolian Terminology — Proposal for Review

**Date:** 2026-05-27
**Source files audited:**
- `src/components/lc300-360/data/hotspots.ts` (28 hotspots × 2 fields = 56 strings)
- `src/components/lc300-360/data/types.ts` (`STAGE_LABELS`, `CTA_PHONE_DISPLAY`)
- `src/components/lc300-360/HotspotOverlay.tsx` (aria-label suffix)
- `src/components/lc300-360/HotspotModal.tsx` (CTA + close button text)
- `src/components/lc300-360/StageButtons.tsx` (tablist aria-label)

**Reviewer:** GS Auto Center owner (native Mongolian speaker)

## How to annotate

For each row below, mark the **Status** line:
- **✓** approve the proposed change as written
- **✗** reject — keep the current term
- **✎ "your wording"** revise with your text

When done, save the file with annotations. Task 5.2 will read this document and apply approved changes to `data/hotspots.ts` (and the three component files where UI text lives).

For row sets where every row in the set has the same answer (e.g., wheel L/R/RL/RR are all the same word), one ✓ at the section heading is sufficient — no need to mark each row.

---

## Section 1 — Engine compartment / Capot

### 1.1 — Капот (engine hood) — used in 4 places
**Current:** Капот
**Locations:** `ext-hood` title, `ext-hood` desc, `eng-app-hood` title, `eng-app-hood` desc
**Proposed:** **KEEP Капот**
**Reasoning:** Russian loanword (капо́т), but it is the universally-used term in Mongolian service shops and everyday speech. The native alternative `Хөдөлгүүрийн таг` ("engine cover/lid") sounds bookish and most customers would not immediately recognise it as the bonnet. Recommend keeping for natural speech.
**Alternative if rejected:** `Хөдөлгүүрийн таг`
**Status:** ⬜

### 1.2 — Капот ба хөдөлгүүрийн булан (title for `ext-hood`)
**Current:** Капот ба хөдөлгүүрийн булан
**Proposed:** **KEEP** — or revise to `Капот ба хөдөлгүүрийн тасалгаа`
**Reasoning:** "Булан" literally means "corner/angle"; "хөдөлгүүрийн булан" reads as "engine corner". The engine bay is more naturally `хөдөлгүүрийн тасалгаа` (engine compartment/room) or simply `хөдөлгүүрийн хэсэг` (engine section). The current "булан" is understandable but slightly colloquial.
**Status:** ⬜

### 1.3 — Капот ба түүний механизм (title for `eng-app-hood`)
**Current:** Капот ба түүний механизм
**Proposed:** `Капотын механизм`
**Reasoning:** "ба түүний" ("and its") is grammatically heavy. Simple genitive `Капотын механизм` reads cleaner in a UI label and means the same.
**Status:** ⬜

### 1.4 — цагийн бүс (timing belt) — in `ext-hood` description
**Current:** цагийн бүс солилт
**Proposed:** `цаг тохируулагч бүсний солилт` OR `тогтоосон бүсний солилт`
**Reasoning:** "Цагийн бүс" literally means "clock belt" or in modern context "time zone". It is widely used colloquially for the timing belt, but the more precise mechanical term is `цаг тохируулагч бүс` (time-regulating belt) or `тогтоосон бүс` (set/fixed belt). If you accept the common colloquial usage, keep as-is.
**Status:** ⬜

### 1.5 — Капотын механизмын засвар, амортизатор, түгжээ (eng-app-hood desc)
**Current:** Капотын механизмын засвар, амортизатор, түгжээ
**Proposed:** **KEEP** with minor revise: `Капотын механизм, амортизатор, түгжээний засвар`
**Reasoning:** Original has "Капотын механизмын засвар" (capot's mechanism's repair) — double genitive is heavy. Restructuring to put `засвар` at the end of the list applies repair to all three items more cleanly.
**Status:** ⬜

### 1.6 — Капот доторх булан рүү шилжих (in `eng-app-hood` desc)
**Current:** Капот доторх булан рүү шилжих
**Proposed:** `Капотын дотор харах` OR `Хөдөлгүүрийн булан руу шилжих`
**Reasoning:** "Капот доторх булан" reads literally as "the corner inside the capot" which is awkward. Cleaner phrasing: "look inside the capot" or "switch to the engine bay view". If kept, at least change "доторх" to "дотор".
**Status:** ⬜

---

## Section 2 — Battery / Electrical

### 2.1 — Аккумулятор (battery) — title for `eng-battery`
**Current:** Аккумулятор
**Proposed:** **KEEP Аккумулятор**
**Reasoning:** Russian loanword, universally used in Mongolia. Native `Цахилгаан хураагуур` (electricity accumulator) is technically correct but rarely used in customer-facing service text — would feel pedantic.
**Status:** ⬜

### 2.2 — Батарей солилт (battery replacement) — `eng-battery` desc
**Current:** Батарей солилт
**Proposed:** `Аккумулятор солилт` (consistency with title)
**Reasoning:** Title says "Аккумулятор" but description switches to "Батарей". Same physical thing, but the inconsistency is jarring. Pick one and use it for both — recommend matching the title.
**Status:** ⬜

### 2.3 — цахилгааны оношилгоо (electrical diagnostic) — `eng-battery` desc
**Current:** цахилгааны оношилгоо
**Proposed:** **KEEP** — minor: `цахилгаан системийн оношилгоо` for specificity
**Reasoning:** Current is fine but slightly generic. Adding "системийн" makes it clearly about the electrical *system* rather than electrical anything.
**Status:** ⬜

### 2.4 — Цахилгаан схемийн оношилгоо (electrical schematic diagnostic) — `eng-fuse-box` desc
**Current:** Цахилгаан схемийн оношилгоо
**Proposed:** **KEEP** — or `Цахилгаан холболтын оношилгоо` (electrical connection diagnostic)
**Reasoning:** "схем" is a Russian loanword for "schematic/diagram". Customers might not parse it immediately. "Холболт" (connection) is plainer. Either works.
**Status:** ⬜

### 2.5 — Гал хамгаалагч (fuse), рэлэ (relay) — `eng-fuse-box`
**Current:** Гал хамгаалагч / рэлэ
**Proposed:** **KEEP both**
**Reasoning:** "Гал хамгаалагч" (fire-guard) is the standard Mongolian calque for fuse. "Рэлэ" is a phonetic Russian loanword for relay, also standard.
**Status:** ⬜

---

## Section 3 — Cooling / Radiator

### 3.1 — Радиатор (radiator) — title for `eng-radiator`, also in `ext-grille`
**Current:** Радиатор
**Proposed:** **KEEP Радиатор**
**Reasoning:** Universally understood loanword. Native `Хөргөгч` ("cooler") is ambiguous (also means "refrigerator") and would confuse customers in an auto-service context.
**Status:** ⬜

### 3.2 — Радиаторын тор (radiator grille) — `ext-grille` title
**Current:** Радиаторын тор
**Proposed:** **KEEP** — alternative `Радиаторын сараалж`
**Reasoning:** "Тор" means "net/mesh" — accurate but generic. `Сараалж` is the more specific automotive term for grille slats. Either is fine.
**Status:** ⬜

### 3.3 — Хөргөлтийн шингэн (coolant) — `eng-radiator` desc
**Current:** Хөргөлтийн шингэн
**Proposed:** **KEEP**
**Reasoning:** Literally "cooling liquid". Standard Mongolian automotive term. No issue.
**Status:** ⬜

### 3.4 — системийн угаалт (system flush) — `eng-radiator` desc
**Current:** системийн угаалт
**Proposed:** `хөргөлтийн системийн угаалт` (cooling system flush)
**Reasoning:** "Систем" alone is generic. Specifying "хөргөлтийн систем" (cooling system) removes ambiguity — readers won't wonder which system.
**Status:** ⬜

---

## Section 4 — Air filter / Intake

### 4.1 — Агаарын шүүлтүүр (air filter) — `eng-air-filter` title
**Current:** Агаарын шүүлтүүр
**Proposed:** **KEEP**
**Reasoning:** Direct, accurate. "Air filter" → "Агаарын шүүлтүүр" is the standard translation.
**Status:** ⬜

### 4.2 — Сорогч хошуу (intake) — `eng-intake` title
**Current:** Сорогч хошуу
**Proposed:** `Агаар сорох хоолой` OR `Хөдөлгүүрийн агаар авагч`
**Reasoning:** "Сорогч хошуу" literally means "sucking snout/nozzle" — colloquial and slightly comical. Cleaner alternatives:
- `Агаар сорох хоолой` ("air-intake pipe") — closer to "intake manifold"
- `Хөдөлгүүрийн агаар авагч` ("engine air intake") — more formal

For an LC300 V35A-FTS twin-turbo, the intake is technically the manifold + air filter housing. The first option is more accurate.
**Status:** ⬜

### 4.3 — агаар сорох замын шалгалт (intake path inspection) — `eng-intake` desc
**Current:** агаар сорох замын шалгалт
**Proposed:** `агаар орох замын шалгалт` OR keep as-is
**Reasoning:** "Сорох" (sucking) repeats the colloquial tone from 4.2. "Орох" (entering) is more neutral. If 4.2 changes, this should match.
**Status:** ⬜

---

## Section 5 — Transfer case

### 5.1 — Хөтлөгчийн хайрцаг (transfer case) — `und-transfer` title
**Current:** Хөтлөгчийн хайрцаг
**Proposed:** `Хүчний дамжуулагч` OR `Раздаткаа`
**Reasoning:** "Хөтлөгчийн хайрцаг" literally means "driver's box" — vague (could be misread as differential or transmission). Alternatives:
- **`Хүчний дамжуулагч`** ("power transmitter") — accurate, native Mongolian, descriptive
- **`Раздаткаа`** — Russian colloquial widely used in MN garages; immediately recognised by any mechanic but informal

For a customer-facing service site, `Хүчний дамжуулагч` is the cleanest option.
**Status:** ⬜

### 5.2 — Дөрвөн дугуйн хөтлөгчийн систем (4WD system) — `und-transfer` desc
**Current:** Дөрвөн дугуйн хөтлөгчийн систем
**Proposed:** `Бүх дугуйт хөтлөгчийн систем` OR `4WD систем`
**Reasoning:** "Дөрвөн дугуйн хөтлөгч" (four-wheel-driver) is accurate but reads as "driver of four wheels". `Бүх дугуйт` (all-wheel) is closer to AWD terminology; or use the bilingual shorthand `4WD систем` which most LC300 customers will recognise.
**Status:** ⬜

### 5.3 — шүдлэг засвар (gear repair) — `und-transfer` desc
**Current:** шүдлэг засвар
**Proposed:** `арааны засвар` (gear repair, using `араа` = gear)
**Reasoning:** "Шүдлэг" literally means "toothed" — accurate but archaic. `Араа` is the standard modern Mongolian word for gear. Common in shop talk.
**Status:** ⬜

---

## Section 6 — Differentials

### 6.1 — Урд / Арын диференциал (front/rear differential) — `und-diff-f`, `und-diff-r` titles
**Current:** Урд диференциал / Арын диференциал
**Proposed:** **KEEP Диференциал**
**Reasoning:** Direct loanword from English/Russian. The native calque `Ялгавартай хайрцаг` ("differential box") is bookish and rarely used in service shops. "Диференциал" is universally understood.
**Status:** ⬜

### 6.2 — шүдлэг хүрд шалгалт (gear wheel inspection) — `und-diff-f`, `und-diff-r` desc
**Current:** шүдлэг хүрд шалгалт
**Proposed:** `араа шалгалт` (gear inspection)
**Reasoning:** Same as 5.3 — "шүдлэг хүрд" (toothed wheel) is archaic for `араа` (gear). Cleaner short form.
**Status:** ⬜

---

## Section 7 — Suspension / Shock absorbers

### 7.1 — Түдгэлзүүр (suspension) — used in 4 underneath titles, 2 exterior descs
**Current:** Түдгэлзүүр
**Proposed:** **KEEP**
**Reasoning:** Native Mongolian, standard automotive usage. No issue.
**Status:** ⬜

### 7.2 — Амортизатор (shock absorber) — used in multiple descs
**Current:** Амортизатор
**Proposed:** **KEEP Амортизатор**
**Reasoning:** Russian loanword, universally used. Native `Цохилт сааруулагч` ("shock reducer") is correct but pedantic.
**Status:** ⬜

### 7.3 — Давхар хөшүүргэт түдгэлзүүр (double-wishbone suspension) — front susp descs
**Current:** Давхар хөшүүргэт түдгэлзүүр
**Proposed:** **KEEP**
**Reasoning:** Accurate calque of "double-wishbone suspension" (literally "double-lever suspension"). Standard usage.
**Status:** ⬜

### 7.4 — Хатуу тэнхлэгт түдгэлзүүр (solid-axle suspension) — rear susp descs
**Current:** Хатуу тэнхлэгт түдгэлзүүр
**Proposed:** **KEEP**
**Reasoning:** Accurate calque of "rigid-axle suspension" / "solid-axle". Standard usage.
**Status:** ⬜

### 7.5 — Бөмбөлгөн холбоос (ball joint) — front susp descs
**Current:** Бөмбөлгөн холбоос
**Proposed:** **KEEP**
**Reasoning:** Direct calque of "ball joint" (literally "ball-shaped linkage"). Standard.
**Status:** ⬜

### 7.6 — 4 цэгийн холбоос (4-link) — rear susp descs
**Current:** 4 цэгийн холбоос
**Proposed:** **KEEP**
**Reasoning:** Direct calque of "4-link suspension". Clear.
**Status:** ⬜

### 7.7 — амортизаторын засвар vs амортизаторын шалгалт
**Current:** Mixed: `амортизаторын шалгалт` in rear wheel descs, `амортизаторын засвар` in rear susp descs
**Proposed:** **KEEP both** — they refer to different services
**Reasoning:** Шалгалт = inspection, Засвар = repair. Both are legitimate services. Not a fix — flagging the variation is intentional.
**Status:** ⬜

---

## Section 8 — Lighting / Headlights

### 8.1 — Гэрэлтүүлэг (headlights) — `ext-headlight-l`, `ext-headlight-r` titles
**Current:** Гэрэлтүүлэг
**Proposed:** **KEEP** — or `Урд гэрэл`
**Reasoning:** "Гэрэлтүүлэг" literally means "illumination/lighting" — slightly generic. `Урд гэрэл` ("front lights") is more specific. The current is acceptable; the alternative is more precise.
**Status:** ⬜

### 8.2 — бамбай тохируулга — in headlight descs
**Current:** бамбай тохируулга
**Proposed:** `Гэрлийн өнцөг тохируулга` (headlight angle adjustment) OR `гэрлийн чиглэл тохируулга` (headlight direction adjustment)
**Reasoning:** "Бамбай" literally means "shield" — in some contexts it refers to a headlight cover/housing, but as a service action ("бамбай тохируулга" = "shield adjustment") it is ambiguous. Most likely the intended service is *headlight aim/beam adjustment* (after a bulb change or accident repair). Recommend explicit phrasing.
**Status:** ⬜

### 8.3 — шилний солилт (glass replacement) — in headlight & mirror & windshield descs
**Current:** шилний солилт
**Proposed:** **KEEP** — context-dependent meaning is fine
**Reasoning:** "Шил" = glass, "шилний солилт" = glass replacement. The specific glass (headlight lens vs mirror glass vs windshield) is disambiguated by the hotspot's title. No change needed.
**Status:** ⬜

### 8.4 — Урд LED гэрэл, бамбай, шилний солилт — `eng-app-front` desc
**Current:** Урд LED гэрэл, бамбай, шилний солилт
**Proposed:** Same fix as 8.2 — replace `бамбай` with `гэрлийн өнцөг`
**Reasoning:** Same ambiguity as above.
**Status:** ⬜

---

## Section 9 — Wheels & Tires

### 9.1 — Урд / Арын зүүн / баруун дугуй (FL/FR/RL/RR wheel) — 4 wheel titles
**Current:** Урд зүүн дугуй / Урд баруун дугуй / Арын зүүн дугуй / Арын баруун дугуй
**Proposed:** **KEEP all four**
**Reasoning:** Clear positional naming. No issue.
**Status:** ⬜

### 9.2 — Дугуй (wheel) — title meaning
**Current:** Дугуй
**Proposed:** **KEEP** — also accept `Дугуй (дугуйн арал)` if extra specificity is wanted
**Reasoning:** "Дугуй" in Mongolian means both "wheel" and "tire" depending on context. Customers will understand both meanings from the hotspot location.
**Status:** ⬜

### 9.3 — Дугуй солилт (tire replacement) — rear wheel descs
**Current:** Дугуй солилт
**Proposed:** `Дугуй сольж тавих` OR keep as-is
**Reasoning:** "Солилт" is fine as a noun for "replacement". The alternative `сольж тавих` ("change-and-install") is more verb-like but no clearer.
**Status:** ⬜

### 9.4 — Балансжуулалт (balancing) — wheel descs
**Current:** Балансжуулалт
**Proposed:** **KEEP**
**Reasoning:** Modern loanword from "balance"; standard automotive term in Mongolia.
**Status:** ⬜

### 9.5 — Тэнхлэгийн тохируулга (axle alignment) — wheel descs
**Current:** Тэнхлэгийн тохируулга
**Proposed:** `Дугуйны өнцгийн тохируулга` (wheel angle alignment) OR `Геометрийн тохируулга` (geometry alignment)
**Reasoning:** "Тэнхлэгийн тохируулга" literally means "axle alignment" — but the actual service is *wheel alignment* (toe-in, camber, caster), not axle adjustment. Either:
- `Дугуйны өнцгийн тохируулга` — explicit "wheel angle adjustment"
- `Геометрийн тохируулга` — technical Russian-derived term used in shops ("geometry adjustment")
**Status:** ⬜

---

## Section 10 — Mirrors & Glass

### 10.1 — Хажуугийн толь (side mirror) — `ext-mirror-l/r` titles
**Current:** Хажуугийн толь
**Proposed:** **KEEP**
**Reasoning:** Standard. "Side mirror" — clear.
**Status:** ⬜

### 10.2 — толины шилний солилт (mirror glass replacement) — `ext-mirror` descs
**Current:** толины шилний солилт
**Proposed:** `Толин шил солих` OR `Толины шил солих`
**Reasoning:** "Толины шилний солилт" stacks three genitives ("mirror's glass's replacement"). Cleaner as a verb phrase: "Толин шил солих" / "Толины шил солих" (replace mirror glass).
**Status:** ⬜

### 10.3 — Цахилгаан тохируулга (electric adjustment) — `ext-mirror` descs
**Current:** Цахилгаан тохируулга
**Proposed:** **KEEP** — or `Цахилгаан тохируулгын засвар` for full clarity
**Reasoning:** "Цахилгаан тохируулга" works as a noun phrase ("electric adjustment"). Adding "засвар" (repair) at the end is more specific to the service being offered.
**Status:** ⬜

### 10.4 — халаалт (heating) — `ext-mirror` desc
**Current:** халаалт
**Proposed:** `халаалтын систем` (heating system) — minor specificity
**Reasoning:** "Халаалт" alone reads slightly bare for a service line. "Халаалтын систем" specifies it's the heated-mirror function.
**Status:** ⬜

### 10.5 — Урд салхины шил (windshield) — `ext-windshield` title
**Current:** Урд салхины шил
**Proposed:** **KEEP**
**Reasoning:** Standard MN automotive term, calque of "front wind glass" = windshield. Universally understood.
**Status:** ⬜

### 10.6 — Шил арчигч (windshield wiper) — `ext-windshield` desc
**Current:** Шил арчигч
**Proposed:** **KEEP**
**Reasoning:** "Glass wiper" — standard term.
**Status:** ⬜

### 10.7 — хагарал засвар (crack repair) — `ext-windshield` desc
**Current:** хагарал засвар
**Proposed:** **KEEP**
**Reasoning:** "Crack repair" — accurate.
**Status:** ⬜

---

## Section 11 — Exhaust system

### 11.1 — Яндангийн систем (exhaust system) — `und-exhaust` title
**Current:** Яндангийн систем
**Proposed:** **KEEP**
**Reasoning:** "Янданг" = exhaust pipe; "Яндангийн систем" = exhaust system. Standard.
**Status:** ⬜

### 11.2 — Каталитик хувиргагч (catalytic converter) — `und-exhaust` desc
**Current:** Каталитик хувиргагч
**Proposed:** **KEEP**
**Reasoning:** Hybrid term: "Каталитик" (loanword) + "хувиргагч" (transformer). Standard. Alternative: just `Катализатор` (Russian loanword) — also accepted.
**Status:** ⬜

### 11.3 — Дуу намсгагч (muffler) — `und-exhaust` desc
**Current:** Дуу намсгагч
**Proposed:** **KEEP**
**Reasoning:** "Sound reducer" — accurate calque of "muffler". Standard.
**Status:** ⬜

---

## Section 12 — Fuel system

### 12.1 — Түлшний сав (fuel tank) — `und-fuel-tank` title
**Current:** Түлшний сав
**Proposed:** **KEEP**
**Reasoning:** Standard. "Fuel container/tank".
**Status:** ⬜

### 12.2 — Түлшний сав цэвэрлэгээ — `und-fuel-tank` desc
**Current:** Түлшний сав цэвэрлэгээ
**Proposed:** `Түлшний савны цэвэрлэгээ` (proper genitive)
**Reasoning:** Missing genitive marker. "Түлшний сав цэвэрлэгээ" should be "Түлшний савны цэвэрлэгээ" (cleaning of the fuel tank).
**Status:** ⬜

### 12.3 — насос (pump) — `und-fuel-tank` desc
**Current:** насос
**Proposed:** **KEEP**
**Reasoning:** Russian loanword for "pump", universally used. Native `шахуурга` exists but is rare in auto context.
**Status:** ⬜

### 12.4 — шугам шалгалт (line/hose inspection) — `und-fuel-tank` desc
**Current:** шугам шалгалт
**Proposed:** **KEEP** — or `шугамын шалгалт` (proper genitive)
**Reasoning:** Same minor genitive issue as 12.2. "Шугамын шалгалт" is grammatically more correct.
**Status:** ⬜

---

## Section 13 — Engine block

### 13.1 — V35A-FTS хөдөлгүүр (engine model) — `eng-block` title
**Current:** V35A-FTS хөдөлгүүр
**Proposed:** **KEEP**
**Reasoning:** Includes the Toyota engine code (V35A-FTS = 3.5L V6 twin-turbo) + хөдөлгүүр (engine). Specific and accurate.
**Status:** ⬜

### 13.2 — цилиндрийн засвар (cylinder repair) — `eng-block` desc
**Current:** цилиндрийн засвар
**Proposed:** **KEEP**
**Reasoning:** Standard. "Цилиндр" is the universal Mongolian/Russian word for engine cylinder.
**Status:** ⬜

### 13.3 — их засвар (major repair / overhaul) — `eng-block` desc
**Current:** их засвар
**Proposed:** **KEEP**
**Reasoning:** "Big repair" — idiomatic Mongolian for engine overhaul / major work. Standard in shop talk.
**Status:** ⬜

---

## Section 14 — UI text (not in hotspots.ts)

### 14.1 — STAGE_LABELS in `data/types.ts`
**Current:**
- `exterior` → `Гадна тал` ("outside")
- `engine_approach` → `Капот руу` ("toward the capot")
- `engine_bay` → `Хөдөлгүүр` ("engine")
- `underneath` → `Доод тал` ("underside")

**Proposed:** **KEEP all four**
**Reasoning:** Short, clear, fit the button width. "Капот руу" is slightly informal but readable; alternative `Капот хаалттай` ("capot closed") is more descriptive but longer.
**Status:** ⬜

### 14.2 — Машины үзэх булан (tablist aria-label in `StageButtons.tsx`)
**Current:** Машины үзэх булан
**Proposed:** `Машины үзэх хэсэг` OR `Машины өнцөг`
**Reasoning:** "Булан" = corner. "Хэсэг" (section) or "өнцөг" (angle/view) reads more naturally as "view section" / "view angle" for a UI tablist.
**Status:** ⬜

### 14.3 — `<hotspot title> - үйлчилгээний мэдээлэл` (aria-label in `HotspotOverlay.tsx`)
**Current:** `<title> - үйлчилгээний мэдээлэл`
**Proposed:** **KEEP**
**Reasoning:** "Service information" suffix is correct and natural. Screen reader reads as e.g. "V35A-FTS хөдөлгүүр - үйлчилгээний мэдээлэл".
**Status:** ⬜

### 14.4 — Цаг захиалах (book appointment, in `HotspotModal.tsx`)
**Current:** Цаг захиалах · +976 77-200-570
**Proposed:** **KEEP**
**Reasoning:** "Book a time/appointment" — standard MN phrasing for service appointments.
**Status:** ⬜

### 14.5 — Хаах (close button, in `HotspotModal.tsx`)
**Current:** Хаах
**Proposed:** **KEEP**
**Reasoning:** Standard "close" verb. Clear.
**Status:** ⬜

---

## Section 15 — Cross-cutting style polish

### 15.1 — Description punctuation
**Current:** Descriptions end with `.`
**Proposed:** **KEEP**
**Reasoning:** Consistent throughout. No change needed.
**Status:** ⬜

### 15.2 — Genitive marker consistency
**Observation:** Several descriptions are inconsistent about adding the genitive marker `-ын/-ийн/-ний` before nouns (e.g., `шугам шалгалт` vs `шугамын шалгалт`).
**Proposed:** Apply genitive markers consistently across descriptions.
**Affected rows (already flagged above):** 3.4, 5.2, 12.2, 12.4
**Status:** ⬜ (umbrella checkbox — covers the individual fixes above)

### 15.3 — "ба" connector
**Observation:** Hotspot titles use `ба` ("and") in two places: `Капот ба хөдөлгүүрийн булан`, `Капот ба түүний механизм`. Both are flagged individually (1.2, 1.3).
**Status:** ⬜ (umbrella checkbox)

---

## Section 16 — Anything I missed?

Below this line, please add any term I didn't catch or any rephrasing you want done. Format:

```
### 16.N — <description>
**Current:** ...
**Wanted:** ...
**Reasoning:** ...
```

### 16.1 — (your additions here)



---

## Summary of recommended changes (if all proposals ✓)

| # | Type | Change |
|---|---|---|
| 1.3 | Title | `Капот ба түүний механизм` → `Капотын механизм` |
| 1.5 | Desc | "Капотын механизмын засвар, амортизатор, түгжээ" → "Капотын механизм, амортизатор, түгжээний засвар" |
| 1.6 | Desc | "Капот доторх булан рүү шилжих" → "Капотын дотор харах" |
| 2.2 | Desc | `Батарей солилт` → `Аккумулятор солилт` |
| 2.3 | Desc | `цахилгааны оношилгоо` → `цахилгаан системийн оношилгоо` |
| 3.4 | Desc | `системийн угаалт` → `хөргөлтийн системийн угаалт` |
| 4.2 | Title | `Сорогч хошуу` → `Агаар сорох хоолой` |
| 4.3 | Desc | `агаар сорох замын шалгалт` → `агаар орох замын шалгалт` |
| 5.1 | Title | `Хөтлөгчийн хайрцаг` → `Хүчний дамжуулагч` |
| 5.2 | Desc | `Дөрвөн дугуйн хөтлөгчийн систем` → `Бүх дугуйт хөтлөгчийн систем` |
| 5.3 | Desc | `шүдлэг засвар` → `арааны засвар` |
| 6.2 | Desc | `шүдлэг хүрд шалгалт` → `араа шалгалт` |
| 8.2 / 8.4 | Desc | `бамбай тохируулга` → `Гэрлийн өнцөг тохируулга` |
| 9.5 | Desc | `Тэнхлэгийн тохируулга` → `Дугуйны өнцгийн тохируулга` |
| 10.2 | Desc | `толины шилний солилт` → `толин шил солих` |
| 10.4 | Desc | `халаалт` → `халаалтын систем` |
| 12.2 | Desc | `Түлшний сав цэвэрлэгээ` → `Түлшний савны цэвэрлэгээ` |
| 12.4 | Desc | `шугам шалгалт` → `шугамын шалгалт` |
| 14.2 | UI | `Машины үзэх булан` → `Машины үзэх хэсэг` |

Items recommended to **KEEP** (no change): 1.1 (Капот), 2.1 (Аккумулятор), 3.1 (Радиатор), 3.2 (Радиаторын тор), 3.3 (Хөргөлтийн шингэн), 4.1 (Агаарын шүүлтүүр), 6.1 (Диференциал), 7.1 (Түдгэлзүүр), 7.2 (Амортизатор), 7.3 (Давхар хөшүүргэт), 7.4 (Хатуу тэнхлэгт), 7.5 (Бөмбөлгөн холбоос), 7.6 (4 цэгийн холбоос), 7.7 (засвар/шалгалт mix), 8.1 (Гэрэлтүүлэг), 8.3 (шилний солилт), 9.1 (wheel L/R), 9.2 (Дугуй), 9.3 (Дугуй солилт), 9.4 (Балансжуулалт), 10.1 (Хажуугийн толь), 10.3 (Цахилгаан тохируулга), 10.5 (Урд салхины шил), 10.6 (Шил арчигч), 10.7 (хагарал засвар), 11.1 (Яндангийн систем), 11.2 (Каталитик хувиргагч), 11.3 (Дуу намсгагч), 12.1 (Түлшний сав), 12.3 (насос), 13.1 (V35A-FTS хөдөлгүүр), 13.2 (цилиндрийн засвар), 13.3 (их засвар), 14.1 (STAGE_LABELS), 14.3 (aria suffix), 14.4 (Цаг захиалах), 14.5 (Хаах).

Mark each section ⬜ → ✓ / ✗ / ✎. When done, save and tell me to run Task 5.2.
