// Lighthouse móvil sobre la build de producción (BRIEF §10.3). Uso: npm run build && npm run lhci
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['http://localhost/index.html', 'http://localhost/video.html'],
      numberOfRuns: 3,
      settings: { formFactor: 'mobile', throttlingMethod: 'simulate', screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75 }, onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], chromeFlags: '--no-sandbox --headless=new' }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }]
      }
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci' }
  }
};
