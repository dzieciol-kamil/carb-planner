// src/faq/FaqIndex.pl.tsx
import { FaqLayout } from './FaqLayout';
import { ARTICLES } from './registry';

export default function FaqIndexPl() {
  return (
    <FaqLayout lang="pl">
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>Częste pytania</h1>
      <p style={{ color: 'var(--muted-2)', fontSize: 15, marginBottom: 28 }}>
        Konkretne odpowiedzi o strategii węglowodanowej i nawodnieniu na długich trasach.
      </p>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {ARTICLES.map((a) => (
          <li key={a.slug}>
            <a
              href={`/pl/faq/${a.slug}/`}
              style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}
            >
              {a.pl.title}
            </a>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted-2)' }}>
              {a.pl.description}
            </p>
          </li>
        ))}
      </ul>
    </FaqLayout>
  );
}
