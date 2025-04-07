// lighthouserc.js (Using ES Module syntax)

// Use 'export default' instead of 'module.exports'
export default {
  ci: {
    collect: {
      url: ['http://localhost:4173'],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'render-blocking-resources': ['warn', { maxLength: 2 }],
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
