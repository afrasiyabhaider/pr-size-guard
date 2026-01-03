/**
 * PR Size Guard — Popup Script
 * Handles settings UI and storage operations.
 */

(function () {
  'use strict';

  // Graceful exit if constants failed to load
  if (!window.PRSizeGuard) {
    console.error('[PR Size Guard] Failed to load shared constants');
    document.body.innerHTML = '<p style="color:red;padding:20px;">Error loading extension. Please reload.</p>';
    return;
  }

  // Use shared constants (loaded via script tag in popup.html)
  const { DEFAULTS, DEFAULT_COLORS, TIMING } = window.PRSizeGuard;
  const { STATUS_DISPLAY_MS } = TIMING;

  const form = document.getElementById('settings-form');
  const resetBtn = document.getElementById('reset-btn');
  const resetColorsBtn = document.getElementById('reset-colors-btn');
  const statusEl = document.getElementById('status');
  const enabledToggle = document.getElementById('enabled-toggle');

  // ============================================================
  // Form Utilities
  // ============================================================

  function getFormValues() {
    return {
      small: {
        files: parseInt(form.small_files.value, 10),
        lines: parseInt(form.small_lines.value, 10)
      },
      medium: {
        files: parseInt(form.medium_files.value, 10),
        lines: parseInt(form.medium_lines.value, 10)
      },
      large: {
        files: parseInt(form.large_files.value, 10),
        lines: parseInt(form.large_lines.value, 10)
      }
    };
  }

  function getColorValues() {
    return {
      small: form.color_small.value,
      medium: form.color_medium.value,
      large: form.color_large.value,
      critical: form.color_critical.value
    };
  }

  function setFormValues(thresholds) {
    form.small_files.value = thresholds.small.files;
    form.small_lines.value = thresholds.small.lines;
    form.medium_files.value = thresholds.medium.files;
    form.medium_lines.value = thresholds.medium.lines;
    form.large_files.value = thresholds.large.files;
    form.large_lines.value = thresholds.large.lines;
  }

  function setColorValues(colors) {
    form.color_small.value = colors.small;
    form.color_medium.value = colors.medium;
    form.color_large.value = colors.large;
    form.color_critical.value = colors.critical;
  }

  function validateThresholds(thresholds) {
    const { small, medium, large } = thresholds;

    const allPositive = [
      small.files, small.lines,
      medium.files, medium.lines,
      large.files, large.lines
    ].every(v => v > 0);

    if (!allPositive) {
      return { valid: false, message: 'All values must be greater than 0' };
    }

    if (small.files >= medium.files || medium.files >= large.files) {
      return { valid: false, message: 'File thresholds must increase: Small < Medium < Large' };
    }

    if (small.lines >= medium.lines || medium.lines >= large.lines) {
      return { valid: false, message: 'Line thresholds must increase: Small < Medium < Large' };
    }

    return { valid: true };
  }

  // ============================================================
  // Status Display
  // ============================================================

  function showStatus(message, type = 'success') {
    statusEl.textContent = message;
    statusEl.className = `status status--${type}`;
    statusEl.hidden = false;

    setTimeout(() => {
      statusEl.hidden = true;
    }, STATUS_DISPLAY_MS);
  }

  // ============================================================
  // Storage Operations
  // ============================================================

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['thresholds', 'colors', 'enabled']);
      const thresholds = result.thresholds || DEFAULTS;
      const colors = result.colors || DEFAULT_COLORS;
      const enabled = result.enabled !== false; // Default to true
      setFormValues(thresholds);
      setColorValues(colors);
      enabledToggle.checked = enabled;
    } catch (e) {
      setFormValues(DEFAULTS);
      setColorValues(DEFAULT_COLORS);
      enabledToggle.checked = true;
    }
  }

  async function saveSettings(thresholds, colors) {
    try {
      await chrome.storage.sync.set({ thresholds, colors });
      showStatus('Settings saved!', 'success');
      return true;
    } catch (e) {
      showStatus('Failed to save settings', 'error');
      return false;
    }
  }

  // ============================================================
  // Event Handlers
  // ============================================================

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const thresholds = getFormValues();
    const colors = getColorValues();
    const validation = validateThresholds(thresholds);

    if (!validation.valid) {
      showStatus(validation.message, 'error');
      return;
    }

    await saveSettings(thresholds, colors);
  });

  resetBtn.addEventListener('click', () => {
    setFormValues(DEFAULTS);
    showStatus('Reset to defaults (not saved yet)', 'success');
  });

  resetColorsBtn.addEventListener('click', () => {
    setColorValues(DEFAULT_COLORS);
    showStatus('Colors reset (not saved yet)', 'success');
  });

  enabledToggle.addEventListener('change', async () => {
    const enabled = enabledToggle.checked;
    try {
      await chrome.storage.sync.set({ enabled });
      showStatus(enabled ? 'Extension enabled' : 'Extension disabled', 'success');
    } catch (e) {
      showStatus('Failed to update setting', 'error');
    }
  });

  // ============================================================
  // Initialization
  // ============================================================

  loadSettings();
})();
