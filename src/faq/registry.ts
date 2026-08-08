export interface FaqArticleMeta {
  slug: string;
  en: { title: string; description: string };
  pl: { title: string; description: string };
}

export const ARTICLES: FaqArticleMeta[] = [
  {
    slug: 'carb-transporter-mix',
    en: {
      title: "Why can't you absorb more than ~90g of carbs per hour?",
      description: 'How mixing glucose and fructose raises your gut absorption ceiling.',
    },
    pl: {
      title: 'Dlaczego nie wchłoniesz więcej niż ok. 90 g węglowodanów na godzinę?',
      description: 'Jak mieszanka glukozy i fruktozy podnosi sufit wchłaniania jelitowego.',
    },
  },
  {
    slug: 'bonk-crisis',
    en: {
      title: 'What actually happens when you bonk — and how to see it coming',
      description: 'The gap between carbs burned and carbs delivered, and how to watch it.',
    },
    pl: {
      title: 'Co się dzieje, gdy "łapiesz bombę" — i jak to przewidzieć',
      description: 'Luka między spalanymi a dostarczanymi węglowodanami i jak ją obserwować.',
    },
  },
  {
    slug: 'bottle-refill-planning',
    en: {
      title: 'Planning bottle refills on a long ride',
      description: 'Where to place shop stops so you never run the tank dry.',
    },
    pl: {
      title: 'Jak zaplanować uzupełnianie butelek na długiej trasie',
      description: 'Gdzie ustawić przystanki sklepowe, żeby nigdy nie zabrakło paliwa.',
    },
  },
];
