// scripts/build-faq.mjs
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const SITE = 'https://carbfueling.com';
const LANGS = ['en', 'pl'];

const ROOT_STYLE = `
  :root { --ink:#16191c; --bg:#eff0ec; --surface:#fff; --border:#e3e5e0; --border-soft:#edefea;
    --chip-border:#dde0da; --muted:#7a817c; --muted-2:#6e7573; --muted-3:#9aa09b;
    --ink-soft:#3d423e; --carb:#5aa33f; --gel:#c9922e; --food:#b4552f; --water:#3d8fbf; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font-family: 'Archivo', Helvetica, sans-serif;
    -webkit-font-smoothing: antialiased; }
  a { color: var(--water); text-decoration: none; }
  a:hover { color: #2f7099; }
`;

function renderPage({ urlPath, altPath, lang, title, description, jsonLd, bodyHtml }) {
  const canonical = `${SITE}${urlPath}`;
  const alternate = `${SITE}${altPath}`;
  const enHref = lang === 'pl' ? alternate : canonical;
  const plHref = lang === 'pl' ? canonical : alternate;
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://kddudi.goatcounter.com; connect-src 'self' https://kddudi.goatcounter.com; base-uri 'self'; form-action 'self';"
    />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="en" href="${enHref}" />
    <link rel="alternate" hreflang="pl" href="${plHref}" />
    <link rel="alternate" hreflang="x-default" href="${enHref}" />
    <meta name="theme-color" content="#16191c" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:locale" content="${lang === 'pl' ? 'pl_PL' : 'en_US'}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link
      href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <script data-goatcounter="https://kddudi.goatcounter.com/count" async src="/count.js"></script>
    <style>${ROOT_STYLE}</style>
  </head>
  <body>
    <div id="root">${bodyHtml}</div>
  </body>
</html>`;
}

function articleModulePath(slug, lang) {
  return `/src/faq/articles/${slug}.${lang}.tsx`;
}

async function writeSitemap(pages) {
  const templatePath = path.join(rootDir, 'public/sitemap.xml');
  const template = await readFile(templatePath, 'utf-8');
  const entries = pages
    .map(
      (p) =>
        `  <url>\n    <loc>${SITE}${p.urlPath}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
    )
    .join('\n');
  const combined = template.replace('</urlset>', `${entries}\n</urlset>`);
  await writeFile(path.join(distDir, 'sitemap.xml'), combined, 'utf-8');
}

async function main() {
  const server = await createServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: 'custom',
  });

  const { ARTICLES } = await server.ssrLoadModule('/src/faq/registry.ts');
  const pages = [];

  for (const lang of LANGS) {
    const prefix = lang === 'pl' ? '/pl/faq' : '/faq';
    const altPrefix = lang === 'pl' ? '/faq' : '/pl/faq';

    const indexModPath = lang === 'pl' ? '/src/faq/FaqIndex.pl.tsx' : '/src/faq/FaqIndex.en.tsx';
    const { default: IndexComponent } = await server.ssrLoadModule(indexModPath);
    pages.push({
      outPath: path.join(distDir, lang === 'pl' ? 'pl/faq/index.html' : 'faq/index.html'),
      urlPath: `${prefix}/`,
      altPath: `${altPrefix}/`,
      lang,
      title: lang === 'pl' ? 'Częste pytania — Carb Fueling' : 'FAQ — Carb Fueling',
      description:
        lang === 'pl'
          ? 'Odpowiedzi na pytania o strategię węglowodanową i nawodnienie na długich trasach rowerowych.'
          : 'Answers about carb and hydration strategy for long bike rides.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: ARTICLES.map((a) => ({
          '@type': 'Question',
          name: a[lang].title,
          acceptedAnswer: { '@type': 'Answer', text: a[lang].description },
        })),
      },
      bodyHtml: renderToStaticMarkup(createElement(IndexComponent)),
    });

    for (const article of ARTICLES) {
      const modPath = path.join(rootDir, 'src/faq/articles', `${article.slug}.${lang}.tsx`);
      if (!existsSync(modPath)) continue; // article not written yet — skip, don't fail the build

      const { default: ArticleComponent } = await server.ssrLoadModule(
        articleModulePath(article.slug, lang),
      );
      pages.push({
        outPath: path.join(
          distDir,
          lang === 'pl' ? `pl/faq/${article.slug}/index.html` : `faq/${article.slug}/index.html`,
        ),
        urlPath: `${prefix}/${article.slug}/`,
        altPath: `${altPrefix}/${article.slug}/`,
        lang,
        title: `${article[lang].title} — Carb Fueling`,
        description: article[lang].description,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article[lang].title,
          description: article[lang].description,
          inLanguage: lang,
        },
        bodyHtml: renderToStaticMarkup(createElement(ArticleComponent)),
      });
    }
  }

  for (const page of pages) {
    await mkdir(path.dirname(page.outPath), { recursive: true });
    await writeFile(page.outPath, renderPage(page), 'utf-8');
  }
  await writeSitemap(pages);

  await server.close();
  console.log(`faq: built ${pages.length} pages`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
