// Ensures TheaterDirector auto-start logic stays disabled when
// ConsciousnessTheater orchestrates start-up sequencing manually.
if (typeof globalThis !== 'undefined') {
  globalThis.__DISABLE_DIRECTOR_AUTOSTART__ = true;
}
