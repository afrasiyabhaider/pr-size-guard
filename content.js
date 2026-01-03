/**
 * PR Size Guard — Content Script
 * Injects PR size badge into GitHub Pull Request pages.
 */

(function () {
  'use strict';

  // ============================================================
  // Configuration
  // ============================================================

  const DEBUG = false; // Set to true during development

  const DEFAULTS = {
    small: { files: 5, lines: 100 },
    medium: { files: 15, lines: 400 },
    large: { files: 30, lines: 1000 }
  };

  // Selector priority lists (fallbacks for GitHub DOM changes)
  const SELECTORS = {
    filesCount: [
      '#files_tab_counter',
      '[data-tab-item="files"] .Counter',
      '.tabnav-tab[href*="files"] .Counter'
    ],
    diffStats: [
      '.diffstat',
      '#diffstat',
      '.js-diff-progressive-container .diffstat'
    ],
    injectionTarget: [
      '.gh-header-title',
      '.js-issue-title',
      '[data-testid="issue-title"]',
      '.gh-header-show h1'
    ]
  };

  const BADGE_ID = 'pr-size-guard-badge';
  const DEBOUNCE_MS = 300;
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [100, 300, 600];

  // ============================================================
  // Utility Functions
  // ============================================================

  function log(...args) {
    if (DEBUG) {
      console.log('[PR Size Guard]', ...args);
    }
  }

  function debounce(fn, ms) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function safeQuerySelector(selectors) {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) return element;
      } catch (e) {
        // Invalid selector, try next
      }
    }
    return null;
  }

  function parseNumber(text) {
    if (!text) return 0;
    // Remove commas and non-numeric characters except digits
    const cleaned = text.replace(/[^\d]/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  }

  // ============================================================
  // Stats Extraction
  // ============================================================

  function extractPRStats() {
    try {
      // Extract files count
      const filesElement = safeQuerySelector(SELECTORS.filesCount);
      const filesChanged = filesElement ? parseNumber(filesElement.textContent) : null;

      // Extract diff stats
      const diffstat = safeQuerySelector(SELECTORS.diffStats);
      if (!diffstat) {
        log('Diffstat not found');
        return null;
      }

      const diffText = diffstat.textContent || '';
      
      // Parse additions and deletions from text like "+123 −45" or "123 additions, 45 deletions"
      const additionsMatch = diffText.match(/\+?([\d,]+)\s*(?:addition|line)/i) || 
                             diffText.match(/\+\s*([\d,]+)/);
      const deletionsMatch = diffText.match(/[-−]?([\d,]+)\s*(?:deletion|line)/i) || 
                             diffText.match(/[-−]\s*([\d,]+)/);

      const additions = additionsMatch ? parseNumber(additionsMatch[1]) : 0;
      const deletions = deletionsMatch ? parseNumber(deletionsMatch[1]) : 0;

      // If we couldn't get files count from tab, try to infer or return null
      if (filesChanged === null && additions === 0 && deletions === 0) {
        log('Could not extract any stats');
        return null;
      }

      return {
        filesChanged: filesChanged || 0,
        additions,
        deletions,
        totalLines: additions + deletions
      };
    } catch (e) {
      log('Error extracting stats:', e);
      return null;
    }
  }

  // ============================================================
  // Classification
  // ============================================================

  function classifyPR(stats, thresholds) {
    if (!stats) return 'unavailable';

    const { filesChanged, totalLines } = stats;
    const t = thresholds;

    // Classify by files
    let fileCategory;
    if (filesChanged <= t.small.files) fileCategory = 'small';
    else if (filesChanged <= t.medium.files) fileCategory = 'medium';
    else if (filesChanged <= t.large.files) fileCategory = 'large';
    else fileCategory = 'dangerous';

    // Classify by lines
    let lineCategory;
    if (totalLines <= t.small.lines) lineCategory = 'small';
    else if (totalLines <= t.medium.lines) lineCategory = 'medium';
    else if (totalLines <= t.large.lines) lineCategory = 'large';
    else lineCategory = 'dangerous';

    // Return the worse of the two
    const order = ['small', 'medium', 'large', 'dangerous'];
    const fileIndex = order.indexOf(fileCategory);
    const lineIndex = order.indexOf(lineCategory);

    return order[Math.max(fileIndex, lineIndex)];
  }

  // ============================================================
  // Badge Injection
  // ============================================================

  function removeBadge() {
    const existing = document.getElementById(BADGE_ID);
    if (existing) {
      existing.remove();
    }
  }

  function formatTooltip(category, stats) {
    const labels = {
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      dangerous: 'Dangerous',
      unavailable: 'Size: ?'
    };

    if (!stats || category === 'unavailable') {
      return 'Could not determine PR size';
    }

    const lines = [
      `PR Size: ${labels[category]}`,
      `───────────────`,
      `Files changed: ${stats.filesChanged}`,
      `Lines added: +${stats.additions}`,
      `Lines deleted: -${stats.deletions}`,
      `Total lines: ${stats.totalLines}`
    ];

    return lines.join('\n');
  }

  function injectBadge(category, stats) {
    try {
      removeBadge();

      const target = safeQuerySelector(SELECTORS.injectionTarget);
      if (!target) {
        log('Injection target not found');
        return false;
      }

      const badge = document.createElement('span');
      badge.id = BADGE_ID;
      badge.className = `pr-size-guard-badge pr-size-guard--${category}`;
      
      const labels = {
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        dangerous: 'Dangerous',
        unavailable: 'Size: ?'
      };
      
      badge.textContent = labels[category] || labels.unavailable;
      badge.title = formatTooltip(category, stats);

      target.appendChild(badge);
      log('Badge injected:', category);
      return true;
    } catch (e) {
      log('Error injecting badge:', e);
      return false;
    }
  }

  // ============================================================
  // Storage
  // ============================================================

  let cachedThresholds = DEFAULTS;

  async function loadThresholds() {
    try {
      const result = await chrome.storage.sync.get('thresholds');
      cachedThresholds = result.thresholds || DEFAULTS;
      log('Thresholds loaded:', cachedThresholds);
    } catch (e) {
      log('Error loading thresholds:', e);
      cachedThresholds = DEFAULTS;
    }
  }

  function setupStorageListener() {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync' && changes.thresholds) {
          cachedThresholds = changes.thresholds.newValue || DEFAULTS;
          log('Thresholds updated:', cachedThresholds);
          // Re-process current page with new thresholds
          processPage();
        }
      });
    } catch (e) {
      log('Error setting up storage listener:', e);
    }
  }

  // ============================================================
  // Main Processing
  // ============================================================

  function processPage() {
    const stats = extractPRStats();
    const category = classifyPR(stats, cachedThresholds);
    injectBadge(category, stats);
    log('Page processed:', { stats, category });
  }

  function processPageWithRetry(attempt = 0) {
    const stats = extractPRStats();
    
    if (stats === null && attempt < MAX_RETRIES) {
      log(`Stats not found, retry ${attempt + 1}/${MAX_RETRIES}`);
      setTimeout(() => processPageWithRetry(attempt + 1), RETRY_DELAYS[attempt]);
      return;
    }

    const category = classifyPR(stats, cachedThresholds);
    injectBadge(category, stats);
    log('Page processed:', { stats, category });
  }

  // ============================================================
  // SPA Navigation Handling
  // ============================================================

  let lastProcessedUrl = '';
  let observer = null;

  function isPRPage() {
    return /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(location.href);
  }

  function handleNavigation() {
    if (!isPRPage()) {
      removeBadge();
      return;
    }

    if (location.href !== lastProcessedUrl) {
      lastProcessedUrl = location.href;
      processPageWithRetry();
    }
  }

  const debouncedHandleNavigation = debounce(handleNavigation, DEBOUNCE_MS);

  function setupObserver() {
    if (observer) {
      log('Observer already exists');
      return;
    }

    observer = new MutationObserver(() => {
      debouncedHandleNavigation();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    log('Observer initialized');
  }

  function setupNavigationListeners() {
    // Handle browser back/forward
    window.addEventListener('popstate', debouncedHandleNavigation);

    // Handle GitHub Turbo navigation (if available)
    document.addEventListener('turbo:load', debouncedHandleNavigation);

    // Legacy PJAX support
    document.addEventListener('pjax:end', debouncedHandleNavigation);
  }

  // ============================================================
  // Initialization
  // ============================================================

  async function init() {
    log('Initializing...');

    await loadThresholds();
    setupStorageListener();
    setupObserver();
    setupNavigationListeners();

    // Initial processing
    if (isPRPage()) {
      lastProcessedUrl = location.href;
      processPageWithRetry();
    }

    log('Initialization complete');
  }

  // Start
  init();
})();
