// src/faq/FaqIndex.en.tsx
import { FaqLayout } from './FaqLayout';
import { ARTICLES } from './registry';

export default function FaqIndexEn() {
  return (
    <FaqLayout lang="en">
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>Fueling FAQ</h1>
      <p style={{ color: 'var(--muted-2)', fontSize: 15, marginBottom: 28 }}>
        Straight answers about carb and hydration strategy for long rides.
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
              href={`/faq/${a.slug}/`}
              style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}
            >
              {a.en.title}
            </a>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted-2)' }}>
              {a.en.description}
            </p>
          </li>
        ))}
      </ul>
    </FaqLayout>
  );
}
