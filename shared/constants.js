/**
 * PR Size Guard — Shared Constants
 * Single source of truth for defaults and configuration.
 */

const PRSizeGuard = Object.freeze({
  // Extension enabled by default
  ENABLED_DEFAULT: true,

  DEFAULTS: Object.freeze({
    small: Object.freeze({ files: 5, lines: 100 }),
    medium: Object.freeze({ files: 15, lines: 400 }),
    large: Object.freeze({ files: 30, lines: 1000 })
  }),

  DEFAULT_COLORS: Object.freeze({
    small: '#2ea44f',
    medium: '#d29922',
    large: '#cf222e',
    critical: '#8b0000',
    unavailable: '#6e7781'
  }),

  CATEGORIES: Object.freeze(['small', 'medium', 'large', 'critical', 'unavailable']),

  LABELS: Object.freeze({
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    critical: 'Critical',
    unavailable: 'Size: ?'
  }),

  // Timing constants
  TIMING: Object.freeze({
    RETRY_BASE_DELAY_MS: 100,
    MAX_RETRY_ATTEMPTS: 5,
    OBSERVER_TIMEOUT_MS: 10000,
    OBSERVER_DEBOUNCE_MS: 100,
    NAVIGATION_DEBOUNCE_MS: 150,
    STATUS_DISPLAY_MS: 3000
  })
});

// For content scripts and popup (non-module context)
if (typeof window !== 'undefined') {
  window.PRSizeGuard = PRSizeGuard;
}
