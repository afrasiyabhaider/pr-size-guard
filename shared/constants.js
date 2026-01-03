/**
 * PR Size Guard — Shared Constants
 * Single source of truth for defaults and configuration.
 */

const PRSizeGuard = {
  DEFAULTS: {
    small: { files: 5, lines: 100 },
    medium: { files: 15, lines: 400 },
    large: { files: 30, lines: 1000 }
  },

  DEFAULT_COLORS: {
    small: '#2ea44f',
    medium: '#d29922',
    large: '#cf222e',
    critical: '#8b0000'
  },

  CATEGORIES: ['small', 'medium', 'large', 'critical', 'unavailable'],

  LABELS: {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    critical: 'Critical',
    unavailable: 'Size: ?'
  }
};

// For content scripts and popup (non-module context)
if (typeof window !== 'undefined') {
  window.PRSizeGuard = PRSizeGuard;
}
