/**
 * PR Size Guard — Popup Script
 * Handles settings UI and storage operations.
 */

(function () {
  'use strict';

  const DEFAULTS = {
    small: { files: 5, lines: 100 },
    medium: { files: 15, lines: 400 },
    large: { files: 30, lines: 1000 }
  };

  const form = document.getElementById('settings-form');
  const resetBtn = document.getElementById('reset-btn');
  const statusEl = document.getElementById('status');

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

  function setFormValues(thresholds) {
    form.small_files.value = thresholds.small.files;
    form.small_lines.value = thresholds.small.lines;
    form.medium_files.value = thresholds.medium.files;
    form.medium_lines.value = thresholds.medium.lines;
    form.large_files.value = thresholds.large.files;
    form.large_lines.value = thresholds.large.lines;
  }

  function validateThresholds(thresholds) {
    const { small, medium, large } = thresholds;

    // Check all values are positive
    const allPositive = [
      small.files, small.lines,
      medium.files, medium.lines,
      large.files, large.lines
    ].every(v => v > 0);

    if (!allPositive) {
      return { valid: false, message: 'All values must be greater than 0' };
    }

    // Check ordering: small < medium < large
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
    }, 3000);
  }

  // ============================================================
  // Storage Operations
  // ============================================================

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get('thresholds');
      const thresholds = result.thresholds || DEFAULTS;
      setFormValues(thresholds);
    } catch (e) {
      setFormValues(DEFAULTS);
    }
  }

  async function saveSettings(thresholds) {
    try {
      await chrome.storage.sync.set({ thresholds });
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
    const validation = validateThresholds(thresholds);

    if (!validation.valid) {
      showStatus(validation.message, 'error');
      return;
    }

    await saveSettings(thresholds);
  });

  resetBtn.addEventListener('click', () => {
    setFormValues(DEFAULTS);
    showStatus('Reset to defaults (not saved yet)', 'success');
  });

  // ============================================================
  // Initialization
  // ============================================================

  loadSettings();
})();
