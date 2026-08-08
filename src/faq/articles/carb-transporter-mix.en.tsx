import {
  FaqLayout,
  articleH1Style,
  articleImgStyle,
  articleLinkStyle,
  articleTextStyle,
} from '../FaqLayout';

export default function CarbTransporterMixEn() {
  return (
    <FaqLayout lang="en">
      <h1 style={articleH1Style}>Why can't you absorb more than ~90g of carbs per hour?</h1>
      <p style={articleTextStyle}>
        Your gut absorbs sugar through two separate doors. Glucose uses one door, fructose uses
        another. Each door has its own speed limit.
      </p>
      <p style={articleTextStyle}>
        The glucose door can move about 60g per hour, no matter how much glucose you drink. Drink
        only glucose gels or plain maltodextrin, and 60g/h is your hard ceiling — extra sugar just
        sits in your stomach and causes bloating or cramps.
      </p>
      <p style={articleTextStyle}>
        Fructose uses a different door, good for about another 30g per hour. Mix fructose into your
        carb source, and you're using both doors at once. That's why glucose-fructose blends push
        the realistic ceiling up to around 90g per hour.
      </p>
      <img
        src="/faq/carb-transporter-mix/absorption-cap.png"
        alt="Mix panel showing the glucose:fructose ratio slider and the resulting absorption ceiling in Carb Fueling."
        style={articleImgStyle}
      />
      <p style={articleTextStyle}>
        The ratio matters. Too much fructose and you waste the glucose door's capacity; too little
        and you waste the fructose door's. A 2:1 glucose-to-fructose ratio by weight is a good
        starting point for most riders — that's the default "Izo" mix in Carb Fueling.
      </p>
      <p style={articleTextStyle}>
        Carb Fueling calculates your personal ceiling from the mix ratio you set, and shows it live
        as you adjust the sliders.
      </p>
      <p>
        <a href="/" style={articleLinkStyle}>
          See your own ceiling →
        </a>
      </p>
    </FaqLayout>
  );
}
