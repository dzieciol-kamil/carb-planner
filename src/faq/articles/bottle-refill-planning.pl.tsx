import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../FaqLayout';

export default function BottleRefillPlanningPl() {
  return (
    <FaqLayout lang="pl">
      <h1 style={articleH1Style}>Jak zaplanować uzupełnianie butelek na długiej trasie</h1>
      <p style={articleTextStyle}>
        Gdy trasa jest dłuższa niż zawartość kilku butelek, nie zabierzesz całego planu od startu.
        Potrzebujesz punktów uzupełniania — i pomysłu, co wlać do której butelki na miejscu.
      </p>
      <p style={articleTextStyle}>
        Zacznij od całkowitego zapotrzebowania na węglowodany i płyny na całą trasę (Carb Fueling
        liczy oba na podstawie trasy i warunków). Porównaj to z tym, ile faktycznie pomieszczą Twoje
        bidony i flaszki. Brakująca część musi skądś się wziąć po drodze — sklep, punkt wsparcia,
        źródełko.
      </p>
      <img
        src="/faq/bottle-refill-planning/shop-stops.png"
        alt="Oś czasu trasy w Carb Fueling z przystankami sklepowymi ustawionymi między uzupełnieniami butelek."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        W miejscu każdego uzupełnienia postaw "przystanek sklepowy". Carb Fueling rozdziela wtedy
        cały miks na odcinki między przystankami, więc wiesz dokładnie, ile proszku, wody i dodatków
        zabrać — albo kupić — na każdym z nich. Ustawiaj przystanki, zanim luka zrobi się zbyt duża,
        nie po fakcie: uzupełnienie przy 20% zapasu to plan, uzupełnienie przy 0% to kryzys.
      </p>
      <p style={articleTextStyle}>
        Na krótszych, dobrze zaopatrzonych trasach zwykle wystarczy jedno uzupełnienie mniej więcej
        w połowie. Na dłuższych albo bardziej odludnych — rozstaw przystanki tak, żeby żaden odcinek
        nie przekraczał pojemności Twoich butelek.
      </p>
      <p>
        <a href="/" style={articleLinkStyle}>
          Dodaj przystanki sklepowe do swojej trasy →
        </a>
      </p>
    </FaqLayout>
  );
}
