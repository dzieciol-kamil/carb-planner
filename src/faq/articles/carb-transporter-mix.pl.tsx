import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../FaqLayout';

export default function CarbTransporterMixPl() {
  return (
    <FaqLayout lang="pl">
      <h1 style={articleH1Style}>
        Dlaczego nie wchłoniesz więcej niż ok. 90 g węglowodanów na godzinę?
      </h1>
      <p style={articleTextStyle}>
        Jelito wchłania cukier dwoma osobnymi "drzwiami". Glukoza wchodzi jednymi, fruktoza drugimi.
        Każde z nich ma swój limit prędkości.
      </p>
      <p style={articleTextStyle}>
        Drzwi od glukozy przepuszczają maksymalnie ok. 60 g na godzinę — niezależnie od tego, ile
        glukozy wypijesz. Jeśli pijesz samą maltodekstrynę albo żele czysto glukozowe, 60 g/h to
        Twój twardy sufit. Nadmiar zalega w żołądku i kończy się wzdęciami albo skurczami.
      </p>
      <p style={articleTextStyle}>
        Fruktoza korzysta z innych drzwi, dobrych na kolejne ok. 30 g na godzinę. Dodając fruktozę
        do miksu, otwierasz obie bramki naraz — dlatego mieszanki glukozowo-fruktozowe podnoszą
        realny sufit do ok. 90 g na godzinę.
      </p>
      <img
        src="/faq/carb-transporter-mix/absorption-cap.png"
        alt="Panel miksu pokazujący suwak proporcji glukoza:fruktoza i wynikowy sufit wchłaniania w Carb Fueling."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        Proporcja ma znaczenie. Za dużo fruktozy i marnujesz zapas drzwi od glukozy; za mało i
        marnujesz zapas drzwi od fruktozy. Proporcja 2:1 (glukoza do fruktozy wagowo) to dobry punkt
        startowy dla większości rowerzystów — to domyślny miks "Izo" w Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling liczy Twój indywidualny sufit na podstawie ustawionej proporcji i pokazuje go
        na bieżąco przy suwakach.
      </p>
      <p>
        <a href="/" style={articleLinkStyle}>
          Sprawdź swój sufit →
        </a>
      </p>
    </FaqLayout>
  );
}
