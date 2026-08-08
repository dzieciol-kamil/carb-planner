import { describe, expect, it } from 'vitest';
import { ARTICLES } from './registry';

describe('ARTICLES registry', () => {
  it('has a unique, URL-safe slug per article', () => {
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('has a non-empty en and pl title/description for every article', () => {
    for (const article of ARTICLES) {
      for (const lang of ['en', 'pl'] as const) {
        expect(article[lang].title.trim().length).toBeGreaterThan(0);
        expect(article[lang].description.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('ships exactly the 3 articles scoped for this round', () => {
    expect(ARTICLES.map((a) => a.slug).sort()).toEqual(
      ['bonk-crisis', 'bottle-refill-planning', 'carb-transporter-mix'].sort(),
    );
  });
});
