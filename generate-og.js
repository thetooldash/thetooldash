/**
 * Generates og.png (1200×630) for thetooldash.com.
 * Run: node generate-og.js
 * Deps: satori + @resvg/resvg-js (already in node_modules)
 */
const { writeFileSync } = require('fs');

async function fetchFonts(family, weight) {
  // Google Fonts v1 API + old UA → returns TTF (satori needs TTF, not woff2)
  const url = `https://fonts.googleapis.com/css?family=${encodeURIComponent(family)}:${weight}`;
  const css = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0' },
  }).then(r => r.text());

  const urls = [...css.matchAll(/url\(([^)]+\.ttf)\)/g)].map(m => m[1]);
  if (!urls.length) throw new Error(`No TTF URLs found for ${family}:${weight}`);
  return Promise.all(urls.map(u => fetch(u).then(r => r.arrayBuffer())));
}

async function main() {
  const { default: satori } = await import('satori');
  const { Resvg } = await import('@resvg/resvg-js');

  process.stdout.write('Fetching fonts from Google Fonts... ');
  const [syneFonts, monoFonts] = await Promise.all([
    fetchFonts('Syne', 800),
    fetchFonts('DM Mono', 400),
  ]);
  const fonts = [
    ...syneFonts.map(data => ({ name: 'Syne',    data, weight: 800, style: 'normal' })),
    ...monoFonts.map(data => ({ name: 'DM Mono', data, weight: 400, style: 'normal' })),
  ];
  console.log(`${fonts.length} subsets loaded`);

  // ── Element tree ────────────────────────────────────────────────────────
  const el = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        background: '#060608',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 80px',
        position: 'relative',
      },
      children: [

        // Badge
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(0,229,160,0.12)',
              border: '1.5px solid rgba(0,229,160,0.28)',
              borderRadius: '100px',
              padding: '8px 20px 8px 14px',
              marginBottom: '32px',
              fontFamily: '"DM Mono"',
              fontSize: '14px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#00e5a0',
            },
            children: [
              // Dot
              {
                type: 'div',
                props: {
                  style: {
                    width: '9px',
                    height: '9px',
                    background: '#00e5a0',
                    borderRadius: '50%',
                    flexShrink: 0,
                  },
                  children: ' ',
                },
              },
              { type: 'span', props: { children: 'PROTOCOL STACK v2.0' } },
            ],
          },
        },

        // H1 — white
        {
          type: 'div',
          props: {
            style: {
              fontFamily: '"Syne"',
              fontSize: '86px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
            },
            children: 'Los suplementos',
          },
        },

        // H1 — accent green
        {
          type: 'div',
          props: {
            style: {
              fontFamily: '"Syne"',
              fontSize: '86px',
              fontWeight: 800,
              color: '#00e5a0',
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
              marginBottom: '32px',
            },
            children: 'Definitivos.',
          },
        },

        // Subtitle
        {
          type: 'div',
          props: {
            style: {
              fontFamily: '"DM Mono"',
              fontSize: '19px',
              color: 'rgba(240,240,240,0.55)',
              letterSpacing: '0.02em',
            },
            children: '// Stack de suplementación · HSN Raw & Sport Series',
          },
        },

        // Site URL — bottom-right
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: '44px',
              right: '80px',
              fontFamily: '"DM Mono"',
              fontSize: '14px',
              color: 'rgba(240,240,240,0.45)',
              letterSpacing: '0.08em',
            },
            children: 'thetooldash.com',
          },
        },

      ],
    },
  };
  // ────────────────────────────────────────────────────────────────────────

  process.stdout.write('Generating SVG... ');
  const svg = await satori(el, { width: 1200, height: 630, fonts });
  console.log('done');

  process.stdout.write('Rendering PNG... ');
  const resvg = new Resvg(svg);
  const png = resvg.render().asPng();
  writeFileSync('og.png', png);
  console.log('done');

  console.log('\n✓  og.png written — 1200 × 630 px');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
