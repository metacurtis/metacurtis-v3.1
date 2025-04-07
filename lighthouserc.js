// lighthouserc.js
module.exports = {
    ci: {
      collect: {
        // Use the URL provided by the preview server
        url: ['http://localhost:4173'],
        // You could optionally let LHCI manage the server:
        // startServerCommand: 'npm run preview',
        numberOfRuns: 1, // Number of times Lighthouse runs on each URL
      },
      assert: {
        // Start with a preset (optional, but good practice)
        // preset: 'lighthouse:recommended', // includes many default checks
  
        // Define specific assertion overrides or additions
        assertions: {
          // Relax render-blocking check: warn if > 2, error if much higher (adjust as needed)
          'render-blocking-resources': ['warn', { maxLength: 2 }],
  
          // --- Example: Keep other important scores strict ---
          // Maintain high scores in core categories (adjust minScore as project evolves)
          'categories:performance': ['error', { minScore: 0.9 }],
          'categories:accessibility': ['error', { minScore: 0.9 }],
          'categories:best-practices': ['error', { minScore: 0.9 }],
          'categories:seo': ['error', { minScore: 0.9 }],
  
          // --- Example: Other specific audits ---
          // Turn off checks that might be irrelevant now or too strict
          // 'uses-rel-preconnect': 'off',
          // 'uses-responsive-images': 'warn',
        },
      },
      upload: {
        // Configuration for uploading reports (optional)
        target: 'temporary-public-storage', // Default, uploads to a temporary public URL
      },
    },
  };