export const LANGS = ['pl', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export interface StringTable {
  tagline: string;
  desktop: string;
  mobile: string;
  route: string;
  byRoute: string;
  byTime: string;
  distance: string;
  speed: string;
  hours: string;
  minutes: string;
  duration: string;
  weight: string;
  preMealCarbs: string;
  preMealMinutes: string;
  intensity: string;
  low: string;
  medium: string;
  high: string;
  temp: string;
  carbsPerHour: string;
  gear: string;
  settings: string;
  profile: string;
  addGear: string;
  savedLocally: string;
  canCarry: string;
  gelPartsLabel: string;
  gearHint: string;
  settingsHint: string;
  curve: string;
  gutHint: string;
  curveHint: string;
  curveHintSum: string;
  intake: string;
  absorbed: string;
  gutLane: string;
  need: string;
  timeline: string;
  axisTime: string;
  gutOver: string;
  gutAt: string;
  dry: string;
  dryAt: string;
  sumMode: string;
  carbMode: string;
  fluidMode: string;
  tDry: string;
  legFluid: string;
  legSweat: string;
  legCap: string;
  capNote: string;
  capNote2: string;
  capNoteFluid: string;
  tAbsorbed: string;
  tCap: string;
  tGutPeak: string;
  timelineHint: string;
  dragHint: string;
  addFuel: string;
  removeItem?: string;
  addShopStop: string;
  addFillTo: string;
  coverage: string;
  summary: string;
  hydration: string;
  sweatLoss: string;
  planned: string;
  needSum: string;
  recipes: string;
  recipesHint: string;
  ratio: string;
  ratioLabelSugar: string;
  ratioLabelHoney: string;
  concLabel: string;
  saltLabel: string;
  citricLabel: string;
  gelConcLabel: string;
  per100: string;
  mixIzo: string;
  mixGel: string;
  target: string;
  mobileNotesTitle: string;
  tCarbs: string;
  tTarget: string;
  tGap: string;
  tKcal: string;
  tDrink: string;
  tSolid: string;
  tRefills: string;
  tPortions: string;
  tabPlan: string;
  tabGear: string;
  tabFood: string;
  tabMe: string;
  ok: string;
  low2: string;
  over: string;
  dip: string;
  hydOk: string;
  hydLow: string;
  gpx: string;
  gpxFile: string;
  gpxOn: string;
  gpxPick: string;
  gpxBad: string;
  shot: string;
  sipped: string;
  water: string;
  izo: string;
  gel: string;
  shotMode: string;
  contMode: string;
  fill: string;
  refills: string;
  addFill: string;
  noRoom: string;
  foodLane: string;
  foodLaneSub: string;
  addFoodHint: string;
  portions: string;
  malto: string;
  fructose: string;
  salt: string;
  citric: string;
  waterFill: string;
  carbsIn: string;
  perPortion: string;
  refillAt: string;
  langName: string;
  langShort: string;
  itemsSuffix: string;
  newVessel: string;
  viewLabel: string;
  viewAuto: string;
  autoDetected: string;
  mixSection: string;
  editInSettings: string;
  ratioCustom: string;
  resetDefaults: string;
  gearMix: string;
  foodSection: string;
  addFoodItem: string;
  newFood: string;
  fName: string;
  fCarbs: string;
  fMl: string;
  fCont: string;
  foodSectionHint: string;
  mixHint: string;
  notes: { title: string; body: string }[];
  ftVersion: string;
  ftAboutBody: string;
  ftSources2: string;
  ftPrivacy: string;
  ftLegal: string;
  ftLegalBody: string;
  ftLinks: string;
  ftIssues: string;
  ftRepo: string;
  ftCopyright: string;
  tourWelcomeTitle: string;
  tourWelcomeBody: string;
  tourRouteTitle: string;
  tourRouteBody: string;
  tourChartTitle: string;
  tourChartBody: string;
  tourChartBodyAfter: string;
  tourFillTitle: string;
  tourFillBody: string;
  tourAddFillTitle: string;
  tourAddFillBody: string;
  tourAddShopTitle: string;
  tourAddShopBody: string;
  tourClosingTitle: string;
  tourClosingBody: string;
  tourNext: string;
  tourBack: string;
  tourSkip: string;
  tourFinish: string;
  tourStepLabel: string;
  tourReplayButton: string;
  tourConfirmTitle: string;
  tourConfirmBody: string;
  tourConfirmCancel: string;
  tourConfirmStart: string;
}

export const STR: Record<Lang, StringTable> = {
  pl: {
    tagline: 'planer węglowodanów i nawodnienia',
    desktop: 'Komputer',
    mobile: 'Telefon',
    route: 'Trasa',
    byRoute: 'Dystans + tempo',
    byTime: 'Czas',
    distance: 'Dystans',
    speed: 'Śr. prędkość',
    hours: 'Godziny',
    minutes: 'Minuty',
    duration: 'Czas trwania',
    weight: 'Waga',
    preMealCarbs: 'Węgle przed startem',
    preMealMinutes: 'Czas przed startem',
    intensity: 'Intensywność',
    low: 'Niska',
    medium: 'Średnia',
    high: 'Wysoka',
    temp: 'Temperatura',
    carbsPerHour: 'Zapotrzebowanie',
    gear: 'Mój sprzęt',
    settings: 'Ustawienia',
    profile: 'Profil',
    addGear: 'Dodaj bidon',
    savedLocally: 'Zapisane lokalnie',
    canCarry: 'Może wozić:',
    gelPartsLabel: 'porcje',
    gearHint: 'Nazwa, pojemność i to, co dany bidon może wozić. Żel dzieli się na tyle porcji, ile tu ustawisz.',
    settingsHint: 'Wszystko zapisuje się w tej przeglądarce (localStorage) — bez konta, bez backendu.',
    curve: 'Planowanie',
    gutHint: 'To Twój żołądek: górny pasek pokazuje, co w nim zalega i jak szybko się trawi, aż do górnego limitu pojemności.',
    curveHint: 'Gruba ciągła linia to tempo, w jakim realnie wchłaniasz węglowodany — rdzawe pola to godziny, w których wchłaniasz mniej, niż potrzebujesz.',
    curveHintSum: 'Gruba ciągła linia to suma węglowodanów, które realnie wchłonąłeś do danej godziny.',
    intake: 'Zjedzone',
    absorbed: 'Wchłonięte',
    gutLane: 'W żołądku',
    need: 'Zapotrzebowanie',
    timeline: 'Rozkład',
    axisTime: 'godziny',
    gutOver: 'Za dużo naraz — ',
    gutAt: ' g zalega w żołądku ok. ',
    dry: 'Dziura w tankowaniu: ',
    dryAt: ' bez cukru, ok. ',
    sumMode: 'Suma',
    carbMode: 'Węglowodany (g/h)',
    fluidMode: 'Nawodnienie (ml/h)',
    tDry: 'Najdłuższa dziura',
    legFluid: 'Płyny',
    legSweat: 'Pot',
    legCap: 'Limit wchłaniania',
    capNote: 'Limit wchłaniania: ',
    capNote2:
      ' — tyle maksymalnie na godzinę wchłonie Twoje jelito, obojętnie ile zjesz; nadwyżka nie znika, tylko czeka w żołądku. Rośnie, gdy mieszasz glukozę z fruktozą, bo mają osobne drogi wchłaniania (glukoza ok. 60 g/h, fruktoza dokłada do tego ok. 30 g/h) — dlatego liczę go z Twojej proporcji maltodekstryna:fruktoza (Jeukendrup, przegląd 2010–2014).',
    capNoteFluid:
      'Limit wchłaniania: 750 ml/h — tyle płynu żołądek oddaje do jelita w wysiłku (przerywana linia). Nadwyżka nie wchłania się, tylko zalega. Przy zwiększonej potliwości podczas wysiłku da się deficyt ograniczyć, ale nie wyzerować.',
    tAbsorbed: 'Wchłonięte',
    tCap: 'Limit wchłaniania',
    tGutPeak: 'Max w żołądku',
    timelineHint: 'Podgląd — pozycję, zakres i zawartość każdej dolewki ustawiasz na wykresie powyżej.',
    dragHint: 'Paski nie nachodzą na siebie — w ciasnej luce przeciągany pasek się skraca. Kreski porcji żelu przesuwasz osobno.',
    addFuel: 'Dodaj jedzenie:',
    removeItem: 'Usuń',
    addShopStop: 'Dodaj sklep',
    addFillTo: 'Dodaj dolewkę do ',
    coverage: 'Pokrycie zapotrzebowania',
    summary: 'Podsumowanie',
    hydration: 'Nawodnienie',
    sweatLoss: 'Utrata',
    planned: 'Plan',
    needSum: 'Zapotrzebowanie',
    recipes: 'Skład bidonów',
    recipesHint: 'Gramy do odmierzenia na każde napełnienie — osobno na bidon, flask czy słoiczek.',
    ratio: 'Maltodekstryna : Fruktoza',
    ratioLabelSugar: 'Cukier',
    ratioLabelHoney: 'Miód',
    concLabel: 'cukry',
    saltLabel: 'sól',
    citricLabel: 'kwasek',
    gelConcLabel: 'cukry',
    per100: 'g/100 ml',
    mixIzo: 'Izotonik',
    mixGel: 'Żel',
    target: 'Cel',
    mobileNotesTitle: 'Zasady wersji mobilnej',
    tCarbs: 'Cukry łącznie',
    tTarget: 'Cel',
    tGap: 'Różnica',
    tKcal: 'Energia',
    tDrink: 'Z płynów',
    tSolid: 'Z jedzenia',
    tRefills: 'Dolewki',
    tPortions: 'Porcje żelu',
    tabPlan: 'Plan',
    tabGear: 'Sprzęt',
    tabFood: 'Produkty',
    tabMe: 'Ja',
    ok: 'Plan pokrywa zapotrzebowanie równomiernie. Największy dołek: ',
    low2: 'Za mało cukru — dołóż element w drugiej połowie trasy.',
    over: 'Powyżej zapotrzebowania — ryzyko problemów żołądkowych.',
    dip: ' g poniżej krzywej ok. ',
    hydOk: 'Płyny pokrywają utratę. Uzupełniaj równomiernie.',
    hydLow: 'Zaplanuj dolewkę lub dodatkowy bidon.',
    gpx: 'Profil GPX',
    gpxFile: 'track.gpx (demo)',
    gpxOn: 'Wł.',
    gpxPick: 'Wczytaj',
    gpxBad: 'Nie udało się odczytać pliku GPX.',
    shot: 'jednorazowo',
    sipped: 'popijane',
    water: 'Woda',
    izo: 'Izo',
    gel: 'Żel',
    shotMode: 'Jednorazowo',
    contMode: 'Ciągle',
    fill: 'Napełnienie',
    refills: 'dolewki',
    addFill: '+ dolewka po wyczerpaniu',
    noRoom: 'brak wolnej luki',
    foodLane: 'Jedzenie / dodatki',
    foodLaneSub: 'mogą się nakładać',
    addFoodHint: 'wybierz z listy pod wykresem',
    portions: 'porcji',
    malto: 'Maltodekstryna',
    fructose: 'Fruktoza',
    salt: 'Sól',
    citric: 'Kwasek cytrynowy',
    waterFill: 'Woda',
    carbsIn: 'Cukry',
    perPortion: 'Na porcję',
    refillAt: 'dolewka na ',
    langName: 'Polski',
    langShort: 'PL',
    itemsSuffix: 'elementów',
    newVessel: 'Nowy bidon',
    viewLabel: 'Widok',
    viewAuto: 'Auto',
    autoDetected: 'wykryte automatycznie: ',
    mixSection: 'Mieszanka',
    editInSettings: 'ustawienia mieszanki',
    ratioCustom: 'własna',
    resetDefaults: 'Przywróć domyślne',
    gearMix: 'Mieszanka i bidony',
    foodSection: 'Jedzenie i dodatki',
    addFoodItem: 'Dodaj produkt',
    newFood: 'Nowy produkt',
    fName: 'produkt',
    fCarbs: 'cukry (g)',
    fMl: 'płyn (ml)',
    fCont: 'stopniowo',
    foodSectionHint:
      'Twoja lista produktów — te przyciski pojawiają się pod wykresem. Podaj same węglowodany w porcji (nie wagę batona) i ewentualny płyn.',
    mixHint: 'Wartości na 100 ml — stąd liczą się gramy dla każdego napełnienia.',
    notes: [
      { title: 'Linia na każdy bidon', body: 'Bidon 720, bidon 610, flask — każdy ma własną linię i nie da się wrzucić żelu do bidonu z izo.' },
      { title: 'Dolewka po wyczerpaniu', body: 'Napełnienia nie zachodzą na siebie: pasek zatrzymuje się na sąsiedzie, a + wstawia dolewkę w wolnej luce.' },
      { title: 'Jedzenie osobno', body: 'Banan i żelki mogą się nakładać, piwo zero bierzesz jednorazowo na stacji — dlatego mają własną linię.' },
      { title: 'Skład na bidon', body: 'Karta „Skład bidonów” liczy gramy maltodekstryny, fruktozy, soli i kwasku dla każdego napełnienia osobno.' },
    ],
    ftVersion: 'wersja demo · projekt hobbystyczny',
    ftAboutBody:
      'Carb Planner liczy, ile węglowodanów i płynów zabrać na trasę — z dystansu, tempa, wagi, intensywności i temperatury — a potem rozkłada je na bidony, flaski i jedzenie w czasie. Plan, sprzęt i lista produktów zapisują się w tej przeglądarce.',
    ftPrivacy: 'Bez konta, bez serwera, bez cookies i trackerów.',
    ftLegal: 'Zastrzeżenie prawne',
    ftLegalBody:
      'To narzędzie edukacyjne i pomocnicze — nie jest poradą medyczną, dietetyczną ani treningową i nie zastępuje kontaktu ze specjalistą. Wyliczenia są szacunkowe, oparte na uśrednionych modelach; Twoje realne zapotrzebowanie, tolerancja żołądkowa, poziom nawodnienia i reakcja na wysiłek mogą się od nich istotnie różnić. Korzystasz z aplikacji na własną odpowiedzialność i wyłącznie na własne ryzyko. Autor nie ponosi odpowiedzialności za jakiekolwiek skutki zdrowotne, kontuzje, szkody, straty ani decyzje podjęte na podstawie wyników — w szczególności nie odpowiada za Twoje zdrowie ani życie. Jeśli chorujesz (m.in. cukrzyca, choroby nerek, serca, przewodu pokarmowego), przyjmujesz leki, jesteś w ciąży albo planujesz długi lub bardzo intensywny start — skonsultuj plan żywieniowy z lekarzem lub dietetykiem sportowym. Nie ignoruj objawów: przy zawrotach głowy, nudnościach, dezorientacji, skurczach lub podejrzeniu hiponatremii przerwij wysiłek i szukaj pomocy. Aplikacja jest dostarczana „taką, jaka jest”, bez żadnych gwarancji.',
    ftLinks: 'Współtwórz',
    ftIssues: 'Pomysły i błędy → GitHub Issues',
    ftRepo: 'Kod źródłowy na GitHubie',
    ftSources2: 'Utrata potu: przybliżenie z wagi, intensywności i temperatury.',
    ftCopyright: '© 2026 Carb Planner · open source',
    tourWelcomeTitle: 'Witaj w Carb Plannerze',
    tourWelcomeBody: 'W kilku krokach pokażemy, jak zaplanować węglowodany i płyny na trasę oraz jak czytać wynik. Zajmie to około minuty.',
    tourRouteTitle: 'Trasa i wynik',
    tourRouteBody:
      'Tu opisujesz przejazd — dystansem i tempem albo czasem trwania — oraz warunki (intensywność, temperatura, posiłek przed startem). Karty obok pokazują, czy Twój plan pokrywa zapotrzebowanie na węglowodany i płyny.',
    tourChartTitle: 'Wykres: podaż kontra zapotrzebowanie',
    tourChartBody:
      'Liczby po lewej to skala: ile gramów węglowodanów na godzinę (g/h). Przerywana linia pokazuje, ile potrzebujesz w każdej godzinie. Teraz nie masz jeszcze żadnego bidonu ani jedzenia w planie, więc nie ma jeszcze linii tego, co realnie dostarczasz. Zaraz dodamy przykładowy bidon, żebyś zobaczył, jak ta linia rośnie.',
    tourChartBodyAfter:
      'Ciągła linia to ile węglowodanów realnie dostarczasz, przerywana — ile potrzebujesz. Dodaliśmy przykładowy bidon: widzisz, jak linia dostaw rośnie i zbliża się do zapotrzebowania.',
    tourFillTitle: 'Bidon: przesuwanie, zwężanie, zmiana zawartości',
    tourFillBody:
      'Ten pasek to właśnie dodany bidon. Chwyć środek, żeby przesunąć go po trasie. Chwyć lewą lub prawą krawędź, żeby skrócić lub wydłużyć odcinek, na którym z niego pijesz. Najedź kursorem, a pojawią się przyciski zmiany zawartości (woda / izotonik / żel), jeśli bidon obsługuje więcej niż jeden rodzaj.',
    tourAddFillTitle: 'Dodaj kolejną dolewkę',
    tourAddFillBody:
      'Ten przycisk „+” wstawia kolejną dolewkę w pierwszej wolnej luce na trasie — przydaje się, gdy bidon się skończy i trzeba go napełnić czymś innym. To samo dotyczy jedzenia: przyciski z listą produktów pod wykresem dodają kolejne pozycje jednym kliknięciem.',
    tourAddShopTitle: 'Punkty zaopatrzenia',
    tourAddShopBody:
      'Ten „+” dodaje na wykresie znacznik punktu zaopatrzenia (np. sklepu) — możesz przeciągnąć go w dowolne miejsce trasy, żeby zaznaczyć, gdzie planujesz dokupić jedzenie lub napój.',
    tourClosingTitle: 'To wszystko na start',
    tourClosingBody:
      'Oś czasu, przepisy na mieszankę i ustawienia (waga, limit wchłaniania, proporcje) znajdziesz niżej i w przyciskach w nagłówku. Ten tour możesz odpalić ponownie w każdej chwili przyciskiem w stopce.',
    tourNext: 'Dalej',
    tourBack: 'Wstecz',
    tourSkip: 'Pomiń',
    tourFinish: 'Zakończ',
    tourStepLabel: 'Krok',
    tourReplayButton: 'Pokaż tour ponownie',
    tourConfirmTitle: 'Uruchomić tour ponownie?',
    tourConfirmBody: 'Tour wczyta przykładowe dane (trasa i jeden bidon) w miejsce Twojego aktualnego planu. Tej zmiany nie da się cofnąć.',
    tourConfirmCancel: 'Anuluj',
    tourConfirmStart: 'Uruchom tour',
  },
  en: {
    tagline: 'carbohydrate & hydration planner',
    desktop: 'Desktop',
    mobile: 'Phone',
    route: 'Route',
    byRoute: 'Distance + pace',
    byTime: 'Time',
    distance: 'Distance',
    speed: 'Avg speed',
    hours: 'Hours',
    minutes: 'Minutes',
    duration: 'Duration',
    weight: 'Weight',
    preMealCarbs: 'Carbs before start',
    preMealMinutes: 'Time before start',
    intensity: 'Intensity',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    temp: 'Temperature',
    carbsPerHour: 'Requirement',
    gear: 'My gear',
    settings: 'Settings',
    profile: 'Profile',
    addGear: 'Add bottle',
    savedLocally: 'Saved locally',
    canCarry: 'Can carry:',
    gelPartsLabel: 'portions',
    gearHint: 'Name, capacity and what this bottle may carry. Gel splits into as many portions as you set here.',
    settingsHint: 'Everything is stored in this browser (localStorage) — no account, no backend.',
    curve: 'Planning',
    gutHint: "This is your stomach: the top strip shows what's sitting in it and how fast it's digesting, up to its capacity limit.",
    curveHint: "The thick solid line is the rate you're actually absorbing carbs at — rust areas are the hours you're absorbing less than you need.",
    curveHintSum: "The thick solid line is the cumulative carbs you've actually absorbed by a given hour.",
    intake: 'Eaten',
    absorbed: 'Absorbed',
    gutLane: 'In the gut',
    need: 'Requirement',
    timeline: 'Schedule',
    axisTime: 'hours',
    gutOver: 'Too much at once — ',
    gutAt: ' g sitting in the stomach around ',
    dry: 'Fuelling gap: ',
    dryAt: ' with no carbs, around ',
    sumMode: 'Total',
    carbMode: 'Carbs (g/h)',
    fluidMode: 'Hydration (ml/h)',
    tDry: 'Longest gap',
    legFluid: 'Fluids',
    legSweat: 'Sweat',
    legCap: 'Absorption limit',
    capNote: 'Absorption limit: ',
    capNote2:
      " — that's the most your gut can absorb per hour no matter how much you eat; anything above it doesn't vanish, it just waits in the stomach. It goes up when you mix glucose and fructose, since they're absorbed through separate routes (glucose ~60 g/h, fructose adds ~30 g/h on top) — that's why it's derived from your maltodextrin:fructose ratio (Jeukendrup, 2010–2014 reviews).",
    capNoteFluid:
      'Absorption limit: 750 ml/h — that is how fast the stomach passes fluid on to the gut under load (dashed line). Anything above it is not absorbed, it just sits there. With a higher sweat rate you can limit the deficit, not erase it.',
    tAbsorbed: 'Absorbed',
    tCap: 'Absorption limit',
    tGutPeak: 'Peak in stomach',
    timelineHint: 'Read-only view — set position, range and contents of each refill on the chart above.',
    dragHint: 'Bars never overlap — a dragged bar shortens to fit a tight gap. Gel portion marks drag on their own.',
    addFuel: 'Add food:',
    removeItem: 'Remove',
    addShopStop: 'Add shop stop',
    addFillTo: 'Add a fill to ',
    coverage: 'Requirement covered',
    summary: 'Summary',
    hydration: 'Hydration',
    sweatLoss: 'Loss',
    planned: 'Planned',
    needSum: 'Requirement',
    recipes: 'Bottle recipes',
    recipesHint: 'Grams to measure out for each fill — per bottle, flask or jar.',
    ratio: 'Maltodextrin : Fructose',
    ratioLabelSugar: 'Sugar',
    ratioLabelHoney: 'Honey',
    concLabel: 'carbs',
    saltLabel: 'salt',
    citricLabel: 'citric',
    gelConcLabel: 'carbs',
    per100: 'g/100 ml',
    mixIzo: 'Isotonic',
    mixGel: 'Gel',
    target: 'Target',
    mobileNotesTitle: 'Mobile rules',
    tCarbs: 'Total carbs',
    tTarget: 'Target',
    tGap: 'Difference',
    tKcal: 'Energy',
    tDrink: 'From drinks',
    tSolid: 'From food',
    tRefills: 'Refills',
    tPortions: 'Gel portions',
    tabPlan: 'Plan',
    tabGear: 'Gear',
    tabFood: 'Products',
    tabMe: 'Me',
    ok: 'Intake tracks the requirement evenly. Biggest dip: ',
    low2: 'Not enough carbs — add an item in the second half.',
    over: 'Above requirement — risk of stomach trouble.',
    dip: ' g below the curve around ',
    hydOk: 'Fluids cover the loss. Sip steadily.',
    hydLow: 'Plan a refill or an extra bottle.',
    gpx: 'GPX profile',
    gpxFile: 'track.gpx (demo)',
    gpxOn: 'On',
    gpxPick: 'Load',
    gpxBad: 'Could not read that GPX file.',
    shot: 'shot',
    sipped: 'sipped',
    water: 'Water',
    izo: 'Izo',
    gel: 'Gel',
    shotMode: 'Shot',
    contMode: 'Steady',
    fill: 'Fill',
    refills: 'refills',
    addFill: '+ refill once empty',
    noRoom: 'no free gap',
    foodLane: 'Food / extras',
    foodLaneSub: 'may overlap',
    addFoodHint: 'pick from the list under the chart',
    portions: 'portions',
    malto: 'Maltodextrin',
    fructose: 'Fructose',
    salt: 'Salt',
    citric: 'Citric acid',
    waterFill: 'Water',
    carbsIn: 'Carbs',
    perPortion: 'Per portion',
    refillAt: 'refill at ',
    langName: 'English',
    langShort: 'EN',
    itemsSuffix: 'items',
    newVessel: 'New bottle',
    viewLabel: 'View',
    viewAuto: 'Auto',
    autoDetected: 'auto-detected: ',
    mixSection: 'Drink mix',
    editInSettings: 'mix settings',
    ratioCustom: 'custom',
    resetDefaults: 'Reset to defaults',
    gearMix: 'Mix & bottles',
    foodSection: 'Food & extras',
    addFoodItem: 'Add product',
    newFood: 'New product',
    fName: 'product',
    fCarbs: 'carbs (g)',
    fMl: 'fluid (ml)',
    fCont: 'over time',
    foodSectionHint: 'Your product list — these buttons show up under the chart. Enter carbs per serving (not the bar weight) and any fluid.',
    mixHint: 'Values per 100 ml — per-fill grams are derived from this.',
    notes: [
      { title: 'A lane per bottle', body: 'Big bottle, small bottle, flask — each has its own lane, so gel cannot land in the izo bottle.' },
      { title: 'Refill once empty', body: 'Fills never overlap: a bar stops at its neighbour and + inserts a refill into a free gap.' },
      { title: 'Food apart', body: 'Banana and chews may overlap, a zero beer is one stop — hence their own lane.' },
      { title: 'Per-bottle recipe', body: 'The recipe card computes maltodextrin, fructose, salt and citric grams for every single fill.' },
    ],
    ftVersion: 'demo build · hobby project',
    ftAboutBody:
      'Carb Planner works out how many carbs and how much fluid to take on a ride — from distance, pace, weight, intensity and temperature — then spreads them across bottles, flasks and food over time. Your plan, gear and product list stay in this browser.',
    ftPrivacy: 'No account, no server, no cookies, no trackers.',
    ftLegal: 'Disclaimer',
    ftLegalBody:
      'This is an educational planning aid — not medical, dietary or coaching advice, and no substitute for a professional. All figures are estimates based on averaged models; your real requirement, gut tolerance, hydration status and response to effort may differ significantly. You use the app on your own responsibility and entirely at your own risk. The author accepts no liability for any health consequences, injury, damage, loss or decisions made on the basis of these results — and specifically takes no responsibility for your health or life. If you have a medical condition (including diabetes, kidney, heart or gastrointestinal disease), take medication, are pregnant, or are preparing for a long or very hard event, discuss your fuelling plan with a doctor or sports dietitian. Never ignore symptoms: if you feel dizzy, nauseous, disoriented, cramping, or suspect hyponatraemia, stop and seek help. The app is provided "as is", without warranty of any kind.',
    ftLinks: 'Contribute',
    ftIssues: 'Ideas & bugs → GitHub Issues',
    ftRepo: 'Source code on GitHub',
    ftSources2: 'Sweat loss: an estimate from weight, intensity and temperature.',
    ftCopyright: '© 2026 Carb Planner · open source',
    tourWelcomeTitle: 'Welcome to Carb Planner',
    tourWelcomeBody: "A few steps to show you how to plan carbs and fluids for your ride, and how to read the result. Takes about a minute.",
    tourRouteTitle: 'Route & result',
    tourRouteBody:
      "Describe your ride here — distance and pace, or a duration — plus conditions (intensity, temperature, pre-ride meal). The cards next to it show whether your plan covers your carb and fluid needs.",
    tourChartTitle: 'The chart: supply vs. requirement',
    tourChartBody:
      "The numbers on the left are the scale: grams of carbs per hour (g/h). The dashed line shows how many carbs you need each hour. There's no bottle or food in the plan yet, so there's no line yet for what you're actually delivering. We'll add a sample bottle next so you can watch that line appear.",
    tourChartBodyAfter:
      "The solid line is how many carbs you're actually delivering, the dashed line is how many you need. We added a sample bottle — watch the delivery line rise toward the requirement.",
    tourFillTitle: 'A bottle: move it, resize it, change its contents',
    tourFillBody:
      "This bar is the bottle we just added. Drag the middle to move it along the route. Drag either edge to shorten or lengthen the stretch you drink it over. Hover it and buttons appear to switch its contents (water / isotonic / gel) if the bottle allows more than one.",
    tourAddFillTitle: 'Add another fill',
    tourAddFillBody:
      "This \"+\" button inserts another fill into the first free gap on the route — useful once a bottle runs dry and needs refilling with something else. The same idea applies to food: the product buttons under the chart add another item with one click.",
    tourAddShopTitle: 'Resupply points',
    tourAddShopBody:
      "This \"+\" adds a resupply marker on the chart (e.g. a shop) — drag it anywhere on the route to mark where you plan to buy more food or drink.",
    tourClosingTitle: "That's the essentials",
    tourClosingBody:
      "The timeline, the mix recipe and settings (weight, absorption limit, ratios) are further down and in the header buttons. Replay this tour any time from the button in the footer.",
    tourNext: 'Next',
    tourBack: 'Back',
    tourSkip: 'Skip',
    tourFinish: 'Finish',
    tourStepLabel: 'Step',
    tourReplayButton: 'Replay tour',
    tourConfirmTitle: 'Replay the tour?',
    tourConfirmBody: "The tour will load sample data (a route and one bottle) over your current plan. This can't be undone.",
    tourConfirmCancel: 'Cancel',
    tourConfirmStart: 'Start tour',
  },
};

export function t(lang: Lang): StringTable {
  return { ...STR.en, ...STR[lang] };
}
