# Handoff: FuelPlan — planer żywienia na rowerze

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
- Przerywana linia na wykresie płynów = 750 ml/h (limit opróżniania żołądka).

## Ekrany / widoki

Jeden ekran w dwóch layoutach; przełącznik `viewMode` (Auto/Desktop/Mobile). Auto: `mobile` gdy `innerWidth < 860` lub (touch i `< 1100`).

### A. Desktop
Kolumna kart na tle `#EFF0EC`, każda karta biała, radius 16, ramka `#E3E5E0`.

1. **Nagłówek** — nazwa, przełącznik języka PL/EN, przełącznik widoku.
2. **Panel trasy** — dystans / tempo (albo czas), waga, intensywność, temperatura, profil GPX (Wł./Wyłącz, „Wczytaj" pliku, komunikat błędu `gpxBad`). *Uwaga: `durationLabel` (czas trwania) został z tego panelu usunięty i obecnie pojawia się tylko w widoku mobilnym — patrz „Otwarte kwestie".*
3. **Karty podsumowania** — cel (g), pokrycie zapotrzebowania (%), nawodnienie (utrata / plan / %), kcal, licznik dolewek.
4. **Krzywa** — SVG na całą szerokość: profil wysokości w tle (pasma podjazd `#D2703F` / zjazd `#3D8FBF`, opacity 0.075), obszar węglowodanów (gradient z `carb`), warstwa „w żołądku", linia zapotrzebowania (przerywana), linia limitu wchłaniania, linia podaży kolorowana kolorem aktualnie aktywnego źródła. Przełączniki: oś X km↔h, tryb Y (g/h ↔ płyny).
5. **Tory pod wykresem** — jeden tor na każdy skonfigurowany pojemnik + tor „Jedzenie / dodatki". W torze pojemnika paski **nie nachodzą na siebie** (przeciągany pasek skraca się do wolnej luki), w torze jedzenia mogą. Po lewej etykieta pojemnika (nazwa, `ml · dozwolona zawartość`), po prawej przycisk `+` (dolewka w pierwszej wolnej luce; nieaktywny → `noRoom`).
6. **Lista produktów do dodania** — chipy z kropką w kolorze `food` i gramaturą.
7. **ROZKŁAD** (collapsible) — lista wszystkich pozycji z zakresem, składem i licznikiem, hover zsynchronizowany z wykresem.
8. **SKŁAD POJEMNIKÓW** — karta na każdy pojemnik, w środku wiersz na każde napełnienie: cukry, malto, fruktoza, sól, kwasek w gramach. W nagłówku przycisk „ustawienia mieszanki" (otwiera panel `mix`).

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
