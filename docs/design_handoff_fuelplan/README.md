# Handoff: FuelPlan — planer żywienia na rowerze

**Wrzut #2 · 2026-07-28.** Jeśli budowałeś już cokolwiek na podstawie wrzutu #1, przeczytaj najpierw „Zmiany od wrzutu #1" na końcu tego pliku — reszta dokumentu jest przepisana pod stan aktualny.

## Overview
FuelPlan to planer nawodnienia i węglowodanów na długą jazdę. Użytkownik podaje trasę (dystans + tempo lub czas), warunki (waga, intensywność, temperatura), konfiguruje pojemniki (bidony, flask, bukłak) i rozkłada na osi trasy **napełnienia** (co i na jakim odcinku pije) oraz **jedzenie/dodatki**. Aplikacja na żywo liczy krzywą podaży vs. zapotrzebowania (g/h), pokrycie zapotrzebowania, nawodnienie oraz gramaturę mieszanki do odmierzenia na każde napełnienie.

Baza funkcjonalna: `calculator.html` z repo `dzieciol-kamil/carb-planner` (kalkulator izotoniku 2:1). FuelPlan to jego redesign i rozszerzenie.

## About the Design Files
Pliki w tym pakiecie to **referencja projektowa napisana w HTML** — prototyp pokazujący docelowy wygląd i zachowanie, a nie kod produkcyjny do skopiowania. Zadaniem jest **odtworzyć te ekrany w docelowym środowisku** (React/Next, Vue, SwiftUI, natywne — cokolwiek jest w repo), używając jego wzorców, routingu, stanu i biblioteki komponentów. Jeśli repo nie ma jeszcze frontendu, wybierz stack sam — rekomendacja niżej.

`FuelPlan.dc.html` jest napisany w wewnętrznym formacie prototypowym (`<x-dc>` + klasa `Component`, style inline). **Logika obliczeniowa w klasie `Component` jest czysta i przenośna** — to najcenniejsza część pliku i można ją przepisać 1:1 do modułu domenowego. Warstwa widoku — nie.

## Fidelity
**High-fidelity.** Kolory, typografia, odstępy, stany hover, zachowanie drag&drop i wszystkie liczby są docelowe. Odtwarzaj pixel-perfect.

