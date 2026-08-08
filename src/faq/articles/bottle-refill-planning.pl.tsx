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
      <h1 style={articleH1Style}>Jak zaplanować uzupełnianie bidonów na długiej trasie</h1>
      <p style={articleTextStyle}>
        Na dłuższej trasie zapas z paru bidonów już nie wystarczy — całego miksu nie zabierzesz od
        razu na starcie. Potrzebujesz punktów, w których uzupełnisz zapasy, i pomysłu, co wtedy
        wlejesz do którego bidonu.
      </p>
      <p style={articleTextStyle}>
        Zacznij od całkowitego zapotrzebowania na węglowodany i płyny na całej trasie — Carb Fueling
        liczy je na podstawie trasy i warunków. Porównaj to z tym, ile realnie pomieszczą Twoje
        bidony i flaski. Brakującą część musisz uzupełnić po drodze: w sklepie, na punkcie wsparcia,
        przy źródle wody.
      </p>
      <img
        src="/faq/bottle-refill-planning/shop-stops.png"
        alt="Oś czasu trasy w Carb Fueling z punktami zaopatrzenia ustawionymi między uzupełnieniami bidonów."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        W każdym miejscu uzupełnienia dodaj na trasie punkt zaopatrzenia (sklep). Carb Fueling
        podzieli wtedy cały miks na porcje przypadające na poszczególne odcinki między punktami,
        więc dokładnie wiesz, ile proszku, wody i dodatków zabrać ze sobą — albo dokupić — w każdym
        z nich. Dodawaj punkty, zanim luka zrobi się zbyt duża, nie gdy już jest za późno:
        uzupełnienie przy 20% zapasu to plan, uzupełnienie przy zerowym zapasie to kryzys.
      </p>
      <p style={articleTextStyle}>
        Na krótszych trasach, prowadzących przez tereny z dobrym dostępem do sklepów, zwykle
        wystarczy jedno uzupełnienie mniej więcej w połowie. Na dłuższych albo bardziej odludnych —
        rozstaw punkty tak, żeby na żadnym odcinku bidony nie musiały pomieścić więcej, niż realnie
        mogą.
      </p>
      <p>
        <a href="/" style={articleLinkStyle}>
          Dodaj punkty zaopatrzenia do swojej trasy →
        </a>
      </p>
    </FaqLayout>
  );
}