## Rekomendowany stack (jeśli repo jest puste)
- Vite + React + TypeScript, deploy na GitHub Pages (tak jak dotychczasowy `calculator.html`).
- Stan lokalny w jednym store (Zustand albo `useReducer`) — kształt stanu poniżej odwzorowuje go 1:1.
- Persystencja w `localStorage` (ustawienia + ostatni plan). Brak backendu.
- Wykresy rysowane ręcznie w SVG (jak w prototypie) — nie wprowadzaj biblioteki wykresów, krzywe są nietypowe (pasma nachylenia, kolorowane odcinki wg aktywnego źródła, warstwa „w żołądku").
- Drag&drop na `pointer` events, bez biblioteki.

## Design Tokens

**Kolory**
| token | hex | użycie |
| --- | --- | --- |
| ink | `#16191C` | tekst główny, ciemne karty, outline hover |
| bg | `#EFF0EC` | tło strony |
| surface | `#FFFFFF` | karty |
| border | `#E3E5E0` | ramka kart |
| border-soft | `#EDEFEA` / `#F0F1ED` / `#F2F3EF` | ramki wewnętrzne, separatory |
| chip-border | `#DDE0DA` | ramka przycisków/chipów |
| muted | `#7A817C` | tekst pomocniczy mono |
| muted-2 | `#6E7573` | podtytuły |
| muted-3 | `#9AA09B` | podpowiedzi, najsłabszy tekst |
| ink-soft | `#3D423E` / `#4B514D` / `#5C635E` | wartości, etykiety |
| track | `#F1F2EE` / `#F4F5F1` / `#F2F5EF` | tła torów, segmented control, wiersz hover |
| carb (izo) | `#5AA33F` | węglowodany / izotonik |
| gel | `#C9922E` | żel |
| food | `#B4552F` | jedzenie / dodatki |
| water | `#3D8FBF` | woda, pasma zjazdów |
| climb | `#D2703F` | pasma podjazdów (opacity 0.075) |

**Typografia**
- Nagłówki i UI: `Archivo` (400/500/600/700), fallback Helvetica, sans-serif.
- Liczby, zakresy, osie, etykiety pasków: `JetBrains Mono` (400/500/700).
- Skala: 28px/700 (duże liczby w kartach), 13px/700 + `letter-spacing:0.1em` + uppercase (tytuły sekcji), 12px/700 + `0.08–0.09em` uppercase (tytuły w widoku mobilnym), 12–13px/600 (etykiety), 12px (tekst), 11px (pomocniczy), 10px/700 mono (etykiety na paskach), 9–10px (mobile).
- `-webkit-font-smoothing: antialiased`, `body { margin:0 }`.

**Promienie / cienie / odstępy**
- Radius: 16 (karty), 12 (karty wewnętrzne), 9 (przyciski), 7 (segmented), 6 (tory, chipy), 4 (paski na osi).
- Cień tylko przy przeciąganiu: `0 3px 10px rgba(0,0,0,0.25)`.
- Padding kart: `20px 24px` desktop, `14–16px` mobile. Gap siatek: 14–24px.
- Wysokość toru: 24px desktop, 15px mobile.

## Deploy: GitHub Pages (wymóg twardy)
Aplikacja hostowana jest na GitHub Pages z repo `dzieciol-kamil/carb-planner` — czyli **statyczny build, bez backendu i bez SSR**.
- `vite.config.ts`: `base: '/carb-planner/'` (albo `base: process.env.GITHUB_ACTIONS ? '/carb-planner/' : '/'`). Bez tego assety 404-ują na Pages.
- Wszystkie ścieżki do assetów przez `import`/`new URL(..., import.meta.url)` — nigdy ścieżki absolutne od `/`.
- Router: jeśli w ogóle potrzebny, `HashRouter` — Pages nie obsługuje fallbacku na `index.html` dla ścieżek.
- Build i publikacja przez GitHub Actions (`actions/upload-pages-artifact` + `actions/deploy-pages`) na push do `master`, output `dist/`. Dodaj `.nojekyll`.
- Zero zmiennych środowiskowych z sekretami — cały stan użytkownika w `localStorage`.
- Fonty: Google Fonts z CDN (jak w prototypie) albo lokalnie w `src/assets/fonts` — bez zależności od proxy.

## Kształt stanu (przenieś 1:1)

```ts
{
  lang: 'pl' | 'en',
  viewMode: 'auto' | 'desktop' | 'mobile', autoView: 'desktop' | 'mobile',
  tab: 'plan', panel: null | <id panelu ustawień>,
  mode: 'route' | 'time',            // dystans+tempo vs. czas trwania
  xUnit: 'km' | 'h',                 // jednostka osi X
  yMode: 'rate' | ...,               // tryb krzywej (g/h vs. płyny)
  distance: 200, speed: 27, hours: 7, minutes: 30,
  weight: 78, intensity: 'low'|'mid'|'high', temp: 24,
  useGpx: true, gpxTrack: null, gpxName: null, gpxError: null,
  // mieszanka (na 100 ml)
  conc: 11, gelConc: 60, ratio: 2, salt: 0.16, citric: 0.2, gelSalt: 0.4, gelCitric: 0.5,
  gear:  [{ gid, name, vol /*ml*/, allowed: ('water'|'izo'|'gel')[], gelParts }],
  fills: [{ fid, gid, content: 'water'|'izo'|'gel', from, to, pos?: number[] /*ręczne pozycje porcji żelu*/ }],
  foods: [{ id, key, name, carbs, ml?, cont?: boolean, from, to }],
  foodLib: FOODS[], // edytowalna biblioteka produktów
  selKey, hoverKey, dragKey, timelineOpen
}
```

Domyślna biblioteka produktów (`carbs` w g, `ml` opcjonalne, `cont:true` = spożywane ciągle):
żel 22 · banan 25 · żelki 30 (cont, span 18 km) · baton 28 · lody 30/120 ml · ciasto 45 · piwo zero 20/500 ml · cola 35/330 ml.

## Model obliczeniowy (przepisz dokładnie)

- `totalHours()` — tryb `route`: `distance / speed`; tryb `time`: `hours + minutes/60`.
- `dist()` — `route`: `max(1, distance)`; `time`: `round(totalHours*10)` (wirtualne „km" osi).
- `cph()` — docelowe g/h wg czasu i intensywności: <1 h → 30/45/60; ≤2,5 h → 30/45/60; >2,5 h → 60/75/90 (low/mid/high).
- `sweat()` — ml/h: `((380 + max(0, temp-15)*42 + {low:0, mid:110, high:220}) * waga/75)`, zaokrąglone do 10.
- `absCap()` — limit wchłaniania g/h z proporcji malto:fruktoza `r`: `glu=r/(r+1)`, `fru=1/(r+1)`, `clamp(45..95, min(60/glu, 32/fru))` (SGLT1 ~60 g/h + GLUT5 ~32 g/h).
- Profil trasy `prof()` — 160 próbek; z GPX (interpolacja `ele`) albo syntetyczny profil demo. Dla każdej próbki liczony `grad` (%) i `effort = clamp(0.32..2.3, 1 + grad * (grad>0 ? 0.19 : 0.11))`; `cum` = skumulowany wysiłek. **Zapotrzebowanie rozkłada się wg `cum`, nie wg dystansu** — na podjazdach rośnie szybciej.
- `carbsFill(f)` — woda 0; inaczej `vol/100 * (gel ? gelConc : conc)`.
- `fracFill / fracFood` — jaka część pozycji jest już spożyta na kilometrze `x`; dla żelu podzielonego na `gelParts` — skokowo, na pozycjach porcji (`partPos`, przesuwalnych osobno).
- `samples()` — 160 próbek: `intake`, `gut` (w żołądku), `absorbed` (opróżnianie żołądka limitowane `absCap`), `ml`, `need`; potem wygładzone (~30 min) `rate`, `needRate`, `fluidRate`, `sweatRate`.
- `rateStats()` — pokrycie liczone uczciwie: `Σ min(rate, needRate)·dt / Σ needRate·dt`; dodatkowo najdłuższy „suchy" odcinek (rate < 40% zapotrzebowania) z jego kilometrem.
- `FCAP = 750` ml/h — stały pułap opróżniania żołądka (przerywana linia w trybie płynów). Literatura daje 600–1000 ml/h w wysiłku (skrajnie ~1300); wartość jest **wpisana na sztywno**, nie skalowana wagą, intensywnością ani osmolalnością napoju — patrz „Otwarte kwestie". Praktyczna konsekwencja do pokazania użytkownikowi: przy pocie powyżej 750 ml/h deficytu nie da się wyzerować, tylko ograniczyć.

## Ekrany / widoki

Jeden ekran w dwóch layoutach; przełącznik `viewMode` (Auto/Desktop/Mobile). Auto: `mobile` gdy `innerWidth < 860` lub (touch i `< 1100`).

### A. Desktop
Kolumna kart na tle `#EFF0EC`, każda karta biała, radius 16, ramka `#E3E5E0`.

1. **Nagłówek** — nazwa, przełącznik języka PL/EN, przełącznik widoku.
2. **Panel trasy** — dystans / tempo (albo czas), waga, intensywność, temperatura, profil GPX (Wł./Wyłącz, „Wczytaj" pliku, komunikat błędu `gpxBad`). *Uwaga: `durationLabel` (czas trwania) został z tego panelu usunięty i obecnie pojawia się tylko w widoku mobilnym — patrz „Otwarte kwestie".*
3. **Karty podsumowania** — cel (g), pokrycie zapotrzebowania (%), nawodnienie (utrata / plan / %), kcal, licznik dolewek.
4. **Krzywa** — SVG na całą szerokość: profil wysokości w tle (pasma podjazd `#D2703F` / zjazd `#3D8FBF`, opacity 0.075), obszar podaży (gradient z `carb`, w trybie płynów z `water`), warstwa „w żołądku", linia zapotrzebowania (przerywana `#A8AEA9`, `6 5`), linia limitu wchłaniania, linia podaży kolorowana kolorem aktualnie aktywnego źródła. Trzy tryby osi Y: `sum` (gramy narastająco), `rate` (g/h), `fluid` (ml/h); osobno przełącznik osi X km↔h.

   **Linia limitu wchłaniania** (`strokeDasharray:'3 5'`, opacity 0.8) — pozioma, rysowana tylko w trybach `rate` i `fluid`:
   - `rate` → na wysokości `absCap()` (g/h), kolor `carb` `#5AA33F`; `maxY` musi obejmować `absCap()*1.05`, żeby linia nie wypadła za górną krawędź przy chudym planie.
   - `fluid` → na 750 ml/h (stała `FCAP`, limit opróżniania żołądka), kolor `water` `#3D8FBF`.
   - `sum` → brak linii (oś to gramy narastająco, limit g/h nie ma tam sensu) i brak wpisu w legendzie.

   **Legenda** (prawy górny róg karty, 12px `#6E7573`): podaż (pełna kreska 14×3, radius 2) · „Zjedzone" (kropkowana, tylko w `sum` gdy zaległość >5 g) · zapotrzebowanie/pot (kreskowana szara) · **„Limit wchłaniania" / „Absorption limit"** (kropkowana 2px w kolorze linii limitu, tylko `rate` i `fluid`) · „W żołądku" (kostka `#DCC98A`, poza trybem płynów). Etykieta legendy jest bez wartości liczbowej — liczba stoi w nocie obok wykresu.

   **Nota obok wykresu** (lewa kolumna, 168px, 11px `#8A918C`) — dwa akapity zależne od trybu:
   - `sum` → `curveHintSum` (gramy narastająco) + `capNote` (wyliczony `absCap()` g/h + wyjaśnienie SGLT1/GLUT5).
   - `rate` → `curveHint` (tempo g/h) + `capNote`.
   - `fluid` → **tylko** `capNoteFluid` (750 ml/h, co znaczy przekroczenie linii); noty węglowodanowej nie ma.
5. **Tory pod wykresem** — jeden tor na każdy skonfigurowany pojemnik + tor „Jedzenie / dodatki". W torze pojemnika paski **nie nachodzą na siebie** (przeciągany pasek skraca się do wolnej luki), w torze jedzenia mogą. Po lewej etykieta pojemnika (nazwa, `ml · dozwolona zawartość`), po prawej przycisk `+` (dolewka w pierwszej wolnej luce; nieaktywny → `noRoom`).
6. **Lista produktów do dodania** — chipy z kropką w kolorze `food` i gramaturą.
7. **ROZKŁAD** (collapsible) — lista wszystkich pozycji z zakresem, składem i licznikiem, hover zsynchronizowany z wykresem.
8. **SKŁAD POJEMNIKÓW** — karta na każdy pojemnik, w środku wiersz na każde napełnienie: cukry, malto, fruktoza, sól, kwasek w gramach. W nagłówku przycisk „ustawienia mieszanki" (otwiera panel `mix`).

9. **Stopka** (desktop, poza kartami, na tle strony) — `border-top:1px solid #DFE2DB`, `padding:22px 18px 0`, siatka `3fr 2fr` z gapem 64px:
   - lewa kolumna: wordmark `FUELPLAN` (14px/700) + `ftVersion` (10px mono, uppercase, letter-spacing 0.12em, `#9AA09B`), `ftAboutBody` (12px/1.6 `#6E7573`), `ftSources1` + `ftSources2` (11px `#9AA09B`), `ftPrivacy` (10px mono);
   - prawa kolumna: `ftLinks` jako nagłówek (10px mono/700, uppercase, 0.14em, `#7A817C`) → link `ftIssues` z kropką `#5AA33F` 8px do `/issues/new` i link do repo z logo GitHuba (16px SVG, `currentColor`); pod nimi `ftLegal` + `ftLegalBody` (11.5px/1.65 `#7A817C`);
   - pasek dolny: `border-top:1px solid #E6E8E2`, `padding-top:14px`, `ftCopyright` (10px mono `#9AA09B`).
   Wszystkie linki `target="_blank" rel="noopener"`. Górny padding strony to `14px 24px 40px` (był 26/60 — stopka domyka stronę wizualnie, nagłówek stoi wyżej).

### B. Mobile
Ten sam model danych, układ pionowy: ciemna karta `#16191C` z czasem trwania i celem (28px mono), kompaktowa krzywa, tory o wysokości 15px, edycja pozycji przez **tap → wiersz edycji** (chipy zawartości + „Usuń") zamiast hovera, uchwyty przeciągania szersze (18px).

## Interakcje

- **Przeciąganie paska** (`pointerdown` na pasku, `pointermove`/`pointerup` na `window`): przelicz `clientX` na km przez szerokość toru; pasek zatrzymuje się na sąsiedzie, w ciasnej luce skraca się. `dragKey` podnosi opacity do 1 i dodaje cień.
- **Uchwyty krawędzi** — lewy/prawy, szerokość 11–12px, `cursor: ew-resize`, wychodzą 5–6px poza pasek; ukryte dla pozycji jednorazowych (punktowych).
- **Porcje żelu** — pionowe kreski w pasku żelu, każda przesuwana osobno, z minimalnym odstępem `0.4%` dystansu; własne pozycje trafiają do `fill.pos[]`.
- **Hover** — `hoverKey` podświetla równocześnie pasek (outline 2px `ink`), odpowiadający element na wykresie (opacity 0.34 → 1) i wiersz w rozkładzie (tło `#F2F5EF`).
- **Popover nad paskiem** — pojawia się na hover, `bottom:100%` z `paddingBottom:7` (padding utrzymuje ciągłość hovera — nie rób z tego marginesu!). Kotwiczenie: paski ciągłe — `left` przy `from`, a powyżej 62% dystansu `right` przy `to`; pozycje **jednorazowe** zawsze `left` przy `from`, a powyżej 80% dystansu `right: 0`, żeby popover nie uciekł obok elementu i dało się w niego trafić kursorem.
- **Chipy w popoverze** — dla napełnień: dozwolone zawartości pojemnika (tylko gdy >1). Dla jedzenia: `Jednorazowo` / `Ciągle` (przełączenie na „Ciągle" ustawia `to = min(dystans, from+18)`).
- **Usuwanie** — przycisk `✕` wewnątrz paska (desktop) / chip „Usuń" w wierszu edycji (mobile). `pointerdown` na nim musi zatrzymywać propagację, żeby nie startował drag.
- **Wczytanie GPX** — parsowanie `<trkpt><ele>`; błąd → komunikat `gpxBad`. Wyłączenie GPX spłaszcza `effort` do 1.

## i18n
Dwa słowniki (`STR.pl`, `STR.en`) — brakujące klucze spadają na EN; dodanie języka = wpis w `LANGS` + blok w `STR`. Domyślny język: PL. Cały tekst UI wyłącznie przez słownik.

## Assets
Brak grafik. Tylko Google Fonts (Archivo, JetBrains Mono) i ikonografia tekstowa (`✕`, `▸`, `+`). Plik GPX demo: `rzuty-200.gpx`.

## Otwarte kwestie do decyzji z właścicielem
- **Czas trwania (`durationLabel`)** — usunięty z panelu trasy na desktopie, dalej liczony. Zdecydować, gdzie ma wrócić (przy krzywej, w podsumowaniu, w nagłówku).
- **Pułap opróżniania żołądka** — 750 ml/h jest stałą. Decyzja: zostawić stałą, wyliczać (waga × intensywność × stężenie napoju), czy wystawić jako pole w ustawieniach?
- **Stopka na mobile** — obecnie stopka jest tylko w layoucie desktopowym. Zdecydować, czy na mobile ma być skrócona wersja (zastrzeżenie prawne + link do repo) czy żadna.
- Persystencja: co zapisujemy w `localStorage` (ustawienia zawsze; plany — jeden ostatni czy lista nazwanych?).
- Czy planowany jest eksport planu (PDF / naklejka na ramę) — wpłynie na strukturę widoku druku.

## Files
- `FuelPlan.dc.html` — kompletny prototyp (widok desktop + mobile, cała logika obliczeniowa).
- `support.js` — runtime prototypu; **nie przenosić do produktu**, potrzebny tylko żeby otworzyć HTML lokalnie.
- `PLAN.md` — lista wymagań funkcjonalnych, na których powstał ten projekt.

## Jak zacząć z Claude Code
1. Wrzuć ten folder do repo jako `docs/design_handoff_fuelplan/`.
2. Otwórz `FuelPlan.dc.html` w przeglądarce obok terminala — to referencja wizualna.
3. Pierwszy prompt: *„Przeczytaj docs/design_handoff_fuelplan/README.md. Zbuduj szkielet aplikacji (Vite+React+TS) i przenieś model obliczeniowy z klasy `Component` w FuelPlan.dc.html do `src/domain/fuel.ts` jako czyste funkcje + testy jednostkowe na cph/sweat/absCap/samples/rateStats. Nie ruszaj jeszcze UI."*
4. Potem ekran po ekranie: panel trasy → wykres SVG → tory z drag&drop → skład pojemników → ustawienia. Za każdym razem odsyłaj do konkretnej sekcji README i do prototypu.
5. Drag&drop i popover zostaw na koniec jednej sesji — to najbardziej wrażliwa część (zachowanie hovera opisane wyżej).

## Zmiany od wrzutu #1

Jeśli implementacja powstawała na poprzednim wrzucie, to jest pełna lista różnic w prototypie. Nic poza tym się nie zmieniło — model obliczeniowy, kształt stanu, tory, drag&drop, skład pojemników i layout mobilny są identyczne.

1. **Linia limitu wchłaniania w trybie g/h (nowe).** Wcześniej pozioma linia limitu istniała tylko w trybie płynów (750 ml/h). Teraz rysuje się także w trybie `rate`, na wysokości `absCap()`, w kolorze `carb`. `maxY` w trybie `rate` uwzględnia `absCap()*1.05`. W trybie `sum` linii nie ma.
2. **Wpis w legendzie „Limit wchłaniania" / „Absorption limit" (nowe).** Kropkowana kreska w kolorze linii limitu, widoczna w `rate` i `fluid`, ukryta w `sum`. Bez wartości liczbowej w etykiecie. Nowe klucze i18n: `legCap`.
3. **Nota obok wykresu rozbita na tryby.** Był jeden tekst `curveHint` widoczny zawsze plus `capNote` z dopiskiem o 750 ml/h na końcu. Teraz: `curveHintSum` (nowy klucz) dla `sum`, `curveHint` dla `rate`, a w `fluid` sam `capNoteFluid` (nowy klucz) — wzmianka o płynach została usunięta z `capNote2`.
4. **Stopka (nowe).** Cała sekcja 9 w „Ekrany / widoki" — wcześniej strona kończyła się na karcie ze składem pojemników. Nowe klucze i18n: `ftVersion`, `ftAbout`, `ftAboutBody`, `ftSources1`, `ftSources2`, `ftPrivacy`, `ftLegal`, `ftLegalBody`, `ftLinks`, `ftIssues`, `ftRepo`, `ftCopyright`.
5. **Padding strony** `26px 24px 60px` → `14px 24px 40px`.
